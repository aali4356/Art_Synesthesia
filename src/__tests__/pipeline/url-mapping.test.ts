import { describe, it, expect } from 'vitest';
import { URL_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import type { CalibrationData } from '@/lib/pipeline/normalize';

const PARAMETER_KEYS = [
  'complexity', 'warmth', 'symmetry', 'rhythm', 'energy', 'density',
  'scaleVariation', 'curvature', 'saturation', 'contrast', 'layering',
  'directionality', 'paletteSize', 'texture', 'regularity',
] as const;

describe('URL_MAPPINGS', () => {
  it('has exactly 15 entries (one per ParameterVector dimension)', () => {
    expect(URL_MAPPINGS).toHaveLength(15);
  });

  it('every ParameterVector key appears exactly once', () => {
    const parameterKeys = URL_MAPPINGS.map((m) => m.parameter);
    for (const key of PARAMETER_KEYS) {
      expect(parameterKeys.filter((k) => k === key)).toHaveLength(1);
    }
  });

  it('every mapping entry has signal weights that sum to 1.0 (within 0.001 tolerance)', () => {
    for (const mapping of URL_MAPPINGS) {
      const sum = mapping.signals.reduce((acc, sw) => acc + sw.weight, 0);
      expect(
        Math.abs(sum - 1.0),
        `weights for '${mapping.parameter}' sum to ${sum}, expected 1.0`
      ).toBeLessThan(0.001);
    }
  });

  it('computeParameterVector with URL signals produces a vector where all 15 values are in [0, 1]', () => {
    // Collect all unique signal names from URL_MAPPINGS
    const signalNames = new Set<string>();
    for (const mapping of URL_MAPPINGS) {
      for (const sw of mapping.signals) {
        signalNames.add(sw.signal);
      }
    }

    // Build mock calibration data (simple sorted arrays for each signal)
    const calibration: CalibrationData = {};
    for (const signal of signalNames) {
      calibration[signal] = [0, 0.5, 1];
    }

    // Build sample URL signals with mid-range values
    const urlSignals: Record<string, number> = {};
    for (const signal of signalNames) {
      urlSignals[signal] = 0.5;
    }

    const { vector } = computeParameterVector(urlSignals, calibration, URL_MAPPINGS);

    for (const key of PARAMETER_KEYS) {
      expect(
        vector[key],
        `parameter '${key}' should be in [0, 1]`
      ).toBeGreaterThanOrEqual(0);
      expect(
        vector[key],
        `parameter '${key}' should be in [0, 1]`
      ).toBeLessThanOrEqual(1);
    }
  });

  it('two different URL signal sets produce different parameter vectors', () => {
    // Collect all unique signal names from URL_MAPPINGS
    const signalNames = new Set<string>();
    for (const mapping of URL_MAPPINGS) {
      for (const sw of mapping.signals) {
        signalNames.add(sw.signal);
      }
    }

    // Build mock calibration data
    const calibration: CalibrationData = {};
    for (const signal of signalNames) {
      calibration[signal] = [0, 0.25, 0.5, 0.75, 1];
    }

    // High-link-density page signals
    const highLinkDensitySignals: Record<string, number> = {};
    for (const signal of signalNames) {
      highLinkDensitySignals[signal] = 0.1; // low values overall
    }
    highLinkDensitySignals['linkDensity'] = 0.9; // high link density
    highLinkDensitySignals['linkCount'] = 0.9;

    // Low-link-density page signals
    const lowLinkDensitySignals: Record<string, number> = {};
    for (const signal of signalNames) {
      lowLinkDensitySignals[signal] = 0.5; // mid values overall
    }
    lowLinkDensitySignals['linkDensity'] = 0.01; // very low link density
    lowLinkDensitySignals['linkCount'] = 0.01;

    const { vector: vectorA } = computeParameterVector(highLinkDensitySignals, calibration, URL_MAPPINGS);
    const { vector: vectorB } = computeParameterVector(lowLinkDensitySignals, calibration, URL_MAPPINGS);

    // At least one parameter should differ
    const hasDifference = PARAMETER_KEYS.some(
      (key) => Math.abs(vectorA[key] - vectorB[key]) > 0.05
    );
    expect(hasDifference).toBe(true);
  });
});
