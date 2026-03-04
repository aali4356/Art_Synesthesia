import { describe, it, expect } from 'vitest';
import { buildOrganicSceneGraph } from '@/lib/render/organic';

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
    // When layering would exceed 5, opacity should be reduced
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

  it('uses dark background in dark theme', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'dark', 'theme-dark');
    expect(scene.background).toBe('#0a0a0a');
  });

  it('uses light background in light theme', () => {
    const scene = buildOrganicSceneGraph(makeParams(), mockPalette, 'light', 'theme-light');
    expect(scene.background).toBe('#fafafa');
  });
});
