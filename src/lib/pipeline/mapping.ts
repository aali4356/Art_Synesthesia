/**
 * Signal-to-parameter weighted blend mapping tables and computation.
 *
 * Each parameter in the ParameterVector is computed as a weighted sum of
 * multiple raw analysis signals, with per-input-type weight tables. This
 * module defines TEXT_MAPPINGS (text-specific) and the computeParameterVector
 * function that produces both the vector and provenance.
 */

import type { ParameterVector, ParameterProvenance } from '@/types/engine';
import { percentileRank } from '@/lib/pipeline/normalize';
import type { CalibrationData } from '@/lib/pipeline/normalize';

/** A single signal's contribution to a parameter */
export interface SignalWeight {
  /** Signal name matching what the analyzer produces (e.g., "charEntropy") */
  signal: string;
  /** Weight in [0, 1]; all weights for a parameter must sum to 1.0 */
  weight: number;
  /** Plain-English explanation of what this signal measures */
  explanation: string;
}

/** Mapping from a single parameter to its contributing signals */
export interface ParameterMapping {
  /** Target parameter dimension */
  parameter: keyof ParameterVector;
  /** Contributing signals with weights and explanations */
  signals: SignalWeight[];
}

/** A complete mapping table for one input type */
export type MappingTable = ParameterMapping[];

/**
 * Text-specific signal-to-parameter mapping table.
 *
 * Each parameter maps to 2-4 raw text analysis signals. Signal names match
 * what the Phase 3 text analyzer will produce. Weights sum to 1.0 per
 * parameter.
 *
 * These are initial mappings that will be tuned during calibration (Plan 02-02).
 */
export const TEXT_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'vocabRichness', weight: 0.4, explanation: 'Variety of unique words used' },
      { signal: 'avgSentenceLength', weight: 0.3, explanation: 'How long sentences tend to be' },
      { signal: 'charEntropy', weight: 0.3, explanation: 'Diversity of characters used' },
    ],
  },
  {
    parameter: 'warmth',
    signals: [
      { signal: 'sentimentPolarity', weight: 0.5, explanation: 'Positive sentiment in text' },
      { signal: 'exclamationDensity', weight: 0.3, explanation: 'Frequent exclamation marks' },
      { signal: 'uppercaseRatio', weight: 0.2, explanation: 'Emphasis through capitalization' },
    ],
  },
  {
    parameter: 'symmetry',
    signals: [
      { signal: 'sentenceLengthVariance', weight: 0.5, explanation: 'Consistency of sentence lengths (low variance = high symmetry)' },
      { signal: 'paragraphBalance', weight: 0.5, explanation: 'Balance between paragraph sizes' },
    ],
  },
  {
    parameter: 'rhythm',
    signals: [
      { signal: 'syllableVariance', weight: 0.4, explanation: 'Variation in syllable patterns' },
      { signal: 'punctuationDensity', weight: 0.3, explanation: 'Frequency of punctuation creating pauses' },
      { signal: 'avgWordLength', weight: 0.3, explanation: 'Average word length affecting reading tempo' },
    ],
  },
  {
    parameter: 'energy',
    signals: [
      { signal: 'exclamationDensity', weight: 0.3, explanation: 'Lots of exclamation marks' },
      { signal: 'shortSentenceRatio', weight: 0.3, explanation: 'Short, punchy sentences' },
      { signal: 'uppercaseRatio', weight: 0.2, explanation: 'Emphasis through capitalization' },
      { signal: 'wordCount', weight: 0.2, explanation: 'Overall text volume' },
    ],
  },
  {
    parameter: 'density',
    signals: [
      { signal: 'wordCount', weight: 0.4, explanation: 'Total number of words' },
      { signal: 'charCount', weight: 0.3, explanation: 'Total character count' },
      { signal: 'avgSentenceLength', weight: 0.3, explanation: 'How packed sentences are' },
    ],
  },
  {
    parameter: 'scaleVariation',
    signals: [
      { signal: 'wordLengthVariance', weight: 0.5, explanation: 'Mix of short and long words' },
      { signal: 'sentenceLengthVariance', weight: 0.5, explanation: 'Mix of short and long sentences' },
    ],
  },
  {
    parameter: 'curvature',
    signals: [
      { signal: 'commaFrequency', weight: 0.4, explanation: 'Commas creating flowing clauses' },
      { signal: 'parenthesisFrequency', weight: 0.3, explanation: 'Parenthetical asides and nesting' },
      { signal: 'questionMarkDensity', weight: 0.3, explanation: 'Questions curving the narrative' },
    ],
  },
  {
    parameter: 'saturation',
    signals: [
      { signal: 'sentimentMagnitude', weight: 0.4, explanation: 'Intensity of emotional language' },
      { signal: 'exclamationDensity', weight: 0.3, explanation: 'Exclamatory emphasis' },
      { signal: 'vocabularyRichness', weight: 0.3, explanation: 'Richness of vocabulary used' },
    ],
  },
  {
    parameter: 'contrast',
    signals: [
      { signal: 'sentenceLengthRange', weight: 0.4, explanation: 'Spread between shortest and longest sentences' },
      { signal: 'wordLengthRange', weight: 0.3, explanation: 'Spread between shortest and longest words' },
      { signal: 'uppercaseRatio', weight: 0.3, explanation: 'Contrast from capitalized emphasis' },
    ],
  },
  {
    parameter: 'layering',
    signals: [
      { signal: 'clauseDepth', weight: 0.4, explanation: 'Depth of nested clauses' },
      { signal: 'commaFrequency', weight: 0.3, explanation: 'Comma-separated layers of meaning' },
      { signal: 'conjunctionFrequency', weight: 0.3, explanation: 'Conjunctions linking ideas together' },
    ],
  },
  {
    parameter: 'directionality',
    signals: [
      { signal: 'questionMarkDensity', weight: 0.4, explanation: 'Questions directing attention' },
      { signal: 'imperativeRatio', weight: 0.3, explanation: 'Commands and directives' },
      { signal: 'listPatternDensity', weight: 0.3, explanation: 'Ordered lists and sequences' },
    ],
  },
  {
    parameter: 'paletteSize',
    signals: [
      { signal: 'uniqueCharCount', weight: 0.3, explanation: 'Number of distinct characters' },
      { signal: 'punctuationDiversity', weight: 0.3, explanation: 'Variety of punctuation marks used' },
      { signal: 'vocabRichness', weight: 0.4, explanation: 'Vocabulary diversity' },
    ],
  },
  {
    parameter: 'texture',
    signals: [
      { signal: 'consonantClusterFreq', weight: 0.4, explanation: 'Frequency of consonant clusters' },
      { signal: 'punctuationDensity', weight: 0.3, explanation: 'Density of punctuation marks' },
      { signal: 'syllableComplexity', weight: 0.3, explanation: 'Complexity of syllable structure' },
    ],
  },
  {
    parameter: 'regularity',
    signals: [
      { signal: 'sentenceLengthVariance', weight: 0.4, explanation: 'Consistency of sentence lengths (low variance = high regularity)' },
      { signal: 'repeatPatternRatio', weight: 0.3, explanation: 'Repeated structural patterns' },
      { signal: 'listPatternDensity', weight: 0.3, explanation: 'Regular list-like structures' },
    ],
  },
];

/**
 * URL-specific signal-to-parameter mapping table.
 *
 * Maps URL structural signals (from analyzeUrlContent) to all 15 ParameterVector
 * dimensions. Signal names must exactly match what analyzeUrlContent produces.
 * Weights per parameter sum to 1.0.
 */
export const URL_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'contentToHtmlRatio', weight: 0.3, explanation: 'How much content vs markup structure' },
      { signal: 'textVocabRichness', weight: 0.4, explanation: 'Vocabulary diversity of page text' },
      { signal: 'linkDensity', weight: 0.3, explanation: 'Density of hyperlinks on the page' },
    ],
  },
  {
    parameter: 'warmth',
    signals: [
      { signal: 'textSentimentPolarity', weight: 0.5, explanation: 'Positive or negative tone of page text' },
      { signal: 'colorCount', weight: 0.3, explanation: 'Number of distinct colors used' },
      { signal: 'imageCount', weight: 0.2, explanation: 'Visual richness from images' },
    ],
  },
  {
    parameter: 'symmetry',
    signals: [
      { signal: 'contentToHtmlRatio', weight: 0.5, explanation: 'Balance between content and structure' },
      { signal: 'listCount', weight: 0.5, explanation: 'Structured lists suggest organized, symmetric layout' },
    ],
  },
  {
    parameter: 'rhythm',
    signals: [
      { signal: 'textAvgSentenceLength', weight: 0.4, explanation: 'Average sentence length sets reading tempo' },
      { signal: 'textPunctuationDensity', weight: 0.3, explanation: 'Punctuation frequency creates cadence' },
      { signal: 'headingCount', weight: 0.3, explanation: 'Headings break content into rhythmic sections' },
    ],
  },
  {
    parameter: 'energy',
    signals: [
      { signal: 'textSentimentMagnitude', weight: 0.4, explanation: 'Emotional intensity of page text' },
      { signal: 'mediaRichness', weight: 0.3, explanation: 'Media-to-text ratio suggests energetic visual pages' },
      { signal: 'linkDensity', weight: 0.3, explanation: 'Dense links suggest high information energy' },
    ],
  },
  {
    parameter: 'density',
    signals: [
      { signal: 'textWordCount', weight: 0.4, explanation: 'Total word count of page content' },
      { signal: 'linkCount', weight: 0.3, explanation: 'Number of links contributing to information density' },
      { signal: 'contentToHtmlRatio', weight: 0.3, explanation: 'How packed with content the page is' },
    ],
  },
  {
    parameter: 'scaleVariation',
    signals: [
      { signal: 'headingCount', weight: 0.4, explanation: 'Headings create typographic scale hierarchy' },
      { signal: 'imageCount', weight: 0.3, explanation: 'Images introduce size variation' },
      { signal: 'tableCount', weight: 0.3, explanation: 'Tables create structured scale contrast' },
    ],
  },
  {
    parameter: 'curvature',
    signals: [
      { signal: 'textComplexity', weight: 0.4, explanation: 'Clause depth suggests flowing, curved narrative' },
      { signal: 'formCount', weight: 0.3, explanation: 'Forms suggest interactive, rounded interface elements' },
      { signal: 'mediaRichness', weight: 0.3, explanation: 'Media-rich pages tend toward organic visual flow' },
    ],
  },
  {
    parameter: 'saturation',
    signals: [
      { signal: 'textSentimentMagnitude', weight: 0.4, explanation: 'Emotional intensity maps to color saturation' },
      { signal: 'colorCount', weight: 0.4, explanation: 'Number of distinct colors used' },
      { signal: 'imageCount', weight: 0.2, explanation: 'Images bring color saturation' },
    ],
  },
  {
    parameter: 'contrast',
    signals: [
      { signal: 'linkDensity', weight: 0.4, explanation: 'High link density creates foreground/background contrast' },
      { signal: 'headingCount', weight: 0.3, explanation: 'Headings create typographic contrast' },
      { signal: 'textCharEntropy', weight: 0.3, explanation: 'Character diversity signals textual contrast' },
    ],
  },
  {
    parameter: 'layering',
    signals: [
      { signal: 'textComplexity', weight: 0.4, explanation: 'Clause depth indicates layered content structure' },
      { signal: 'listCount', weight: 0.3, explanation: 'Lists create layered hierarchies' },
      { signal: 'tableCount', weight: 0.3, explanation: 'Tables layer structured data' },
    ],
  },
  {
    parameter: 'directionality',
    signals: [
      { signal: 'linkDensity', weight: 0.4, explanation: 'Links direct the reader to other content' },
      { signal: 'formCount', weight: 0.3, explanation: 'Forms provide explicit user direction' },
      { signal: 'listCount', weight: 0.3, explanation: 'Lists impose ordered directional reading' },
    ],
  },
  {
    parameter: 'paletteSize',
    signals: [
      { signal: 'colorCount', weight: 0.5, explanation: 'Distinct colors extracted from page styles' },
      { signal: 'imageCount', weight: 0.3, explanation: 'Images contribute additional palette variety' },
      { signal: 'textVocabRichness', weight: 0.2, explanation: 'Vocabulary diversity mirrors palette diversity' },
    ],
  },
  {
    parameter: 'texture',
    signals: [
      { signal: 'textVocabRichness', weight: 0.4, explanation: 'Rich vocabulary creates textural density' },
      { signal: 'linkDensity', weight: 0.3, explanation: 'Dense links create visual texture' },
      { signal: 'mediaRichness', weight: 0.3, explanation: 'Media elements add textural variety' },
    ],
  },
  {
    parameter: 'regularity',
    signals: [
      { signal: 'listCount', weight: 0.4, explanation: 'Lists indicate regular, repeating structure' },
      { signal: 'tableCount', weight: 0.3, explanation: 'Tables impose regular grid structure' },
      { signal: 'headingCount', weight: 0.3, explanation: 'Headings create regular content sections' },
    ],
  },
];

/**
 * Data-specific signal-to-parameter mapping table.
 *
 * Maps data analysis signals (from analyzeData) to all 15 ParameterVector
 * dimensions. Signal names must exactly match what analyzeData() produces.
 * Weights per parameter sum to 1.0.
 */
export const DATA_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'columnCount', weight: 0.3, explanation: 'Number of data dimensions (columns)' },
      { signal: 'avgSkewness', weight: 0.3, explanation: 'Asymmetry in numeric distributions' },
      { signal: 'numericColumnRatio', weight: 0.4, explanation: 'Proportion of numeric data columns' },
    ],
  },
  {
    parameter: 'warmth',
    signals: [
      { signal: 'avgMean', weight: 0.5, explanation: 'Average magnitude of numeric values' },
      { signal: 'numericColumnRatio', weight: 0.3, explanation: 'Numeric-heavy datasets feel structured and warm' },
      { signal: 'dataUniformity', weight: 0.2, explanation: 'Uniform data has a calm, warm regularity' },
    ],
  },
  {
    parameter: 'symmetry',
    signals: [
      { signal: 'avgSkewness', weight: 0.5, explanation: 'Low skewness means symmetric distributions' },
      { signal: 'dataUniformity', weight: 0.5, explanation: 'Uniform categorical data suggests symmetry' },
    ],
  },
  {
    parameter: 'rhythm',
    signals: [
      { signal: 'rowCount', weight: 0.4, explanation: 'Number of rows sets data repetition rhythm' },
      { signal: 'columnCount', weight: 0.3, explanation: 'Column count creates repeating structural beats' },
      { signal: 'nullRatio', weight: 0.3, explanation: 'Missing values disrupt data rhythm' },
    ],
  },
  {
    parameter: 'energy',
    signals: [
      { signal: 'avgVariance', weight: 0.4, explanation: 'High variance signals energetic, spread-out data' },
      { signal: 'avgKurtosis', weight: 0.3, explanation: 'Heavy tails indicate extreme value energy' },
      { signal: 'maxCorrelation', weight: 0.3, explanation: 'Strong correlations indicate organized energy' },
    ],
  },
  {
    parameter: 'density',
    signals: [
      { signal: 'rowCount', weight: 0.4, explanation: 'More rows means denser dataset' },
      { signal: 'columnCount', weight: 0.3, explanation: 'More columns means wider information density' },
      { signal: 'nullRatio', weight: 0.3, explanation: 'Low null ratio means dense, complete data (inverted)' },
    ],
  },
  {
    parameter: 'scaleVariation',
    signals: [
      { signal: 'varianceSpread', weight: 0.5, explanation: 'Spread of variances across columns' },
      { signal: 'avgKurtosis', weight: 0.3, explanation: 'Kurtosis reflects scale extremes' },
      { signal: 'columnCount', weight: 0.2, explanation: 'More columns create more scale variety' },
    ],
  },
  {
    parameter: 'curvature',
    signals: [
      { signal: 'avgSkewness', weight: 0.5, explanation: 'Skewed distributions curve away from center' },
      { signal: 'avgKurtosis', weight: 0.5, explanation: 'High kurtosis means peaked, curved distributions' },
    ],
  },
  {
    parameter: 'saturation',
    signals: [
      { signal: 'avgVariance', weight: 0.4, explanation: 'High variance data feels richly saturated' },
      { signal: 'maxCorrelation', weight: 0.3, explanation: 'Strong correlations saturate the relationship signal' },
      { signal: 'numericColumnRatio', weight: 0.3, explanation: 'Numeric-heavy data saturates with quantitative richness' },
    ],
  },
  {
    parameter: 'contrast',
    signals: [
      { signal: 'varianceSpread', weight: 0.5, explanation: 'Different variances across columns create contrast' },
      { signal: 'nullRatio', weight: 0.3, explanation: 'Missing values create contrast with present values' },
      { signal: 'avgSkewness', weight: 0.2, explanation: 'Skewed distributions contrast against symmetric baseline' },
    ],
  },
  {
    parameter: 'layering',
    signals: [
      { signal: 'columnCount', weight: 0.4, explanation: 'Many columns create layered data structure' },
      { signal: 'avgCorrelation', weight: 0.3, explanation: 'Correlated columns form layered relationship structures' },
      { signal: 'numericColumnRatio', weight: 0.3, explanation: 'Numeric layers over string layers' },
    ],
  },
  {
    parameter: 'directionality',
    signals: [
      { signal: 'maxCorrelation', weight: 0.5, explanation: 'Strong correlation shows directed relationship' },
      { signal: 'avgCorrelation', weight: 0.3, explanation: 'Average correlation indicates overall directionality' },
      { signal: 'avgSkewness', weight: 0.2, explanation: 'Skewness indicates a directional pull in distribution' },
    ],
  },
  {
    parameter: 'paletteSize',
    signals: [
      { signal: 'avgCardinality', weight: 0.5, explanation: 'High cardinality in categorical columns means many distinct values' },
      { signal: 'columnCount', weight: 0.3, explanation: 'More columns provide more palette dimensions' },
      { signal: 'stringColumnRatio', weight: 0.2, explanation: 'String columns offer categorical color variety' },
    ],
  },
  {
    parameter: 'texture',
    signals: [
      { signal: 'nullRatio', weight: 0.4, explanation: 'Missing values create textural gaps' },
      { signal: 'varianceSpread', weight: 0.3, explanation: 'Variance differences create textural roughness' },
      { signal: 'avgCardinality', weight: 0.3, explanation: 'High cardinality creates fine-grained texture' },
    ],
  },
  {
    parameter: 'regularity',
    signals: [
      { signal: 'dataUniformity', weight: 0.5, explanation: 'Uniform category distribution signals regular patterns' },
      { signal: 'nullRatio', weight: 0.3, explanation: 'Low null ratio signals regular, complete data' },
      { signal: 'avgSkewness', weight: 0.2, explanation: 'Low skewness signals regular, symmetric distributions' },
    ],
  },
];

/**
 * Compute the full parameter vector and provenance from raw analysis signals.
 *
 * For each mapping entry:
 * 1. Normalize each contributing signal via percentileRank against calibration
 * 2. Compute weighted sum
 * 3. Clamp result to [0, 1]
 * 4. Collect provenance contributors
 *
 * @param rawSignals - Signal name -> raw numeric value from analyzer
 * @param calibration - Signal name -> sorted ascending reference values
 * @param mappings - Mapping table (e.g., TEXT_MAPPINGS)
 * @returns The parameter vector and per-parameter provenance
 */
export function computeParameterVector(
  rawSignals: Record<string, number>,
  calibration: CalibrationData,
  mappings: MappingTable
): { vector: ParameterVector; provenance: ParameterProvenance[] } {
  const vector: Record<string, number> = {};
  const provenance: ParameterProvenance[] = [];

  for (const mapping of mappings) {
    let weightedSum = 0;
    const contributors: ParameterProvenance['contributors'] = [];

    for (const { signal, weight, explanation } of mapping.signals) {
      const rawValue = rawSignals[signal] ?? 0;
      const distribution = calibration[signal] ?? [];
      const normalized = percentileRank(distribution, rawValue);

      weightedSum += normalized * weight;
      contributors.push({ signal, rawValue, weight, explanation });
    }

    // Clamp to [0, 1]
    const clampedValue = Math.max(0, Math.min(1, weightedSum));
    vector[mapping.parameter] = clampedValue;

    provenance.push({
      parameter: mapping.parameter,
      value: clampedValue,
      contributors,
    });
  }

  return {
    vector: vector as unknown as ParameterVector,
    provenance,
  };
}
