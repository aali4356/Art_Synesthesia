import { describe, it, expect } from 'vitest';
import { generatePalette, type PaletteResult, type PaletteColor } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';
import {
  useMode, modeOklch, modeRgb, modeLrgb, modeLab65,
  converter, wcagContrast, differenceCiede2000,
} from 'culori/fn';

useMode(modeOklch);
useMode(modeRgb);
useMode(modeLrgb);
useMode(modeLab65);

const toRgb = converter('rgb');
const toLab = converter('lab65');
const deltaE = differenceCiede2000();

function makeParams(overrides: Partial<ParameterVector> = {}): ParameterVector {
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

const TEST_SEED = 'test-seed-deterministic';

describe('generatePalette', () => {
  describe('palette size', () => {
    it('produces 3 colors with paletteSize=0', () => {
      const result = generatePalette(makeParams({ paletteSize: 0 }), TEST_SEED);
      expect(result.count).toBe(3);
      expect(result.dark).toHaveLength(3);
      expect(result.light).toHaveLength(3);
    });

    it('produces 8 colors with paletteSize=1', () => {
      const result = generatePalette(makeParams({ paletteSize: 1 }), TEST_SEED);
      expect(result.count).toBe(8);
      expect(result.dark).toHaveLength(8);
      expect(result.light).toHaveLength(8);
    });

    it('produces 5-6 colors with paletteSize=0.5', () => {
      const result = generatePalette(makeParams({ paletteSize: 0.5 }), TEST_SEED);
      expect(result.count).toBeGreaterThanOrEqual(5);
      expect(result.count).toBeLessThanOrEqual(6);
    });
  });

  describe('color validity', () => {
    it('all colors are valid OKLCH', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      for (const color of [...result.dark, ...result.light]) {
        expect(color.oklch.mode).toBe('oklch');
        expect(color.oklch.l).toBeGreaterThanOrEqual(0);
        expect(color.oklch.l).toBeLessThanOrEqual(1);
        expect(color.oklch.c).toBeGreaterThan(0);
        expect(color.oklch.h).toBeGreaterThanOrEqual(0);
        expect(color.oklch.h).toBeLessThan(360);
      }
    });

    it('all colors have gamut-mapped sRGB hex representations', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      for (const color of [...result.dark, ...result.light]) {
        // Hex should be valid format
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
        // CSS should be oklch() format
        expect(color.css).toContain('oklch');
      }
    });

    it('gamut-mapped colors have RGB values in [0, 1]', () => {
      const result = generatePalette(makeParams({ saturation: 1 }), TEST_SEED);
      for (const color of [...result.dark, ...result.light]) {
        const rgb = toRgb(color.oklch);
        if (rgb) {
          // After gamut mapping, RGB should be in valid range
          // Allow small floating point errors
          expect(rgb.r).toBeGreaterThanOrEqual(-0.001);
          expect(rgb.r).toBeLessThanOrEqual(1.001);
          expect(rgb.g).toBeGreaterThanOrEqual(-0.001);
          expect(rgb.g).toBeLessThanOrEqual(1.001);
          expect(rgb.b).toBeGreaterThanOrEqual(-0.001);
          expect(rgb.b).toBeLessThanOrEqual(1.001);
        }
      }
    });
  });

  describe('parameter mapping', () => {
    it('warmth=0 produces cool blue-ish base hue', () => {
      const result = generatePalette(makeParams({ warmth: 0, paletteSize: 0 }), TEST_SEED);
      // First dark color should have a cool hue (around 200-260)
      const h = result.dark[0].oklch.h;
      expect(h).toBeGreaterThanOrEqual(180);
      expect(h).toBeLessThanOrEqual(280);
    });

    it('warmth=1 produces warm orange/red base hue', () => {
      const result = generatePalette(makeParams({ warmth: 1, paletteSize: 0 }), TEST_SEED);
      // First dark color should have a warm hue (around 0-60 or 330-360)
      const h = result.dark[0].oklch.h;
      const isWarm = (h >= 0 && h <= 70) || (h >= 330 && h < 360);
      expect(isWarm).toBe(true);
    });

    it('saturation=0 produces low chroma with floor', () => {
      const result = generatePalette(makeParams({ saturation: 0 }), TEST_SEED);
      for (const color of result.dark) {
        // Chroma floor is 0.05, should never go below
        expect(color.oklch.c).toBeGreaterThanOrEqual(0.04); // allow tiny float error
      }
    });

    it('saturation=1 produces high chroma', () => {
      const result = generatePalette(makeParams({ saturation: 1 }), TEST_SEED);
      // At least some colors should have high chroma
      const maxChroma = Math.max(...result.dark.map((c) => c.oklch.c));
      expect(maxChroma).toBeGreaterThanOrEqual(0.20);
    });

    it('never produces fully gray colors (chroma floor per COLOR-04)', () => {
      const result = generatePalette(makeParams({ saturation: 0 }), TEST_SEED);
      for (const color of [...result.dark, ...result.light]) {
        expect(color.oklch.c).toBeGreaterThan(0);
      }
    });
  });

  describe('dominant color', () => {
    it('first color has highest chroma in palette', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      // Check dark mode palette
      const firstChroma = result.dark[0].oklch.c;
      for (let i = 1; i < result.dark.length; i++) {
        expect(firstChroma).toBeGreaterThanOrEqual(result.dark[i].oklch.c);
      }
    });
  });

  describe('contrast requirements', () => {
    it('all dark mode colors have WCAG contrast >= 3.0 against dark background', () => {
      const darkBg = { mode: 'oklch' as const, l: 0.09, c: 0.005, h: 250 };
      const result = generatePalette(makeParams(), TEST_SEED);
      for (const color of result.dark) {
        const ratio = wcagContrast(toRgb(color.oklch)!, toRgb(darkBg)!);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      }
    });

    it('all light mode colors have WCAG contrast >= 3.0 against white background', () => {
      const lightBg = { mode: 'oklch' as const, l: 1.0, c: 0, h: 0 };
      const result = generatePalette(makeParams(), TEST_SEED);
      for (const color of result.light) {
        const ratio = wcagContrast(toRgb(color.oklch)!, toRgb(lightBg)!);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      }
    });
  });

  describe('near-duplicate rejection', () => {
    it('no two palette colors have deltaE < 10 in LAB space', () => {
      const result = generatePalette(makeParams({ paletteSize: 1 }), TEST_SEED);
      const darkColors = result.dark;
      for (let i = 0; i < darkColors.length; i++) {
        for (let j = i + 1; j < darkColors.length; j++) {
          const lab1 = toLab(darkColors[i].oklch);
          const lab2 = toLab(darkColors[j].oklch);
          if (lab1 && lab2) {
            const distance = deltaE(lab1, lab2);
            expect(distance).toBeGreaterThanOrEqual(10);
          }
        }
      }
    });
  });

  describe('dual mode palettes', () => {
    it('returns both dark and light mode versions', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      expect(result.dark).toBeDefined();
      expect(result.light).toBeDefined();
      expect(result.dark.length).toBe(result.light.length);
    });

    it('dark and light mode colors share same hue', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      for (let i = 0; i < result.dark.length; i++) {
        const darkHue = result.dark[i].oklch.h;
        const lightHue = result.light[i].oklch.h;
        // Hues should be the same (both derived from same base)
        expect(Math.abs(darkHue - lightHue)).toBeLessThan(1);
      }
    });

    it('dark and light mode colors share same chroma (within gamut-mapping tolerance)', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      for (let i = 0; i < result.dark.length; i++) {
        // Gamut mapping (clampChroma) at different lightness levels may
        // slightly adjust chroma, so we use a broader tolerance.
        // The intent is that the same base chroma is used for both modes.
        expect(result.dark[i].oklch.c).toBeCloseTo(result.light[i].oklch.c, 1);
      }
    });

    it('dark and light mode colors have different lightness', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      let hasDifferentLightness = false;
      for (let i = 0; i < result.dark.length; i++) {
        if (Math.abs(result.dark[i].oklch.l - result.light[i].oklch.l) > 0.01) {
          hasDifferentLightness = true;
          break;
        }
      }
      expect(hasDifferentLightness).toBe(true);
    });
  });

  describe('harmony selection', () => {
    it('includes harmony type in result', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      expect(['analogous', 'complementary', 'triadic', 'split-complementary']).toContain(
        result.harmony,
      );
    });

    it('high symmetry + low contrast produces analogous harmony', () => {
      const result = generatePalette(
        makeParams({ symmetry: 0.8, contrast: 0.2, energy: 0.5 }),
        TEST_SEED,
      );
      expect(result.harmony).toBe('analogous');
    });

    it('high contrast + high energy produces complementary harmony', () => {
      const result = generatePalette(
        makeParams({ symmetry: 0.3, contrast: 0.8, energy: 0.8 }),
        TEST_SEED,
      );
      expect(result.harmony).toBe('complementary');
    });
  });

  describe('determinism', () => {
    it('same parameters + same seed always produces identical palette', () => {
      const params = makeParams();
      const result1 = generatePalette(params, TEST_SEED);
      const result2 = generatePalette(params, TEST_SEED);

      expect(result1.count).toBe(result2.count);
      expect(result1.harmony).toBe(result2.harmony);

      for (let i = 0; i < result1.dark.length; i++) {
        expect(result1.dark[i].hex).toBe(result2.dark[i].hex);
        expect(result1.light[i].hex).toBe(result2.light[i].hex);
        expect(result1.dark[i].oklch.l).toBeCloseTo(result2.dark[i].oklch.l, 10);
        expect(result1.dark[i].oklch.c).toBeCloseTo(result2.dark[i].oklch.c, 10);
        expect(result1.dark[i].oklch.h).toBeCloseTo(result2.dark[i].oklch.h, 10);
      }
    });

    it('different seeds produce different palettes', () => {
      const params = makeParams();
      const result1 = generatePalette(params, 'seed-a');
      const result2 = generatePalette(params, 'seed-b');

      // At least some colors should differ
      let hasDifference = false;
      for (let i = 0; i < result1.dark.length; i++) {
        if (result1.dark[i].hex !== result2.dark[i].hex) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });
  });

  describe('PaletteResult structure', () => {
    it('has correct shape', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      expect(result).toHaveProperty('dark');
      expect(result).toHaveProperty('light');
      expect(result).toHaveProperty('harmony');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('familyId');
      expect(result).toHaveProperty('familyName');
      expect(result).toHaveProperty('familyDescriptor');
      expect(result).toHaveProperty('selectionKey');
      expect(result).toHaveProperty('selectionVector');
    });

    it('PaletteColor has oklch, hex, and css', () => {
      const result = generatePalette(makeParams(), TEST_SEED);
      const color = result.dark[0];
      expect(color).toHaveProperty('oklch');
      expect(color).toHaveProperty('hex');
      expect(color).toHaveProperty('css');
      expect(color.oklch).toHaveProperty('mode');
      expect(color.oklch).toHaveProperty('l');
      expect(color.oklch).toHaveProperty('c');
      expect(color.oklch).toHaveProperty('h');
    });
  });
});
