// Color module barrel exports

// Palette generation
export { generatePalette } from './palette';
export type { PaletteResult, PaletteColor } from './palette';

// Harmony algorithms
export { selectHarmony, generateHueAngles } from './harmony';
export type { HarmonyType } from './harmony';

// Contrast checking and lightness profiles
export {
  ensureContrast,
  adjustForMode,
  DARK_BG,
  LIGHT_BG,
  DARK_MODE_PROFILE,
  LIGHT_MODE_PROFILE,
} from './contrast';
export type { LightnessProfile } from './contrast';

// Near-duplicate rejection
export { rejectNearDuplicates } from './dedup';
export type { OklchColor } from './dedup';
