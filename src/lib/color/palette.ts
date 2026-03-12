import {
  useMode,
  modeOklch,
  modeRgb,
  modeLrgb,
  modeLab65,
  converter,
  formatCss,
  formatHex,
  clampChroma,
} from 'culori/fn';
import type { ParameterVector } from '@/types/engine';
import { createPRNG } from '@/lib/engine/prng';
import { selectHarmony, type HarmonyType } from './harmony';
import { rejectNearDuplicates, type OklchColor } from './dedup';
import { adjustForMode } from './contrast';
import { selectPaletteFamily, type PaletteSelectionVector } from './palette-family-selection';

// Register color spaces
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeLab65);

const toRgb = converter('rgb');

/**
 * A single palette color with OKLCH, hex, and CSS representations.
 */
export interface PaletteColor {
  /** OKLCH representation */
  oklch: OklchColor;
  /** Gamut-mapped hex string (e.g., "#7b3dd4") */
  hex: string;
  /** CSS oklch() string (e.g., "oklch(0.65 0.25 285)") */
  css: string;
}

/**
 * Complete palette result with dark and light mode versions.
 */
export interface PaletteResult {
  /** Colors adjusted for dark mode */
  dark: PaletteColor[];
  /** Colors adjusted for light mode */
  light: PaletteColor[];
  /** Which harmony was selected */
  harmony: HarmonyType;
  /** Number of colors in palette */
  count: number;
  /** Stable curated family ID */
  familyId: string;
  /** Human-readable curated family name */
  familyName: string;
  /** Stable description of the curated family */
  familyDescriptor: string;
  /** Compact deterministic selection signature */
  selectionKey: string;
  /** Deterministic selection inputs for diagnostics */
  selectionVector: PaletteSelectionVector;
}

/**
 * Normalize a hue angle to [0, 360).
 */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Convert an OKLCH color to a PaletteColor with gamut-mapped hex and CSS.
 */
function toPaletteColor(color: OklchColor): PaletteColor {
  const clamped = clampChroma(color, 'oklch');
  const oklch: OklchColor = {
    mode: 'oklch',
    l: clamped?.l ?? color.l,
    c: clamped?.c ?? color.c,
    h: clamped?.h ?? color.h,
  };

  const rgb = toRgb(oklch);
  const hex = rgb ? formatHex(rgb) : '#000000';
  const css = formatCss(oklch) ?? 'oklch(0 0 0)';

  return { oklch, hex, css };
}

/**
 * Generate a perceptually coherent OKLCH color palette from a parameter vector.
 */
export function generatePalette(
  params: ParameterVector,
  seed: string,
): PaletteResult {
  const count = Math.round(3 + params.paletteSize * 5);
  const prng = createPRNG(seed);
  const familySelection = selectPaletteFamily(params, seed);
  const family = familySelection.family;

  const legacyBaseHue = normalizeHue(((1 - params.warmth) * 220 + params.warmth * 390));
  const familyHueDrift = (prng() - 0.5) * family.hueJitter;
  const baseHue = normalizeHue(legacyBaseHue + familyHueDrift);
  const chromaRange = family.chromaMax - family.chromaMin;
  const harmony = selectHarmony(params);
  const lightnessTarget = family.lightnessTarget;
  const lightnessSpread = Math.min(family.lightnessSpread + params.contrast * 0.04, 0.34);

  let candidates: OklchColor[] = Array.from({ length: count }, (_, i) => {
    const offset = family.hueOffsetDegrees[i % family.hueOffsetDegrees.length] ?? 0;
    const hueNoise = (prng() - 0.5) * family.hueJitter;
    const t = count === 1 ? 0 : i / (count - 1);
    const centered = count === 1 ? 0 : t * 2 - 1;
    const accentWeight = i === 0 ? 1 : 0;
    const chromaBase = family.chromaMin + params.saturation * chromaRange;
    const chromaSlope = centered * family.chromaStep;
    const chromaJitter = (prng() - 0.5) * Math.max(0.004, Math.abs(family.chromaStep) * 0.35);
    const curveOffset = Math.sin(t * Math.PI) * family.lightnessCurve;
    const alternatingOffset = (i % 2 === 0 ? -1 : 1) * family.lightnessAlternation * params.energy;
    const lightnessJitter = (prng() - 0.5) * 0.018;

    return {
      mode: 'oklch' as const,
      h: normalizeHue(baseHue + offset * family.dominantHueWeight + hueNoise),
      c: Math.max(
        0.05,
        Math.min(
          0.32,
          chromaBase + chromaSlope + chromaJitter + accentWeight * family.accentChromaBoost,
        ),
      ),
      l: Math.max(
        0.22,
        Math.min(
          0.88,
          lightnessTarget + centered * lightnessSpread * 0.55 + curveOffset + alternatingOffset + lightnessJitter,
        ),
      ),
    };
  });

  candidates = candidates.map((candidate, i, all) => {
    if (i === 0) {
      return candidate;
    }

    const familyChromaDecay = family.id === 'lagoon-mist' ? 0.008 : family.id === 'solar-flare' ? 0.004 : 0.006;
    return {
      ...candidate,
      c: Math.min(candidate.c, Math.max(0.05, all[0].c - 0.014 - i * familyChromaDecay)),
    };
  });

  const dedupThreshold = Math.max(10, family.dedupThreshold);
  let deduplicated = rejectNearDuplicates(candidates, dedupThreshold, 60, 0.09);

  let shiftAttempt = 0;
  while (deduplicated.length < count && shiftAttempt < 12) {
    const offset = family.hueOffsetDegrees[shiftAttempt % family.hueOffsetDegrees.length] ?? 0;
    const extraHue = normalizeHue(baseHue + offset * family.dominantHueWeight + (shiftAttempt + 1) * 24 + (prng() - 0.5) * 8);
    const extraColor: OklchColor = {
      mode: 'oklch',
      l: Math.max(
        0.22,
        Math.min(0.86, lightnessTarget + (prng() - 0.5) * lightnessSpread + family.lightnessCurve * 0.5),
      ),
      c: Math.max(0.05, Math.min(0.31, family.chromaMin + params.saturation * chromaRange + family.chromaStep * 0.5)),
      h: extraHue,
    };
    const withExtra = [...deduplicated, extraColor];
    deduplicated = rejectNearDuplicates(withExtra, dedupThreshold, 60, 0.09);
    shiftAttempt++;
  }

  deduplicated = rejectNearDuplicates(deduplicated, dedupThreshold + 4, 120, 0.18).slice(0, count);

  const contrastFloor = family.id === 'solar-flare' || family.id === 'orchid-nocturne' ? 3.15 : 3.05;
  const sharedBaseColors = deduplicated.map((color, index) => {
    const lightAdjusted = adjustForMode('light', color, contrastFloor);
    const chromaBuffer = family.id === 'orchid-nocturne' ? 0.015 : 0.03;
    return {
      ...color,
      c: Math.max(0.05, Math.min(color.c, lightAdjusted.c + chromaBuffer - index * 0.003)),
    };
  });

  const darkBaseColors = rejectNearDuplicates(sharedBaseColors, 10, 180, 0.28).slice(0, count);
  const darkColors: PaletteColor[] = darkBaseColors.map((color) => toPaletteColor(adjustForMode('dark', color, contrastFloor)));
  const lightColors: PaletteColor[] = darkBaseColors.map((color) => toPaletteColor(adjustForMode('light', color, contrastFloor)));

  return {
    dark: darkColors,
    light: lightColors,
    harmony,
    count: deduplicated.length,
    familyId: family.id,
    familyName: family.name,
    familyDescriptor: family.descriptor,
    selectionKey: familySelection.selectionKey,
    selectionVector: familySelection.selectionVector,
  };
}
