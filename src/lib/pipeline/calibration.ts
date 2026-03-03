/**
 * Calibration harness for the normalization pipeline.
 *
 * Loads the reference corpus, computes calibration distributions (sorted arrays
 * of signal values across corpus entries), and validates distribution quality.
 *
 * The CORPUS_HASH constant couples this module to the corpus file — if the
 * corpus changes, CORPUS_HASH must be updated and normalizerVersion bumped.
 */

import corpusData from '@/data/calibration-corpus.json';
import type { MappingTable } from '@/lib/pipeline/mapping';
import type { CalibrationData } from '@/lib/pipeline/normalize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single entry in the calibration corpus */
export interface CorpusEntry {
  id: string;
  text: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Corpus hash (update when corpus file changes, and bump normalizerVersion)
// ---------------------------------------------------------------------------

/**
 * SHA-256 hash of the calibration-corpus.json file content.
 *
 * When the corpus is modified, this constant MUST be updated to match the new
 * file hash, and `normalizerVersion` in `src/lib/engine/version.ts` must be
 * bumped. A test enforces this coupling.
 */
export const CORPUS_HASH =
  'e124a16cbf05bc967cfc463395c9a379fc6a2494fe44316865dfe7f755a819c0';

// ---------------------------------------------------------------------------
// Corpus loading
// ---------------------------------------------------------------------------

/**
 * Load and return the calibration corpus as a typed array.
 */
export function loadCorpus(): CorpusEntry[] {
  return corpusData as CorpusEntry[];
}

// ---------------------------------------------------------------------------
// Mock signal extraction (temporary — replaced by real analyzer in Phase 3)
// ---------------------------------------------------------------------------

/**
 * Temporary mock signal extractor that computes basic text statistics.
 *
 * Produces enough signal variation across the diverse corpus to validate the
 * normalization pipeline end-to-end. Placeholders are used for signals that
 * require NLP capabilities not yet built.
 *
 * @param text - The input text to analyze
 * @returns A record of signal name -> numeric value
 */
export function extractMockSignals(
  text: string
): Record<string, number> {
  // Basic text splitting
  const chars = [...text];
  const charCount = chars.length;
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length || 1; // avoid division by zero
  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // Sentence detection
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = wordCount / sentenceCount;

  // Vocabulary richness — weighted by word count to avoid short-text ceiling
  // Short texts (1-3 words) trivially have 100% unique words, which is misleading.
  // Scale by log(wordCount) to reward genuine vocabulary diversity in longer texts.
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''));
  const uniqueWords = new Set(lowerWords.filter((w) => w.length > 0));
  const rawVocabRatio =
    lowerWords.filter((w) => w.length > 0).length > 0
      ? uniqueWords.size / lowerWords.filter((w) => w.length > 0).length
      : 0;
  // Scale by word-count factor: log2(wordCount+1)/log2(100) saturates around 100 words
  const wordCountFactor = Math.min(1, Math.log2(wordCount + 1) / Math.log2(100));
  const vocabRichness = rawVocabRatio * wordCountFactor;

  // Character entropy (Shannon entropy)
  const charFreq: Record<string, number> = {};
  for (const c of chars) {
    charFreq[c] = (charFreq[c] || 0) + 1;
  }
  let charEntropy = 0;
  for (const count of Object.values(charFreq)) {
    const p = count / charCount;
    if (p > 0) charEntropy -= p * Math.log2(p);
  }

  // Uppercase ratio
  const uppercaseChars = chars.filter(
    (c) => c !== c.toLowerCase() && c === c.toUpperCase() && /\p{L}/u.test(c)
  ).length;
  const uppercaseRatio = charCount > 0 ? uppercaseChars / charCount : 0;

  // Punctuation density and diversity
  const punctuation = chars.filter((c) => /[^\w\s]/.test(c));
  const punctuationDensity = charCount > 0 ? punctuation.length / charCount : 0;
  const punctuationSet = new Set(punctuation);
  const punctuationDiversity = punctuationSet.size;

  // Specific punctuation densities
  const exclamationCount = chars.filter((c) => c === '!').length;
  const exclamationDensity = charCount > 0 ? exclamationCount / charCount : 0;
  const questionMarkCount = chars.filter((c) => c === '?').length;
  const questionMarkDensity = charCount > 0 ? questionMarkCount / charCount : 0;
  const commaCount = chars.filter((c) => c === ',').length;
  const commaFrequency = charCount > 0 ? commaCount / charCount : 0;
  const parenCount = chars.filter(
    (c) => c === '(' || c === ')' || c === '[' || c === ']' || c === '{' || c === '}'
  ).length;
  const parenthesisFrequency = charCount > 0 ? parenCount / charCount : 0;

  // Sentence length variance
  const sentenceLengths = sentences.map(
    (s) => s.split(/\s+/).filter((w) => w.length > 0).length
  );
  const sentenceLengthVariance = variance(sentenceLengths);

  // Word length variance
  const wordLengths = words.map((w) => w.length);
  const wordLengthVariance = variance(wordLengths);

  // Unique character count
  const uniqueCharCount = new Set(chars).size;

  // Short sentence ratio (sentences with < 5 words)
  const shortSentences = sentenceLengths.filter((len) => len < 5).length;
  const shortSentenceRatio = sentenceCount > 0 ? shortSentences / sentenceCount : 0;

  // Sentence length range
  const sentenceLengthRange =
    sentenceLengths.length > 0
      ? Math.max(...sentenceLengths) - Math.min(...sentenceLengths)
      : 0;

  // Word length range
  const wordLengthRange =
    wordLengths.length > 0
      ? Math.max(...wordLengths) - Math.min(...wordLengths)
      : 0;

  // Clause depth proxy (comma frequency * 3)
  const clauseDepth = commaFrequency * 3;

  // Conjunction frequency
  const conjunctions = new Set([
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
    'because', 'although', 'while', 'whereas', 'however',
  ]);
  const conjunctionCount = words.filter((w) =>
    conjunctions.has(w.toLowerCase())
  ).length;
  const conjunctionFrequency = wordCount > 0 ? conjunctionCount / wordCount : 0;

  // List pattern density
  const lines = text.split('\n');
  const listLines = lines.filter((line) =>
    /^\s*[-*]|\s*\d+[.)]\s/.test(line)
  ).length;
  const listPatternDensity = lines.length > 0 ? listLines / lines.length : 0;

  // Syllable complexity proxy
  const syllableComplexity = avgWordLength / 3;

  // Sentiment placeholders — will be replaced by real NLP in Phase 3
  // Use diverse text characteristics as rough proxies for variation
  const sentimentPolarity =
    0.2 +
    exclamationDensity * 8 +
    (uppercaseRatio > 0.1 ? 0.3 : 0) +
    (questionMarkDensity > 0 ? -0.1 : 0.1);
  // sentimentMagnitude: use a mix of features that vary independently from
  // exclamationDensity to avoid signal correlation within the saturation parameter
  const sentimentMagnitude =
    uppercaseRatio * 3 +
    punctuationDensity * 2 +
    (wordLengthVariance > 3 ? 0.3 : 0) +
    Math.abs(vocabRichness - 0.5) * 0.5;

  // Placeholders designed to correlate with co-mapped signals for spread
  // syllableVariance: correlate with punctuationDensity (both in rhythm)
  const syllableVariance = wordLengthVariance * 0.6 + punctuationDensity * 2;
  // consonantClusterFreq: correlate with punctuationDensity (both in texture)
  const consonantClusterFreq = avgWordLength * 0.1 + punctuationDensity * 1.5;
  // imperativeRatio: correlate with questionMarkDensity/listPatternDensity (directionality)
  const imperativeRatio = shortSentenceRatio * 0.5 + listPatternDensity * 0.4;
  // repeatPatternRatio: correlate with sentenceLengthVariance (regularity)
  const repeatPatternRatio =
    listPatternDensity * 0.6 +
    (sentenceLengthVariance < 5 ? 0.4 : sentenceLengthVariance < 20 ? 0.2 : 0.05);
  // paragraphBalance: measures actual paragraph size consistency
  // Split text into paragraphs (double newlines or all-as-one), measure their length variance
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphLengths = paragraphs.map(
    (p) => p.split(/\s+/).filter((w) => w.length > 0).length
  );
  const paragraphBalance =
    paragraphLengths.length > 1
      ? 1 / (1 + variance(paragraphLengths) * 0.01)
      : 0.5;

  return {
    charCount,
    wordCount,
    avgWordLength,
    sentenceCount,
    avgSentenceLength,
    vocabRichness,
    // Duplicate key for saturation mapping which uses 'vocabularyRichness'
    vocabularyRichness: vocabRichness,
    charEntropy,
    uppercaseRatio,
    punctuationDensity,
    exclamationDensity,
    questionMarkDensity,
    commaFrequency,
    parenthesisFrequency,
    sentimentPolarity,
    sentimentMagnitude,
    sentenceLengthVariance,
    wordLengthVariance,
    syllableVariance,
    uniqueCharCount,
    punctuationDiversity,
    consonantClusterFreq,
    syllableComplexity,
    shortSentenceRatio,
    sentenceLengthRange,
    wordLengthRange,
    clauseDepth,
    conjunctionFrequency,
    imperativeRatio,
    listPatternDensity,
    repeatPatternRatio,
    paragraphBalance,
  };
}

// ---------------------------------------------------------------------------
// Calibration distribution computation
// ---------------------------------------------------------------------------

/**
 * For each signal referenced in the mapping table, extract that signal from
 * every corpus entry, collect into an array, and sort ascending.
 *
 * The result is a CalibrationData record ready for use by percentileRank.
 *
 * @param corpus - Array of corpus entries to process
 * @param mappings - Mapping table defining which signals to calibrate
 * @returns CalibrationData with sorted ascending arrays per signal
 */
export function computeCalibrationDistributions(
  corpus: CorpusEntry[],
  mappings: MappingTable
): CalibrationData {
  // Collect all unique signal names from mappings
  const signalNames = new Set<string>();
  for (const mapping of mappings) {
    for (const sw of mapping.signals) {
      signalNames.add(sw.signal);
    }
  }

  // Extract signals from all corpus entries
  const allSignals = corpus.map((entry) => extractMockSignals(entry.text));

  // Build sorted arrays for each signal
  const calibration: CalibrationData = {};
  for (const signal of signalNames) {
    const values = allSignals.map((signals) => signals[signal] ?? 0);
    calibration[signal] = values.slice().sort((a, b) => a - b);
  }

  return calibration;
}

// ---------------------------------------------------------------------------
// Distribution quality checking
// ---------------------------------------------------------------------------

/**
 * Check if a set of normalized values passes the distribution quality gate.
 *
 * The gate requires that no 0.2-wide band contains more than 50% of values.
 * Bands are: [0, 0.2), [0.2, 0.4), [0.4, 0.6), [0.6, 0.8), [0.8, 1.0].
 *
 * @param values - Array of normalized [0, 1] values to check
 * @returns Quality result with pass/fail, worst band, and percentage
 */
export function checkDistributionQuality(values: number[]): {
  passes: boolean;
  worstBand: string;
  percentage: number;
} {
  const bands = [
    { label: '[0, 0.2)', min: 0, max: 0.2 },
    { label: '[0.2, 0.4)', min: 0.2, max: 0.4 },
    { label: '[0.4, 0.6)', min: 0.4, max: 0.6 },
    { label: '[0.6, 0.8)', min: 0.6, max: 0.8 },
    { label: '[0.8, 1.0]', min: 0.8, max: 1.0001 }, // inclusive upper bound for last band
  ];

  let worstBand = bands[0].label;
  let worstPercentage = 0;

  for (const band of bands) {
    const count = values.filter(
      (v) => v >= band.min && v < band.max
    ).length;
    const percentage = values.length > 0 ? (count / values.length) * 100 : 0;

    if (percentage > worstPercentage) {
      worstPercentage = percentage;
      worstBand = band.label;
    }
  }

  return {
    passes: worstPercentage <= 50,
    worstBand,
    percentage: worstPercentage,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute the variance of a numeric array */
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}
