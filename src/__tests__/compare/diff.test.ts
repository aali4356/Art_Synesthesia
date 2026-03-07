import { describe, it, expect } from 'vitest';
import { computeParameterDiff } from '@/lib/compare/diff';
import type { ParameterVector } from '@/types/engine';

const BASE: ParameterVector = {
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
};

describe('COMP-02: computeParameterDiff', () => {
  it('returns one entry per numeric parameter, excluding extensions', () => {
    const diffs = computeParameterDiff(BASE, BASE);
    expect(diffs).toHaveLength(15);
    expect(diffs.every((d) => d.parameter !== 'extensions')).toBe(true);
  });

  it('computes signed delta: rightValue - leftValue', () => {
    const right = { ...BASE, rhythm: 0.9 };
    const diffs = computeParameterDiff(BASE, right);
    const rhythmDiff = diffs.find((d) => d.parameter === 'rhythm')!;
    expect(rhythmDiff.delta).toBeCloseTo(0.4, 5);
    expect(rhythmDiff.leftValue).toBe(0.5);
    expect(rhythmDiff.rightValue).toBe(0.9);
  });

  it('sorts by absDelta descending (largest difference first)', () => {
    const right = { ...BASE, rhythm: 0.9, warmth: 0.1, symmetry: 0.6 };
    const diffs = computeParameterDiff(BASE, right);
    expect(diffs[0].parameter).toBe('warmth');   // absDelta = 0.4
    expect(diffs[1].parameter).toBe('rhythm');   // absDelta = 0.4
    // symmetry (0.1) and all zeros come after
    expect(diffs[diffs.length - 1].absDelta).toBeGreaterThanOrEqual(0);
  });

  it('returns delta=0 for identical vectors', () => {
    const diffs = computeParameterDiff(BASE, BASE);
    expect(diffs.every((d) => d.delta === 0)).toBe(true);
  });

  it('handles extensions field by excluding it', () => {
    const leftWithExt = { ...BASE, extensions: { custom: 0.8 } };
    const rightWithExt = { ...BASE, extensions: { custom: 0.2 } };
    const diffs = computeParameterDiff(leftWithExt, rightWithExt);
    expect(diffs.find((d) => d.parameter === 'extensions')).toBeUndefined();
  });
});
