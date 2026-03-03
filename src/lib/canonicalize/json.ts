import type { CanonResult } from '@/types/engine';

/**
 * Recursively sort object keys alphabetically.
 * Arrays preserve their order; objects within arrays get sorted keys.
 */
function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Strip JSONC-style comments (// and /* ... *​/).
 */
function stripComments(input: string): string {
  // Remove single-line comments (not inside strings)
  let result = input.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

/**
 * Canonicalize JSON input.
 * CANON-02: Parse and re-serialize with stable alphabetical key ordering,
 * normalized number formatting. Also strips JSONC comments.
 */
export function canonicalizeJson(input: string): CanonResult {
  const changes: string[] = [];

  // Strip JSONC comments
  const stripped = stripComments(input);
  if (stripped !== input) {
    changes.push('Stripped JSON comments');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }

  const sorted = sortKeys(parsed);
  const canonical = JSON.stringify(sorted);

  // Check if key order or number formatting changed
  const originalStr = JSON.stringify(parsed);
  if (originalStr !== canonical) {
    changes.push('Sorted keys alphabetically');
  }

  return { canonical, changes, inputType: 'json' };
}
