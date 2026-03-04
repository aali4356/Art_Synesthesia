'use client';

import { useRef, useEffect } from 'react';
import type { OrganicSceneGraph } from '@/lib/render/types';
import { drawOrganicSceneComplete, drawOrganicScenePartial } from '@/lib/render/organic';

interface OrganicCanvasProps {
  /** Pre-computed organic scene graph to render */
  scene: OrganicSceneGraph;
  /** Whether to animate the progressive build */
  animated: boolean;
  /** Callback fired when rendering completes */
  onRenderComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function OrganicCanvas({
  scene,
  animated,
  onRenderComplete,
  className = '',
}: OrganicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = scene.width * dpr;
    canvas.height = scene.height * dpr;
    ctx.scale(dpr, dpr);

    let aborted = false;
    let animationId = 0;

    if (!animated) {
      drawOrganicSceneComplete(ctx, scene);
      onRenderComplete?.();
      return;
    }

    const totalDuration = 900; // ms
    const fadeInDuration = 80; // ms per curve fade
    const curveCount = scene.curves.length;

    if (curveCount === 0) {
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, scene.width, scene.height);
      onRenderComplete?.();
      return;
    }

    const staggerDelay = totalDuration / curveCount;
    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (aborted) return;

      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const currentCurveIdx = Math.floor(elapsed / staggerDelay);

      if (currentCurveIdx >= curveCount) {
        drawOrganicSceneComplete(ctx!, scene);
        onRenderComplete?.();
        return;
      }

      const curveElapsed = elapsed - currentCurveIdx * staggerDelay;
      const alpha = Math.min(1, curveElapsed / fadeInDuration);

      drawOrganicScenePartial(ctx!, scene, currentCurveIdx, alpha);

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
      aria-label="Generated organic artwork"
      className={`rounded-lg max-w-full ${className}`}
      style={{ width: scene.width, height: scene.height }}
    />
  );
}
