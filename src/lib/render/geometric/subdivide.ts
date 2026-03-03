/**
 * Recursive subdivision algorithm for the geometric composition engine.
 *
 * Transforms a rectangular region into an array of non-overlapping cells
 * with configurable depth, symmetry, gaps, and frame padding.
 *
 * Algorithm:
 * 1. Root call insets region by framePadding (GEOM-03: 2% canvas edge padding)
 * 2. Each step splits the region into two sub-regions with cellGap between them
 * 3. Split direction biased toward the longer side, modulated by directionality/rhythm
 * 4. Split ratio pulled toward 0.5 by symmetry, widened by scaleVariation
 * 5. Recursion stops at maxDepth or when cells reach minCellSize
 *
 * All randomness via seeded PRNG for determinism (GEOM-06).
 */

import type { Cell, RenderConfig } from '../types';

/**
 * Recursively subdivide a region into non-overlapping cells.
 *
 * @param region - The root region to subdivide (typically full canvas)
 * @param config - Render configuration with composition parameters
 * @param prng - Seeded PRNG function returning values in [0, 1)
 * @returns Array of leaf Cell objects that tile the region
 */
export function subdivide(
  region: Cell,
  config: RenderConfig,
  prng: () => number,
): Cell[] {
  // Apply frame padding on the root call (depth 0 region)
  const pad = config.framePadding;
  const paddedRegion: Cell = {
    x: region.x + pad,
    y: region.y + pad,
    width: region.width - pad * 2,
    height: region.height - pad * 2,
    depth: 0,
  };

  return subdivideRecursive(paddedRegion, config, prng, 0);
}

/**
 * Internal recursive subdivision.
 */
function subdivideRecursive(
  region: Cell,
  config: RenderConfig,
  prng: () => number,
  depth: number,
): Cell[] {
  // Max depth = 2 + floor(complexity * 6), range [2, 8]
  const maxDepth = 2 + Math.floor(config.complexity * 6);

  const minDim = config.minCellSize * 2 + config.cellGap;

  // Terminal conditions
  if (
    depth >= maxDepth ||
    region.width < minDim ||
    region.height < minDim
  ) {
    // Only return if cell meets minimum size
    if (region.width >= config.minCellSize && region.height >= config.minCellSize) {
      return [{ ...region, depth }];
    }
    return [];
  }

  // Determine split direction
  const splitHorizontal = chooseSplitDirection(region, config, prng, depth);

  // Determine split ratio
  const ratio = chooseSplitRatio(config, prng);

  // Create two child regions with gap
  const gap = config.cellGap;

  if (splitHorizontal) {
    // Split along the width (left/right)
    const totalWidth = region.width - gap;
    const leftWidth = totalWidth * ratio;
    const rightWidth = totalWidth * (1 - ratio);

    if (leftWidth < config.minCellSize || rightWidth < config.minCellSize) {
      return [{ ...region, depth }];
    }

    const left: Cell = {
      x: region.x,
      y: region.y,
      width: leftWidth,
      height: region.height,
      depth: depth + 1,
    };

    const right: Cell = {
      x: region.x + leftWidth + gap,
      y: region.y,
      width: rightWidth,
      height: region.height,
      depth: depth + 1,
    };

    return [
      ...subdivideRecursive(left, config, prng, depth + 1),
      ...subdivideRecursive(right, config, prng, depth + 1),
    ];
  } else {
    // Split along the height (top/bottom)
    const totalHeight = region.height - gap;
    const topHeight = totalHeight * ratio;
    const bottomHeight = totalHeight * (1 - ratio);

    if (topHeight < config.minCellSize || bottomHeight < config.minCellSize) {
      return [{ ...region, depth }];
    }

    const top: Cell = {
      x: region.x,
      y: region.y,
      width: region.width,
      height: topHeight,
      depth: depth + 1,
    };

    const bottom: Cell = {
      x: region.x,
      y: region.y + topHeight + gap,
      width: region.width,
      height: bottomHeight,
      depth: depth + 1,
    };

    return [
      ...subdivideRecursive(top, config, prng, depth + 1),
      ...subdivideRecursive(bottom, config, prng, depth + 1),
    ];
  }
}

/**
 * Choose whether to split horizontally (left/right) or vertically (top/bottom).
 *
 * Biased toward splitting the longer dimension.
 * directionality modulates this bias (high = stronger preference).
 * rhythm controls alternation (high = more regular alternation by depth).
 */
function chooseSplitDirection(
  region: Cell,
  config: RenderConfig,
  prng: () => number,
  depth: number,
): boolean {
  // Base bias toward longer side
  const aspectBias = region.width > region.height ? 0.7 : 0.3;

  // Directionality strengthens the bias
  const directionStrength = config.directionality * 0.3;
  let bias = aspectBias;
  if (region.width > region.height) {
    bias = aspectBias + directionStrength;
  } else {
    bias = aspectBias - directionStrength;
  }

  // Rhythm: at high values, alternate by depth
  if (config.rhythm > 0.5) {
    const rhythmStrength = (config.rhythm - 0.5) * 2; // 0-1
    const shouldAlternate = depth % 2 === 0;
    bias = bias * (1 - rhythmStrength) + (shouldAlternate ? 0.8 : 0.2) * rhythmStrength;
  }

  // Clamp to [0.1, 0.9] to always allow some randomness
  bias = Math.max(0.1, Math.min(0.9, bias));

  return prng() < bias;
}

/**
 * Choose the split ratio.
 *
 * symmetry pulls ratio toward 0.5 (balanced).
 * scaleVariation widens the allowed range (more asymmetric).
 * regularity snaps toward clean fractions (1/2, 1/3, 2/3).
 */
function chooseSplitRatio(
  config: RenderConfig,
  prng: () => number,
): number {
  // Base range: [0.5 - spread, 0.5 + spread]
  // spread = (1 - symmetry) * 0.3, widened by scaleVariation
  const baseSpread = (1 - config.symmetry) * 0.3;
  const spread = baseSpread + config.scaleVariation * 0.15;

  const min = Math.max(0.15, 0.5 - spread);
  const max = Math.min(0.85, 0.5 + spread);

  let ratio = min + prng() * (max - min);

  // Regularity: snap toward clean fractions
  if (config.regularity > 0.5) {
    const snapStrength = (config.regularity - 0.5) * 2; // 0-1
    const cleanFractions = [1 / 3, 0.5, 2 / 3];
    const nearest = cleanFractions.reduce((best, f) =>
      Math.abs(f - ratio) < Math.abs(best - ratio) ? f : best,
    );
    ratio = ratio * (1 - snapStrength) + nearest * snapStrength;
  }

  return ratio;
}
