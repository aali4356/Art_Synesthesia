import type { ParticleSceneGraph, Particle } from '@/lib/render/types';

/** Cache of glow sprites keyed by "radius-color" string */
const glowSpriteCache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

/**
 * Pre-renders a radial gradient glow sprite onto an offscreen canvas.
 * Cached by radius+color to avoid redundant allocations.
 */
function getGlowSprite(radius: number, color: string, dpr: number): HTMLCanvasElement | OffscreenCanvas {
  const key = `${radius}-${color}`;
  if (glowSpriteCache.has(key)) return glowSpriteCache.get(key)!;

  const size = Math.ceil(radius * 4 * dpr);
  let canvas: HTMLCanvasElement | OffscreenCanvas;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(size, size);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius * 2 * dpr);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color + '80'); // 50% alpha approximation
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  glowSpriteCache.set(key, canvas);
  return canvas;
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  dpr: number,
): void {
  ctx.save();
  ctx.globalAlpha = particle.opacity;

  if (particle.glowRadius > 0) {
    const sprite = getGlowSprite(particle.glowRadius, particle.color, dpr);
    const spriteSize = particle.glowRadius * 4;
    ctx.drawImage(
      sprite as CanvasImageSource,
      particle.x - spriteSize / 2,
      particle.y - spriteSize / 2,
      spriteSize,
      spriteSize,
    );
  }

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fillStyle = particle.color;
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the complete particle scene (static, no animation).
 * Used for instant render, reduced-motion, and thumbnails.
 */
export function drawParticleSceneComplete(
  ctx: CanvasRenderingContext2D,
  scene: ParticleSceneGraph,
  dpr: number = 1,
): void {
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  ctx.save();
  for (const conn of scene.connections) {
    const a = scene.particles[conn.from];
    const b = scene.particles[conn.to];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = a.color;
    ctx.globalAlpha = conn.opacity;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  const sorted = [...scene.particles].sort((a, b) => a.radius - b.radius);
  for (const particle of sorted) {
    drawParticle(ctx, particle, dpr);
  }
}

/**
 * Draws the scene at a specific animation time offset for idle animation.
 * Particles are displaced from their base position by orbital drift.
 *
 * @param ctx - Canvas 2D context
 * @param scene - The static particle scene graph
 * @param elapsedSeconds - Seconds elapsed since animation started
 * @param dpr - Device pixel ratio
 */
export function drawParticleSceneAnimated(
  ctx: CanvasRenderingContext2D,
  scene: ParticleSceneGraph,
  elapsedSeconds: number,
  dpr: number = 1,
): void {
  const animatedScene: ParticleSceneGraph = {
    ...scene,
    particles: scene.particles.map((p) => {
      const cluster = scene.clusters[p.clusterId];
      const angle = p.orbitAngle + p.orbitSpeed * elapsedSeconds;
      return {
        ...p,
        x: cluster.cx + Math.cos(angle) * p.orbitRadius,
        y: cluster.cy + Math.sin(angle) * p.orbitRadius,
      };
    }),
  };

  drawParticleSceneComplete(ctx, animatedScene, dpr);
}
