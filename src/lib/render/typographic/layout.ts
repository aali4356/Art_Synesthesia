import type { TypographicWord } from '@/lib/render/types';
import type { WeightedWord } from './words';

export interface MeasureResult {
  width: number;
  height: number;
}

/**
 * Text measurement function type.
 * In production: wraps ctx.measureText() on an offscreen canvas.
 * In tests: returns width = text.length * fontSize * 0.6, height = fontSize.
 */
export type MeasureFn = (text: string, fontSize: number, fontFamily: string, fontWeight: string) => MeasureResult;

/**
 * Default test-safe measurement: approximates character width.
 * Used when no real canvas is available (SSR, tests).
 */
export const approximateMeasure: MeasureFn = (text, fontSize, _fontFamily, _fontWeight) => ({
  width: text.length * fontSize * 0.55,
  height: fontSize * 1.2,
});

function aabbOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function expandForRotation(
  width: number,
  height: number,
  rotationDegrees: number,
): { width: number; height: number } {
  const rad = Math.abs(rotationDegrees) * (Math.PI / 180);
  const expandedWidth = width * Math.cos(rad) + height * Math.sin(rad);
  const expandedHeight = width * Math.sin(rad) + height * Math.cos(rad);
  return { width: expandedWidth, height: expandedHeight };
}

/**
 * Places weighted words on the canvas following all composition laws.
 *
 * @param words - Sorted weighted words (highest weight first)
 * @param canvasSize - Canvas width and height in pixels
 * @param colors - Palette colors as hex strings
 * @param prng - Seeded PRNG for position/rotation jitter
 * @param measure - Text measurement function (real or mock)
 * @param energyParam - 0-1, controls font size spread
 * @param complexityParam - 0-1, controls number of words shown
 */
export function placeWords(
  words: WeightedWord[],
  canvasSize: number,
  colors: string[],
  prng: () => number,
  measure: MeasureFn,
  energyParam: number,
  complexityParam: number,
): TypographicWord[] {
  const padding = canvasSize * 0.05;
  const usableSize = canvasSize - padding * 2;

  const targetCount = Math.min(
    words.length,
    Math.round(5 + complexityParam * 35),
  );
  const wordsToPlace = words.slice(0, targetCount);

  const isShortInput = words.length <= 3;

  const placed: TypographicWord[] = [];
  const placedBoxes: Array<{ box: { x: number; y: number; width: number; height: number }; opacity: number }> = [];

  let totalWords = 0;
  let rotatedCount = 0;

  wordsToPlace.forEach((word, index) => {
    const isProminent = index < 3;

    let fontSize: number;
    if (isShortInput && index === 0) {
      const testMeasure = measure(word.displayText, 100, 'Georgia, serif', 'bold');
      const scaleFactor = (usableSize * 0.85) / testMeasure.width;
      fontSize = Math.min(100 * scaleFactor, usableSize * 0.7);
    } else if (isProminent) {
      const baseFontSize = 40 + word.weight * 60 * (0.5 + energyParam * 0.5);
      fontSize = Math.max(16, baseFontSize); // TYPO-02: min 16px
    } else {
      const baseFontSize = 10 + word.weight * 30 * (0.3 + energyParam * 0.7);
      fontSize = Math.max(8, baseFontSize);
    }

    const fontFamily = isProminent ? 'Georgia, serif' : 'system-ui, sans-serif';
    const fontWeight = isProminent ? 'bold' : 'normal';
    const color = colors[index % colors.length];

    let rotation: number;
    const maxRotated = Math.floor(targetCount * 0.3);
    const rotationBudgetLeft = maxRotated - rotatedCount;
    const remainingWords = targetCount - totalWords;
    const canRotate = rotationBudgetLeft > 0 && remainingWords > 0;

    if (isProminent) {
      // Prominent: slight tilt only, max 15 degrees (TYPO-02)
      rotation = (prng() - 0.5) * 20; // -10 to +10 deg
      rotation = Math.max(-15, Math.min(15, rotation));
    } else if (canRotate && prng() < 0.35) {
      rotation = (prng() - 0.5) * 70; // -35 to +35 deg
    } else {
      rotation = (prng() - 0.5) * 14; // -7 to +7 deg
    }

    totalWords++;
    if (Math.abs(rotation) > 10) rotatedCount++;

    const measured = measure(word.displayText, fontSize, fontFamily, fontWeight);
    const { width: expandedW, height: expandedH } = expandForRotation(
      measured.width,
      measured.height,
      rotation,
    );

    let x: number;
    let y: number;
    let opacity = 1.0;

    if (isShortInput && index === 0) {
      x = padding + (usableSize - expandedW) / 2;
      y = padding + (usableSize - expandedH) / 2 + expandedH;
    } else if (isProminent && placed.length === 0) {
      x = padding + (usableSize - expandedW) / 2 + (prng() - 0.5) * usableSize * 0.2;
      y = padding + usableSize * 0.3 + (prng() - 0.5) * usableSize * 0.2;
    } else {
      const spiralSteps = 40;
      let placed_ok = false;

      for (let step = 0; step < spiralSteps; step++) {
        const spiralAngle = step * 0.5;
        const spiralR = step * (canvasSize / spiralSteps) * 0.3;
        const cx = canvasSize / 2 + Math.cos(spiralAngle) * spiralR + (prng() - 0.5) * 40;
        const cy = canvasSize / 2 + Math.sin(spiralAngle) * spiralR + (prng() - 0.5) * 40;

        const testX = Math.max(padding, Math.min(canvasSize - padding - expandedW, cx - expandedW / 2));
        const testY = Math.max(padding + expandedH, Math.min(canvasSize - padding, cy + expandedH / 2));
        const testBox = { x: testX, y: testY - expandedH, width: expandedW, height: expandedH };

        const fullOpacityBoxes = placedBoxes.filter((pb) => pb.opacity >= 1.0);
        const overlaps = fullOpacityBoxes.some((pb) => aabbOverlap(testBox, pb.box));

        if (!overlaps) {
          x = testX;
          y = testY;
          placed_ok = true;
          break;
        }
      }

      if (!placed_ok) {
        x = padding + prng() * (usableSize - expandedW);
        y = padding + expandedH + prng() * (usableSize - expandedH);
        opacity = 0.1 + prng() * 0.25; // 0.1 to 0.35 — always below 0.4
      }
    }

    const boundingBox = {
      x: x!,
      y: (y! - expandedH),
      width: expandedW,
      height: expandedH,
    };

    placedBoxes.push({ box: boundingBox, opacity });

    placed.push({
      text: word.displayText,
      x: x!,
      y: y!,
      fontSize,
      fontFamily,
      fontWeight,
      color,
      rotation,
      opacity,
      isProminent,
      boundingBox,
    });
  });

  return placed;
}
