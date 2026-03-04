import { describe, it, expect } from 'vitest';
import { buildParticleSceneGraph } from '@/lib/render/particle';

function mockParams() {
  return {
    complexity: 0.6, warmth: 0.4, symmetry: 0.7, rhythm: 0.3,
    energy: 0.8, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
    saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
    paletteSize: 0.5, texture: 0.5, regularity: 0.5,
  } as any;
}

const mockPalette = {
  dark: [{ hex: '#c0a0ff' }, { hex: '#80c0ff' }],
  light: [{ hex: '#4040a0' }, { hex: '#204080' }],
} as any;

describe('particle renderer determinism', () => {
  it('produces identical scene for same inputs (multiple runs)', () => {
    const a = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'det-seed-1');
    const b = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'det-seed-1');

    expect(a.particles.length).toBe(b.particles.length);
    expect(a.clusters.length).toBe(b.clusters.length);
    expect(a.connections.length).toBe(b.connections.length);

    for (let i = 0; i < Math.min(5, a.particles.length); i++) {
      expect(a.particles[i].x).toBeCloseTo(b.particles[i].x, 5);
      expect(a.particles[i].y).toBeCloseTo(b.particles[i].y, 5);
      expect(a.particles[i].radius).toBeCloseTo(b.particles[i].radius, 5);
    }
  });

  it('produces different scenes for different seeds', () => {
    const a = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'seed-A');
    const b = buildParticleSceneGraph(mockParams(), mockPalette, 'dark', 'seed-B');

    const someDiffer = a.particles.some((p, i) =>
      Math.abs(p.x - b.particles[i]?.x) > 1 || Math.abs(p.y - b.particles[i]?.y) > 1
    );
    expect(someDiffer).toBe(true);
  });
});
