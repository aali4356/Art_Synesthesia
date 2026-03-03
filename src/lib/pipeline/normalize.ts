/**
 * Quantile-based normalization engine.
 *
 * Maps raw analysis signals to the [0, 1] range using empirical percentile
 * rank against sorted reference (calibration) distributions. This approach is
 * robust to outliers and produces uniform distributions regardless of input
 * skew — unlike min-max scaling which clusters near extremes.
 *
 * All calibration distributions must be pre-sorted in ascending order.
 */

/** Full calibration dataset: signal name -> sorted ascending reference values */
export type CalibrationData = Record<string, number[]>;

/**
 * Compute the percentile rank of `value` within a sorted reference
 * distribution. Returns a value in [0, 1].
 *
 * - Empty array -> 0.5 (no reference data, return midpoint)
 * - value <= min -> 0
 * - value >= max -> 1
 * - Exact match -> average rank position of all matching values / (n-1)
 * - Between values -> linear interpolation of rank
 *
 * @param sortedValues - Reference distribution, sorted ascending
 * @param value - The value to rank
 */
export function percentileRank(sortedValues: number[], value: number): number {
  const n = sortedValues.length;

  // No reference data: return midpoint
  if (n === 0) return 0.5;

  // Single element: can only distinguish below, at, or above
  if (n === 1) {
    if (value < sortedValues[0]) return 0;
    if (value > sortedValues[0]) return 1;
    return 0.5; // exactly at the single value
  }

  // Below or at minimum
  if (value <= sortedValues[0]) {
    // Check if value equals min — need to find all matches at min
    if (value === sortedValues[0]) {
      // Find last occurrence of this value
      let last = 0;
      while (last < n - 1 && sortedValues[last + 1] === value) last++;

      // If ALL values are the same, return midpoint
      if (last === n - 1) return 0.5;

      // Average rank of matching positions / (n-1)
      return (0 + last) / 2 / (n - 1);
    }
    return 0;
  }

  // Above or at maximum
  if (value >= sortedValues[n - 1]) {
    if (value === sortedValues[n - 1]) {
      // Find first occurrence of this value
      let first = n - 1;
      while (first > 0 && sortedValues[first - 1] === value) first--;

      // If ALL values are the same, return midpoint
      if (first === 0) return 0.5;

      // Average rank of matching positions / (n-1)
      return (first + (n - 1)) / 2 / (n - 1);
    }
    return 1;
  }

  // Binary search for insertion point (first element >= value)
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedValues[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Exact match within the array
  if (sortedValues[lo] === value) {
    // Find first and last occurrence
    let first = lo;
    while (first > 0 && sortedValues[first - 1] === value) first--;
    let last = lo;
    while (last < n - 1 && sortedValues[last + 1] === value) last++;

    // Average rank / (n-1)
    return (first + last) / 2 / (n - 1);
  }

  // Value is between sortedValues[lo-1] and sortedValues[lo]
  // Linear interpolation of rank
  const lower = lo - 1;
  const fraction =
    (value - sortedValues[lower]) / (sortedValues[lo] - sortedValues[lower]);
  return (lower + fraction) / (n - 1);
}

/**
 * Normalize a set of raw analysis signals using calibration distributions.
 *
 * Each signal is mapped to [0, 1] via percentileRank against its calibration
 * distribution. Signals not found in calibration return 0.5 (neutral midpoint).
 *
 * @param rawSignals - Signal name -> raw numeric value
 * @param calibrationDistributions - Signal name -> sorted ascending reference values
 */
export function normalizeSignals(
  rawSignals: Record<string, number>,
  calibrationDistributions: CalibrationData
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [signal, rawValue] of Object.entries(rawSignals)) {
    const distribution = calibrationDistributions[signal];
    if (distribution) {
      result[signal] = percentileRank(distribution, rawValue);
    } else {
      // No calibration data for this signal: return midpoint
      result[signal] = 0.5;
    }
  }

  return result;
}
