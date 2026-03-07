import type { ParameterVector } from '@/types/engine';

/**
 * Represents the signed difference between two parameter values.
 */
export interface ParameterDiff {
  /** Parameter name (e.g., 'rhythm', 'warmth') */
  parameter: string;
  /** Left input value (0-1) */
  leftValue: number;
  /** Right input value (0-1) */
  rightValue: number;
  /** Signed delta: rightValue - leftValue */
  delta: number;
  /** Absolute value of delta; used for ranking */
  absDelta: number;
}

/**
 * Compute the signed parameter-by-parameter diff between two parameter vectors.
 *
 * Returns one ParameterDiff per numeric parameter, sorted by absDelta
 * descending so the most significant differences appear first.
 *
 * The `extensions` field is excluded.
 */
export function computeParameterDiff(
  left: ParameterVector,
  right: ParameterVector
): ParameterDiff[] {
  const keys = (Object.keys(left) as (keyof ParameterVector)[]).filter(
    (k) => k !== 'extensions' && typeof left[k] === 'number'
  );

  return keys
    .map((key) => {
      const lv = left[key] as number;
      const rv = right[key] as number;
      const delta = rv - lv;
      return {
        parameter: key,
        leftValue: lv,
        rightValue: rv,
        delta,
        absDelta: Math.abs(delta),
      };
    })
    .sort((a, b) => b.absDelta - a.absDelta);
}
