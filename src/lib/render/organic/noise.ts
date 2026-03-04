/**
 * Fractional Brownian Motion (fBm) noise utility for the organic renderer.
 *
 * Wraps simplex-noise v4 createNoise2D with configurable octave count.
 * Uses a dedicated PRNG instance to avoid state corruption with other
 * scene-building randomness.
 *
 * Octave range enforced: minimum 2, maximum 6 (ORGN-02).
 */

import { createNoise2D } from 'simplex-noise';
import { createPRNG } from '@/lib/engine/prng';

/** Persistence coefficient: amplitude multiplier per octave */
const PERSISTENCE = 0.5;
/** Lacunarity coefficient: frequency multiplier per octave */
const LACUNARITY = 2.0;

/**
 * Create a fractional Brownian motion function seeded from a string.
 *
 * @param seed - Seed string; append a suffix to isolate PRNG from other uses
 * @param octaves - Number of noise octaves; clamped to [2, 6] per ORGN-02
 * @returns A function (x, y) => number in [-1, 1]
 */
export function createFbm(seed: string, octaves: number): (x: number, y: number) => number {
  // Clamp octaves to [2, 6] per ORGN-02
  const clampedOctaves = Math.max(2, Math.min(6, Math.round(octaves)));

  // Dedicated PRNG for noise initialization — prevents PRNG state corruption
  const noisePrng = createPRNG(seed + '-noise');
  const noise2D = createNoise2D(noisePrng);

  return function fbm(x: number, y: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < clampedOctaves; i++) {
      value += noise2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= PERSISTENCE;
      frequency *= LACUNARITY;
    }

    // Normalize to [-1, 1]
    return value / maxAmplitude;
  };
}

/**
 * Compute the actual octave count from a complexity parameter value.
 *
 * Maps [0, 1] complexity to [2, 6] octaves.
 *
 * @param complexity - ParameterVector.complexity in [0, 1]
 * @returns Integer octave count in [2, 6]
 */
export function computeOctaves(complexity: number): number {
  return Math.max(2, Math.min(6, Math.round(2 + complexity * 4)));
}
