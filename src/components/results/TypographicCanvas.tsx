'use client';

import { useRef, useEffect } from 'react';
import type { TypographicSceneGraph } from '@/lib/render/types';
import { drawTypographicSceneComplete } from '@/lib/render/typographic';
import { generateArtworkAltText } from '@/lib/accessibility/alt-text';

interface TypographicCanvasProps {
  /** Pre-computed typographic scene graph */
  scene: TypographicSceneGraph;
  /** Whether to animate — typographic uses simple fade-in only */
  animated: boolean;
  /** Callback fired when rendering completes */
  onRenderComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function TypographicCanvas({
  scene,
  animated,
  onRenderComplete,
  className = '',
}: TypographicCanvasProps) {
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

    let aborted = false;
    let animationId = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!animated || prefersReducedMotion) {
      drawTypographicSceneComplete(ctx, scene);
      onRenderComplete?.();
      return;
    }

    // Progressive fade-in: fade in the entire scene over 600ms
    let startTime: number | null = null;
    const fadeDuration = 600;

    function animate(timestamp: number) {
      if (aborted) return;
      if (startTime === null) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const alpha = Math.min(1, elapsed / fadeDuration);

      ctx!.fillStyle = scene.background;
      ctx!.fillRect(0, 0, scene.width, scene.height);

      ctx!.globalAlpha = alpha;
      drawTypographicSceneComplete(ctx!, scene);
      ctx!.globalAlpha = 1;

      if (alpha >= 1) {
        drawTypographicSceneComplete(ctx!, scene);
        onRenderComplete?.();
        return;
      }

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      aborted = true;
      cancelAnimationFrame(animationId);
    };
  }, [scene, animated, onRenderComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={generateArtworkAltText(scene.parameters, 'typographic')}
      className={`rounded-lg max-w-full ${className}`}
      style={{ width: scene.width, height: scene.height }}
    />
  );
}
