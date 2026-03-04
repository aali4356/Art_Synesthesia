/**
 * Tests for DATA_MAPPINGS and computeParameterVector with data signals.
 *
 * Verifies structural integrity of the mapping table and that the pipeline
 * produces correct, bounded output vectors from data analysis signals.
 */

import { describe, it, expect } from 'vitest';
import { DATA_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import type { CalibrationData } from '@/lib/pipeline/normalize';

// ---------------------------------------------------------------------------
// Structural tests
// ---------------------------------------------------------------------------

describe('DATA_MAPPINGS structure', () => {
  it('has exactly 15 entries', () => {
    expect(DATA_MAPPINGS).toHaveLength(15);
  });

  it('every ParameterVector key appears exactly once', () => {
    const parameters = DATA_MAPPINGS.map((m) => m.parameter);
    const unique = new Set(parameters);
    expect(unique.size).toBe(15);
    expect(parameters.length).toBe(15);
  });

  it("every mapping entry's signal weights sum to 1.0 within tolerance", () => {
    for (const mapping of DATA_MAPPINGS) {
      const sum = mapping.signals.reduce((acc, s) => acc + s.weight, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    }
  });
});

// ---------------------------------------------------------------------------
// computeParameterVector with DATA_MAPPINGS
// ---------------------------------------------------------------------------

/** Build a simple calibration for all data signals [0, 0.5, 1] */
function buildDataCalibration(): CalibrationData {
  const calibration: CalibrationData = {};
  for (const mapping of DATA_MAPPINGS) {
    for (const { signal } of mapping.signals) {
      calibration[signal] = [0, 0.5, 1];
    }
  }
  return calibration;
}

/** A sample signal record with all data signal names set to a given base value */
function buildSignals(base: number): Record<string, number> {
  const signals: Record<string, number> = {};
  for (const mapping of DATA_MAPPINGS) {
    for (const { signal } of mapping.signals) {
      signals[signal] = base;
    }
  }
  return signals;
}

describe('computeParameterVector with DATA_MAPPINGS', () => {
  it('produces a vector with all values in [0, 1]', () => {
    const calibration = buildDataCalibration();
    const signals = buildSignals(0.5);
    const { vector } = computeParameterVector(signals, calibration, DATA_MAPPINGS);

    for (const value of Object.values(vector)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('produces different parameter vectors for high-numeric vs high-string datasets', () => {
    const calibration = buildDataCalibration();

    // High-numeric dataset: numericColumnRatio, avgMean, avgVariance all high
    const highNumericSignals: Record<string, number> = {
      columnCount: 0.8,
      rowCount: 0.8,
      numericColumnRatio: 0.95,
      stringColumnRatio: 0.05,
      dateColumnRatio: 0,
      nullRatio: 0.01,
      avgMean: 0.9,
      avgVariance: 0.85,
      avgSkewness: 0.2,
      avgKurtosis: 0.3,
      maxCorrelation: 0.7,
      avgCorrelation: 0.6,
      avgCardinality: 0.1,
      varianceSpread: 0.4,
      dataUniformity: 0.8,
    };

    // High-string dataset: stringColumnRatio high, numericColumnRatio low, avgCardinality high
    const highStringSignals: Record<string, number> = {
      columnCount: 0.3,
      rowCount: 0.3,
      numericColumnRatio: 0.05,
      stringColumnRatio: 0.95,
      dateColumnRatio: 0,
      nullRatio: 0.2,
      avgMean: 0.1,
      avgVariance: 0.05,
      avgSkewness: 0.8,
      avgKurtosis: 0.9,
      maxCorrelation: 0.1,
      avgCorrelation: 0.05,
      avgCardinality: 0.9,
      varianceSpread: 0.1,
      dataUniformity: 0.2,
    };

    const { vector: numericVector } = computeParameterVector(
      highNumericSignals,
      calibration,
      DATA_MAPPINGS
    );
    const { vector: stringVector } = computeParameterVector(
      highStringSignals,
      calibration,
      DATA_MAPPINGS
    );

    // Count dimensions that differ by more than 0.1
    const numericRaw = numericVector as unknown as Record<string, number>;
    const stringRaw = stringVector as unknown as Record<string, number>;
    const keys = Object.keys(numericRaw);
    const significantDiffs = keys.filter(
      (k) => Math.abs((numericRaw[k] ?? 0) - (stringRaw[k] ?? 0)) > 0.1
    );

    expect(significantDiffs.length).toBeGreaterThanOrEqual(2);
  });
});
