'use client';

import { useRef, useEffect } from 'react';
import type { SceneGraph } from '@/lib/render/types';
import { drawElement, drawSceneComplete } from '@/lib/render/geometric';

/**
 * GeometricCanvas renders a SceneGraph to an HTML Canvas element
 * with HiDPI support and optional progressive build animation.
 *
 * Progressive animation draws elements largest-first with fade-in,
 * completing in ~750ms. Instant mode draws the complete scene in
 * a single frame (used for reduced-motion or theme changes).
 */

interface GeometricCanvasProps {
  /** Pre-computed scene graph to render */
  scene: SceneGraph;
  /** Whether to animate the progressive build */
  animated: boolean;
  /** Callback fired when rendering completes */
  onRenderComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function GeometricCanvas({
  scene,
  animated,
  onRenderComplete,
  className = '',
}: GeometricCanvasProps) {
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

    // Abort flag for cleanup
    let aborted = false;
    let animationId = 0;

    if (!animated) {
      // Instant render: draw complete scene in one pass
      drawSceneComplete(ctx, scene);
      onRenderComplete?.();
      return;
    }

    // Progressive build animation
    const totalDuration = 750; // ms (within 0.5-1s range)
    const fadeInDuration = 100; // ms per element fade
    const elementCount = scene.elements.length;

    if (elementCount === 0) {
      // No elements: just draw background
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, scene.width, scene.height);
      onRenderComplete?.();
      return;
    }

    const staggerDelay = totalDuration / elementCount;
    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (aborted) return;

      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      // Clear and draw background
      ctx!.fillStyle = scene.background;
      ctx!.fillRect(0, 0, scene.width, scene.height);

      // Draw each element with progressive alpha
      let allComplete = true;
      for (let i = 0; i < elementCount; i++) {
        const elementStart = i * staggerDelay;
        if (elapsed < elementStart) {
          allComplete = false;
          continue; // This element hasn't started yet
        }

        const elementElapsed = elapsed - elementStart;
        const alpha = Math.min(1, elementElapsed / fadeInDuration);

        if (alpha < 1) {
          allComplete = false;
        }

        drawElement(ctx!, scene.elements[i], alpha * scene.elements[i].opacity);
      }

      if (allComplete) {
        // Final clean render at full opacity
        drawSceneComplete(ctx!, scene);
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
      aria-label="Generated geometric artwork"
      className={`rounded-lg max-w-full ${className}`}
      style={{ width: scene.width, height: scene.height }}
    />
  );
}
