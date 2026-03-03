import { describe, it, expect } from 'vitest';
import { selectHarmony, generateHueAngles, type HarmonyType } from '@/lib/color/harmony';
import type { ParameterVector } from '@/types/engine';

function makeParams(overrides: Partial<ParameterVector>): ParameterVector {
  return {
    complexity: 0.5,
    warmth: 0.5,
    symmetry: 0.5,
    rhythm: 0.5,
    energy: 0.5,
    density: 0.5,
    scaleVariation: 0.5,
    curvature: 0.5,
    saturation: 0.5,
    contrast: 0.5,
    layering: 0.5,
    directionality: 0.5,
    paletteSize: 0.5,
    texture: 0.5,
    regularity: 0.5,
    ...overrides,
  };
}

describe('selectHarmony', () => {
  it('returns analogous for high symmetry + low contrast', () => {
    const result = selectHarmony(makeParams({ symmetry: 0.8, contrast: 0.2, energy: 0.5 }));
    expect(result).toBe('analogous');
  });

  it('returns complementary for high contrast + high energy', () => {
    const result = selectHarmony(makeParams({ symmetry: 0.3, contrast: 0.8, energy: 0.8 }));
    expect(result).toBe('complementary');
  });

  it('returns triadic for high contrast + moderate energy', () => {
    const result = selectHarmony(makeParams({ symmetry: 0.3, contrast: 0.6, energy: 0.5 }));
    expect(result).toBe('triadic');
  });

  it('returns split-complementary as default fallback', () => {
    const result = selectHarmony(makeParams({ symmetry: 0.5, contrast: 0.4, energy: 0.4 }));
    expect(result).toBe('split-complementary');
  });
});

describe('generateHueAngles', () => {
  // Simple deterministic PRNG mock
  const mockPrng = (() => {
    let i = 0;
    return () => {
      i = (i + 1) % 10;
      return i / 10;
    };
  })();

  it('generates analogous hues within ~30 degrees of base', () => {
    const hues = generateHueAngles('analogous', 180, 5, mockPrng);
    expect(hues).toHaveLength(5);
    for (const h of hues) {
      const diff = Math.abs(h - 180);
      const circularDiff = Math.min(diff, 360 - diff);
      expect(circularDiff).toBeLessThanOrEqual(35); // allow slight PRNG jitter
    }
  });

  it('generates complementary hues including base and base+180', () => {
    const hues = generateHueAngles('complementary', 30, 4, mockPrng);
    expect(hues).toHaveLength(4);
    // Should have hues near 30 and near 210
    const nearBase = hues.filter((h) => {
      const diff = Math.abs(h - 30);
      return Math.min(diff, 360 - diff) < 30;
    });
    const nearOpposite = hues.filter((h) => {
      const diff = Math.abs(h - 210);
      return Math.min(diff, 360 - diff) < 30;
    });
    expect(nearBase.length).toBeGreaterThanOrEqual(1);
    expect(nearOpposite.length).toBeGreaterThanOrEqual(1);
  });

  it('generates triadic hues at ~120-degree intervals', () => {
    const hues = generateHueAngles('triadic', 60, 3, mockPrng);
    expect(hues).toHaveLength(3);
    // Sort hues and check ~120 degree spacing
    const sorted = [...hues].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[(i + 1) % sorted.length];
      const diff = ((next - sorted[i]) + 360) % 360;
      // Each gap should be roughly 120 degrees (allow some jitter)
      expect(diff).toBeGreaterThan(90);
      expect(diff).toBeLessThan(150);
    }
  });

  it('generates split-complementary hues', () => {
    const hues = generateHueAngles('split-complementary', 0, 4, mockPrng);
    expect(hues).toHaveLength(4);
    // Should have base hue and hues near 150 and 210 degrees away
    const hasNearBase = hues.some((h) => {
      const diff = Math.min(Math.abs(h), 360 - Math.abs(h));
      return diff < 20;
    });
    expect(hasNearBase).toBe(true);
  });

  it('normalizes all hues to [0, 360)', () => {
    const hues = generateHueAngles('analogous', 350, 5, mockPrng);
    for (const h of hues) {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });
});
