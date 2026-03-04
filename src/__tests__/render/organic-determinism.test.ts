import { describe, it, expect } from 'vitest';
import { buildOrganicSceneGraph } from '@/lib/render/organic';

const params = {
  complexity: 0.6, warmth: 0.4, symmetry: 0.7, rhythm: 0.3,
  energy: 0.8, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
  saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
  paletteSize: 0.5, texture: 0.5, regularity: 0.5,
} as any;

const palette = {
  dark: [{ hex: '#7b3dd4' }, { hex: '#d4783d' }],
  light: [{ hex: '#4040a0' }, { hex: '#a04020' }],
  harmony: 'triadic',
  count: 2,
} as any;

describe('organic renderer determinism', () => {
  it('identical inputs produce identical OrganicSceneGraph', () => {
    const a = buildOrganicSceneGraph(params, palette, 'dark', 'det-seed');
    const b = buildOrganicSceneGraph(params, palette, 'dark', 'det-seed');

    expect(a.curves.length).toBe(b.curves.length);
    expect(a.octaves).toBe(b.octaves);
    expect(a.layers).toBe(b.layers);
    expect(a.dominantDirection).toBeCloseTo(b.dominantDirection, 5);

    for (let i = 0; i < Math.min(3, a.curves.length); i++) {
      expect(a.curves[i].points.length).toBe(b.curves[i].points.length);
      expect(a.curves[i].points[0].x).toBeCloseTo(b.curves[i].points[0].x, 5);
    }
  });

  it('different seeds produce different curve sets', () => {
    const a = buildOrganicSceneGraph(params, palette, 'dark', 'seed-A');
    const b = buildOrganicSceneGraph(params, palette, 'dark', 'seed-B');

    const someDiffer = a.curves.some((curve, i) =>
      !b.curves[i] || Math.abs(curve.points[0].x - b.curves[i].points[0].x) > 1
    );
    expect(someDiffer).toBe(true);
  });

  it('determinism holds across 3 runs with no hidden state', () => {
    const runs = [
      buildOrganicSceneGraph(params, palette, 'dark', 'repeat-seed'),
      buildOrganicSceneGraph(params, palette, 'dark', 'repeat-seed'),
      buildOrganicSceneGraph(params, palette, 'dark', 'repeat-seed'),
    ];
    expect(runs[0].curves.length).toBe(runs[1].curves.length);
    expect(runs[1].curves.length).toBe(runs[2].curves.length);
  });
});
