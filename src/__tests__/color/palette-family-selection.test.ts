import { describe, it, expect } from 'vitest';
import { generatePalette } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';

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

describe('palette family selection contract', () => {
  it('returns stable family metadata on PaletteResult', () => {
    const result = generatePalette(makeParams(), 'family-metadata-seed');

    expect(result).toHaveProperty('familyId');
    expect(result).toHaveProperty('familyName');
    expect(result).toHaveProperty('familyDescriptor');
    expect(result).toHaveProperty('selectionKey');
    expect(result).toHaveProperty('selectionVector');

    expect(result.familyId).toMatch(/^[a-z0-9-]+$/);
    expect(result.familyName.length).toBeGreaterThan(0);
    expect(result.familyDescriptor.length).toBeGreaterThan(0);
    expect(result.selectionKey.length).toBeGreaterThan(0);

    expect(result.selectionVector).toMatchObject({
      warmthBucket: expect.any(Number),
      energyBucket: expect.any(Number),
      contrastBucket: expect.any(Number),
      seedInfluence: expect.any(Number),
    });
  });

  it('keeps family identity deterministic for the same parameter vector and seed', () => {
    const params = makeParams({
      warmth: 0.78,
      energy: 0.81,
      contrast: 0.67,
      saturation: 0.73,
      paletteSize: 0.62,
    });

    const first = generatePalette(params, 'deterministic-family-seed');
    const second = generatePalette(params, 'deterministic-family-seed');

    expect(first.familyId).toBe(second.familyId);
    expect(first.familyName).toBe(second.familyName);
    expect(first.familyDescriptor).toBe(second.familyDescriptor);
    expect(first.selectionKey).toBe(second.selectionKey);
    expect(first.selectionVector).toEqual(second.selectionVector);
  });

  it('changes family identity across representative vectors and seeds', () => {
    const scenarios = [
      {
        name: 'solar warm high-energy',
        expectedFamilyId: 'solar-flare',
        params: makeParams({ warmth: 0.95, energy: 0.92, contrast: 0.82, saturation: 0.88 }),
        seed: 'family-solar',
      },
      {
        name: 'lagoon cool low-energy',
        expectedFamilyId: 'lagoon-mist',
        params: makeParams({ warmth: 0.12, energy: 0.18, contrast: 0.34, saturation: 0.58 }),
        seed: 'family-lagoon',
      },
      {
        name: 'orchid nocturne balanced dramatic',
        expectedFamilyId: 'orchid-nocturne',
        params: makeParams({ warmth: 0.66, energy: 0.46, contrast: 0.78, saturation: 0.74 }),
        seed: 'family-orchid',
      },
      {
        name: 'meadow bloom bright moderate',
        expectedFamilyId: 'meadow-bloom',
        params: makeParams({ warmth: 0.44, energy: 0.57, contrast: 0.41, saturation: 0.63 }),
        seed: 'family-meadow',
      },
    ] as const;

    const familyIds = scenarios.map(({ params, seed, expectedFamilyId }) => {
      const result = generatePalette(params, seed);
      expect(result.familyId).toBe(expectedFamilyId);
      return result.familyId;
    });

    expect(new Set(familyIds).size).toBe(scenarios.length);
  });

  it('keeps legacy palette fields intact while exposing family observability', () => {
    const result = generatePalette(makeParams({ warmth: 0.31, contrast: 0.76 }), 'legacy-shape-seed');

    expect(result.dark.length).toBe(result.count);
    expect(result.light.length).toBe(result.count);
    expect(result.harmony).toBeDefined();
    expect(result.familyId).toBeDefined();
    expect(result.selectionVector).toBeDefined();
  });
});
