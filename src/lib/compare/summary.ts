import type { ParameterDiff } from './diff';

/**
 * Generate a plain-English summary of the top parameter differences.
 *
 * Format: "These differ most in rhythm (+0.43), warmth (-0.31), energy (+0.12)"
 * When inputs are identical: "These inputs produce identical parameters."
 *
 * Uses the top 3 differences by absDelta.
 */
export function generateDiffSummary(diffs: ParameterDiff[]): string {
  const significant = diffs.filter((d) => d.absDelta > 0);
  if (significant.length === 0) {
    return 'These inputs produce identical parameters.';
  }

  const top = significant.slice(0, 3);
  const parts = top.map((d) => {
    const sign = d.delta >= 0 ? '+' : '';
    return `${d.parameter} (${sign}${d.delta.toFixed(2)})`;
  });

  return `These differ most in ${parts.join(', ')}`;
}

/**
 * Returns true when the parameter difference is visually significant.
 * Used by the UI to decide whether to highlight a bar.
 */
export function isSignificantDiff(absDelta: number): boolean {
  return absDelta > 0.1;
}
