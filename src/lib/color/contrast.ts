import {
  useMode,
  modeOklch,
  modeRgb,
  modeLrgb,
  converter,
  wcagContrast,
} from 'culori/fn';
import type { OklchColor } from './dedup';

// Register color spaces (lrgb needed for wcagContrast luminance calculation)
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLrgb);

const toRgb = converter('rgb');

/**
 * Lightness profile for a color mode (dark or light).
 */
export interface LightnessProfile {
  /** Minimum lightness for art colors */
  min: number;
  /** Maximum lightness for art colors */
  max: number;
  /** Preferred lightness for dominant color */
  target: number;
}

/** Dark mode background: oklch(0.09 0.005 250) - near-black with slight blue tint */
export const DARK_BG: OklchColor = { mode: 'oklch', l: 0.09, c: 0.005, h: 250 };

/** Light mode background: oklch(1.0 0 0) - pure white */
export const LIGHT_BG: OklchColor = { mode: 'oklch', l: 1.0, c: 0, h: 0 };

/** Dark mode lightness profile: art colors must be bright enough against near-black */
export const DARK_MODE_PROFILE: LightnessProfile = {
  min: 0.45,
  max: 0.90,
  target: 0.65,
};

/** Light mode lightness profile: art colors can be darker against white */
export const LIGHT_MODE_PROFILE: LightnessProfile = {
  min: 0.25,
  max: 0.70,
  target: 0.50,
};

/**
 * Ensure a color meets minimum WCAG contrast ratio against a background.
 *
 * Iteratively adjusts OKLCH lightness away from the background in steps of 0.02,
 * up to 20 iterations. Direction is determined by background lightness:
 * - Dark background (L < 0.5): push lightness up (lighten)
 * - Light background (L >= 0.5): push lightness down (darken)
 *
 * Preserves hue and chroma.
 *
 * @param color - OKLCH color to adjust
 * @param background - Background OKLCH color to check contrast against
 * @param minRatio - Minimum WCAG contrast ratio. Default: 3.0 (AA large text)
 * @returns Adjusted OKLCH color meeting contrast requirement
 */
export function ensureContrast(
  color: OklchColor,
  background: OklchColor,
  minRatio: number = 3.0,
): OklchColor {
  const bgRgb = toRgb(background);
  if (!bgRgb) return color;

  let adjusted = { ...color };
  const direction = background.l < 0.5 ? 1 : -1;

  for (let i = 0; i < 20; i++) {
    const adjustedRgb = toRgb(adjusted);
    if (!adjustedRgb) break;

    const ratio = wcagContrast(adjustedRgb, bgRgb);
    if (ratio >= minRatio) break;

    adjusted = {
      ...adjusted,
      l: Math.max(0, Math.min(1, adjusted.l + direction * 0.02)),
    };
  }

  return adjusted;
}

/**
 * Adjust a color for a specific display mode (dark or light).
 *
 * 1. Clamps lightness to the mode's profile range
 * 2. Ensures WCAG contrast >= 3.0 against the mode's background
 *
 * Preserves hue and chroma.
 *
 * @param mode - 'dark' or 'light'
 * @param color - OKLCH color to adjust
 * @returns Adjusted OKLCH color suitable for the specified mode
 */
export function adjustForMode(
  mode: 'dark' | 'light',
  color: OklchColor,
  minRatio: number = 3.0,
): OklchColor {
  const profile = mode === 'dark' ? DARK_MODE_PROFILE : LIGHT_MODE_PROFILE;
  const background = mode === 'dark' ? DARK_BG : LIGHT_BG;

  // Clamp lightness to profile range
  const clamped: OklchColor = {
    ...color,
    l: Math.max(profile.min, Math.min(profile.max, color.l)),
  };

  // Ensure contrast against the mode's background
  return ensureContrast(clamped, background, minRatio);
}
