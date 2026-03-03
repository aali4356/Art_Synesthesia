import { describe, it, expect } from 'vitest';
import {
  ensureContrast,
  adjustForMode,
  DARK_BG,
  LIGHT_BG,
  DARK_MODE_PROFILE,
  LIGHT_MODE_PROFILE,
} from '@/lib/color/contrast';
import type { OklchColor } from '@/lib/color/dedup';
import {
  useMode, modeOklch, modeRgb,
  converter, wcagContrast,
} from 'culori/fn';

useMode(modeOklch);
useMode(modeRgb);

const toRgb = converter('rgb');

describe('constants', () => {
  it('DARK_BG is oklch(0.09 0.005 250)', () => {
    expect(DARK_BG).toEqual({ mode: 'oklch', l: 0.09, c: 0.005, h: 250 });
  });

  it('LIGHT_BG is oklch(1.0 0 0)', () => {
    expect(LIGHT_BG).toEqual({ mode: 'oklch', l: 1.0, c: 0, h: 0 });
  });

  it('DARK_MODE_PROFILE has correct ranges', () => {
    expect(DARK_MODE_PROFILE).toEqual({ min: 0.45, max: 0.90, target: 0.65 });
  });

  it('LIGHT_MODE_PROFILE has correct ranges', () => {
    expect(LIGHT_MODE_PROFILE).toEqual({ min: 0.25, max: 0.70, target: 0.50 });
  });
});

describe('ensureContrast', () => {
  it('returns color unchanged if already meeting contrast ratio', () => {
    // Bright color against dark bg - already good contrast
    const color: OklchColor = { mode: 'oklch', l: 0.80, c: 0.2, h: 285 };
    const result = ensureContrast(color, DARK_BG);
    const ratio = wcagContrast(toRgb(result)!, toRgb(DARK_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
    // Should be close to original since it already passes
    expect(Math.abs(result.l - color.l)).toBeLessThan(0.05);
  });

  it('lightens color against dark background until ratio >= 3.0', () => {
    // Very dark color against dark bg - needs lightening
    const color: OklchColor = { mode: 'oklch', l: 0.15, c: 0.1, h: 100 };
    const result = ensureContrast(color, DARK_BG);
    const ratio = wcagContrast(toRgb(result)!, toRgb(DARK_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
    expect(result.l).toBeGreaterThan(color.l);
  });

  it('darkens color against light background until ratio >= 3.0', () => {
    // Very light color against light bg - needs darkening
    const color: OklchColor = { mode: 'oklch', l: 0.95, c: 0.1, h: 60 };
    const result = ensureContrast(color, LIGHT_BG);
    const ratio = wcagContrast(toRgb(result)!, toRgb(LIGHT_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
    expect(result.l).toBeLessThan(color.l);
  });

  it('preserves hue and chroma', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.15, c: 0.2, h: 285 };
    const result = ensureContrast(color, DARK_BG);
    expect(result.h).toBe(285);
    expect(result.c).toBe(0.2);
    expect(result.mode).toBe('oklch');
  });

  it('uses default minRatio of 3.0', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.20, c: 0.1, h: 200 };
    const result = ensureContrast(color, DARK_BG);
    const ratio = wcagContrast(toRgb(result)!, toRgb(DARK_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

describe('adjustForMode', () => {
  it('dark mode applies DARK_MODE_PROFILE lightness bounds', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.30, c: 0.2, h: 60 };
    const result = adjustForMode('dark', color);
    // Lightness should be clamped to [0.45, 0.90]
    expect(result.l).toBeGreaterThanOrEqual(0.45);
    expect(result.l).toBeLessThanOrEqual(0.90);
  });

  it('light mode applies LIGHT_MODE_PROFILE lightness bounds', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.85, c: 0.2, h: 60 };
    const result = adjustForMode('light', color);
    // Lightness should be clamped to [0.25, 0.70]
    expect(result.l).toBeGreaterThanOrEqual(0.25);
    expect(result.l).toBeLessThanOrEqual(0.70);
  });

  it('dark mode ensures contrast against DARK_BG', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.50, c: 0.15, h: 180 };
    const result = adjustForMode('dark', color);
    const ratio = wcagContrast(toRgb(result)!, toRgb(DARK_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('light mode ensures contrast against LIGHT_BG', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.50, c: 0.15, h: 180 };
    const result = adjustForMode('light', color);
    const ratio = wcagContrast(toRgb(result)!, toRgb(LIGHT_BG)!);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('preserves hue and chroma', () => {
    const color: OklchColor = { mode: 'oklch', l: 0.50, c: 0.22, h: 300 };
    const darkResult = adjustForMode('dark', color);
    const lightResult = adjustForMode('light', color);
    expect(darkResult.h).toBe(300);
    expect(darkResult.c).toBe(0.22);
    expect(lightResult.h).toBe(300);
    expect(lightResult.c).toBe(0.22);
  });
});
