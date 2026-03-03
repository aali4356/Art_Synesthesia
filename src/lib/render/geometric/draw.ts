/**
 * Canvas 2D drawing functions for the geometric composition engine.
 *
 * These functions consume SceneGraph/SceneElement data and draw to a
 * CanvasRenderingContext2D. They are the only module that touches the
 * Canvas API -- all other modules produce pure data.
 */

import type { SceneElement, SceneGraph } from '../types';

/**
 * Draw a single scene element on the canvas context.
 *
 * Handles all 5 shape types: rect, circle, triangle, line, empty.
 * Applies fill color, optional stroke, and alpha transparency.
 *
 * @param ctx - Canvas 2D rendering context
 * @param el - The scene element to draw
 * @param alpha - Override opacity (default uses el.opacity)
 */
export function drawElement(
  ctx: CanvasRenderingContext2D,
  el: SceneElement,
  alpha: number = el.opacity,
): void {
  // Skip empty elements
  if (el.type === 'empty') return;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = el.fill;

  switch (el.type) {
    case 'rect':
      ctx.fillRect(el.x, el.y, el.width, el.height);
      break;

    case 'circle': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const radius = Math.min(el.width, el.height) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'triangle': {
      const midX = el.x + el.width / 2;
      ctx.beginPath();
      ctx.moveTo(midX, el.y);
      ctx.lineTo(el.x, el.y + el.height);
      ctx.lineTo(el.x + el.width, el.y + el.height);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'line': {
      ctx.strokeStyle = el.fill;
      ctx.lineWidth = el.strokeWidth ?? 2;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y + el.height / 2);
      ctx.lineTo(el.x + el.width, el.y + el.height / 2);
      ctx.stroke();
      break;
    }
  }

  // Apply stroke overlay if present (not for 'line' which uses stroke as primary)
  if (el.stroke && el.strokeWidth && el.type !== 'line') {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth;

    switch (el.type) {
      case 'rect':
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        break;

      case 'circle': {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const radius = Math.min(el.width, el.height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'triangle': {
        const midX = el.x + el.width / 2;
        ctx.beginPath();
        ctx.moveTo(midX, el.y);
        ctx.lineTo(el.x, el.y + el.height);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.closePath();
        ctx.stroke();
        break;
      }
    }
  }

  // Reset alpha
  ctx.globalAlpha = 1.0;
}

/**
 * Draw the complete scene on the canvas.
 *
 * Clears the canvas with the background color, then draws all
 * elements in order (largest first, as they are pre-sorted).
 *
 * @param ctx - Canvas 2D rendering context
 * @param scene - The complete scene graph to render
 */
export function drawSceneComplete(
  ctx: CanvasRenderingContext2D,
  scene: SceneGraph,
): void {
  // Clear canvas with background
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  // Draw all elements
  for (const element of scene.elements) {
    drawElement(ctx, element, 1.0);
  }
}
