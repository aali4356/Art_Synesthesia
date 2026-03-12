import type { ParameterVector } from '@/types/engine';
import { createPRNG } from '@/lib/engine/prng';
import {
  PALETTE_FAMILY_CATALOG,
  type PaletteFamilyDescriptor,
  type PaletteFamilyId,
} from './palette-families';

export interface PaletteSelectionVector {
  warmthBucket: number;
  energyBucket: number;
  contrastBucket: number;
  seedInfluence: number;
}

export interface PaletteFamilySelection {
  family: PaletteFamilyDescriptor;
  selectionKey: string;
  selectionVector: PaletteSelectionVector;
}

function toBucket(value: number): number {
  return Math.max(0, Math.min(3, Math.floor(value * 4)));
}

function selectFamilyId(
  warmthBucket: number,
  energyBucket: number,
  contrastBucket: number,
): PaletteFamilyId {
  if (warmthBucket >= 3 && energyBucket >= 3 && contrastBucket >= 3) {
    return 'solar-flare';
  }
  if (warmthBucket <= 0 && energyBucket <= 0 && contrastBucket <= 1) {
    return 'lagoon-mist';
  }
  if (warmthBucket === 1 && contrastBucket <= 1) {
    return 'meadow-bloom';
  }
  if (warmthBucket >= 2 && contrastBucket >= 3) {
    return 'orchid-nocturne';
  }
  if (energyBucket >= 2 && contrastBucket <= 1) {
    return 'meadow-bloom';
  }
  if (warmthBucket <= 1 && energyBucket <= 1) {
    return 'lagoon-mist';
  }
  if (warmthBucket >= 2) {
    return 'orchid-nocturne';
  }
  return 'meadow-bloom';
}

export function selectPaletteFamily(
  params: ParameterVector,
  seed: string,
): PaletteFamilySelection {
  const prng = createPRNG(`${seed}:palette-family-selection`);
  const warmthBucket = toBucket(params.warmth);
  const energyBucket = toBucket(params.energy);
  const contrastBucket = toBucket(params.contrast);
  const seedInfluence = Number(prng().toFixed(6));

  const familyId = selectFamilyId(warmthBucket, energyBucket, contrastBucket);
  const family = PALETTE_FAMILY_CATALOG.find((candidate) => candidate.id === familyId);

  if (!family) {
    throw new Error(`Missing palette family descriptor for ${familyId}`);
  }

  return {
    family,
    selectionKey: `${family.id}:w${warmthBucket}-e${energyBucket}-c${contrastBucket}-s${seedInfluence.toFixed(3)}`,
    selectionVector: {
      warmthBucket,
      energyBucket,
      contrastBucket,
      seedInfluence,
    },
  };
}
