import { describe, it, expect } from 'vitest';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import type { PaletteResult } from '@/lib/color/palette';

function makeParams(overrides: Record<string, number> = {}) {
  return {
    complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5,
    energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
    saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
    paletteSize: 0.5, texture: 0.5, regularity: 0.5, ...overrides,
  } as any;
}

const mockPalette = {
  dark: [
    { hex: '#7b3dd4' }, { hex: '#d4783d' }, { hex: '#3dd47b' },
  ],
  light: [
    { hex: '#4040a0' }, { hex: '#a04020' }, { hex: '#206040' },
  ],
  harmony: 'triadic',
  count: 3,
} as any;

function makePaletteWithMapping(mappingOverrides: Partial<PaletteResult['mapping']>): PaletteResult {
  return {
    dark: [
      { hex: '#7b3dd4', css: 'oklch(0.62 0.21 300)', oklch: { mode: 'oklch', l: 0.62, c: 0.21, h: 300 } },
      { hex: '#d4783d', css: 'oklch(0.71 0.16 45)', oklch: { mode: 'oklch', l: 0.71, c: 0.16, h: 45 } },
      { hex: '#3dd47b', css: 'oklch(0.74 0.19 155)', oklch: { mode: 'oklch', l: 0.74, c: 0.19, h: 155 } },
    ],
    light: [
      { hex: '#4040a0', css: 'oklch(0.46 0.15 280)', oklch: { mode: 'oklch', l: 0.46, c: 0.15, h: 280 } },
      { hex: '#a04020', css: 'oklch(0.57 0.14 40)', oklch: { mode: 'oklch', l: 0.57, c: 0.14, h: 40 } },
      { hex: '#206040', css: 'oklch(0.43 0.09 160)', oklch: { mode: 'oklch', l: 0.43, c: 0.09, h: 160 } },
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

describe('buildOrganicSceneGraph', () => {
  it('ORGN-01: returns OrganicSceneGraph with correct structure', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'dark', 'test-seed');
    expect(scene.style).toBe('organic');
    expect(Array.isArray(scene.curves)).toBe(true);
    expect(Array.isArray(scene.gradientStops)).toBe(true);
    expect(typeof scene.layers).toBe('number');
    expect(scene.width).toBe(800);
    expect(scene.height).toBe(800);
    expect(typeof scene.background).toBe('string');
  });

  it('ORGN-02: octave count is clamped to [2, 6] based on complexity', () => {
    const minScene = buildOrganicSceneGraph(makeParams({ complexity: 0 }), mockPalette, 'dark', 'min');
    expect(minScene.octaves).toBeGreaterThanOrEqual(2);
    expect(minScene.octaves).toBeLessThanOrEqual(6);

    const maxScene = buildOrganicSceneGraph(makeParams({ complexity: 1 }), mockPalette, 'dark', 'max');
    expect(maxScene.octaves).toBeGreaterThanOrEqual(2);
    expect(maxScene.octaves).toBeLessThanOrEqual(6);
  });

  it('ORGN-03: layer count <= 5; opacity reduced when layering param is high', () => {
    const highLayering = buildOrganicSceneGraph(makeParams({ layering: 1.0 }), mockPalette, 'dark', 'layers');
    expect(highLayering.layers).toBeLessThanOrEqual(5);
    for (const curve of highLayering.curves) {
      expect(curve.opacity).toBeGreaterThan(0);
      expect(curve.opacity).toBeLessThanOrEqual(1);
    }
  });

  it('ORGN-04: dominant flow direction is set by directionality parameter', () => {
    const sceneRight = buildOrganicSceneGraph(makeParams({ directionality: 0 }), mockPalette, 'dark', 'dir-right');
    const sceneLeft = buildOrganicSceneGraph(makeParams({ directionality: 0.5 }), mockPalette, 'dark', 'dir-left');
    expect(sceneRight.dominantDirection).not.toBeCloseTo(sceneLeft.dominantDirection, 1);
  });

  it('curves array has at least 1 curve with at least 2 points each', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'dark', 'curves-check');
    expect(scene.curves.length).toBeGreaterThan(0);
    for (const curve of scene.curves) {
      expect(curve.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('gradientStops have valid offset values between 0 and 1', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'dark', 'gradient-check');
    for (const stop of scene.gradientStops) {
      expect(stop.offset).toBeGreaterThanOrEqual(0);
      expect(stop.offset).toBeLessThanOrEqual(1);
    }
  });

  it('ORGN-05: bold vivid mappings produce denser, richer, more directional scenes than soft muted mappings', () => {
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
      mood: 'incandescent surge',
      temperatureBias: 'hot',
      chromaPosture: 'vivid',
      contrastPosture: 'bold',
      harmony: 'complementary',
      familyId: 'solar-flare',
      anchorHue: 28,
    });

    const calmScene = buildOrganicSceneGraph(makeParams(), calmPalette, 'dark', 'mapping-organic');
    const dramaticScene = buildOrganicSceneGraph(makeParams(), dramaticPalette, 'dark', 'mapping-organic');

    expect(calmScene.curves.length).toBeLessThan(dramaticScene.curves.length);
    expect(calmScene.gradientStops.length).toBeLessThan(dramaticScene.gradientStops.length);

    const calmAverageOpacity = calmScene.curves.reduce((sum, curve) => sum + curve.opacity, 0) / calmScene.curves.length;
    const dramaticAverageOpacity = dramaticScene.curves.reduce((sum, curve) => sum + curve.opacity, 0) / dramaticScene.curves.length;
    expect(calmAverageOpacity).toBeLessThan(dramaticAverageOpacity);

    const calmDirectionalStrength = Math.abs(calmScene.dominantDirection);
    const dramaticDirectionalStrength = Math.abs(dramaticScene.dominantDirection);
    expect(calmDirectionalStrength).toBeLessThan(dramaticDirectionalStrength);
  });

  it('uses dark background in dark theme', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'dark', 'theme-dark');
    expect(scene.background).toBe('#0a0a0a');
  });

  it('uses light background in light theme', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'light', 'theme-light');
    expect(scene.background).toBe('#fafafa');
  });
});
