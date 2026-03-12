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
import { interpretRendererExpressiveness } from '../expressiveness';
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
  const expressiveness = interpretRendererExpressiveness(palette, theme);

  // ORGN-02: octave count in [2, 6]
  const octaves = computeOctaves(params.complexity);

  // ORGN-03: layer count from layering param; capped at MAX_LAYERS
  const expressiveLayerBoost = Math.round(expressiveness.layeringDepth * 2);
  const rawLayers = Math.max(1, Math.round(1 + params.layering * 7 + expressiveLayerBoost));
  const layers = Math.min(rawLayers, MAX_LAYERS);
  const opacityScale = rawLayers > MAX_LAYERS ? MAX_LAYERS / rawLayers : 1.0;

  // ORGN-04: dominant direction from directionality parameter
  const directionalityBoost = expressiveness.directionalDrama * 0.45;
  const dominantDirection = computeDominantDirection(
    Math.max(0, Math.min(1, params.directionality * (0.78 + directionalityBoost))),
  );
  const spread = Math.max(0.12, 1.0 - params.directionality * 0.8 - expressiveness.directionalDrama * 0.22);

  const curveCount = Math.max(
    10,
    Math.round(
      26
        + params.complexity * 74
        + params.density * 32
        + expressiveness.densityLift * 22
        + expressiveness.atmosphericRichness * 12,
    ),
  );

  const fbm = createFbm(seed, octaves);

  const gradientStops: GradientStop[] = buildGradientStops(hexColors, params.warmth, theme, expressiveness.atmosphericRichness);

  const startPoints = computeCurveStartPoints(curveCount, canvasSize, params.directionality, scenePrng);

  const baseLineWidth = 0.45 + params.texture * 2.15 + expressiveness.layeringDepth * 0.85;

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

    const width = baseLineWidth * (0.45 + scenePrng() * (0.85 + expressiveness.layeringDepth * 0.35));

    const layerIdx = i % layers;
    const layerOpacity = (
      0.3
      + params.energy * 0.38
      + expressiveness.layeringDepth * 0.18
      + expressiveness.atmosphericRichness * 0.12
    ) * opacityScale * (1 - layerIdx * (0.06 + (1 - expressiveness.layeringDepth) * 0.04));

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
    expressiveness: {
      atmosphericRichness: expressiveness.atmosphericRichness,
      densityLift: expressiveness.densityLift,
      layeringDepth: expressiveness.layeringDepth,
      directionalDrama: expressiveness.directionalDrama,
    },
  };
}

function buildGradientStops(
  hexColors: string[],
  warmth: number,
  theme: 'dark' | 'light',
  atmosphericRichness: number,
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
    stops.push({ offset: Math.min(0.82, 0.38 + warmth * 0.22), color: hexColors[1] + '18' });
  }

  if (colorCount >= 3 && atmosphericRichness >= 0.58) {
    stops.push({ offset: Math.min(0.92, 0.62 + atmosphericRichness * 0.18), color: hexColors[2] + '12' });
  }

  const bgHex = theme === 'dark' ? '#0a0a0a' : '#fafafa';
  stops.push({ offset: 1, color: bgHex });

  return stops;
}
