import type { HarmonyType } from './harmony';

export interface PaletteFamilyDescriptor {
  id: string;
  name: string;
  descriptor: string;
  baseHue: number;
  chromaMin: number;
  chromaMax: number;
  lightnessTarget: number;
  lightnessSpread: number;
  preferredHarmony: HarmonyType;
  hueOffsetDegrees: readonly number[];
  hueJitter: number;
  dominantHueWeight: number;
  accentChromaBoost: number;
  chromaStep: number;
  lightnessCurve: number;
  lightnessAlternation: number;
  dedupThreshold: number;
}

export const PALETTE_FAMILY_CATALOG: readonly PaletteFamilyDescriptor[] = [
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    descriptor: 'incandescent warm spectrum with bold complementary tension',
    baseHue: 28,
    chromaMin: 0.26,
    chromaMax: 0.34,
    lightnessTarget: 0.63,
    lightnessSpread: 0.28,
    preferredHarmony: 'complementary',
    hueOffsetDegrees: [0, 16, 188, 208, 28, 198],
    hueJitter: 5,
    dominantHueWeight: 0.82,
    accentChromaBoost: 0.04,
    chromaStep: 0.03,
    lightnessCurve: 0.08,
    lightnessAlternation: 0.05,
    dedupThreshold: 12.5,
  },
  {
    id: 'lagoon-mist',
    name: 'Lagoon Mist',
    descriptor: 'cool aquatic drift with calm analogous range',
    baseHue: 208,
    chromaMin: 0.06,
    chromaMax: 0.1,
    lightnessTarget: 0.69,
    lightnessSpread: 0.16,
    preferredHarmony: 'analogous',
    hueOffsetDegrees: [-48, -24, -6, 18, 42, 66],
    hueJitter: 3.5,
    dominantHueWeight: 0.72,
    accentChromaBoost: -0.02,
    chromaStep: -0.014,
    lightnessCurve: -0.03,
    lightnessAlternation: 0.02,
    dedupThreshold: 9.5,
  },
  {
    id: 'orchid-nocturne',
    name: 'Orchid Nocturne',
    descriptor: 'dusky magenta-violet drama with triadic accents',
    baseHue: 316,
    chromaMin: 0.19,
    chromaMax: 0.26,
    lightnessTarget: 0.5,
    lightnessSpread: 0.24,
    preferredHarmony: 'triadic',
    hueOffsetDegrees: [0, 42, 96, 168, 228, 288],
    hueJitter: 4.5,
    dominantHueWeight: 0.96,
    accentChromaBoost: 0.028,
    chromaStep: 0.02,
    lightnessCurve: -0.08,
    lightnessAlternation: 0.06,
    dedupThreshold: 11,
  },
  {
    id: 'meadow-bloom',
    name: 'Meadow Bloom',
    descriptor: 'fresh verdant bloom balanced by floral warmth',
    baseHue: 118,
    chromaMin: 0.14,
    chromaMax: 0.23,
    lightnessTarget: 0.67,
    lightnessSpread: 0.2,
    preferredHarmony: 'split-complementary',
    hueOffsetDegrees: [-32, -8, 18, 92, 148, 204],
    hueJitter: 4,
    dominantHueWeight: 0.86,
    accentChromaBoost: 0.02,
    chromaStep: 0.012,
    lightnessCurve: 0.02,
    lightnessAlternation: 0.03,
    dedupThreshold: 11,
  },
] as const;

export type PaletteFamilyId = (typeof PALETTE_FAMILY_CATALOG)[number]['id'];

export function getPaletteFamilyById(id: PaletteFamilyId): PaletteFamilyDescriptor {
  const family = PALETTE_FAMILY_CATALOG.find((candidate) => candidate.id === id);
  if (!family) {
    throw new Error(`Unknown palette family: ${id}`);
  }
  return family;
}
