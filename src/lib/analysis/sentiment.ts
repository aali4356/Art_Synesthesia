/**
 * AFINN-165 based sentiment scoring with simple negation handling.
 *
 * Uses the AFINN-165 lexicon for word-level sentiment. A 1-word lookback
 * detects negation (e.g., "not happy" -> flipped score).
 *
 * @module
 */

import { afinn165 } from 'afinn-165';

/** Words that negate the following sentiment word */
const NEGATORS = new Set([
  'not',
  'no',
  'never',
  'neither',
  "n't",
  "don't",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "couldn't",
  "shouldn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "haven't",
  "hasn't",
]);

/**
 * Compute sentiment polarity and magnitude from a list of words.
 *
 * @param words - Array of words (already split from text)
 * @returns polarity (comparative: total/wordCount) and magnitude (avg absolute per sentiment word)
 */
export function computeSentiment(
  words: string[]
): { polarity: number; magnitude: number } {
  if (words.length === 0) {
    return { polarity: 0, magnitude: 0 };
  }

  let totalScore = 0;
  let absMagnitudeSum = 0;
  let sentimentWordCount = 0;

  for (let i = 0; i < words.length; i++) {
    // Clean word: lowercase, strip non-alpha except apostrophe/hyphen
    const cleaned = words[i].toLowerCase().replace(/[^a-z'-]/g, '');
    if (cleaned.length === 0) continue;

    // Use Object.hasOwn to avoid prototype collision (e.g., "constructor")
    if (!Object.hasOwn(afinn165, cleaned)) continue;

    let score = afinn165[cleaned];

    // 1-word lookback negation
    if (i > 0) {
      const prevWord = words[i - 1].toLowerCase().replace(/[^a-z'-]/g, '');
      if (NEGATORS.has(prevWord)) {
        score = -score;
      }
    }

    totalScore += score;
    absMagnitudeSum += Math.abs(score);
    sentimentWordCount++;
  }

  const polarity = totalScore / words.length;
  const magnitude =
    sentimentWordCount > 0 ? absMagnitudeSum / sentimentWordCount : 0;

  return { polarity, magnitude };
}
