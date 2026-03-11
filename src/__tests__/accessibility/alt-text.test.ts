import { describe, it, expect } from 'vitest';
import { generateArtworkAltText } from '@/lib/accessibility/alt-text';
import type { ParameterVector } from '@/types/engine';

const vector: ParameterVector = {
  complexity: 0.72,
  warmth: 0.81,
  symmetry: 0.21,
  rhythm: 0.63,
  energy: 0.77,
  density: 0.44,
  scaleVariation: 0.31,
  curvature: 0.68,
  saturation: 0.74,
  contrast: 0.58,
  layering: 0.49,
  directionality: 0.83,
  paletteSize: 0.4,
  texture: 0.52,
  regularity: 0.35,
};

describe('generateArtworkAltText', () => {
  it('creates descriptive alt text for geometric artwork', () => {
    const alt = generateArtworkAltText(vector, 'geometric');
    expect(alt).toContain('Generated geometric artwork');
    expect(alt).toContain('high complexity');
    expect(alt).toContain('moderate density');
    expect(alt).toContain('asymmetric structure');
    expect(alt).toContain('warm palette');
  });

  it('creates style-specific alt text for typographic artwork', () => {
    const alt = generateArtworkAltText(vector, 'typographic');
    expect(alt.startsWith('Generated typographic artwork')).toBe(true);
    expect(alt.endsWith('.')).toBe(true);
  });
});
