/**
 * Pipeline module barrel exports.
 *
 * The pipeline transforms raw analysis signals into a normalized 15-dimension
 * ParameterVector with full provenance tracking.
 */

// Normalization engine
export { percentileRank, normalizeSignals } from './normalize';
export type { CalibrationData } from './normalize';

// Signal-to-parameter mapping
export { computeParameterVector, TEXT_MAPPINGS } from './mapping';
export type { SignalWeight, ParameterMapping, MappingTable } from './mapping';

// Provenance summaries
export { generateSummary, generateAllSummaries } from './provenance';

// Calibration harness
export {
  loadCorpus,
  computeCalibrationDistributions,
  checkDistributionQuality,
  extractMockSignals,
  CORPUS_HASH,
} from './calibration';
export type { CorpusEntry } from './calibration';
