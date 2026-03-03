import { describe, it, expect } from 'vitest';
import { percentileRank, normalizeSignals } from '@/lib/pipeline/normalize';
import type { CalibrationData } from '@/lib/pipeline/normalize';

describe('percentileRank', () => {
  it('returns 0 for values below the minimum', () => {
    expect(percentileRank([1, 2, 3, 4, 5], 0)).toBe(0);
  });

  it('returns 1 for values above the maximum', () => {
    expect(percentileRank([1, 2, 3, 4, 5], 6)).toBe(1);
  });

  it('returns 0.5 for the median value', () => {
    expect(percentileRank([1, 2, 3, 4, 5], 3)).toBe(0.5);
  });

  it('returns 0 for value at the minimum', () => {
    expect(percentileRank([1, 2, 3, 4, 5], 1)).toBe(0);
  });

  it('returns 1 for value at the maximum', () => {
    expect(percentileRank([1, 2, 3, 4, 5], 5)).toBe(1);
  });

  it('returns 0.5 for empty distribution (midpoint)', () => {
    expect(percentileRank([], 42)).toBe(0.5);
  });

  it('returns 0.5 for all-same values (midpoint via average rank)', () => {
    expect(percentileRank([1, 1, 1, 1, 1], 1)).toBe(0.5);
  });

  it('interpolates linearly between adjacent values', () => {
    // Between 2 and 4 in [1, 2, 4, 5]
    // Value 3 is halfway between index 1 (value 2) and index 2 (value 4)
    // Rank of 2 = 1/(4-1) = 1/3, rank of 4 = 2/(4-1) = 2/3
    // Interpolated rank = 1/3 + 0.5 * (2/3 - 1/3) = 1/3 + 1/6 = 1/2
    const result = percentileRank([1, 2, 4, 5], 3);
    expect(result).toBeCloseTo(0.5, 5);
  });

  it('handles two-element distribution', () => {
    // [0, 10], value 5 should be 0.5 (midway between ranks 0 and 1)
    expect(percentileRank([0, 10], 5)).toBeCloseTo(0.5, 5);
  });

  it('handles single-element distribution at that element', () => {
    // Single element: [5], value 5. n=1, n-1=0. Special case -> 0.5
    expect(percentileRank([5], 5)).toBe(0.5);
  });

  it('handles single-element distribution below that element', () => {
    expect(percentileRank([5], 3)).toBe(0);
  });

  it('handles single-element distribution above that element', () => {
    expect(percentileRank([5], 7)).toBe(1);
  });

  it('handles duplicate values at boundaries', () => {
    // [1, 1, 3, 5, 5] for value 1: first=0, last=1, avg rank = 0.5/4 = 0.125
    const result = percentileRank([1, 1, 3, 5, 5], 1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(0.5);
  });

  it('handles duplicate values at upper boundary', () => {
    // [1, 1, 3, 5, 5] for value 5: first=3, last=4, avg rank = 3.5/4 = 0.875
    const result = percentileRank([1, 1, 3, 5, 5], 5);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('always returns values in [0, 1] range', () => {
    const testValues = [-100, -1, 0, 0.5, 1, 2, 3, 50, 1000];
    const dist = [1, 2, 3, 4, 5];
    for (const v of testValues) {
      const result = percentileRank(dist, v);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });
});

describe('normalizeSignals', () => {
  const calibration: CalibrationData = {
    signalA: [1, 2, 3, 4, 5],
    signalB: [10, 20, 30, 40, 50],
  };

  it('normalizes signals using calibration distributions', () => {
    const raw = { signalA: 3, signalB: 30 };
    const result = normalizeSignals(raw, calibration);

    expect(result.signalA).toBeCloseTo(0.5, 5);
    expect(result.signalB).toBeCloseTo(0.5, 5);
  });

  it('returns 0.5 for signals not in calibration data', () => {
    const raw = { unknownSignal: 42 };
    const result = normalizeSignals(raw, calibration);

    expect(result.unknownSignal).toBe(0.5);
  });

  it('returns all values in [0, 1]', () => {
    const raw = { signalA: -100, signalB: 1000 };
    const result = normalizeSignals(raw, calibration);

    expect(result.signalA).toBeGreaterThanOrEqual(0);
    expect(result.signalA).toBeLessThanOrEqual(1);
    expect(result.signalB).toBeGreaterThanOrEqual(0);
    expect(result.signalB).toBeLessThanOrEqual(1);
  });

  it('handles empty raw signals', () => {
    const result = normalizeSignals({}, calibration);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles empty calibration data', () => {
    const raw = { signalA: 3 };
    const result = normalizeSignals(raw, {});

    // No calibration for signalA -> returns 0.5
    expect(result.signalA).toBe(0.5);
  });

  it('normalizes multiple signals independently', () => {
    const raw = { signalA: 1, signalB: 50 };
    const result = normalizeSignals(raw, calibration);

    // signalA at minimum -> 0
    expect(result.signalA).toBe(0);
    // signalB at maximum -> 1
    expect(result.signalB).toBe(1);
  });
});
