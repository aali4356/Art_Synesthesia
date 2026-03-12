import { createPRNG } from '@/lib/engine/prng';
import type { ParameterVector } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';
import type { TypographicSceneGraph } from '@/lib/render/types';
import { interpretRendererExpressiveness } from '@/lib/render/expressiveness';
import { extractWeightedWords } from './words';
import { placeWords, approximateMeasure } from './layout';
import type { LayoutExpressiveness, MeasureFn } from './layout';

/**
 * Builds a complete typographic scene graph from text input and parameters.
 * Pure function when measureFn is deterministic (in production, use real canvas;
 * in tests, use approximateMeasure which is deterministic).
 *
 * @param params - Normalized parameter vector
 * @param palette - Generated color palette
 * @param theme - 'dark' | 'light'
 * @param seed - Deterministic seed string
 * @param inputText - The raw input text to use as visual medium
 * @param canvasSize - Canvas width and height in pixels (default 800)
 * @param measureFn - Text measurement function (defaults to approximateMeasure)
 */
export function buildTypographicSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  seed: string,
  inputText: string,
  canvasSize: number = 800,
  measureFn: MeasureFn = approximateMeasure,
): TypographicSceneGraph {
  const prng = createPRNG(seed + '-typo-layout');
  const expressiveness = interpretRendererExpressiveness(palette, theme);

  const maxWords = Math.round(5 + params.complexity * 36 + expressiveness.densityLift * 24);
  const weightedWords = extractWeightedWords(inputText, maxWords);

  const colors = theme === 'dark'
    ? palette.dark.map((c) => c.hex)
    : palette.light.map((c) => c.hex);

  const layoutExpressiveness: LayoutExpressiveness = {
    densityLift: expressiveness.densityLift,
    hierarchyLift: expressiveness.hierarchyLift,
    rotationFreedom: expressiveness.rotationFreedom,
    fontVariety: expressiveness.fontVariety,
    placementBiasX: expressiveness.placementBiasX,
    placementBiasY: expressiveness.placementBiasY,
  };

  const words = placeWords(
    weightedWords,
    canvasSize,
    colors,
    prng,
    measureFn,
    params.energy,
    params.complexity,
    layoutExpressiveness,
  );

  const background = theme === 'dark' ? '#0a0a0a' : '#fafafa';

  return {
    style: 'typographic',
    parameters: params,
    width: canvasSize,
    height: canvasSize,
    background,
    words,
    expressiveness: layoutExpressiveness,
  };
}
