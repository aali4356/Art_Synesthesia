import { describe, it, expect } from 'vitest';
import { buildSceneGraph } from '@/lib/render/geometric/scene';
import type { ParameterVector } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';

/** Helper: create a default ParameterVector. */
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

/** Helper: create a mock PaletteResult. */
function makePalette(): PaletteResult {
  const colors = [
    { oklch: { mode: 'oklch' as const, l: 0.65, c: 0.25, h: 285 }, hex: '#7b3dd4', css: 'oklch(0.65 0.25 285)' },
    { oklch: { mode: 'oklch' as const, l: 0.60, c: 0.20, h: 30 }, hex: '#d4783d', css: 'oklch(0.60 0.20 30)' },
    { oklch: { mode: 'oklch' as const, l: 0.55, c: 0.18, h: 120 }, hex: '#3dd47b', css: 'oklch(0.55 0.18 120)' },
  ];
  return {
    dark: colors,
    light: colors,
    harmony: 'triadic',
    count: 3,
  };
}

describe('determinism', () => {
  it('produces identical SceneGraph with same seed + params + palette', () => {
    const params = makeParams();
    const palette = makePalette();

    const scene1 = buildSceneGraph(params, palette, 'dark', 'determinism-seed');
    const scene2 = buildSceneGraph(params, palette, 'dark', 'determinism-seed');

    // Deep comparison
    expect(scene1.elements.length).toBe(scene2.elements.length);
    expect(scene1.background).toBe(scene2.background);
    expect(scene1.width).toBe(scene2.width);
    expect(scene1.height).toBe(scene2.height);

    for (let i = 0; i < scene1.elements.length; i++) {
      expect(scene1.elements[i]).toEqual(scene2.elements[i]);
    }
  });

  it('produces different SceneGraph with different seeds', () => {
    const params = makeParams();
    const palette = makePalette();

    const scene1 = buildSceneGraph(params, palette, 'dark', 'seed-A');
    const scene2 = buildSceneGraph(params, palette, 'dark', 'seed-B');

    // At least some elements should differ
    const differs = scene1.elements.some((el, i) => {
      const other = scene2.elements[i];
      if (!other) return true;
      return el.x !== other.x || el.y !== other.y || el.type !== other.type || el.fill !== other.fill;
    }) || scene1.elements.length !== scene2.elements.length;

    expect(differs).toBe(true);
  });

  it('produces identical result across 3 runs (no hidden state)', () => {
    const params = makeParams({ complexity: 0.7, curvature: 0.3 });
    const palette = makePalette();
    const seed = 'triple-check';

    const scene1 = buildSceneGraph(params, palette, 'dark', seed);
    const scene2 = buildSceneGraph(params, palette, 'dark', seed);
    const scene3 = buildSceneGraph(params, palette, 'dark', seed);

    // All three should be identical
    expect(scene1.elements.length).toBe(scene2.elements.length);
    expect(scene2.elements.length).toBe(scene3.elements.length);

    for (let i = 0; i < scene1.elements.length; i++) {
      expect(scene1.elements[i]).toEqual(scene2.elements[i]);
      expect(scene2.elements[i]).toEqual(scene3.elements[i]);
    }
  });
});
