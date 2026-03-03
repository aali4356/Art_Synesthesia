import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

import {
  loadCorpus,
  computeCalibrationDistributions,
  checkDistributionQuality,
  extractMockSignals,
  CORPUS_HASH,
} from '@/lib/pipeline/calibration';
import { TEXT_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import { CURRENT_VERSION } from '@/lib/engine/version';
import { analyzeText } from '@/lib/analysis';

describe('Calibration corpus validity', () => {
  it('loadCorpus returns 35+ entries', () => {
    const corpus = loadCorpus();
    expect(corpus.length).toBeGreaterThanOrEqual(35);
  });

  it('every entry has id, text, and category fields', () => {
    const corpus = loadCorpus();
    for (const entry of corpus) {
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);

      expect(entry.text).toBeDefined();
      expect(typeof entry.text).toBe('string');
      expect(entry.text.length).toBeGreaterThan(0);

      expect(entry.category).toBeDefined();
      expect(typeof entry.category).toBe('string');
      expect(entry.category.length).toBeGreaterThan(0);
    }
  });

  it('covers 10+ distinct categories', () => {
    const corpus = loadCorpus();
    const categories = new Set(corpus.map((e) => e.category));
    expect(categories.size).toBeGreaterThanOrEqual(10);
  });
});

describe('Mock signal extraction', () => {
  it('produces numeric values for all signals referenced in TEXT_MAPPINGS', () => {
    const requiredSignals = new Set<string>();
    for (const mapping of TEXT_MAPPINGS) {
      for (const sw of mapping.signals) {
        requiredSignals.add(sw.signal);
      }
    }

    const corpus = loadCorpus();
    // Test against a few diverse entries
    const testEntries = [corpus[0], corpus[7], corpus[17], corpus[24]];

    for (const entry of testEntries) {
      const signals = extractMockSignals(entry.text);
      for (const signalName of requiredSignals) {
        expect(signals[signalName]).toBeDefined();
        expect(typeof signals[signalName]).toBe('number');
        expect(Number.isFinite(signals[signalName])).toBe(true);
      }
    }
  });

  it('produces different signal values for different text types', () => {
    const corpus = loadCorpus();
    const singleWord = corpus.find((e) => e.category === 'single-word')!;
    const paragraph = corpus.find((e) => e.category === 'paragraph')!;
    const code = corpus.find((e) => e.category === 'code')!;

    const swSignals = extractMockSignals(singleWord.text);
    const pSignals = extractMockSignals(paragraph.text);
    const cSignals = extractMockSignals(code.text);

    // Single word should have lower wordCount than paragraph
    expect(swSignals.wordCount).toBeLessThan(pSignals.wordCount);
    // Code should have higher punctuationDensity than paragraph
    expect(cSignals.punctuationDensity).toBeGreaterThan(pSignals.punctuationDensity);
  });
});

describe('Distribution quality gate', () => {
  it('checkDistributionQuality returns passes: true when values are well spread', () => {
    // Values spread uniformly across [0, 1]
    const values = Array.from({ length: 20 }, (_, i) => i / 19);
    const result = checkDistributionQuality(values);
    expect(result.passes).toBe(true);
  });

  it('checkDistributionQuality returns passes: false when >50% cluster in a band', () => {
    // 15 of 20 values in [0.4, 0.6) = 75% in one band
    const values = [
      0.05, 0.15, 0.25, 0.35, 0.85,
      0.40, 0.42, 0.44, 0.45, 0.46,
      0.48, 0.50, 0.51, 0.52, 0.53,
      0.54, 0.55, 0.56, 0.57, 0.58,
    ];
    const result = checkDistributionQuality(values);
    expect(result.passes).toBe(false);
    expect(result.worstBand).toBe('[0.4, 0.6)');
    expect(result.percentage).toBeGreaterThan(50);
  });

  it('HARD GATE: all parameters pass distribution quality against full corpus (real analyzer)', () => {
    const corpus = loadCorpus();
    const calibration = computeCalibrationDistributions(corpus, TEXT_MAPPINGS);

    // For each of the 15 parameters, normalize all corpus entries and check distribution
    for (const mapping of TEXT_MAPPINGS) {
      const parameterValues: number[] = [];

      for (const entry of corpus) {
        const rawSignals = analyzeText(entry.text);
        const { vector } = computeParameterVector(rawSignals, calibration, TEXT_MAPPINGS);
        parameterValues.push(vector[mapping.parameter] as number);
      }

      const quality = checkDistributionQuality(parameterValues);
      expect(
        quality.passes,
        `Distribution quality FAILED for "${mapping.parameter}": ${quality.percentage.toFixed(1)}% of values in band ${quality.worstBand}. ` +
        `Maximum allowed is 50%. Corpus needs more diversity for this dimension.`
      ).toBe(true);
    }
  });
});

describe('Version-corpus coupling', () => {
  it('CORPUS_HASH matches the actual SHA-256 of calibration-corpus.json', () => {
    const corpusPath = join(process.cwd(), 'src/data/calibration-corpus.json');
    const content = readFileSync(corpusPath, 'utf8');
    const actualHash = createHash('sha256').update(content).digest('hex');

    expect(
      CORPUS_HASH,
      'Calibration corpus changed but CORPUS_HASH was not updated. ' +
      'Update CORPUS_HASH in calibration.ts and bump normalizerVersion in version.ts.'
    ).toBe(actualHash);
  });

  it('normalizerVersion has been bumped from initial 0.1.0', () => {
    // If corpus exists, normalizer version should reflect calibration data addition
    expect(CURRENT_VERSION.normalizerVersion).not.toBe('0.1.0');
  });
});

describe('computeCalibrationDistributions', () => {
  it('returns sorted ascending arrays for each signal in mappings', () => {
    const corpus = loadCorpus();
    const calibration = computeCalibrationDistributions(corpus, TEXT_MAPPINGS);

    // Get all unique signal names from mappings
    const signalNames = new Set<string>();
    for (const mapping of TEXT_MAPPINGS) {
      for (const sw of mapping.signals) {
        signalNames.add(sw.signal);
      }
    }

    for (const signal of signalNames) {
      expect(calibration[signal]).toBeDefined();
      expect(Array.isArray(calibration[signal])).toBe(true);
      expect(calibration[signal].length).toBe(corpus.length);

      // Verify sorted ascending
      for (let i = 1; i < calibration[signal].length; i++) {
        expect(calibration[signal][i]).toBeGreaterThanOrEqual(calibration[signal][i - 1]);
      }
    }
  });
});

describe('Real text analysis (analyzeText)', () => {
  it('produces numeric values for all signals referenced in TEXT_MAPPINGS', () => {
    const requiredSignals = new Set<string>();
    for (const mapping of TEXT_MAPPINGS) {
      for (const sw of mapping.signals) {
        requiredSignals.add(sw.signal);
      }
    }

    const corpus = loadCorpus();
    const testEntries = [corpus[0], corpus[7], corpus[17], corpus[24]];

    for (const entry of testEntries) {
      const signals = analyzeText(entry.text);
      for (const signalName of requiredSignals) {
        expect(signals[signalName]).toBeDefined();
        expect(typeof signals[signalName]).toBe('number');
        expect(Number.isFinite(signals[signalName])).toBe(true);
      }
    }
  });

  it('calibration distributions use real analyzer (not mock)', () => {
    const corpus = loadCorpus();
    const calibration = computeCalibrationDistributions(corpus, TEXT_MAPPINGS);

    // Verify calibration was computed with real analyzer by checking
    // that sentimentPolarity distribution contains genuine AFINN values
    // (real analyzer produces values based on actual lexicon, not proxies)
    const sentimentValues = calibration['sentimentPolarity'];
    expect(sentimentValues).toBeDefined();
    // Real sentiment should have some negative values (mock never did)
    const hasNegative = sentimentValues.some((v) => v < 0);
    expect(hasNegative).toBe(true);
  });
});
