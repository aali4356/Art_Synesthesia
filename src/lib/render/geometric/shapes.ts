/**
 * Shape assignment for the geometric composition engine.
 *
 * Assigns a ShapeType and visual properties to each Cell based on
 * the curvature, density, energy, layering, and texture parameters.
 *
 * Shape distribution:
 * - curvature drives circle vs rect/triangle ratio
 * - density controls fill vs empty probability
 * - energy increases palette color diversity
 * - layering allows slight overflow beyond cell bounds
 * - texture controls stroke visibility and weight
 */

import type { Cell, SceneElement, RenderConfig, ShapeType } from '../types';
import type { PaletteColor } from '@/lib/color/palette';

/**
 * Assign a shape and visual properties to a cell.
 *
 * @param cell - The cell to assign a shape to
 * @param config - Render configuration with composition parameters
 * @param palette - Array of palette colors to choose from
 * @param prng - Seeded PRNG function
 * @returns SceneElement with shape type, position, color, and stroke
 */
export function assignShape(
  cell: Cell,
  config: RenderConfig,
  palette: PaletteColor[],
  prng: () => number,
): SceneElement {
  // Density controls fill vs empty: fillProbability = 0.3 + density * 0.65
  const fillProbability = 0.3 + config.density * 0.65;

  if (prng() > fillProbability) {
    return createEmptyElement(cell);
  }

  // Choose shape type based on curvature
  const shapeType = chooseShapeType(config.curvature, prng);

  // Choose fill color from palette
  const fill = chooseColor(cell, palette, config.energy, prng);

  // Compute element bounds (with possible layering overflow)
  const { x, y, width, height } = computeBounds(cell, config, prng);

  // Determine stroke
  const area = width * height;
  const stroke = config.strokeVisible
    ? chooseStrokeColor(palette, fill, prng)
    : undefined;

  // Median area estimate for stroke weight selection: use cell area as reference
  // Large shapes get primary weight, small shapes get secondary (GEOM-04: at most 2 weights)
  const medianArea = 60 * 60; // Reasonable median for composition
  const strokeWidth = config.strokeVisible
    ? (area > medianArea ? config.primaryStrokeWidth : config.secondaryStrokeWidth)
    : undefined;

  return {
    type: shapeType,
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    opacity: 1.0,
    area,
    depth: cell.depth,
  };
}

/**
 * Choose a shape type based on curvature parameter.
 *
 * P(circle) = curvature * 0.5
 * P(triangle) = (1 - curvature) * 0.3
 * P(line) = 0.05
 * P(rect) = 1 - P(circle) - P(triangle) - P(line)
 */
function chooseShapeType(curvature: number, prng: () => number): ShapeType {
  const pCircle = curvature * 0.5;
  const pTriangle = (1 - curvature) * 0.3;
  const pLine = 0.05;
  // pRect = 1 - pCircle - pTriangle - pLine

  const roll = prng();

  if (roll < pCircle) return 'circle';
  if (roll < pCircle + pTriangle) return 'triangle';
  if (roll < pCircle + pTriangle + pLine) return 'line';
  return 'rect';
}

/**
 * Choose a fill color from the palette.
 *
 * First palette color is dominant (60% for largest cells).
 * energy increases diversity of color usage.
 */
function chooseColor(
  cell: Cell,
  palette: PaletteColor[],
  energy: number,
  prng: () => number,
): string {
  if (palette.length === 0) return '#000000';
  if (palette.length === 1) return palette[0].hex;

  // Dominant color probability: higher for large cells, reduced by energy
  const dominantProb = 0.6 * (1 - energy * 0.5);

  if (prng() < dominantProb) {
    return palette[0].hex;
  }

  // Pick from remaining colors
  const idx = 1 + Math.floor(prng() * (palette.length - 1));
  return palette[Math.min(idx, palette.length - 1)].hex;
}

/**
 * Compute element bounds, with optional layering overflow.
 */
function computeBounds(
  cell: Cell,
  config: RenderConfig,
  prng: () => number,
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = cell;

  // Layering: at high values (>0.7), add 5-15% overflow
  if (config.layering > 0.7) {
    const overflow = 0.05 + prng() * 0.1; // 5-15%
    const dx = width * overflow * 0.5;
    const dy = height * overflow * 0.5;
    x -= dx;
    y -= dy;
    width += dx * 2;
    height += dy * 2;
  }

  return { x, y, width, height };
}

/**
 * Choose a stroke color: contrasting palette color or neutral.
 */
function chooseStrokeColor(
  palette: PaletteColor[],
  fillHex: string,
  prng: () => number,
): string {
  // 50% chance of neutral stroke
  if (prng() < 0.5 || palette.length < 2) {
    return '#333333';
  }

  // Pick a different palette color
  const candidates = palette.filter(c => c.hex !== fillHex);
  if (candidates.length === 0) return '#333333';

  const idx = Math.floor(prng() * candidates.length);
  return candidates[idx].hex;
}

/**
 * Create an empty element (no visible shape).
 */
function createEmptyElement(cell: Cell): SceneElement {
  return {
    type: 'empty',
    x: cell.x,
    y: cell.y,
    width: cell.width,
    height: cell.height,
    fill: 'transparent',
    opacity: 0,
    area: cell.width * cell.height,
    depth: cell.depth,
  };
}
