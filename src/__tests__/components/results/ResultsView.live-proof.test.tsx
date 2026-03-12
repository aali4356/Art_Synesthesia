import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
  scale: vi.fn(),
  drawImage: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}));

vi.mock('@/components/results/GeometricCanvas', () => ({
  GeometricCanvas: () => <canvas data-testid="geometric-canvas" />,
}));
vi.mock('@/components/results/OrganicCanvas', () => ({
  OrganicCanvas: () => <canvas data-testid="organic-canvas" />,
}));
vi.mock('@/components/results/ParticleCanvas', () => ({
  ParticleCanvas: () => <canvas data-testid="particle-canvas" />,
}));
vi.mock('@/components/results/TypographicCanvas', () => ({
  TypographicCanvas: () => <canvas data-testid="typographic-canvas" />,
}));
vi.mock('@/components/results/ParameterPanel', () => ({
  ParameterPanel: () => <div data-testid="parameter-panel" />,
}));
vi.mock('@/components/results/ShareButton', () => ({
  ShareButton: () => <button type="button">Share</button>,
}));
vi.mock('@/components/results/ExportControls', () => ({
  ExportControls: () => <div data-testid="export-controls" />,
}));
vi.mock('@/components/gallery/GallerySaveModal', () => ({
  GallerySaveModal: () => <div data-testid="gallery-save-modal" />,
}));
vi.mock('@/lib/engine/prng', () => ({
  deriveSeed: vi.fn().mockResolvedValue('results-proof-seed'),
}));
vi.mock('@/lib/render/geometric', () => ({
  buildSceneGraph: vi.fn().mockReturnValue({ style: 'geometric', width: 800, height: 800, elements: [] }),
  drawSceneComplete: vi.fn(),
}));
vi.mock('@/lib/render/organic', () => ({
  drawOrganicSceneComplete: vi.fn(),
  buildOrganicSceneGraph: vi.fn().mockReturnValue({
    style: 'organic',
    width: 800,
    height: 800,
    curves: [],
    gradientStops: [],
    layers: 4,
    octaves: 5,
    dominantDirection: 1.2,
    expressiveness: {
      atmosphericRichness: 0.84,
      densityLift: 0.68,
      layeringDepth: 0.77,
      directionalDrama: 0.72,
    },
  }),
}));
vi.mock('@/lib/render/particle', () => ({
  drawParticleSceneComplete: vi.fn(),
  buildParticleSceneGraph: vi.fn().mockReturnValue({
    style: 'particle',
    width: 800,
    height: 800,
    particles: [],
    connections: [],
    clusters: [],
  }),
}));
vi.mock('@/lib/render/typographic', () => ({
  drawTypographicSceneComplete: vi.fn(),
  buildTypographicSceneGraph: vi.fn().mockReturnValue({
    style: 'typographic',
    width: 800,
    height: 800,
    words: [],
    expressiveness: {
      densityLift: 0.76,
      hierarchyLift: 0.88,
      rotationFreedom: 0.61,
      fontVariety: 0.73,
      placementBiasX: 0.57,
      placementBiasY: 0.41,
    },
  }),
}));

import { ResultsView } from '@/components/results/ResultsView';

const result = {
  vector: {
    complexity: 0.72,
    symmetry: 0.41,
    density: 0.67,
    curvature: 0.7,
    texture: 0.56,
    scaleVariation: 0.63,
    rhythm: 0.55,
    regularity: 0.34,
    directionality: 0.74,
    layering: 0.78,
    energy: 0.66,
    warmth: 0.45,
    saturation: 0.71,
    contrast: 0.8,
    paletteSize: 0.6,
  },
  provenance: [],
  palette: {
    dark: [],
    light: [],
    familyId: 'ember-cascade',
    harmony: 'complementary',
    mapping: {
      mood: 'cinematic',
      temperatureBias: 'hot',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'vivid',
      contrastPosture: 'bold',
      harmony: 'complementary',
      familyId: 'ember-cascade',
      anchorHue: 24,
    },
  },
  summaries: {},
  canonical: 'results-view-proof',
  changes: [],
};

describe('S04 live art proof contract — ResultsView metadata seam', () => {
  it('requires a stable acceptance metadata surface for palette mapping and renderer expressiveness without exposing raw input', async () => {
    render(
      <ResultsView
        result={result}
        inputText="Private launch memo about confidential findings"
        onRegenerate={vi.fn()}
        stage="complete"
        inputType="text"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('proof diagnostics')).toBeDefined();
    });

    expect(screen.getByText('palette family')).toBeDefined();
    expect(screen.getByText('ember-cascade')).toBeDefined();
    expect(screen.getByText('mapping posture')).toBeDefined();
    expect(screen.getByText('cinematic · vivid · bold')).toBeDefined();
    expect(screen.getByText('renderer expressiveness')).toBeDefined();
    expect(screen.getByText('organic.atmosphericRichness')).toBeDefined();
    expect(screen.getByText('0.84')).toBeDefined();
    expect(screen.getByText('typographic.hierarchyLift')).toBeDefined();
    expect(screen.getByText('0.88')).toBeDefined();
    expect(screen.getByText('active style')).toBeDefined();
    expect(screen.getByText('geometric')).toBeDefined();
    expect(screen.getByText('derived diagnostics only — raw input hidden')).toBeDefined();

    expect(screen.queryByText(/Private launch memo about confidential findings/)).toBeNull();
    expect(screen.queryByText('canonical')).toBeNull();
  });
});
