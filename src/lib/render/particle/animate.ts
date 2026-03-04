import type { ParticleSceneGraph } from '@/lib/render/types';
import { drawParticleSceneAnimated } from './draw';

/**
 * Starts the idle orbital drift animation loop.
 * Returns a cancel function that stops the loop and releases resources.
 *
 * @param ctx - Canvas 2D context to draw on (already scaled for HiDPI)
 * @param scene - The particle scene graph (immutable during animation)
 * @param dpr - Device pixel ratio for glow sprite sizing
 * @returns cleanup function — call this in useEffect return
 */
export function startIdleAnimation(
  ctx: CanvasRenderingContext2D,
  scene: ParticleSceneGraph,
  dpr: number,
): () => void {
  let animationId = 0;
  let aborted = false;
  let startTime: number | null = null;

  function animate(timestamp: number) {
    if (aborted) return;

    if (startTime === null) startTime = timestamp;
    const elapsedSeconds = (timestamp - startTime) / 1000;

    drawParticleSceneAnimated(ctx, scene, elapsedSeconds, dpr);

    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);

  return () => {
    aborted = true;
    cancelAnimationFrame(animationId);
  };
}
