/**
 * Scene graph builder for the geometric composition engine.
 *
 * Combines recursive subdivision, shape assignment, and palette selection
 * into a complete SceneGraph of drawing instructions.
 *
 * Pure function: no side effects, no Canvas API calls.
 * Deterministic: same input + same seed = same scene graph.
 */

import type { ParameterVector } from '@/types/engine';
import type { PaletteResult, PaletteColor } from '@/lib/color/palette';
import { createPRNG } from '@/lib/engine/prng';
import { subdivide } from './subdivide';
import { assignShape } from './shapes';
import { createRenderConfig, type SceneGraph } from '../types';

/**
 * Build a complete scene graph from parameters, palette, and seed.
 *
 * @param params - The ParameterVector driving composition
 * @param palette - PaletteResult with dark/light mode colors
 * @param theme - 'dark' or 'light' mode
 * @param seed - PRNG seed for deterministic generation
 * @param canvasSize - Canvas dimension in pixels (default 800)
 * @returns Complete SceneGraph ready for rendering
 */
export function buildSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  seed: string,
  canvasSize: number = 800,
): SceneGraph {
  // 1. Create PRNG from seed
  const prng = createPRNG(seed);

  // 2. Derive RenderConfig from ParameterVector
  const config = createRenderConfig(
    {
      complexity: params.complexity,
      symmetry: params.symmetry,
      density: params.density,
      curvature: params.curvature,
      texture: params.texture,
      scaleVariation: params.scaleVariation,
      rhythm: params.rhythm,
      regularity: params.regularity,
      directionality: params.directionality,
      layering: params.layering,
      energy: params.energy,
    },
    canvasSize,
  );

  // 3. Create root cell (full canvas, subdivision will apply frame padding)
  const rootCell = {
    x: 0,
    y: 0,
    width: canvasSize,
    height: canvasSize,
    depth: 0,
  };

  // 4. Subdivide into cells
  const cells = subdivide(rootCell, config, prng);

  // 5. Select palette colors based on theme
  const paletteColors: PaletteColor[] = theme === 'dark' ? palette.dark : palette.light;

  // 6. Assign shapes to each cell
  const elements = cells.map(cell => assignShape(cell, config, paletteColors, prng));

  // 7. Sort elements by area descending (largest first for progressive animation)
  elements.sort((a, b) => b.area - a.area);

  // 8. Set background color
  const background = theme === 'dark' ? '#0a0a0a' : '#fafafa';

  // 9. Return complete scene graph
  return {
    elements,
    width: canvasSize,
    height: canvasSize,
    background,
  };
}
