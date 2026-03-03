import { describe, it, expect } from 'vitest';
import {
  TEXT_MAPPINGS,
  computeParameterVector,
} from '@/lib/pipeline/mapping';
import type { MappingTable } from '@/lib/pipeline/mapping';
import type { CalibrationData } from '@/lib/pipeline/normalize';
import type { ParameterVector } from '@/types/engine';

/** All 15 core ParameterVector dimension names */
const PARAMETER_NAMES: (keyof ParameterVector)[] = [
  'complexity',
  'warmth',
  'symmetry',
  'rhythm',
  'energy',
  'density',
  'scaleVariation',
  'curvature',
  'saturation',
  'contrast',
  'layering',
  'directionality',
  'paletteSize',
  'texture',
  'regularity',
];

describe('TEXT_MAPPINGS', () => {
  it('covers all 15 parameters', () => {
    const coveredParams = TEXT_MAPPINGS.map((m) => m.parameter);
    for (const param of PARAMETER_NAMES) {
      expect(coveredParams).toContain(param);
    }
  });

  it('has at least 2 signals per parameter', () => {
    for (const mapping of TEXT_MAPPINGS) {
      expect(mapping.signals.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has weights summing to 1.0 per parameter (within tolerance)', () => {
    for (const mapping of TEXT_MAPPINGS) {
      const sum = mapping.signals.reduce((acc, s) => acc + s.weight, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('has non-empty explanations for each signal', () => {
    for (const mapping of TEXT_MAPPINGS) {
      for (const signal of mapping.signals) {
        expect(signal.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('has positive weights for all signals', () => {
    for (const mapping of TEXT_MAPPINGS) {
      for (const signal of mapping.signals) {
        expect(signal.weight).toBeGreaterThan(0);
      }
    }
  });
});

describe('computeParameterVector', () => {
  // Build calibration data: all signals have a [0..100] range
  function buildUniformCalibration(
    mappings: MappingTable
  ): CalibrationData {
    const cal: CalibrationData = {};
    const allSignals = new Set<string>();
    for (const m of mappings) {
      for (const s of m.signals) {
        allSignals.add(s.signal);
      }
    }
    for (const signal of allSignals) {
      cal[signal] = Array.from({ length: 101 }, (_, i) => i);
    }
    return cal;
  }

  it('returns all 15 dimensions', () => {
    const cal = buildUniformCalibration(TEXT_MAPPINGS);
    // All signals at midpoint (50)
    const raw: Record<string, number> = {};
    const allSignals = new Set<string>();
    for (const m of TEXT_MAPPINGS) {
      for (const s of m.signals) {
        allSignals.add(s.signal);
      }
    }
    for (const signal of allSignals) {
      raw[signal] = 50;
    }

    const { vector } = computeParameterVector(raw, cal, TEXT_MAPPINGS);

    for (const param of PARAMETER_NAMES) {
      expect(vector[param]).toBeDefined();
      expect(typeof vector[param]).toBe('number');
    }
  });

  it('produces all values in [0, 1]', () => {
    const cal = buildUniformCalibration(TEXT_MAPPINGS);
    const raw: Record<string, number> = {};
    const allSignals = new Set<string>();
    for (const m of TEXT_MAPPINGS) {
      for (const s of m.signals) {
        allSignals.add(s.signal);
      }
    }
    for (const signal of allSignals) {
      raw[signal] = 50;
    }

    const { vector } = computeParameterVector(raw, cal, TEXT_MAPPINGS);

    for (const param of PARAMETER_NAMES) {
      expect(vector[param]).toBeGreaterThanOrEqual(0);
      expect(vector[param]).toBeLessThanOrEqual(1);
    }
  });

  it('computes values as weighted sums of normalized signals', () => {
    // Use a simple 2-signal mapping for predictable testing
    const testMappings: MappingTable = [
      {
        parameter: 'complexity',
        signals: [
          { signal: 'a', weight: 0.6, explanation: 'signal a' },
          { signal: 'b', weight: 0.4, explanation: 'signal b' },
        ],
      },
    ];
    const cal: CalibrationData = {
      a: [0, 25, 50, 75, 100],
      b: [0, 25, 50, 75, 100],
    };
    // a=50 -> percentile 0.5, b=100 -> percentile 1.0
    // weighted sum: 0.6*0.5 + 0.4*1.0 = 0.3 + 0.4 = 0.7
    const raw = { a: 50, b: 100 };
    const { vector } = computeParameterVector(raw, cal, testMappings);

    expect(vector.complexity).toBeCloseTo(0.7, 2);
  });

  it('returns provenance array with correct structure', () => {
    const cal = buildUniformCalibration(TEXT_MAPPINGS);
    const raw: Record<string, number> = {};
    const allSignals = new Set<string>();
    for (const m of TEXT_MAPPINGS) {
      for (const s of m.signals) {
        allSignals.add(s.signal);
      }
    }
    for (const signal of allSignals) {
      raw[signal] = 50;
    }

    const { provenance } = computeParameterVector(raw, cal, TEXT_MAPPINGS);

    expect(provenance).toHaveLength(15);
    for (const p of provenance) {
      expect(p.parameter).toBeDefined();
      expect(typeof p.value).toBe('number');
      expect(p.contributors.length).toBeGreaterThanOrEqual(2);
      for (const c of p.contributors) {
        expect(typeof c.signal).toBe('string');
        expect(typeof c.rawValue).toBe('number');
        expect(typeof c.weight).toBe('number');
        expect(typeof c.explanation).toBe('string');
      }
    }
  });

  it('provenance includes rawValue, weight, and explanation for each contributor', () => {
    const testMappings: MappingTable = [
      {
        parameter: 'warmth',
        signals: [
          { signal: 'x', weight: 0.7, explanation: 'test x' },
          { signal: 'y', weight: 0.3, explanation: 'test y' },
        ],
      },
    ];
    const cal: CalibrationData = {
      x: [0, 50, 100],
      y: [0, 50, 100],
    };
    const raw = { x: 25, y: 75 };
    const { provenance } = computeParameterVector(raw, cal, testMappings);

    const warmthProv = provenance.find((p) => p.parameter === 'warmth');
    expect(warmthProv).toBeDefined();
    expect(warmthProv!.contributors).toHaveLength(2);

    const xContrib = warmthProv!.contributors.find((c) => c.signal === 'x');
    expect(xContrib).toBeDefined();
    expect(xContrib!.rawValue).toBe(25);
    expect(xContrib!.weight).toBe(0.7);
    expect(xContrib!.explanation).toBe('test x');

    const yContrib = warmthProv!.contributors.find((c) => c.signal === 'y');
    expect(yContrib).toBeDefined();
    expect(yContrib!.rawValue).toBe(75);
    expect(yContrib!.weight).toBe(0.3);
    expect(yContrib!.explanation).toBe('test y');
  });

  it('treats missing signals in rawSignals as 0', () => {
    const testMappings: MappingTable = [
      {
        parameter: 'energy',
        signals: [
          { signal: 'present', weight: 0.5, explanation: 'present' },
          { signal: 'missing', weight: 0.5, explanation: 'missing' },
        ],
      },
    ];
    const cal: CalibrationData = {
      present: [0, 50, 100],
      missing: [0, 50, 100],
    };
    // Only provide 'present', 'missing' should be treated as 0
    const raw = { present: 100 };
    const { vector } = computeParameterVector(raw, cal, testMappings);

    // present=100 -> rank 1.0, missing=0 -> rank 0.0
    // weighted: 0.5*1.0 + 0.5*0.0 = 0.5
    expect(vector.energy).toBeCloseTo(0.5, 2);
  });

  it('clamps final values to [0, 1]', () => {
    // Even in edge cases, values should be clamped
    const cal = buildUniformCalibration(TEXT_MAPPINGS);
    const raw: Record<string, number> = {};
    const allSignals = new Set<string>();
    for (const m of TEXT_MAPPINGS) {
      for (const s of m.signals) {
        allSignals.add(s.signal);
      }
    }
    // All signals at extreme values
    for (const signal of allSignals) {
      raw[signal] = 999999;
    }

    const { vector } = computeParameterVector(raw, cal, TEXT_MAPPINGS);

    for (const param of PARAMETER_NAMES) {
      expect(vector[param]).toBeLessThanOrEqual(1);
      expect(vector[param]).toBeGreaterThanOrEqual(0);
    }
  });
});
