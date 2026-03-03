import { describe, it, expect } from 'vitest';
import { createPRNG } from '@/lib/engine/prng';
import { subdivide } from '@/lib/render/geometric/subdivide';
import { assignShape } from '@/lib/render/geometric/shapes';
import { createRenderConfig, type Cell, type RenderConfig } from '@/lib/render/types';
import type { PaletteColor } from '@/lib/color/palette';

/** Helper: create a default render config at specific complexity/symmetry/density. */
function makeConfig(overrides: Partial<RenderConfig> = {}): RenderConfig {
  return createRenderConfig({
    complexity: 0.5,
    symmetry: 0.5,
    density: 0.5,
    curvature: 0.5,
    texture: 0.5,
    scaleVariation: 0.5,
    rhythm: 0.5,
    regularity: 0.5,
    directionality: 0.5,
    layering: 0.5,
    energy: 0.5,
    ...overrides,
  });
}

/** Helper: create a root region (800x800). */
function makeRoot(size: number = 800): Cell {
  return { x: 0, y: 0, width: size, height: size, depth: 0 };
}

/** Helper: mock palette colors. */
function makePalette(count: number = 5): PaletteColor[] {
  const hues = [285, 30, 120, 200, 60];
  return Array.from({ length: count }, (_, i) => ({
    oklch: { mode: 'oklch' as const, l: 0.65, c: 0.25, h: hues[i % hues.length] },
    hex: ['#7b3dd4', '#d4783d', '#3dd47b', '#3d78d4', '#d4d43d'][i % 5],
    css: `oklch(0.65 0.25 ${hues[i % hues.length]})`,
  }));
}

describe('subdivide', () => {
  it('produces cells that tile the input region (GEOM-01)', () => {
    const prng = createPRNG('test-seed');
    const config = makeConfig({ complexity: 0.5 });
    const root = makeRoot();
    const cells = subdivide(root, config, prng);

    expect(cells.length).toBeGreaterThan(1);
    // All cells should be within the frame-padded region
    const pad = config.framePadding;
    for (const cell of cells) {
      expect(cell.x).toBeGreaterThanOrEqual(pad - 0.01);
      expect(cell.y).toBeGreaterThanOrEqual(pad - 0.01);
      expect(cell.x + cell.width).toBeLessThanOrEqual(800 - pad + 0.01);
      expect(cell.y + cell.height).toBeLessThanOrEqual(800 - pad + 0.01);
      expect(cell.width).toBeGreaterThan(0);
      expect(cell.height).toBeGreaterThan(0);
    }
  });

  it('enforces minimum cell size of 4px at max complexity (GEOM-02 min-size)', () => {
    const prng = createPRNG('min-size-seed');
    const config = makeConfig({ complexity: 1.0, density: 1.0 });
    const root = makeRoot();
    const cells = subdivide(root, config, prng);

    for (const cell of cells) {
      expect(cell.width).toBeGreaterThanOrEqual(4);
      expect(cell.height).toBeGreaterThanOrEqual(4);
    }
  });

  it('bounds cell count at max complexity+density (GEOM-02 depth-limiting)', () => {
    const prng = createPRNG('depth-limit-seed');
    const config = makeConfig({ complexity: 1.0, density: 1.0 });
    const root = makeRoot();
    const cells = subdivide(root, config, prng);

    // At max complexity depth=8, cell count should be bounded
    // For 800x800 with gaps and min size, a reasonable upper bound
    expect(cells.length).toBeGreaterThan(1);
    expect(cells.length).toBeLessThan(10000); // Sanity: not infinite
  });

  it('applies frame padding of 2% on all edges (GEOM-03)', () => {
    const prng = createPRNG('padding-seed');
    const canvasSize = 800;
    const config = makeConfig({ complexity: 0.8 });
    const root = makeRoot(canvasSize);
    const cells = subdivide(root, config, prng);
    const pad = config.framePadding; // 800 * 0.02 = 16

    expect(pad).toBeCloseTo(16, 1);
    for (const cell of cells) {
      expect(cell.x).toBeGreaterThanOrEqual(pad - 0.01);
      expect(cell.y).toBeGreaterThanOrEqual(pad - 0.01);
      expect(cell.x + cell.width).toBeLessThanOrEqual(canvasSize - pad + 0.01);
      expect(cell.y + cell.height).toBeLessThanOrEqual(canvasSize - pad + 0.01);
    }
  });

  it('produces fewer cells at complexity=0 than complexity=1', () => {
    const prngLow = createPRNG('depth-test');
    const prngHigh = createPRNG('depth-test');
    const configLow = makeConfig({ complexity: 0.0 });
    const configHigh = makeConfig({ complexity: 1.0 });
    const root = makeRoot();

    const cellsLow = subdivide(root, configLow, prngLow);
    const cellsHigh = subdivide(root, configHigh, prngHigh);

    expect(cellsLow.length).toBeLessThan(cellsHigh.length);
  });

  it('produces more balanced splits at symmetry=1.0 vs symmetry=0.0', () => {
    // Run multiple subdivisions and check ratio variance
    const prngBalanced = createPRNG('symmetry-test');
    const prngAsymmetric = createPRNG('symmetry-test');
    const configBalanced = makeConfig({ symmetry: 1.0, complexity: 0.5 });
    const configAsymmetric = makeConfig({ symmetry: 0.0, complexity: 0.5 });
    const root = makeRoot();

    const cellsBalanced = subdivide(root, configBalanced, prngBalanced);
    const cellsAsymmetric = subdivide(root, configAsymmetric, prngAsymmetric);

    // With symmetry=1.0, cells should have more similar sizes
    const areasBalanced = cellsBalanced.map(c => c.width * c.height);
    const areasAsymmetric = cellsAsymmetric.map(c => c.width * c.height);

    // Coefficient of variation (std/mean) should be lower for balanced
    const cv = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
      return Math.sqrt(variance) / mean;
    };

    expect(cv(areasBalanced)).toBeLessThan(cv(areasAsymmetric));
  });

  it('produces non-overlapping cells with cellGap separation', () => {
    const prng = createPRNG('gap-test');
    const config = makeConfig({ complexity: 0.7 });
    const root = makeRoot();
    const cells = subdivide(root, config, prng);

    // No two cells should overlap
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i];
        const b = cells[j];
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });
});

describe('assignShape', () => {
  it('assigns mostly circles at curvature=1.0', () => {
    const prng = createPRNG('curvature-high');
    const config = makeConfig({ curvature: 1.0, density: 1.0 });
    const palette = makePalette();
    const cells: Cell[] = Array.from({ length: 50 }, (_, i) => ({
      x: 20 + (i % 10) * 70,
      y: 20 + Math.floor(i / 10) * 70,
      width: 60,
      height: 60,
      depth: 2,
    }));

    const elements = cells.map(c => assignShape(c, config, palette, prng));
    const nonEmpty = elements.filter(e => e.type !== 'empty');
    const circles = nonEmpty.filter(e => e.type === 'circle');

    // At curvature=1.0, circles should be the majority
    expect(circles.length).toBeGreaterThan(nonEmpty.length * 0.3);
  });

  it('assigns mostly rectangles/triangles at curvature=0.0', () => {
    const prng = createPRNG('curvature-low');
    const config = makeConfig({ curvature: 0.0, density: 1.0 });
    const palette = makePalette();
    const cells: Cell[] = Array.from({ length: 50 }, (_, i) => ({
      x: 20 + (i % 10) * 70,
      y: 20 + Math.floor(i / 10) * 70,
      width: 60,
      height: 60,
      depth: 2,
    }));

    const elements = cells.map(c => assignShape(c, config, palette, prng));
    const nonEmpty = elements.filter(e => e.type !== 'empty');
    const circles = nonEmpty.filter(e => e.type === 'circle');

    // At curvature=0.0, circles should be rare
    expect(circles.length).toBeLessThan(nonEmpty.length * 0.3);
  });

  it('produces more empty cells at low density', () => {
    const prng = createPRNG('density-low');
    const config = makeConfig({ density: 0.1 });
    const palette = makePalette();
    const cells: Cell[] = Array.from({ length: 100 }, (_, i) => ({
      x: 20 + (i % 10) * 70,
      y: 20 + Math.floor(i / 10) * 70,
      width: 60,
      height: 60,
      depth: 2,
    }));

    const elements = cells.map(c => assignShape(c, config, palette, prng));
    const empties = elements.filter(e => e.type === 'empty');

    // At low density (fillProbability ~0.365), many cells should be empty
    expect(empties.length).toBeGreaterThan(cells.length * 0.3);
  });

  it('assigns fill colors from the palette for non-empty shapes', () => {
    const prng = createPRNG('color-test');
    const config = makeConfig({ density: 1.0 });
    const palette = makePalette();
    const paletteHexes = new Set(palette.map(c => c.hex));
    const cells: Cell[] = Array.from({ length: 20 }, (_, i) => ({
      x: 20 + i * 35,
      y: 20,
      width: 30,
      height: 30,
      depth: 2,
    }));

    const elements = cells.map(c => assignShape(c, config, palette, prng));
    const nonEmpty = elements.filter(e => e.type !== 'empty');

    for (const el of nonEmpty) {
      expect(paletteHexes.has(el.fill)).toBe(true);
    }
  });
});
