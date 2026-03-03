/**
 * Syllable feature extraction using the `syllable` package.
 *
 * Computes syllable complexity (mean syllables per word) and syllable
 * variance (population variance of syllable counts across words).
 *
 * @module
 */

import { syllable } from 'syllable';

/**
 * Compute syllable features from a list of words.
 *
 * @param words - Array of words (already split from text)
 * @returns syllableComplexity (mean) and syllableVariance (population variance)
 */
export function computeSyllableFeatures(
  words: string[]
): { syllableVariance: number; syllableComplexity: number } {
  if (words.length === 0) {
    return { syllableVariance: 0, syllableComplexity: 0 };
  }

  const counts = words.map((w) => syllable(w));

  // Mean
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;

  // Population variance
  const syllableVariance =
    counts.length < 2
      ? 0
      : counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;

  return {
    syllableVariance,
    syllableComplexity: mean,
  };
}
