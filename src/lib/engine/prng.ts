import seedrandom from 'seedrandom';
import { sha256 } from './hash';

/**
 * Create a deterministic PRNG using the Alea algorithm.
 * Returns a function that produces values in [0, 1).
 *
 * IMPORTANT: NEVER use Math.random() — ESLint will catch it.
 * Always use createPRNG(seed) for any randomness in rendering or analysis.
 */
export function createPRNG(seed: string): () => number {
  return seedrandom.alea(seed);
}

/**
 * Derive a PRNG seed from input parameters.
 * Seed = SHA-256(canonicalizedInput + styleName + engineVersion)
 *
 * This ensures:
 * - Same input + same style + same version = same artwork
 * - Different styles produce intentionally different results
 * - Version bumps produce new artwork
 */
export async function deriveSeed(
  canonicalizedInput: string,
  styleName: string,
  engineVersion: string
): Promise<string> {
  return sha256(`${canonicalizedInput}${styleName}${engineVersion}`);
}
