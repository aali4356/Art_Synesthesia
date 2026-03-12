import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
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

vi.mock('@/components/layout/Shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header" />,
}));

vi.mock('@/components/progress', () => ({
  PipelineProgress: ({ currentStage }: { currentStage: string }) => (
    <div data-testid="pipeline-progress">{currentStage}</div>
  ),
}));

vi.mock('@/components/input', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/input')>();
  return actual;
});

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
  deriveSeed: vi.fn().mockResolvedValue('editorial-proof-seed'),
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
    dominantDirection: 1.1,
    expressiveness: {
      atmosphericRichness: 0.84,
      densityLift: 0.67,
      layeringDepth: 0.78,
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

const textGenerate = vi.fn();
const urlGenerate = vi.fn();
const dataGenerate = vi.fn();
const textReset = vi.fn();
const urlReset = vi.fn();
const dataReset = vi.fn();

const textResult = {
  vector: {
    complexity: 0.78,
    symmetry: 0.36,
    density: 0.68,
    curvature: 0.66,
    texture: 0.57,
    scaleVariation: 0.63,
    rhythm: 0.49,
    regularity: 0.29,
    directionality: 0.71,
    layering: 0.74,
    energy: 0.69,
    warmth: 0.42,
    saturation: 0.73,
    contrast: 0.81,
    paletteSize: 0.61,
  },
  provenance: [],
  palette: {
    dark: [],
    light: [],
    familyId: 'orchid-nocturne',
    harmony: 'triadic',
    mapping: {
      mood: 'dramatic',
      temperatureBias: 'cool',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'lush',
      contrastPosture: 'dramatic',
      harmony: 'triadic',
      familyId: 'orchid-nocturne',
      anchorHue: 314,
    },
  },
  summaries: {},
  canonical: 'text-proof-canonical',
  changes: [],
};

const textState = { stage: 'idle', result: null as typeof textResult | null, generate: textGenerate, reset: textReset };
const urlState = {
  stage: 'idle',
  result: null,
  error: null as string | null,
  remainingQuota: 8,
  generate: urlGenerate,
  reset: urlReset,
};
const dataState = {
  stage: 'idle',
  result: null,
  error: null as string | null,
  generate: dataGenerate,
  reset: dataReset,
};

vi.mock('@/hooks/useTextAnalysis', () => ({ useTextAnalysis: () => textState }));
vi.mock('@/hooks/useUrlAnalysis', () => ({ useUrlAnalysis: () => urlState }));
vi.mock('@/hooks/useDataAnalysis', () => ({ useDataAnalysis: () => dataState }));

import Home from '@/app/page';

describe('S01 editorial homepage proof contract', () => {
  beforeEach(() => {
    cleanup();
    textState.stage = 'idle';
    textState.result = null;
    urlState.stage = 'idle';
    urlState.result = null;
    urlState.error = null;
    dataState.stage = 'idle';
    dataState.result = null;
    dataState.error = null;
    textGenerate.mockReset();
    urlGenerate.mockReset();
    dataGenerate.mockReset();
    textReset.mockReset();
    urlReset.mockReset();
    dataReset.mockReset();
  });

  it('defines branded editorial continuity from landing through results while preserving privacy-safe diagnostics', async () => {
    const { rerender } = render(<Home />);

    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(
      screen.getByText('Editorial chromatic portraits for text, links, and living datasets.')
    ).toBeDefined();
    expect(
      screen.getByText('A launch gallery for language, references, and research artifacts.')
    ).toBeDefined();
    expect(screen.getByText('Choose your source')).toBeDefined();
    expect(screen.getByText('Private-by-default generation. Raw source stays off the proof surface.')).toBeDefined();
    expect(screen.getByText('Curated prompts')).toBeDefined();
    expect(screen.getByRole('button', { name: 'a haiku' })).toBeDefined();

    fireEvent.change(screen.getByLabelText('Text input for artwork generation'), {
      target: { value: 'Cathedral brass and midnight rain' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(textGenerate).toHaveBeenCalledWith('Cathedral brass and midnight rain');

    textState.stage = 'complete';
    textState.result = textResult;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Back to the editorial desk')).toBeDefined();
    });

    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(screen.getByText('Editorial result')).toBeDefined();
    expect(screen.getByText('From source to proof')).toBeDefined();
    expect(screen.getByText('A continuous editorial workspace from intake to render.')).toBeDefined();
    expect(screen.getByText('proof diagnostics')).toBeDefined();
    expect(screen.getByText('derived diagnostics only — raw input hidden')).toBeDefined();
    expect(screen.getByText('palette family')).toBeDefined();
    expect(screen.getByText('orchid-nocturne')).toBeDefined();
    expect(screen.getByText('renderer expressiveness')).toBeDefined();
    expect(screen.getByText('Share')).toBeDefined();
    expect(screen.getByText('Save to Gallery')).toBeDefined();
    expect(screen.queryByText('Cathedral brass and midnight rain')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /back to the editorial desk/i }));
    expect(textReset).toHaveBeenCalled();
    expect(urlReset).toHaveBeenCalled();
    expect(dataReset).toHaveBeenCalled();
  });
});
