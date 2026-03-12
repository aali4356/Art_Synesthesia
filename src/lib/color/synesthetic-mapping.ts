import type { ParameterVector } from '@/types/engine';
import type { HarmonyType } from './harmony';
import type { PaletteFamilyDescriptor } from './palette-families';

export type SynestheticTemperatureBias = 'cool' | 'warm' | 'hot';
export type SynestheticHueAnchor = 'family-base';
export type SynestheticHarmonySource = 'family';
export type SynestheticChromaPosture = 'muted' | 'balanced' | 'lush' | 'vivid';
export type SynestheticContrastPosture = 'soft' | 'balanced' | 'dramatic' | 'bold';

export interface SynestheticMapping {
  mood: string;
  temperatureBias: SynestheticTemperatureBias;
  harmonySource: SynestheticHarmonySource;
  hueAnchor: SynestheticHueAnchor;
  chromaPosture: SynestheticChromaPosture;
  contrastPosture: SynestheticContrastPosture;
  harmony: HarmonyType;
  familyId: string;
  anchorHue: number;
}

function determineTemperatureBias(params: ParameterVector): SynestheticTemperatureBias {
  if (params.warmth >= 0.85) return 'hot';
  if (params.warmth >= 0.45) return 'warm';
  return 'cool';
}

function determineChromaPosture(params: ParameterVector, family: PaletteFamilyDescriptor): SynestheticChromaPosture {
  if (family.id === 'solar-flare' || params.saturation >= 0.88) return 'vivid';
  if (family.id === 'orchid-nocturne' || params.saturation >= 0.72) return 'lush';
  if (family.id === 'lagoon-mist' || params.saturation <= 0.42) return 'muted';
  return 'balanced';
}

function determineContrastPosture(params: ParameterVector, family: PaletteFamilyDescriptor): SynestheticContrastPosture {
  if (family.id === 'solar-flare' || params.contrast >= 0.86) return 'bold';
  if (family.id === 'orchid-nocturne' || params.contrast >= 0.7) return 'dramatic';
  if (family.id === 'lagoon-mist' || params.contrast <= 0.35) return 'soft';
  return 'balanced';
}

function determineMood(params: ParameterVector, family: PaletteFamilyDescriptor): string {
  switch (family.id) {
    case 'lagoon-mist':
      return 'calm drift';
    case 'solar-flare':
      return 'incandescent surge';
    case 'orchid-nocturne':
      return 'midnight bloom';
    case 'meadow-bloom':
      if (params.energy >= 0.65) return 'verdant lift';
      if (params.texture >= 0.55) return 'floral weave';
      return 'meadow pulse';
    default:
      return 'balanced resonance';
  }
}

export function deriveSynestheticMapping(
  params: ParameterVector,
  family: PaletteFamilyDescriptor,
): SynestheticMapping {
  return {
    mood: determineMood(params, family),
    temperatureBias: determineTemperatureBias(params),
    harmonySource: 'family',
    hueAnchor: 'family-base',
    chromaPosture: determineChromaPosture(params, family),
    contrastPosture: determineContrastPosture(params, family),
    harmony: family.preferredHarmony,
    familyId: family.id,
    anchorHue: family.baseHue,
  };
}
