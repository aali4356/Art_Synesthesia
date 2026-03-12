import { describe, it, expect } from 'vitest';
import { buildTypographicSceneGraph, approximateMeasure } from '@/lib/render/typographic';
import type { PaletteResult } from '@/lib/color/palette';

function mockParams(overrides: Record<string, number> = {}) {
  return {
    complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5,
    energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
    saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
    paletteSize: 0.5, texture: 0.5, regularity: 0.5,
    ...overrides,
  } as any;
}

const mockPalette = {
  dark: [{ hex: '#c0a0ff' }, { hex: '#80c0ff' }, { hex: '#ff80a0' }],
  light: [{ hex: '#4040a0' }, { hex: '#204080' }, { hex: '#803040' }],
} as any;

function makePaletteWithMapping(mappingOverrides: Partial<PaletteResult['mapping']>): PaletteResult {
  return {
    dark: [
      { hex: '#c0a0ff', css: 'oklch(0.77 0.14 300)', oklch: { mode: 'oklch', l: 0.77, c: 0.14, h: 300 } },
      { hex: '#80c0ff', css: 'oklch(0.78 0.11 240)', oklch: { mode: 'oklch', l: 0.78, c: 0.11, h: 240 } },
      { hex: '#ff80a0', css: 'oklch(0.76 0.16 8)', oklch: { mode: 'oklch', l: 0.76, c: 0.16, h: 8 } },
    ],
    light: [
      { hex: '#4040a0', css: 'oklch(0.46 0.14 280)', oklch: { mode: 'oklch', l: 0.46, c: 0.14, h: 280 } },
      { hex: '#204080', css: 'oklch(0.39 0.09 255)', oklch: { mode: 'oklch', l: 0.39, c: 0.09, h: 255 } },
      { hex: '#803040', css: 'oklch(0.44 0.12 15)', oklch: { mode: 'oklch', l: 0.44, c: 0.12, h: 15 } },
    ],
    harmony: 'triadic',
    count: 3,
    familyId: 'test-family',
    familyName: 'Test Family',
    familyDescriptor: 'test family',
    selectionKey: 'test-selection',
    selectionVector: {
      warmth: 0.5,
      energy: 0.5,
      saturation: 0.5,
      contrast: 0.5,
      symmetry: 0.5,
      layering: 0.5,
      texture: 0.5,
    },
    mapping: {
      mood: 'balanced resonance',
      temperatureBias: 'warm',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'balanced',
      contrastPosture: 'balanced',
      harmony: 'triadic',
      familyId: 'test-family',
      anchorHue: 300,
      ...mappingOverrides,
    },
  };
}

const sampleText = 'The quick brown fox jumps over the lazy dog. Exploration and curiosity drive great discoveries.';
const shortText = 'Love';

describe('buildTypographicSceneGraph', () => {
  it('TYPO-01: returns TypographicSceneGraph with correct style and structure', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'dark', 'test-seed', sampleText, 800, approximateMeasure,
    );
    expect(scene.style).toBe('typographic');
    expect(Array.isArray(scene.words)).toBe(true);
    expect(scene.words.length).toBeGreaterThan(0);
    expect(scene.width).toBe(800);
    expect(scene.height).toBe(800);

    for (const w of scene.words) {
      expect(typeof w.text).toBe('string');
      expect(typeof w.x).toBe('number');
      expect(typeof w.y).toBe('number');
      expect(typeof w.fontSize).toBe('number');
      expect(typeof w.fontFamily).toBe('string');
      expect(typeof w.fontWeight).toBe('string');
      expect(typeof w.color).toBe('string');
      expect(typeof w.rotation).toBe('number');
      expect(typeof w.opacity).toBe('number');
      expect(typeof w.isProminent).toBe('boolean');
      expect(w.boundingBox).toBeDefined();
    }
  });

  it('TYPO-02: top 3 prominent words have rotation <= 15 degrees and fontSize >= 16px', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'dark', 'prominent-test', sampleText, 800, approximateMeasure,
    );
    const prominent = scene.words.filter((w) => w.isProminent);
    expect(prominent.length).toBeGreaterThanOrEqual(1);
    for (const w of prominent) {
      expect(Math.abs(w.rotation)).toBeLessThanOrEqual(15);
      expect(w.fontSize).toBeGreaterThanOrEqual(16);
    }
  });

  it('TYPO-03: no more than 30% of words are rotated beyond 10 degrees', () => {
    const scene = buildTypographicSceneGraph(
      mockParams({ complexity: 0.8 }), mockPalette, 'dark', 'rotation-test', sampleText, 800, approximateMeasure,
    );
    const total = scene.words.length;
    const rotated = scene.words.filter((w) => Math.abs(w.rotation) > 10).length;
    expect(rotated / total).toBeLessThanOrEqual(0.31);
  });

  it('TYPO-04: no two full-opacity words overlap', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'dark', 'overlap-test', sampleText, 800, approximateMeasure,
    );
    const fullOpacity = scene.words.filter((w) => w.opacity >= 1.0);
    for (let i = 0; i < fullOpacity.length; i++) {
      for (let j = i + 1; j < fullOpacity.length; j++) {
        const a = fullOpacity[i].boundingBox;
        const b = fullOpacity[j].boundingBox;
        const overlaps = !(
          a.x + a.width < b.x ||
          b.x + b.width < a.x ||
          a.y + a.height < b.y ||
          b.y + b.height < a.y
        );
        expect(overlaps).toBe(false);
      }
    }
  });

  it('TYPO-04: reduced-opacity words have opacity < 0.4', () => {
    const scene = buildTypographicSceneGraph(
      mockParams({ complexity: 1.0 }), mockPalette, 'dark', 'opacity-test', sampleText, 800, approximateMeasure,
    );
    for (const w of scene.words) {
      if (w.opacity < 1.0) {
        expect(w.opacity).toBeLessThan(0.4);
      }
    }
  });

  it('TYPO-05: vivid bold mappings loosen hierarchy and rotation while soft muted mappings stay tighter', () => {
    const calmPalette = makePaletteWithMapping({
      mood: 'calm drift',
      temperatureBias: 'cool',
      chromaPosture: 'muted',
      contrastPosture: 'soft',
      harmony: 'analogous',
      familyId: 'lagoon-mist',
      anchorHue: 205,
    });
    const dramaticPalette = makePaletteWithMapping({
      mood: 'midnight bloom',
      temperatureBias: 'warm',
      chromaPosture: 'lush',
      contrastPosture: 'dramatic',
      harmony: 'triadic',
      familyId: 'orchid-nocturne',
      anchorHue: 314,
    });

    const calmScene = buildTypographicSceneGraph(
      mockParams(), calmPalette, 'dark', 'mapping-typographic', sampleText, 800, approximateMeasure,
    );
    const dramaticScene = buildTypographicSceneGraph(
      mockParams(), dramaticPalette, 'dark', 'mapping-typographic', sampleText, 800, approximateMeasure,
    );

    expect(calmScene.words.length).toBeLessThan(dramaticScene.words.length);

    const calmProminent = calmScene.words.filter((word) => word.isProminent);
    const dramaticProminent = dramaticScene.words.filter((word) => word.isProminent);
    const calmAverageProminentSize = calmProminent.reduce((sum, word) => sum + word.fontSize, 0) / calmProminent.length;
    const dramaticAverageProminentSize = dramaticProminent.reduce((sum, word) => sum + word.fontSize, 0) / dramaticProminent.length;
    expect(calmAverageProminentSize).toBeLessThan(dramaticAverageProminentSize);

    const calmAverageRotation = calmScene.words.reduce((sum, word) => sum + Math.abs(word.rotation), 0) / calmScene.words.length;
    const dramaticAverageRotation = dramaticScene.words.reduce((sum, word) => sum + Math.abs(word.rotation), 0) / dramaticScene.words.length;
    expect(calmAverageRotation).toBeLessThan(dramaticAverageRotation);

    const calmProminentFamilies = new Set(calmProminent.map((word) => word.fontFamily));
    const dramaticProminentFamilies = new Set(dramaticProminent.map((word) => word.fontFamily));
    expect(calmProminentFamilies.size).toBeLessThan(dramaticProminentFamilies.size);
  });

  it('short text (1 word) produces a prominent scene with large font', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'dark', 'short-seed', shortText, 800, approximateMeasure,
    );
    expect(scene.words.length).toBeGreaterThanOrEqual(1);
    const firstWord = scene.words[0];
    expect(firstWord.isProminent).toBe(true);
    expect(firstWord.fontSize).toBeGreaterThan(40);
  });

  it('uses dark background in dark theme', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'dark', 'theme-dark', sampleText, 800, approximateMeasure,
    );
    expect(scene.background).toBe('#0a0a0a');
  });

  it('uses light background in light theme', () => {
    const scene = buildTypographicSceneGraph(
      mockParams(), mockPalette, 'light', 'theme-light', sampleText, 800, approximateMeasure,
    );
    expect(scene.background).toBe('#fafafa');
  });
});
