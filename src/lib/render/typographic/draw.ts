import type { TypographicSceneGraph, TypographicWord } from '@/lib/render/types';

function drawWord(ctx: CanvasRenderingContext2D, word: TypographicWord): void {
  ctx.save();

  ctx.translate(word.x, word.y);
  ctx.rotate(word.rotation * (Math.PI / 180));

  ctx.globalAlpha = word.opacity;
  ctx.font = `${word.fontWeight} ${word.fontSize}px ${word.fontFamily}`;
  ctx.fillStyle = word.color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(word.text, 0, 0);

  ctx.restore();
}

/**
 * Draws the complete typographic scene.
 * Words rendered back-to-front (background words first).
 */
export function drawTypographicSceneComplete(
  ctx: CanvasRenderingContext2D,
  scene: TypographicSceneGraph,
): void {
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);

  const background = scene.words.filter((w) => !w.isProminent);
  const foreground = scene.words.filter((w) => w.isProminent);

  for (const word of background) {
    drawWord(ctx, word);
  }
  for (const word of foreground) {
    drawWord(ctx, word);
  }
}
