import type { ParameterVector } from '@/types/engine';

/**
 * Color harmony types supported by the palette generator.
 * Selected based on parameter vector thresholds.
 */
export type HarmonyType =
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'split-complementary';

/**
 * Normalize a hue angle to [0, 360).
 */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Select a color harmony type based on parameter vector values.
 *
 * Selection logic:
 * - High symmetry + low contrast -> analogous (calm, cohesive)
 * - High contrast + high energy -> complementary (bold, dynamic)
 * - High contrast + moderate energy -> triadic (vibrant but balanced)
 * - Default -> split-complementary (versatile fallback)
 */
export function selectHarmony(params: ParameterVector): HarmonyType {
  if (params.symmetry > 0.6 && params.contrast < 0.4) {
    return 'analogous';
  }
  if (params.contrast > 0.6 && params.energy > 0.6) {
    return 'complementary';
  }
  if (params.contrast > 0.5 && params.energy > 0.4) {
    return 'triadic';
  }
  return 'split-complementary';
}

/**
 * Generate hue angles based on a harmony type, base hue, and desired count.
 * Uses PRNG for slight jitter to add organic variation while maintaining harmony structure.
 *
 * @param harmony - The harmony type to use
 * @param baseHue - The base hue angle (0-360)
 * @param count - Number of hue angles to generate
 * @param prng - Seeded PRNG returning values in [0, 1)
 * @returns Array of normalized hue angles in [0, 360)
 */
export function generateHueAngles(
  harmony: HarmonyType,
  baseHue: number,
  count: number,
  prng: () => number,
): number[] {
  const hues: number[] = [];

  switch (harmony) {
    case 'analogous': {
      // Spread hues within +-30 degrees of base
      const spread = 30;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1 to 1
        const jitter = (prng() - 0.5) * 5; // +-2.5 degree jitter
        hues.push(normalizeHue(baseHue + t * spread + jitter));
      }
      break;
    }

    case 'complementary': {
      // Base + opposite (180) with slight variations
      const oppositeHue = baseHue + 180;
      for (let i = 0; i < count; i++) {
        const isOpposite = i % 2 === 1;
        const center = isOpposite ? oppositeHue : baseHue;
        const jitter = (prng() - 0.5) * 10; // +-5 degree jitter
        hues.push(normalizeHue(center + jitter));
      }
      break;
    }

    case 'triadic': {
      // 120-degree intervals with slight PRNG jitter
      for (let i = 0; i < count; i++) {
        const segment = i % 3;
        const center = baseHue + segment * 120;
        const jitter = (prng() - 0.5) * 10; // +-5 degree jitter
        hues.push(normalizeHue(center + jitter));
      }
      break;
    }

    case 'split-complementary': {
      // Base + two hues ~150 and ~210 degrees away + fill
      const angles = [0, 150, 210];
      for (let i = 0; i < count; i++) {
        const angleIndex = i % angles.length;
        const center = baseHue + angles[angleIndex];
        const jitter = (prng() - 0.5) * 10; // +-5 degree jitter
        hues.push(normalizeHue(center + jitter));
      }
      break;
    }
  }

  return hues;
}
