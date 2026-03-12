// Color module barrel exports

// Palette generation
export { generatePalette } from './palette';
export type { PaletteResult, PaletteColor } from './palette';
export { selectPaletteFamily } from './palette-family-selection';
export type { PaletteFamilySelection, PaletteSelectionVector } from './palette-family-selection';
export { PALETTE_FAMILY_CATALOG, getPaletteFamilyById } from './palette-families';
export type { PaletteFamilyDescriptor, PaletteFamilyId } from './palette-families';
export { deriveSynestheticMapping } from './synesthetic-mapping';
export type {
  SynestheticMapping,
  SynestheticTemperatureBias,
  SynestheticHueAnchor,
  SynestheticHarmonySource,
  SynestheticChromaPosture,
  SynestheticContrastPosture,
} from './synesthetic-mapping';

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
