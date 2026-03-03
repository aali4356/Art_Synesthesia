import { describe, it, expect } from 'vitest';
import {
  generateSummary,
  generateAllSummaries,
} from '@/lib/pipeline/provenance';
import type { ParameterProvenance } from '@/types/engine';

describe('generateSummary', () => {
  it('produces a human-readable string', () => {
    const prov: ParameterProvenance = {
      parameter: 'energy',
      value: 0.8,
      contributors: [
        {
          signal: 'exclamationDensity',
          rawValue: 0.9,
          weight: 0.3,
          explanation: 'Lots of exclamation marks',
        },
        {
          signal: 'shortSentenceRatio',
          rawValue: 0.7,
          weight: 0.3,
          explanation: 'Short, punchy sentences',
        },
        {
          signal: 'uppercaseRatio',
          rawValue: 0.5,
          weight: 0.2,
          explanation: 'Some uppercase words',
        },
        {
          signal: 'wordCount',
          rawValue: 0.6,
          weight: 0.2,
          explanation: 'Moderate word count',
        },
      ],
    };

    const summary = generateSummary(prov);

    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('references the top 2 contributors', () => {
    const prov: ParameterProvenance = {
      parameter: 'warmth',
      value: 0.75,
      contributors: [
        {
          signal: 'sentimentPolarity',
          rawValue: 0.9,
          weight: 0.5,
          explanation: 'Positive sentiment in text',
        },
        {
          signal: 'exclamationDensity',
          rawValue: 0.8,
          weight: 0.3,
          explanation: 'Frequent exclamation marks',
        },
        {
          signal: 'uppercaseRatio',
          rawValue: 0.2,
          weight: 0.2,
          explanation: 'Some uppercase usage',
        },
      ],
    };

    const summary = generateSummary(prov);

    // Should reference top 2 explanations (sentimentPolarity and exclamationDensity by weight)
    expect(summary.toLowerCase()).toContain('positive sentiment');
    expect(summary.toLowerCase()).toContain('exclamation');
  });

  it('uses "high" for values > 0.66', () => {
    const prov: ParameterProvenance = {
      parameter: 'energy',
      value: 0.8,
      contributors: [
        { signal: 'a', rawValue: 0.9, weight: 0.6, explanation: 'Signal A' },
        { signal: 'b', rawValue: 0.7, weight: 0.4, explanation: 'Signal B' },
      ],
    };

    const summary = generateSummary(prov);
    expect(summary.toLowerCase()).toContain('high');
  });

  it('uses "moderate" for values between 0.33 and 0.66', () => {
    const prov: ParameterProvenance = {
      parameter: 'rhythm',
      value: 0.5,
      contributors: [
        { signal: 'a', rawValue: 0.5, weight: 0.6, explanation: 'Signal A' },
        { signal: 'b', rawValue: 0.5, weight: 0.4, explanation: 'Signal B' },
      ],
    };

    const summary = generateSummary(prov);
    expect(summary.toLowerCase()).toContain('moderate');
  });

  it('uses "low" for values < 0.33', () => {
    const prov: ParameterProvenance = {
      parameter: 'density',
      value: 0.15,
      contributors: [
        { signal: 'a', rawValue: 0.1, weight: 0.6, explanation: 'Signal A' },
        { signal: 'b', rawValue: 0.2, weight: 0.4, explanation: 'Signal B' },
      ],
    };

    const summary = generateSummary(prov);
    expect(summary.toLowerCase()).toContain('low');
  });

  it('includes the parameter name', () => {
    const prov: ParameterProvenance = {
      parameter: 'curvature',
      value: 0.6,
      contributors: [
        { signal: 'a', rawValue: 0.6, weight: 0.6, explanation: 'Signal A' },
        { signal: 'b', rawValue: 0.5, weight: 0.4, explanation: 'Signal B' },
      ],
    };

    const summary = generateSummary(prov);
    expect(summary.toLowerCase()).toContain('curvature');
  });

  it('handles single contributor gracefully', () => {
    const prov: ParameterProvenance = {
      parameter: 'complexity',
      value: 0.9,
      contributors: [
        { signal: 'a', rawValue: 0.9, weight: 1.0, explanation: 'Signal A' },
      ],
    };

    const summary = generateSummary(prov);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.toLowerCase()).toContain('signal a');
  });
});

describe('generateAllSummaries', () => {
  it('returns a record mapping parameter names to summaries', () => {
    const provenances: ParameterProvenance[] = [
      {
        parameter: 'energy',
        value: 0.8,
        contributors: [
          { signal: 'a', rawValue: 0.9, weight: 0.6, explanation: 'Signal A' },
          { signal: 'b', rawValue: 0.7, weight: 0.4, explanation: 'Signal B' },
        ],
      },
      {
        parameter: 'warmth',
        value: 0.3,
        contributors: [
          { signal: 'c', rawValue: 0.3, weight: 0.5, explanation: 'Signal C' },
          { signal: 'd', rawValue: 0.2, weight: 0.5, explanation: 'Signal D' },
        ],
      },
    ];

    const summaries = generateAllSummaries(provenances);

    expect(summaries.energy).toBeDefined();
    expect(summaries.warmth).toBeDefined();
    expect(typeof summaries.energy).toBe('string');
    expect(typeof summaries.warmth).toBe('string');
  });

  it('returns empty record for empty input', () => {
    const summaries = generateAllSummaries([]);
    expect(Object.keys(summaries)).toHaveLength(0);
  });
});
