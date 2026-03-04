import type { Particle, ParticleConnection, ParticleCluster } from '@/lib/render/types';

/**
 * Distributes particles across clusters with cosmic starfield hierarchy:
 * - ~5% of particles are "large stars" (radius 6-12, with glow)
 * - ~95% are "small stars" (radius 1-3, no glow)
 * Each particle gets orbit parameters for idle animation.
 *
 * @param clusters - Pre-built cluster layout
 * @param totalCount - Total particle count (already capped for mobile/desktop)
 * @param palette - Array of hex color strings from the palette
 * @param prng - Seeded PRNG
 */
export function buildParticles(
  clusters: ParticleCluster[],
  totalCount: number,
  palette: string[],
  prng: () => number,
): Particle[] {
  const particles: Particle[] = [];
  const particlesPerCluster = Math.floor(totalCount / clusters.length);
  const remainder = totalCount - particlesPerCluster * clusters.length;

  clusters.forEach((cluster, clusterId) => {
    const count = particlesPerCluster + (clusterId < remainder ? 1 : 0);

    for (let i = 0; i < count; i++) {
      const angle = prng() * Math.PI * 2;
      const r = cluster.radius * Math.sqrt(prng()) * 0.9;

      const x = cluster.cx + Math.cos(angle) * r;
      const y = cluster.cy + Math.sin(angle) * r;

      // Cosmic hierarchy: ~5% large stars
      const isLarge = prng() < 0.05;
      const radius = isLarge
        ? 6 + prng() * 6   // 6-12px large stars
        : 1 + prng() * 2;  // 1-3px small stars

      const glowRadius = isLarge ? radius * 2.5 : 0;
      const color = palette[Math.floor(prng() * palette.length)];
      const opacity = isLarge ? 0.85 + prng() * 0.15 : 0.5 + prng() * 0.5;

      const orbitRadius = r;
      const orbitAngle = angle;
      const orbitSpeed = isLarge
        ? (0.02 + prng() * 0.03) * (prng() < 0.5 ? 1 : -1)
        : (0.05 + prng() * 0.08) * (prng() < 0.5 ? 1 : -1);

      particles.push({ x, y, radius, color, glowRadius, opacity, clusterId, orbitRadius, orbitAngle, orbitSpeed });
    }
  });

  return particles;
}

/**
 * Builds constellation-like connections between nearby particles within clusters.
 * Only connects large stars (glowRadius > 0) for constellation clarity.
 *
 * @param particles - All placed particles
 * @param clusters - Cluster layout (for radius reference)
 * @param prng - Seeded PRNG
 */
export function buildConnections(
  particles: Particle[],
  clusters: ParticleCluster[],
  prng: () => number,
): ParticleConnection[] {
  const connections: ParticleConnection[] = [];

  const largeStars = particles
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => p.glowRadius > 0);

  for (let i = 0; i < largeStars.length; i++) {
    const a = largeStars[i];
    for (let j = i + 1; j < largeStars.length; j++) {
      const b = largeStars[j];
      if (a.clusterId !== b.clusterId) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cluster = clusters[a.clusterId];

      if (dist < cluster.radius * 0.6 && prng() < 0.4) {
        const opacity = 0.08 + (1 - dist / (cluster.radius * 0.6)) * 0.15;
        connections.push({ from: a.idx, to: b.idx, opacity });
      }
    }
  }

  return connections;
}
