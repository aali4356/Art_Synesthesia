'use client';

import { useRef, useEffect } from 'react';
import type { ParticleSceneGraph } from '@/lib/render/types';
import { drawParticleSceneComplete, startIdleAnimation } from '@/lib/render/particle';
import { generateArtworkAltText } from '@/lib/accessibility/alt-text';

interface ParticleCanvasProps {
  /** Pre-computed particle scene graph */
  scene: ParticleSceneGraph;
  /** Whether to run progressive build + idle drift animation */
  animated: boolean;
  /** Callback fired when initial render is complete */
  onRenderComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ParticleCanvas({
  scene,
  animated,
  onRenderComplete,
  className = '',
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling (same pattern as GeometricCanvas)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = scene.width * dpr;
    canvas.height = scene.height * dpr;
    ctx.scale(dpr, dpr);

    // Check prefers-reduced-motion (PTCL-05)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Always draw the static scene first
    drawParticleSceneComplete(ctx, scene, dpr);
    onRenderComplete?.();

    if (!animated || prefersReducedMotion) {
      // Static: draw once and stop
      return;
    }

    // Start idle animation loop (slow orbital drift)
    const stopAnimation = startIdleAnimation(ctx, scene, dpr);

    return () => {
      stopAnimation();
    };
  }, [scene, animated, onRenderComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={generateArtworkAltText(scene.parameters, 'particle')}
      className={`rounded-lg max-w-full ${className}`}
      style={{ width: scene.width, height: scene.height }}
    />
  );
}
