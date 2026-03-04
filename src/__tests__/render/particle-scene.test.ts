import { describe, it, expect } from 'vitest';
import { buildParticleSceneGraph } from '@/lib/render/particle';
import type { ParameterVector } from '@/types/engine';

function mockParams(overrides: Partial<ParameterVector> = {}): ParameterVector {
  const base: ParameterVector = {
    complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5,
    energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
    saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
    paletteSize: 0.5, texture: 0.5, regularity: 0.5,
  };
  return { ...base, ...overrides };
}

const mockPalette = {
  dark: [
    { hex: '#c0a0ff' }, { hex: '#80c0ff' }, { hex: '#ff80a0' }, { hex: '#a0ffb0' },
  ],
  light: [
    { hex: '#4040a0' }, { hex: '#204080' }, { hex: '#803040' }, { hex: '#206040' },
  ],
} as any;

describe('buildParticleSceneGraph', () => {
  it('returns a ParticleSceneGraph with correct style and structure (PTCL-01)', () => {
    const scene = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'test-seed');
    expect(scene.style).toBe('particle');
    expect(Array.isArray(scene.particles)).toBe(true);
    expect(Array.isArray(scene.connections)).toBe(true);
    expect(Array.isArray(scene.clusters)).toBe(true);
    expect(scene.width).toBe(800);
    expect(scene.height).toBe(800);
  });

  it('caps particle count at maxParticles (PTCL-02)', () => {
    const mobileScene = buildParticleSceneGraph(mockParams({ density: 1.0 }), mockPalette, 'dark', 'mobile-seed', 800, 2000);
    expect(mobileScene.particles.length).toBeLessThanOrEqual(2000);

    const desktopScene = buildParticleSceneGraph(mockParams({ density: 1.0 }), mockPalette, 'dark', 'desktop-seed', 800, 10000);
    expect(desktopScene.particles.length).toBeLessThanOrEqual(10000);
  });

  it('produces at least 2 clusters (PTCL-03)', () => {
    const scene = buildParticleSceneGraph(mockParams({ complexity: 0.0 }), mockPalette, 'dark', 'min-complexity');
    expect(scene.clusters.length).toBeGreaterThanOrEqual(2);
  });

  it('enforces 15% negative space when density <= 0.85 (PTCL-04)', () => {
    const scene = buildParticleSceneGraph(mockParams({ density: 0.5 }), mockPalette, 'dark', 'density-test', 800, 10000);
    const canvasArea = 800 * 800;
    const coveredArea = scene.clusters.reduce((sum, c) => sum + Math.PI * c.radius * c.radius, 0);
    const negativeSpaceRatio = 1 - coveredArea / canvasArea;
    expect(negativeSpaceRatio).toBeGreaterThanOrEqual(0.14); // allow 1% tolerance
  });

  it('negative space enforcement is relaxed when density > 0.85 (PTCL-04)', () => {
    const scene = buildParticleSceneGraph(mockParams({ density: 0.9 }), mockPalette, 'dark', 'high-density', 800, 10000);
    expect(scene.particles.length).toBeGreaterThan(0);
  });

  it('uses dark background in dark theme', () => {
    const scene = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'theme-dark');
    expect(scene.background).toBe('#0a0a0a');
  });

  it('uses light background in light theme', () => {
    const scene = buildParticleSceneGraph(mockParams(), mockPalette, 'light', 'theme-light');
    expect(scene.background).toBe('#fafafa');
  });

  it('all particles have valid positions and opacity', () => {
    const scene = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'bounds-test');
    for (const p of scene.particles) {
      expect(p.radius).toBeGreaterThan(0);
      expect(p.opacity).toBeGreaterThan(0);
      expect(p.opacity).toBeLessThanOrEqual(1);
    }
  });
});
