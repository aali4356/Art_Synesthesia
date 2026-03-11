/**
 * Scene graph builder for the organic flow field renderer.
 *
 * Pure function: no side effects, no Canvas API calls.
 * Deterministic: same input + same seed = same scene graph.
 *
 * Composition laws enforced:
 * - ORGN-02: octave count clamped to [2, 6]
 * - ORGN-03: max 5 overlapping layers; opacity reduces beyond that
 * - ORGN-04: dominant flow direction set by directionality parameter
 */

import type { ParameterVector } from '@/types/engine';
import type { PaletteResult, PaletteColor } from '@/lib/color/palette';
import { createPRNG } from '@/lib/engine/prng';
import type { OrganicSceneGraph, FlowCurve, GradientStop } from '../types';
import { createFbm, computeOctaves } from './noise';
import {
  computeDominantDirection,
  traceFlowCurve,
  computeCurveStartPoints,
} from './flowfield';

const MAX_LAYERS = 5;
const TRACE_STEPS = 200;
const STEP_SIZE = 3;

/**
 * Build a complete organic scene graph from parameters, palette, and seed.
 *
 * @param params - The ParameterVector driving composition
 * @param palette - PaletteResult with dark/light mode colors
 * @param theme - 'dark' or 'light' mode
 * @param seed - PRNG seed for deterministic generation
 * @param canvasSize - Canvas dimension in pixels (default 800)
 * @returns Complete OrganicSceneGraph ready for rendering
 */
export function buildOrganicSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  seed: string,
  canvasSize: number = 800,
): OrganicSceneGraph {
  const scenePrng = createPRNG(seed + '-scene');

  const paletteColors: PaletteColor[] = theme === 'dark' ? palette.dark : palette.light;
  const hexColors = paletteColors.map(c => c.hex);

  const background = theme === 'dark' ? '#0a0a0a' : '#fafafa';

  // ORGN-02: octave count in [2, 6]
  const octaves = computeOctaves(params.complexity);

  // ORGN-03: layer count from layering param; capped at MAX_LAYERS
  const rawLayers = Math.max(1, Math.round(1 + params.layering * 7));
  const layers = Math.min(rawLayers, MAX_LAYERS);
  const opacityScale = rawLayers > MAX_LAYERS ? MAX_LAYERS / rawLayers : 1.0;

  // ORGN-04: dominant direction from directionality parameter
  const dominantDirection = computeDominantDirection(params.directionality);
  const spread = 1.0 - params.directionality * 0.8;

  const curveCount = Math.max(10, Math.round(30 + params.complexity * 80 + params.density * 40));

  const fbm = createFbm(seed, octaves);

  const gradientStops: GradientStop[] = buildGradientStops(hexColors, params.warmth, theme);

  const startPoints = computeCurveStartPoints(curveCount, canvasSize, params.directionality, scenePrng);

  const baseLineWidth = 0.5 + params.texture * 2.5;

  const curves: FlowCurve[] = [];

  for (let i = 0; i < curveCount; i++) {
    const start = startPoints[i];
    if (!start) continue;

    const points = traceFlowCurve(
      start.x,
      start.y,
      fbm,
      dominantDirection,
      spread,
      TRACE_STEPS,
      STEP_SIZE,
      canvasSize,
    );

    if (points.length < 5) continue;

    const colorIdxStart = Math.floor(scenePrng() * hexColors.length);
    const colorIdxEnd = Math.floor(scenePrng() * hexColors.length);
    const startColor = hexColors[colorIdxStart] ?? hexColors[0];
    const endColor = hexColors[colorIdxEnd] ?? hexColors[0];

    const width = baseLineWidth * (0.5 + scenePrng() * 1.0);

    const layerIdx = i % layers;
    const layerOpacity = (0.4 + params.energy * 0.5) * opacityScale * (1 - layerIdx * 0.08);

    curves.push({
      points,
      startColor: startColor ?? '#000000',
      endColor: endColor ?? '#000000',
      width,
      opacity: Math.max(0.05, Math.min(1.0, layerOpacity)),
    });
  }

  return {
    style: 'organic',
    parameters: params,
    width: canvasSize,
    height: canvasSize,
    background,
    gradientStops,
    curves,
    layers,
    octaves,
    dominantDirection,
  };
}

function buildGradientStops(
  hexColors: string[],
  warmth: number,
  theme: 'dark' | 'light',
): GradientStop[] {
  if (hexColors.length === 0) {
    return [
      { offset: 0, color: theme === 'dark' ? '#111111' : '#f0f0f0' },
      { offset: 1, color: theme === 'dark' ? '#0a0a0a' : '#fafafa' },
    ];
  }

  const stops: GradientStop[] = [];
  const colorCount = Math.min(3, hexColors.length);

  stops.push({ offset: 0, color: hexColors[0] + '22' });

  if (colorCount >= 2) {
    stops.push({ offset: 0.5 + warmth * 0.3, color: hexColors[1] + '18' });
  }

  const bgHex = theme === 'dark' ? '#0a0a0a' : '#fafafa';
  stops.push({ offset: 1, color: bgHex });

  return stops;
}
