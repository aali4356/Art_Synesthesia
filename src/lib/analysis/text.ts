/**
 * Real text analyzer that replaces `extractMockSignals`.
 *
 * Produces all 31 signals referenced by TEXT_MAPPINGS using:
 * - AFINN-165 for sentiment scoring with negation handling
 * - `syllable` package for syllable features
 * - Statistical measures for all other text features
 *
 * @module
 */

import { computeSentiment } from '@/lib/analysis/sentiment';
import { computeSyllableFeatures } from '@/lib/analysis/syllables';

// ---------------------------------------------------------------------------
// Imperative verb list (~50 common verbs for imperativeRatio heuristic)
// ---------------------------------------------------------------------------

const IMPERATIVE_VERBS = new Set([
  'go', 'run', 'make', 'try', 'add', 'remove', 'click', 'open', 'set', 'get',
  'put', 'take', 'find', 'use', 'keep', 'let', 'stop', 'start', 'move', 'turn',
  'read', 'write', 'check', 'close', 'send', 'show', 'tell', 'give', 'ask', 'call',
  'play', 'work', 'help', 'fix', 'cut', 'draw', 'push', 'pull', 'pick', 'drop',
  'fill', 'clear', 'save', 'load', 'mark', 'list', 'sort', 'join', 'split', 'build',
  'look', 'think', 'wait', 'bring', 'hold', 'leave', 'come', 'sit', 'stand', 'walk',
  'define', 'create', 'select', 'insert', 'delete', 'update', 'return', 'print',
  'enter', 'press', 'tap', 'type', 'scroll', 'drag', 'copy', 'paste', 'undo',
  'note', 'remember', 'consider', 'imagine', 'observe', 'notice', 'avoid', 'ensure',
  'see', 'know', 'love', 'say', 'hear', 'feel', 'need', 'want', 'believe',
  'change', 'follow', 'learn', 'grow', 'break', 'speak', 'write', 'rise', 'fall',
]);

// ---------------------------------------------------------------------------
// Clause depth indicator words
// ---------------------------------------------------------------------------

const CLAUSE_WORDS = new Set(['which', 'that', 'who']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute the population variance of a numeric array */
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

// ---------------------------------------------------------------------------
// Main analyzer
// ---------------------------------------------------------------------------

/**
 * Analyze text and produce all 31 signals expected by TEXT_MAPPINGS.
 *
 * @param text - Raw input text
 * @returns Record of signal name -> numeric value
 */
export function analyzeText(text: string): Record<string, number> {
  // Handle empty text: return all-zeros
  if (!text || text.trim().length === 0) {
    return {
      charCount: 0, wordCount: 0, avgWordLength: 0, sentenceCount: 0,
      avgSentenceLength: 0, vocabRichness: 0, vocabularyRichness: 0,
      charEntropy: 0, uppercaseRatio: 0, punctuationDensity: 0,
      exclamationDensity: 0, questionMarkDensity: 0, commaFrequency: 0,
      parenthesisFrequency: 0, sentimentPolarity: 0, sentimentMagnitude: 0,
      sentenceLengthVariance: 0, wordLengthVariance: 0, syllableVariance: 0,
      uniqueCharCount: 0, punctuationDiversity: 0, consonantClusterFreq: 0,
      syllableComplexity: 0, shortSentenceRatio: 0, sentenceLengthRange: 0,
      wordLengthRange: 0, clauseDepth: 0, conjunctionFrequency: 0,
      imperativeRatio: 0, listPatternDensity: 0, repeatPatternRatio: 0,
      paragraphBalance: 0,
    };
  }

  // -----------------------------------------------------------------------
  // Basic text splitting
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Vocabulary richness (scaled by log(wordCount))
  // -----------------------------------------------------------------------

  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''));
  const validLowerWords = lowerWords.filter((w) => w.length > 0);
  const uniqueWords = new Set(validLowerWords);
  const rawVocabRatio =
    validLowerWords.length > 0 ? uniqueWords.size / validLowerWords.length : 0;
  const wordCountFactor = Math.min(
    1,
    Math.log2(wordCount + 1) / Math.log2(100)
  );
  const vocabRichness = rawVocabRatio * wordCountFactor;

  // -----------------------------------------------------------------------
  // Character entropy (Shannon entropy)
  // -----------------------------------------------------------------------

  const charFreq: Record<string, number> = {};
  for (const c of chars) {
    charFreq[c] = (charFreq[c] || 0) + 1;
  }
  let charEntropy = 0;
  for (const count of Object.values(charFreq)) {
    const p = count / charCount;
    if (p > 0) charEntropy -= p * Math.log2(p);
  }

  // -----------------------------------------------------------------------
  // Uppercase ratio
  // -----------------------------------------------------------------------

  const uppercaseChars = chars.filter(
    (c) => c !== c.toLowerCase() && c === c.toUpperCase() && /\p{L}/u.test(c)
  ).length;
  const uppercaseRatio = charCount > 0 ? uppercaseChars / charCount : 0;

  // -----------------------------------------------------------------------
  // Punctuation density and diversity
  // -----------------------------------------------------------------------

  const punctuation = chars.filter((c) => /[^\w\s]/.test(c));
  const punctuationDensity =
    charCount > 0 ? punctuation.length / charCount : 0;
  const punctuationSet = new Set(punctuation);
  const punctuationDiversity = punctuationSet.size;

  // Specific punctuation densities
  const exclamationCount = chars.filter((c) => c === '!').length;
  const exclamationDensity =
    charCount > 0 ? exclamationCount / charCount : 0;
  const questionMarkCount = chars.filter((c) => c === '?').length;
  const questionMarkDensity =
    charCount > 0 ? questionMarkCount / charCount : 0;
  const commaCount = chars.filter((c) => c === ',').length;
  const commaFrequency = charCount > 0 ? commaCount / charCount : 0;
  const parenCount = chars.filter(
    (c) =>
      c === '(' || c === ')' || c === '[' || c === ']' || c === '{' || c === '}'
  ).length;
  const parenthesisFrequency =
    charCount > 0 ? parenCount / charCount : 0;

  // -----------------------------------------------------------------------
  // Sentence and word length statistics
  // -----------------------------------------------------------------------

  const sentenceLengths = sentences.map(
    (s) => s.split(/\s+/).filter((w) => w.length > 0).length
  );
  const sentenceLengthVariance = variance(sentenceLengths);

  const wordLengths = words.map((w) => w.length);
  const wordLengthVariance = variance(wordLengths);

  const uniqueCharCount = new Set(chars).size;

  const shortSentences = sentenceLengths.filter((len) => len < 5).length;
  const shortSentenceRatio =
    sentenceCount > 0 ? shortSentences / sentenceCount : 0;

  const sentenceLengthRange =
    sentenceLengths.length > 0
      ? Math.max(...sentenceLengths) - Math.min(...sentenceLengths)
      : 0;

  const wordLengthRange =
    wordLengths.length > 0
      ? Math.max(...wordLengths) - Math.min(...wordLengths)
      : 0;

  // -----------------------------------------------------------------------
  // Sentiment (AFINN-165 with negation)
  // -----------------------------------------------------------------------

  const sentiment = computeSentiment(words);

  // -----------------------------------------------------------------------
  // Syllable features
  // -----------------------------------------------------------------------

  const syllableFeatures = computeSyllableFeatures(words);

  // -----------------------------------------------------------------------
  // Consonant cluster frequency (3+ consecutive consonants per text length)
  // -----------------------------------------------------------------------

  const lowered = text.toLowerCase();
  const consonantClusters = lowered.match(/[bcdfghjklmnpqrstvwxyz]{3,}/g);
  const letterCount = (lowered.match(/[a-z]/g) || []).length;
  const consonantClusterFreq =
    letterCount > 0
      ? ((consonantClusters?.length ?? 0) / letterCount) * 10
      : 0;

  // -----------------------------------------------------------------------
  // Imperative ratio (with verb-initial sentence detection)
  // -----------------------------------------------------------------------

  let imperativeSentences = 0;
  for (const sentence of sentences) {
    const firstWord = sentence.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord && IMPERATIVE_VERBS.has(firstWord)) {
      imperativeSentences++;
    }
  }
  // Base imperative ratio from strict verb-initial detection
  const strictImperativeRatio =
    sentenceCount > 0 ? imperativeSentences / sentenceCount : 0;
  // Add a small contribution from action verb density throughout text
  // (texts with more verbs have higher "directive" quality even when not imperative)
  const actionVerbsInText = words.filter((w) => {
    const cleaned = w.toLowerCase().replace(/[^a-z]/g, '');
    // Check exact match first, then stem match (verb + s/ed/ing/er)
    if (IMPERATIVE_VERBS.has(cleaned)) return true;
    // Simple stemming: check if removing common suffixes yields a known verb
    for (const suffix of ['s', 'ed', 'ing', 'er', 'es', 'tion']) {
      if (cleaned.length > suffix.length + 2) {
        const stem = cleaned.slice(0, -suffix.length);
        if (IMPERATIVE_VERBS.has(stem)) return true;
      }
    }
    return false;
  }).length;
  const actionVerbDensity = wordCount > 0 ? actionVerbsInText / wordCount : 0;
  // Combine: strict imperative detection + verb density bonus
  // The bonus spreads zero-imperative texts by their action verb content
  const imperativeRatio = strictImperativeRatio + actionVerbDensity * 0.3;

  // -----------------------------------------------------------------------
  // Clause depth heuristic
  // -----------------------------------------------------------------------

  const semicolonCount = chars.filter((c) => c === ';').length;
  const clauseWordCount = words.filter((w) =>
    CLAUSE_WORDS.has(w.toLowerCase())
  ).length;
  const clauseDepth =
    sentenceCount > 0
      ? (commaCount + semicolonCount + clauseWordCount) / sentenceCount
      : 0;

  // -----------------------------------------------------------------------
  // Conjunction frequency
  // -----------------------------------------------------------------------

  const conjunctions = new Set([
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
    'because', 'although', 'while', 'whereas', 'however',
  ]);
  const conjunctionCount = words.filter((w) =>
    conjunctions.has(w.toLowerCase())
  ).length;
  const conjunctionFrequency =
    wordCount > 0 ? conjunctionCount / wordCount : 0;

  // -----------------------------------------------------------------------
  // List pattern density (markdown lists, numbered items, sequential markers)
  // -----------------------------------------------------------------------

  const lines = text.split('\n');
  const listLines = lines.filter((line) =>
    /^\s*[-*]\s/.test(line) ||
    /^\s*\d+[.)]\s/.test(line) ||
    /^\s*(step|item|note|rule|tip)\s*\d/i.test(line)
  ).length;
  // Also detect sequential sentence patterns (first/second/third/then/next/finally)
  const sequentialWords = ['first', 'second', 'third', 'fourth', 'fifth', 'then', 'next', 'finally', 'lastly', 'afterward'];
  const sequentialSentences = sentences.filter((s) => {
    const fw = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    return fw && sequentialWords.includes(fw);
  }).length;
  const rawListDensity = lines.length > 0 ? listLines / lines.length : 0;
  const sequentialDensity = sentenceCount > 0 ? sequentialSentences / sentenceCount : 0;
  const listPatternDensity = Math.min(1, rawListDensity + sequentialDensity * 0.5);

  // -----------------------------------------------------------------------
  // Repeat pattern ratio
  // -----------------------------------------------------------------------

  const repeatPatternRatio =
    listPatternDensity * 0.6 +
    (sentenceLengthVariance < 5
      ? 0.4
      : sentenceLengthVariance < 20
        ? 0.2
        : 0.05);

  // -----------------------------------------------------------------------
  // Paragraph balance
  // -----------------------------------------------------------------------

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  const paragraphLengths = paragraphs.map(
    (p) => p.split(/\s+/).filter((w) => w.length > 0).length
  );
  const paragraphBalance =
    paragraphLengths.length > 1
      ? 1 / (1 + variance(paragraphLengths) * 0.01)
      : 0.5;

  // -----------------------------------------------------------------------
  // Return all 31 signals
  // -----------------------------------------------------------------------

  return {
    charCount,
    wordCount,
    avgWordLength,
    sentenceCount,
    avgSentenceLength,
    vocabRichness,
    vocabularyRichness: vocabRichness,
    charEntropy,
    uppercaseRatio,
    punctuationDensity,
    exclamationDensity,
    questionMarkDensity,
    commaFrequency,
    parenthesisFrequency,
    sentimentPolarity: sentiment.polarity,
    sentimentMagnitude: sentiment.magnitude,
    sentenceLengthVariance,
    wordLengthVariance,
    syllableVariance: syllableFeatures.syllableVariance,
    uniqueCharCount,
    punctuationDiversity,
    consonantClusterFreq,
    syllableComplexity: syllableFeatures.syllableComplexity,
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
