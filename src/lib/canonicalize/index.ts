import type { CanonResult } from '@/types/engine';
import { canonicalizeText } from './text';
import { canonicalizeJson } from './json';
import { canonicalizeCsv } from './csv';
import { canonicalizeUrl } from './url';

export type InputType = 'text' | 'json' | 'csv' | 'url';

/**
 * Route input to the correct canonicalizer based on type.
 */
export function canonicalize(input: string, inputType: InputType): CanonResult {
  switch (inputType) {
    case 'text':
      return canonicalizeText(input);
    case 'json':
      return canonicalizeJson(input);
    case 'csv':
      return canonicalizeCsv(input);
    case 'url':
      return canonicalizeUrl(input);
  }
}

export { canonicalizeText } from './text';
export { canonicalizeJson } from './json';
export { canonicalizeCsv } from './csv';
export { canonicalizeUrl } from './url';
