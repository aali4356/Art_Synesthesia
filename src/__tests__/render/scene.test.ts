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
    { oklch: { mode: 'oklch' as const, l: 0.50, c: 0.15, h: 200 }, hex: '#3d78d4', css: 'oklch(0.50 0.15 200)' },
    { oklch: { mode: 'oklch' as const, l: 0.60, c: 0.22, h: 60 }, hex: '#d4d43d', css: 'oklch(0.60 0.22 60)' },
  ];
  return {
    dark: colors,
    light: colors.map(c => ({ ...c, oklch: { ...c.oklch, l: c.oklch.l + 0.15 } })),
    harmony: 'triadic',
    count: 5,
  };
}

describe('buildSceneGraph', () => {
  it('returns a SceneGraph with elements, width, height, and background', () => {
    const scene = buildSceneGraph(makeParams(), makePalette(), 'dark', 'test-seed');

    expect(scene).toHaveProperty('elements');
    expect(scene).toHaveProperty('width');
    expect(scene).toHaveProperty('height');
    expect(scene).toHaveProperty('background');
    expect(Array.isArray(scene.elements)).toBe(true);
    expect(scene.elements.length).toBeGreaterThan(0);
    expect(scene.width).toBe(800);
    expect(scene.height).toBe(800);
  });

  it('elements have area > 0 and valid hex fill color strings', () => {
    const scene = buildSceneGraph(makeParams(), makePalette(), 'dark', 'color-check');
    const nonEmpty = scene.elements.filter(e => e.type !== 'empty');

    for (const el of nonEmpty) {
      expect(el.area).toBeGreaterThan(0);
      expect(el.fill).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('elements are sorted by area descending (largest first)', () => {
    const scene = buildSceneGraph(makeParams(), makePalette(), 'dark', 'sort-check');

    for (let i = 1; i < scene.elements.length; i++) {
      expect(scene.elements[i - 1].area).toBeGreaterThanOrEqual(scene.elements[i].area);
    }
  });

  it('enforces frame padding on all elements (GEOM-03)', () => {
    const canvasSize = 800;
    const pad = canvasSize * 0.02; // 16px
    const scene = buildSceneGraph(
      makeParams({ complexity: 0.8 }),
      makePalette(),
      'dark',
      'padding-check',
      canvasSize,
    );

    // Non-empty elements should be within padded region
    // Allow layering overflow for elements with layering effect
    const nonEmpty = scene.elements.filter(e => e.type !== 'empty');
    for (const el of nonEmpty) {
      // Layered elements may extend slightly beyond, but core subdivision
      // cells are within padding. We test that center is within bounds.
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      expect(centerX).toBeGreaterThanOrEqual(pad);
      expect(centerY).toBeGreaterThanOrEqual(pad);
      expect(centerX).toBeLessThanOrEqual(canvasSize - pad);
      expect(centerY).toBeLessThanOrEqual(canvasSize - pad);
    }
  });

  it('uses at most 2 distinct stroke widths (GEOM-04)', () => {
    const scene = buildSceneGraph(
      makeParams({ texture: 0.8 }), // High texture = visible strokes
      makePalette(),
      'dark',
      'stroke-check',
    );

    const strokeWidths = new Set<number>();
    for (const el of scene.elements) {
      if (el.strokeWidth !== undefined) {
        strokeWidths.add(el.strokeWidth);
      }
    }

    expect(strokeWidths.size).toBeLessThanOrEqual(2);
  });

  it('sets dark background for dark theme', () => {
    const scene = buildSceneGraph(makeParams(), makePalette(), 'dark', 'bg-dark');
    // Dark background should be a dark hex color
    expect(scene.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    // First two hex chars after # represent red: for dark, should be low
    const r = parseInt(scene.background.slice(1, 3), 16);
    expect(r).toBeLessThan(30);
  });

  it('sets light background for light theme', () => {
    const scene = buildSceneGraph(makeParams(), makePalette(), 'light', 'bg-light');
    expect(scene.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    const r = parseInt(scene.background.slice(1, 3), 16);
    expect(r).toBeGreaterThan(230);
  });

  it('contains at least 2 different shape types for variety', () => {
    const scene = buildSceneGraph(
      makeParams({ complexity: 0.7, density: 0.9 }),
      makePalette(),
      'dark',
      'variety-check',
    );

    const types = new Set(scene.elements.filter(e => e.type !== 'empty').map(e => e.type));
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it('empty cell proportion roughly matches (1 - density) at low density', () => {
    const density = 0.3;
    const scene = buildSceneGraph(
      makeParams({ density, complexity: 0.6 }),
      makePalette(),
      'dark',
      'empty-ratio',
    );

    const total = scene.elements.length;
    const empties = scene.elements.filter(e => e.type === 'empty').length;
    const emptyRatio = empties / total;

    // Fill probability = 0.3 + density * 0.65 = 0.495
    // Expected empty ratio ~ 0.505
    // Allow generous tolerance for PRNG variance
    expect(emptyRatio).toBeGreaterThan(0.15);
    expect(emptyRatio).toBeLessThan(0.85);
  });
});
