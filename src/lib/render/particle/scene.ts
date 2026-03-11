import { createPRNG } from '@/lib/engine/prng';
import type { ParameterVector } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';
import type { ParticleSceneGraph } from '@/lib/render/types';
import { buildClusters } from './cluster';
import { buildParticles, buildConnections } from './placement';

/**
 * Builds a complete particle scene graph from parameters.
 * Pure function: same inputs always produce identical output.
 *
 * @param params - Normalized parameter vector (all values 0-1)
 * @param palette - Generated palette for this input
 * @param theme - 'dark' | 'light' (affects background color)
 * @param seed - Deterministic seed string (from deriveSeed)
 * @param canvasSize - Canvas width and height in pixels (square, default 800)
 * @param maxParticles - Cap for total particles; pass 2000 for mobile, 10000 for desktop
 */
export function buildParticleSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  seed: string,
  canvasSize: number = 800,
  maxParticles: number = 10000,
): ParticleSceneGraph {
  // Separate PRNGs for determinism — don't share PRNG state
  const clusterPrng = createPRNG(seed + '-clusters');
  const placePrng = createPRNG(seed + '-placement');
  const connectionPrng = createPRNG(seed + '-connections');

  // Derive cluster count: 2-6 based on complexity parameter
  const clusterCount = Math.max(2, Math.round(2 + params.complexity * 4));

  // Derive total particle count: scale by density, cap at maxParticles
  const baseCount = Math.round(maxParticles * (0.2 + params.density * 0.8));
  const particleCount = Math.min(baseCount, maxParticles);

  // Negative space: enforce 15% unless density > 0.85 (PTCL-04)
  const negativeSpaceRatio = params.density > 0.85 ? 0.05 : 0.15;

  const clusters = buildClusters(clusterCount, particleCount, canvasSize, clusterPrng, negativeSpaceRatio);

  const colors = theme === 'dark'
    ? palette.dark.map((c) => c.hex)
    : palette.light.map((c) => c.hex);

  const particles = buildParticles(clusters, particleCount, colors, placePrng);

  const connections = buildConnections(particles, clusters, connectionPrng);

  const background = theme === 'dark' ? '#0a0a0a' : '#fafafa';

  return {
    style: 'particle',
    parameters: params,
    width: canvasSize,
    height: canvasSize,
    background,
    particles,
    connections,
    clusters,
  };
}
