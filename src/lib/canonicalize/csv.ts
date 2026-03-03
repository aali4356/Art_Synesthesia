import type { CanonResult } from '@/types/engine';
import Papa from 'papaparse';

/**
 * Canonicalize CSV input.
 * CANON-03: Parsed with explicit rules (comma delimiter, double-quote escaping,
 * UTF-8), cell whitespace trimmed, empty cells normalized to null.
 */
export function canonicalizeCsv(input: string): CanonResult {
  const changes: string[] = [];

  if (!input.trim()) {
    return { canonical: '', changes: ['Input was empty'], inputType: 'csv' };
  }

  const parsed = Papa.parse<string[]>(input, {
    delimiter: ',',
    quoteChar: '"',
    skipEmptyLines: false,
    header: false,
  });

  if (parsed.errors.length > 0) {
    changes.push(`Parser warnings: ${parsed.errors.length}`);
  }

  let trimCount = 0;
  let nullCount = 0;

  const normalized = parsed.data.map((row) =>
    row.map((cell) => {
      if (typeof cell !== 'string') return 'null';
      const trimmed = cell.trim();
      if (trimmed !== cell) trimCount++;
      if (trimmed === '') {
        nullCount++;
        return 'null';
      }
      return trimmed;
    })
  );

  if (trimCount > 0) changes.push(`Trimmed whitespace in ${trimCount} cell(s)`);
  if (nullCount > 0)
    changes.push(`Normalized ${nullCount} empty cell(s) to null`);

  // Serialize back to canonical CSV
  const canonical = Papa.unparse(normalized);

  return { canonical, changes, inputType: 'csv' };
}
