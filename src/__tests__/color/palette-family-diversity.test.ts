import { describe, it, expect } from 'vitest';
import { generatePalette } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';
import {
  useMode,
  modeOklch,
  modeRgb,
  modeLrgb,
  modeLab65,
  converter,
  wcagContrast,
  differenceCiede2000,
} from 'culori/fn';

useMode(modeOklch);
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeLab65);

const toRgb = converter('rgb');
const toLab = converter('lab65');
const deltaE = differenceCiede2000();

function makeParams(overrides: Partial<ParameterVector> = {}): ParameterVector {
  return {
    complexity: 0.5,
    warmth: 0.5,
    symmetry: 0.5,
    rhythm: 0.5,
    energy: 0.5,
    density: 0.5,
    scaleVariation: 0.5,
    curvature: 0.5,
    saturation: 0.5,
    contrast: 0.5,
    layering: 0.5,
    directionality: 0.5,
    paletteSize: 0.5,
    texture: 0.5,
    regularity: 0.5,
    ...overrides,
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizePalette(result: ReturnType<typeof generatePalette>) {
  return {
    avgHue: average(result.dark.map((color) => color.oklch.h)),
    avgChroma: average(result.dark.map((color) => color.oklch.c)),
    avgLightness: average(result.dark.map((color) => color.oklch.l)),
  };
}

describe('palette family diversity contract', () => {
  const curatedCases = [
    {
      familyId: 'solar-flare',
      params: makeParams({ warmth: 0.95, energy: 0.92, contrast: 0.82, saturation: 0.88, paletteSize: 0.8 }),
      seed: 'diversity-solar',
    },
    {
      familyId: 'lagoon-mist',
      params: makeParams({ warmth: 0.12, energy: 0.18, contrast: 0.34, saturation: 0.58, paletteSize: 0.8 }),
      seed: 'diversity-lagoon',
    },
    {
      familyId: 'orchid-nocturne',
      params: makeParams({ warmth: 0.66, energy: 0.46, contrast: 0.78, saturation: 0.74, paletteSize: 0.8 }),
      seed: 'diversity-orchid',
    },
  ] as const;

  it('realizes curated families into materially distinct perceptual territory', () => {
    const realized = curatedCases.map(({ familyId, params, seed }) => {
      const result = generatePalette(params, seed);
      expect(result.familyId).toBe(familyId);
      return { familyId, result, summary: summarizePalette(result) };
    });

    for (let i = 0; i < realized.length; i++) {
      for (let j = i + 1; j < realized.length; j++) {
        const a = realized[i];
        const b = realized[j];

        const dominantA = toLab(a.result.dark[0].oklch);
        const dominantB = toLab(b.result.dark[0].oklch);
        expect(dominantA && dominantB).toBeTruthy();
        if (!dominantA || !dominantB) {
          continue;
        }

        expect(deltaE(dominantA, dominantB)).toBeGreaterThanOrEqual(20);
        expect(Math.abs(a.summary.avgHue - b.summary.avgHue)).toBeGreaterThanOrEqual(25);
        expect(Math.abs(a.summary.avgChroma - b.summary.avgChroma)).toBeGreaterThanOrEqual(0.03);
      }
    }
  });

  it('preserves contrast safety after family realization in both modes', () => {
    const darkBg = { mode: 'oklch' as const, l: 0.09, c: 0.005, h: 250 };
    const lightBg = { mode: 'oklch' as const, l: 1.0, c: 0, h: 0 };

    for (const { params, seed } of curatedCases) {
      const result = generatePalette(params, seed);

      for (const color of result.dark) {
        const ratio = wcagContrast(toRgb(color.oklch)!, toRgb(darkBg)!);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      }

      for (const color of result.light) {
        const ratio = wcagContrast(toRgb(color.oklch)!, toRgb(lightBg)!);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      }
    }
  });

  it('preserves near-duplicate rejection within each curated family output', () => {
    for (const { params, seed } of curatedCases) {
      const result = generatePalette(params, seed);

      for (let i = 0; i < result.dark.length; i++) {
        for (let j = i + 1; j < result.dark.length; j++) {
          const first = toLab(result.dark[i].oklch);
          const second = toLab(result.dark[j].oklch);
          expect(first && second).toBeTruthy();
          if (!first || !second) {
            continue;
          }
          expect(deltaE(first, second)).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });
});
