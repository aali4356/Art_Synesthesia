import type { CanonResult } from '@/types/engine';

/**
 * Canonicalize text input.
 * CANON-01: Unicode NFC, newline normalization, trailing whitespace trim.
 * Does NOT collapse internal whitespace (preserves intentional formatting).
 */
export function canonicalizeText(input: string): CanonResult {
  const changes: string[] = [];
  let result = input;

  // Step 1: Unicode NFC normalization
  const nfc = result.normalize('NFC');
  if (nfc !== result) {
    changes.push('Applied Unicode NFC normalization');
    result = nfc;
  }

  // Step 2: Newline normalization (\r\n and \r -> \n)
  const crlfCount = (result.match(/\r\n/g) || []).length;
  const afterCrlf = result.replace(/\r\n/g, '\n');
  const crCount = (afterCrlf.match(/\r/g) || []).length;
  const normalized = afterCrlf.replace(/\r/g, '\n');

  if (crlfCount > 0) changes.push(`Converted ${crlfCount} \\r\\n to \\n`);
  if (crCount > 0) changes.push(`Converted ${crCount} \\r to \\n`);
  result = normalized;

  // Step 3: Trim trailing whitespace per line (preserve leading)
  const lines = result.split('\n');
  const trimmed = lines.map((line) => line.trimEnd());
  const trimmedStr = trimmed.join('\n');
  if (trimmedStr !== result) {
    changes.push('Trimmed trailing whitespace');
    result = trimmedStr;
  }

  return { canonical: result, changes, inputType: 'text' };
}
