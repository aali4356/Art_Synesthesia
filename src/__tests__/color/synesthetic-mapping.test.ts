import { describe, expect, it } from 'vitest';
import { generatePalette } from '@/lib/color/palette';
import { selectHarmony } from '@/lib/color/harmony';
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

describe('synesthetic mapping contract', () => {
  it('exposes a calm lagoon mapping with family-authoritative analogous harmony and cool hue anchor', () => {
    const params = makeParams({
      warmth: 0.1,
      energy: 0.15,
      contrast: 0.22,
      symmetry: 0.86,
      saturation: 0.32,
      texture: 0.28,
      paletteSize: 0.4,
    });

    const result = generatePalette(params, 'synesthetic-lagoon');

    expect(result.familyId).toBe('lagoon-mist');
    expect(result.mapping).toMatchObject({
      mood: 'calm drift',
      temperatureBias: 'cool',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'muted',
      contrastPosture: 'soft',
    });
    expect(result.mapping.familyId).toBe('lagoon-mist');
    expect(result.mapping.harmony).toBe('analogous');
    expect(result.harmony).toBe('analogous');
    expect(result.mapping.anchorHue).toBeGreaterThanOrEqual(190);
    expect(result.mapping.anchorHue).toBeLessThanOrEqual(225);
    expect(selectHarmony(params)).toBe('analogous');
  });

  it('exposes a solar flare mapping where family selection overrides vector harmony toward complementary heat', () => {
    const params = makeParams({
      warmth: 0.97,
      energy: 0.94,
      contrast: 0.88,
      symmetry: 0.93,
      saturation: 0.92,
      layering: 0.7,
      paletteSize: 0.75,
    });

    const result = generatePalette(params, 'synesthetic-solar');

    expect(result.familyId).toBe('solar-flare');
    expect(selectHarmony(params)).toBe('complementary');
    expect(result.mapping).toMatchObject({
      mood: 'incandescent surge',
      temperatureBias: 'hot',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'vivid',
      contrastPosture: 'bold',
      harmony: 'complementary',
    });
    expect(result.harmony).toBe('complementary');
    expect(result.mapping.anchorHue).toBeGreaterThanOrEqual(15);
    expect(result.mapping.anchorHue).toBeLessThanOrEqual(40);
  });

  it('exposes an orchid nocturne mapping with dramatic chroma and triadic authority', () => {
    const params = makeParams({
      warmth: 0.72,
      energy: 0.48,
      contrast: 0.83,
      symmetry: 0.35,
      saturation: 0.81,
      texture: 0.62,
      regularity: 0.38,
    });

    const result = generatePalette(params, 'synesthetic-orchid');

    expect(result.familyId).toBe('orchid-nocturne');
    expect(result.mapping).toMatchObject({
      mood: 'midnight bloom',
      temperatureBias: 'warm',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'lush',
      contrastPosture: 'dramatic',
      harmony: 'triadic',
    });
    expect(result.harmony).toBe('triadic');
    expect(result.mapping.anchorHue).toBeGreaterThanOrEqual(300);
    expect(result.mapping.anchorHue).toBeLessThanOrEqual(330);
  });

  it('surfaces mapping diagnostics directly on PaletteResult for downstream inspection', () => {
    const result = generatePalette(makeParams({ warmth: 0.43, energy: 0.58, contrast: 0.41 }), 'mapping-shape');

    expect(result).toHaveProperty('mapping');
    expect(result.mapping).toMatchObject({
      mood: expect.any(String),
      temperatureBias: expect.any(String),
      harmonySource: expect.any(String),
      hueAnchor: expect.any(String),
      chromaPosture: expect.any(String),
      contrastPosture: expect.any(String),
      harmony: expect.any(String),
      familyId: expect.any(String),
      anchorHue: expect.any(Number),
    });
  });
});
