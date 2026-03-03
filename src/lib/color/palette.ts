import {
  useMode,
  modeOklch,
  modeRgb,
  modeLrgb,
  modeLab65,
  converter,
  formatCss,
  formatHex,
  clampChroma,
} from 'culori/fn';
import type { ParameterVector } from '@/types/engine';
import { createPRNG } from '@/lib/engine/prng';
import { selectHarmony, generateHueAngles, type HarmonyType } from './harmony';
import { rejectNearDuplicates, type OklchColor } from './dedup';
import { adjustForMode } from './contrast';

// Register color spaces
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeLab65);

const toRgb = converter('rgb');

/**
 * A single palette color with OKLCH, hex, and CSS representations.
 */
export interface PaletteColor {
  /** OKLCH representation */
  oklch: OklchColor;
  /** Gamut-mapped hex string (e.g., "#7b3dd4") */
  hex: string;
  /** CSS oklch() string (e.g., "oklch(0.65 0.25 285)") */
  css: string;
}

/**
 * Complete palette result with dark and light mode versions.
 */
export interface PaletteResult {
  /** Colors adjusted for dark mode */
  dark: PaletteColor[];
  /** Colors adjusted for light mode */
  light: PaletteColor[];
  /** Which harmony was selected */
  harmony: HarmonyType;
  /** Number of colors in palette */
  count: number;
}

/**
 * Normalize a hue angle to [0, 360).
 */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Convert an OKLCH color to a PaletteColor with gamut-mapped hex and CSS.
 */
function toPaletteColor(color: OklchColor): PaletteColor {
  // Gamut-map via clampChroma to ensure sRGB safe
  const clamped = clampChroma(color, 'oklch');
  const oklch: OklchColor = {
    mode: 'oklch',
    l: clamped?.l ?? color.l,
    c: clamped?.c ?? color.c,
    h: clamped?.h ?? color.h,
  };

  const rgb = toRgb(oklch);
  const hex = rgb ? formatHex(rgb) : '#000000';
  const css = formatCss(oklch) ?? 'oklch(0 0 0)';

  return { oklch, hex, css };
}

/**
 * Generate a perceptually coherent OKLCH color palette from a parameter vector.
 *
 * The palette is driven by the parameter vector:
 * - paletteSize: determines number of colors (0 -> 3, 1 -> 8)
 * - warmth: drives base hue (0 = cool blue ~220, 1 = warm orange ~30)
 * - saturation: drives chroma with floor of 0.05 (never fully gray)
 * - contrast: drives lightness spread between palette colors
 * - symmetry/contrast/energy: drive harmony type selection
 *
 * The first color is the dominant color (highest chroma).
 * Both dark and light mode versions are generated with same hue/chroma, different lightness.
 * All colors are gamut-mapped to sRGB before output.
 * Deterministic: same parameters + seed = same palette.
 *
 * @param params - The parameter vector driving palette generation
 * @param seed - PRNG seed for deterministic generation
 * @returns PaletteResult with dark and light mode palettes
 */
export function generatePalette(
  params: ParameterVector,
  seed: string,
): PaletteResult {
  // a. Compute palette size: 3-8 colors
  const count = Math.round(3 + params.paletteSize * 5);

  // b. Create PRNG for deterministic jitter
  const prng = createPRNG(seed);

  // c. Derive base hue from warmth
  // warmth 0 -> 220 (cool blue), warmth 1 -> 30 (warm orange)
  // Sweep: 220 -> 260 -> 300 -> 340 -> 360(0) -> 30
  const baseHue = normalizeHue(((1 - params.warmth) * 220 + params.warmth * 390));

  // d. Derive chroma from saturation with floor
  const chromaFloor = 0.05;
  const chroma = chromaFloor + params.saturation * 0.25; // range [0.05, 0.30]

  // e. Select harmony type
  const harmony = selectHarmony(params);

  // f. Generate hue angles
  const hueAngles = generateHueAngles(harmony, baseHue, count, prng);

  // g. Create candidate OKLCH colors with lightness variation
  const lightnessTarget = 0.60; // Base lightness centered between dark/light profiles
  const lightnessSpread = 0.1 + params.contrast * 0.3; // range [0.1, 0.4]

  const candidates: OklchColor[] = hueAngles.map((hue, i) => {
    // Distribute lightness across colors
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1 to 1
    const l = Math.max(0.2, Math.min(0.9, lightnessTarget + t * lightnessSpread * 0.5));

    return {
      mode: 'oklch' as const,
      l,
      c: chroma,
      h: normalizeHue(hue),
    };
  });

  // h. Set dominant color: first color gets highest chroma
  if (candidates.length > 0) {
    candidates[0] = {
      ...candidates[0],
      c: Math.min(0.35, chroma * 1.15),
    };
  }

  // i. Reject near-duplicates
  let deduplicated = rejectNearDuplicates(candidates);

  // If count dropped below target, generate additional colors with shifted hues
  let shiftAttempt = 0;
  while (deduplicated.length < count && shiftAttempt < 10) {
    const extraHue = normalizeHue(baseHue + (shiftAttempt + 1) * 45 + prng() * 20);
    const extraColor: OklchColor = {
      mode: 'oklch',
      l: lightnessTarget + (prng() - 0.5) * lightnessSpread,
      c: chroma,
      h: extraHue,
    };
    const withExtra = [...deduplicated, extraColor];
    deduplicated = rejectNearDuplicates(withExtra);
    shiftAttempt++;
  }

  // Trim to target count if we somehow got more
  deduplicated = deduplicated.slice(0, count);

  // j. Adjust for dark mode
  const darkColors: PaletteColor[] = deduplicated.map((color) => {
    const adjusted = adjustForMode('dark', color);
    return toPaletteColor(adjusted);
  });

  // k. Adjust for light mode (same hue/chroma, different lightness)
  const lightColors: PaletteColor[] = deduplicated.map((color) => {
    const adjusted = adjustForMode('light', color);
    return toPaletteColor(adjusted);
  });

  return {
    dark: darkColors,
    light: lightColors,
    harmony,
    count: deduplicated.length,
  };
}
