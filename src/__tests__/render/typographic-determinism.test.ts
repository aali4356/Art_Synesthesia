import { describe, it, expect } from 'vitest';
import { buildTypographicSceneGraph, approximateMeasure } from '@/lib/render/typographic';

const params = {
  complexity: 0.6, warmth: 0.4, symmetry: 0.7, rhythm: 0.3,
  energy: 0.8, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
  saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
  paletteSize: 0.5, texture: 0.5, regularity: 0.5,
} as any;

const palette = {
  dark: [{ hex: '#c0a0ff' }, { hex: '#80c0ff' }],
  light: [{ hex: '#4040a0' }, { hex: '#204080' }],
} as any;

const text = 'The quick brown fox jumps over the lazy dog';

describe('typographic renderer determinism', () => {
  it('produces identical scene for same inputs (multiple runs)', () => {
    const a = buildTypographicSceneGraph(params, palette, 'dark', 'det-seed', text, 800, approximateMeasure);
    const b = buildTypographicSceneGraph(params, palette, 'dark', 'det-seed', text, 800, approximateMeasure);

    expect(a.words.length).toBe(b.words.length);
    for (let i = 0; i < Math.min(5, a.words.length); i++) {
      expect(a.words[i].x).toBeCloseTo(b.words[i].x, 5);
      expect(a.words[i].y).toBeCloseTo(b.words[i].y, 5);
      expect(a.words[i].fontSize).toBeCloseTo(b.words[i].fontSize, 5);
      expect(a.words[i].rotation).toBeCloseTo(b.words[i].rotation, 5);
    }
  });

  it('produces different scenes for different seeds', () => {
    const a = buildTypographicSceneGraph(params, palette, 'dark', 'seed-A', text, 800, approximateMeasure);
    const b = buildTypographicSceneGraph(params, palette, 'dark', 'seed-B', text, 800, approximateMeasure);
    const someDiffer = a.words.some((w, i) =>
      Math.abs(w.x - (b.words[i]?.x ?? 0)) > 1 || Math.abs(w.rotation - (b.words[i]?.rotation ?? 0)) > 0.1
    );
    expect(someDiffer).toBe(true);
  });

  it('produces different layouts for different input text', () => {
    const a = buildTypographicSceneGraph(params, palette, 'dark', 'same-seed', 'hello world', 800, approximateMeasure);
    const b = buildTypographicSceneGraph(params, palette, 'dark', 'same-seed', 'goodbye moon', 800, approximateMeasure);
    expect(a.words[0]?.text).not.toBe(b.words[0]?.text);
  });
});
