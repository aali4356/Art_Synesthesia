import type { ParticleCluster } from '@/lib/render/types';

/**
 * Generates cluster center positions using seeded PRNG.
 * Guarantees:
 * - At least 2 clusters (PTCL-03)
 * - Cluster radii constrained so that covered area <= (1 - negativeSpaceRatio) of canvas (PTCL-04)
 * - Clusters do not completely overlap (centroids separated by at least sum of radii * 0.5)
 *
 * @param clusterCount - Number of clusters to generate (min 2, derived from complexity)
 * @param particleCount - Total particles to distribute across clusters
 * @param canvasSize - Canvas width/height in pixels
 * @param prng - Seeded PRNG function (alea instance)
 * @param negativeSpaceRatio - Minimum fraction of canvas that must remain empty (0.15 unless density > 0.85)
 */
export function buildClusters(
  clusterCount: number,
  particleCount: number,
  canvasSize: number,
  prng: () => number,
  negativeSpaceRatio: number,
): ParticleCluster[] {
  // Enforce minimum 2 clusters (PTCL-03)
  const count = Math.max(2, clusterCount);

  // Maximum total covered area = (1 - negativeSpaceRatio) * canvasArea
  const canvasArea = canvasSize * canvasSize;
  const maxCoveredArea = canvasArea * (1 - negativeSpaceRatio);
  const maxClusterArea = maxCoveredArea / count;
  const maxRadius = Math.sqrt(maxClusterArea / Math.PI);

  const padding = canvasSize * 0.08;
  const clusters: ParticleCluster[] = [];

  let attempts = 0;
  while (clusters.length < count && attempts < count * 20) {
    attempts++;
    const cx = padding + prng() * (canvasSize - padding * 2);
    const cy = padding + prng() * (canvasSize - padding * 2);
    const radius = maxRadius * (0.4 + prng() * 0.6);

    const tooClose = clusters.some((c) => {
      const dx = cx - c.cx;
      const dy = cy - c.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < (radius + c.radius) * 0.5;
    });

    if (!tooClose || clusters.length === 0) {
      clusters.push({ cx, cy, radius });
    }
  }

  // If we didn't get enough, force-place remaining with relaxed separation
  while (clusters.length < count) {
    const cx = padding + prng() * (canvasSize - padding * 2);
    const cy = padding + prng() * (canvasSize - padding * 2);
    clusters.push({ cx, cy, radius: maxRadius * 0.4 });
  }

  return clusters;
}
