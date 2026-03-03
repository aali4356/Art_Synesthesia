/**
 * Provenance generation with plain-English summaries.
 *
 * Produces human-readable explanations of why each parameter has its value,
 * referencing the top contributing signals. Designed to feel like a museum
 * exhibit label -- inviting curiosity, not overwhelming.
 */

import type { ParameterProvenance } from '@/types/engine';

/**
 * Get the level label for a parameter value.
 *
 * @param value - Parameter value in [0, 1]
 * @returns "low" | "moderate" | "high"
 */
function getLevel(value: number): 'low' | 'moderate' | 'high' {
  if (value < 0.33) return 'low';
  if (value > 0.66) return 'high';
  return 'moderate';
}

/**
 * Format a parameter name for display (camelCase -> human-readable).
 *
 * @param param - Parameter name in camelCase
 * @returns Formatted name (e.g., "scaleVariation" -> "scale variation")
 */
function formatParameterName(param: string): string {
  return param.replace(/([A-Z])/g, ' $1').toLowerCase();
}

/**
 * Generate a plain-English summary for a single parameter's provenance.
 *
 * References the top 2 contributors by weight. Format:
 * "[Parameter] is [high/moderate/low] because [explanation 1] and [explanation 2]."
 *
 * @param provenance - The provenance record for one parameter
 * @returns A human-readable summary string
 */
export function generateSummary(provenance: ParameterProvenance): string {
  const level = getLevel(provenance.value);
  const paramName = formatParameterName(provenance.parameter);

  // Sort contributors by weight descending, take top 2
  const sorted = [...provenance.contributors].sort(
    (a, b) => b.weight - a.weight
  );
  const topContributors = sorted.slice(0, 2);

  if (topContributors.length === 0) {
    return `${capitalize(paramName)} is ${level}.`;
  }

  if (topContributors.length === 1) {
    return `${capitalize(paramName)} is ${level} because ${lowerFirst(topContributors[0].explanation)}.`;
  }

  return `${capitalize(paramName)} is ${level} because ${lowerFirst(topContributors[0].explanation)} and ${lowerFirst(topContributors[1].explanation)}.`;
}

/**
 * Generate summaries for all parameter provenances.
 *
 * @param provenances - Array of provenance records
 * @returns Record mapping parameter name to summary string
 */
export function generateAllSummaries(
  provenances: ParameterProvenance[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const prov of provenances) {
    result[prov.parameter] = generateSummary(prov);
  }

  return result;
}

/** Capitalize first letter of a string */
function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Lowercase first letter of a string (for mid-sentence placement) */
function lowerFirst(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
