/**
 * Canvas 2D drawing functions for the organic flow field renderer.
 *
 * Only this module touches the Canvas API. Scene builders are pure functions.
 * Handles:
 * - Background gradient wash (linear gradient)
 * - Flow curves with color interpolation via quadratic bezier
 */

import type { OrganicSceneGraph, FlowCurve } from '../types';

/**
 * Draw the complete organic scene onto the canvas.
 *
 * @param ctx - Canvas 2D rendering context
 * @param scene - The OrganicSceneGraph produced by buildOrganicSceneGraph
 */
export function drawOrganicSceneComplete(
  ctx: CanvasRenderingContext2D,
  scene: OrganicSceneGraph,
): void {
  drawBackground(ctx, scene);

  for (const curve of scene.curves) {
    drawFlowCurve(ctx, curve);
  }

  ctx.globalAlpha = 1.0;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  scene: OrganicSceneGraph,
): void {
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  if (scene.gradientStops.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, scene.height);
    for (const stop of scene.gradientStops) {
      try {
        gradient.addColorStop(stop.offset, stop.color);
      } catch {
        // Skip invalid color stop
      }
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, scene.width, scene.height);
  }
}

function drawFlowCurve(
  ctx: CanvasRenderingContext2D,
  curve: FlowCurve,
): void {
  if (curve.points.length < 2) return;

  ctx.globalAlpha = curve.opacity;
  ctx.lineWidth = curve.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const totalSegments = curve.points.length - 1;

  for (let i = 0; i < totalSegments; i++) {
    ctx.strokeStyle = i < totalSegments / 2 ? curve.startColor : curve.endColor;

    ctx.beginPath();
    ctx.moveTo(curve.points[i].x, curve.points[i].y);

    if (i + 2 < curve.points.length) {
      const midX = (curve.points[i + 1].x + curve.points[i + 2].x) / 2;
      const midY = (curve.points[i + 1].y + curve.points[i + 2].y) / 2;
      ctx.quadraticCurveTo(curve.points[i + 1].x, curve.points[i + 1].y, midX, midY);
    } else {
      ctx.lineTo(curve.points[i + 1].x, curve.points[i + 1].y);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Draw a partial organic scene (for progressive animation).
 *
 * Renders the gradient background, then draws curves up to curveIndex
 * with the last curve fading in at alpha.
 *
 * @param ctx - Canvas 2D context
 * @param scene - Complete OrganicSceneGraph
 * @param curveIndex - Draw curves [0, curveIndex) completely
 * @param alpha - Fade-in alpha for the curve at curveIndex (0-1)
 */
export function drawOrganicScenePartial(
  ctx: CanvasRenderingContext2D,
  scene: OrganicSceneGraph,
  curveIndex: number,
  alpha: number,
): void {
  drawBackground(ctx, scene);

  for (let i = 0; i < curveIndex && i < scene.curves.length; i++) {
    drawFlowCurve(ctx, scene.curves[i]);
  }

  if (curveIndex < scene.curves.length) {
    const partialCurve: FlowCurve = {
      ...scene.curves[curveIndex],
      opacity: scene.curves[curveIndex].opacity * alpha,
    };
    drawFlowCurve(ctx, partialCurve);
  }

  ctx.globalAlpha = 1.0;
}
