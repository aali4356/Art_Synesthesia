import { describe, it, expect } from 'vitest';
import { analyzeText } from '@/lib/analysis';
import { computeSentiment } from '@/lib/analysis/sentiment';
import { computeSyllableFeatures } from '@/lib/analysis/syllables';
import { TEXT_MAPPINGS } from '@/lib/pipeline/mapping';

// ---------------------------------------------------------------------------
// Collect all 31 unique signal names from TEXT_MAPPINGS
// ---------------------------------------------------------------------------
const REQUIRED_SIGNALS = new Set<string>();
for (const mapping of TEXT_MAPPINGS) {
  for (const sw of mapping.signals) {
    REQUIRED_SIGNALS.add(sw.signal);
  }
}

describe('analyzeText — signal coverage', () => {
  it('returns all 31 signal keys from TEXT_MAPPINGS', () => {
    const result = analyzeText('Hello world');
    for (const signal of REQUIRED_SIGNALS) {
      expect(result, `missing signal: ${signal}`).toHaveProperty(signal);
    }
  });

  it('every signal value is a finite number', () => {
    const result = analyzeText('Hello world');
    for (const signal of REQUIRED_SIGNALS) {
      expect(typeof result[signal]).toBe('number');
      expect(
        Number.isFinite(result[signal]),
        `signal ${signal} is not finite: ${result[signal]}`
      ).toBe(true);
    }
  });

  it('returns all signals as 0 for empty input', () => {
    const result = analyzeText('');
    for (const signal of REQUIRED_SIGNALS) {
      expect(result[signal], `signal ${signal} should be 0 for empty text`).toBe(0);
    }
  });
});

describe('analyzeText — sentiment (AFINN-165)', () => {
  it('positive text produces positive sentimentPolarity', () => {
    const result = analyzeText('I love this wonderful day');
    expect(result.sentimentPolarity).toBeGreaterThan(0);
  });

  it('negative text produces negative sentimentPolarity', () => {
    const result = analyzeText('I hate this terrible mess');
    expect(result.sentimentPolarity).toBeLessThan(0);
  });

  it('negation flips sentiment: "not happy" is negative', () => {
    const result = analyzeText('not happy');
    expect(result.sentimentPolarity).toBeLessThan(0);
  });

  it('neutral text produces near-zero sentimentPolarity', () => {
    const result = analyzeText('The table is flat');
    expect(Math.abs(result.sentimentPolarity)).toBeLessThan(0.5);
  });

  it('sentimentMagnitude is always >= 0', () => {
    const texts = [
      'I love this',
      'I hate this',
      'The table is flat',
      'not happy at all',
    ];
    for (const text of texts) {
      const result = analyzeText(text);
      expect(result.sentimentMagnitude).toBeGreaterThanOrEqual(0);
    }
  });

  it('Object.hasOwn prevents prototype collision ("constructor" has no sentiment)', () => {
    const { polarity } = computeSentiment(['constructor']);
    expect(polarity).toBe(0);
  });
});

describe('analyzeText — syllable features', () => {
  it('"cat" has syllableComplexity of 1.0', () => {
    const result = analyzeText('cat');
    expect(result.syllableComplexity).toBeCloseTo(1.0, 1);
  });

  it('"beautiful" has higher syllableComplexity than "cat"', () => {
    const catResult = analyzeText('cat');
    const beautifulResult = analyzeText('beautiful');
    expect(beautifulResult.syllableComplexity).toBeGreaterThan(
      catResult.syllableComplexity
    );
  });

  it('syllableVariance is 0 for single-word input', () => {
    const result = analyzeText('cat');
    expect(result.syllableVariance).toBe(0);
  });

  it('multi-word mixed syllable counts produce non-zero syllableVariance', () => {
    const result = analyzeText('I unbelievable');
    expect(result.syllableVariance).toBeGreaterThan(0);
  });
});

describe('analyzeText — statistical signals', () => {
  it('"Hello world" has wordCount=2 and charCount=11', () => {
    const result = analyzeText('Hello world');
    expect(result.wordCount).toBe(2);
    expect(result.charCount).toBe(11);
  });

  it('charEntropy is > 0 for any non-empty text', () => {
    const result = analyzeText('Hello world');
    expect(result.charEntropy).toBeGreaterThan(0);
  });

  it('vocabRichness is scaled by log(wordCount) factor', () => {
    // Short text should have lower richness even with 100% unique words
    const shortResult = analyzeText('cat');
    const longResult = analyzeText(
      'The quick brown fox jumps over the lazy dog near the bright red barn on the green hilltop'
    );
    // Both have decent uniqueness, but short text gets penalized by log factor
    expect(shortResult.vocabRichness).toBeLessThan(longResult.vocabRichness);
  });

  it('uppercaseRatio for "HELLO" is close to 1.0', () => {
    const result = analyzeText('HELLO');
    expect(result.uppercaseRatio).toBeGreaterThan(0.8);
  });

  it('punctuationDensity for "!!!" is close to 1.0', () => {
    const result = analyzeText('!!!');
    expect(result.punctuationDensity).toBeGreaterThan(0.8);
  });

  it('shortSentenceRatio for mostly short sentences is > 0.5', () => {
    const result = analyzeText('Go. Run. Now. This is a longer sentence here.');
    expect(result.shortSentenceRatio).toBeGreaterThan(0.5);
  });

  it('paragraphBalance for single-paragraph text is approximately 0.5', () => {
    const result = analyzeText('This is a single paragraph with some words in it.');
    expect(result.paragraphBalance).toBeCloseTo(0.5, 1);
  });
});

describe('analyzeText — heuristic signals', () => {
  it('imperativeRatio detects verb-initial sentences', () => {
    const result = analyzeText('Go to the store. Run fast. Make dinner.');
    expect(result.imperativeRatio).toBeGreaterThan(0);
  });

  it('clauseDepth heuristic uses comma/semicolon/which/that frequency', () => {
    const result = analyzeText(
      'The cat, which was large, sat on the mat that was old.'
    );
    expect(result.clauseDepth).toBeGreaterThan(0);
  });

  it('consonantClusterFreq counts 3+ consecutive consonants', () => {
    const result = analyzeText('strengths and lengths');
    expect(result.consonantClusterFreq).toBeGreaterThan(0);
  });
});

describe('analyzeText — performance', () => {
  it('analyzes 10,000 characters in under 500ms', () => {
    const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(250);
    expect(longText.length).toBeGreaterThanOrEqual(10000);

    const start = performance.now();
    analyzeText(longText);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
  });
});

describe('computeSentiment — unit tests', () => {
  it('returns { polarity: 0, magnitude: 0 } for empty array', () => {
    const result = computeSentiment([]);
    expect(result.polarity).toBe(0);
    expect(result.magnitude).toBe(0);
  });

  it('returns positive polarity for positive words', () => {
    const result = computeSentiment(['love', 'wonderful', 'great']);
    expect(result.polarity).toBeGreaterThan(0);
  });

  it('returns negative polarity for negative words', () => {
    const result = computeSentiment(['hate', 'terrible', 'awful']);
    expect(result.polarity).toBeLessThan(0);
  });

  it('negation flips score: ["not", "happy"]', () => {
    const result = computeSentiment(['not', 'happy']);
    expect(result.polarity).toBeLessThan(0);
  });
});

describe('computeSyllableFeatures — unit tests', () => {
  it('returns { syllableVariance: 0, syllableComplexity: 1 } for ["cat"]', () => {
    const result = computeSyllableFeatures(['cat']);
    expect(result.syllableComplexity).toBeCloseTo(1.0, 1);
    expect(result.syllableVariance).toBe(0);
  });

  it('returns non-zero variance for mixed-syllable words', () => {
    const result = computeSyllableFeatures(['I', 'unbelievable']);
    expect(result.syllableVariance).toBeGreaterThan(0);
  });
});
