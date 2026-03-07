import { describe, it, expect } from 'vitest';
import { generateDiffSummary, isSignificantDiff } from '@/lib/compare/summary';
import type { ParameterDiff } from '@/lib/compare/diff';

const makeDiff = (parameter: string, delta: number): ParameterDiff => ({
  parameter,
  leftValue: 0.5,
  rightValue: 0.5 + delta,
  delta,
  absDelta: Math.abs(delta),
});

describe('COMP-03: generateDiffSummary', () => {
  it('returns identical message when all deltas are zero', () => {
    const diffs: ParameterDiff[] = [makeDiff('rhythm', 0), makeDiff('warmth', 0)];
    expect(generateDiffSummary(diffs)).toBe('These inputs produce identical parameters.');
  });

  it('includes top 3 parameters by absDelta with signed values', () => {
    const diffs: ParameterDiff[] = [
      makeDiff('rhythm', 0.43),
      makeDiff('warmth', -0.31),
      makeDiff('energy', 0.12),
      makeDiff('complexity', 0.05),
    ];
    const summary = generateDiffSummary(diffs);
    expect(summary).toContain('rhythm (+0.43)');
    expect(summary).toContain('warmth (-0.31)');
    expect(summary).toContain('energy (+0.12)');
    expect(summary).not.toContain('complexity');
  });

  it('formats positive delta with + sign', () => {
    const diffs = [makeDiff('rhythm', 0.5)];
    expect(generateDiffSummary(diffs)).toContain('+0.50');
  });

  it('formats negative delta without extra minus', () => {
    const diffs = [makeDiff('warmth', -0.3)];
    expect(generateDiffSummary(diffs)).toContain('-0.30');
  });

  it('handles single difference', () => {
    const diffs = [makeDiff('rhythm', 0.2)];
    const summary = generateDiffSummary(diffs);
    expect(summary).toContain('These differ most in');
    expect(summary).toContain('rhythm');
  });
});

describe('isSignificantDiff', () => {
  it('returns true for absDelta > 0.1', () => {
    expect(isSignificantDiff(0.11)).toBe(true);
    expect(isSignificantDiff(0.5)).toBe(true);
  });

  it('returns false for absDelta <= 0.1', () => {
    expect(isSignificantDiff(0.1)).toBe(false);
    expect(isSignificantDiff(0.0)).toBe(false);
  });
});
