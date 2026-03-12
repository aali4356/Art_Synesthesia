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

const originalGetContext = HTMLCanvasElement.prototype.getContext;
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
  deriveSeed: vi.fn().mockResolvedValue('proof-seed'),
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
    layers: 3,
    octaves: 4,
    dominantDirection: 0.75,
    expressiveness: {
      atmosphericRichness: 0.79,
      densityLift: 0.66,
      layeringDepth: 0.72,
      directionalDrama: 0.61,
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
      densityLift: 0.71,
      hierarchyLift: 0.83,
      rotationFreedom: 0.58,
      fontVariety: 0.69,
      placementBiasX: 0.52,
      placementBiasY: 0.46,
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

const urlResult = {
  vector: textResult.vector,
  provenance: [],
  palette: {
    dark: [],
    light: [],
    familyId: 'lagoon-mist',
    harmony: 'analogous',
    mapping: {
      mood: 'calm',
      temperatureBias: 'cool',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'muted',
      contrastPosture: 'soft',
      harmony: 'analogous',
      familyId: 'lagoon-mist',
      anchorHue: 204,
    },
  },
  summaries: {},
  canonical: 'https://example.com/proof',
  title: 'Example Proof Page',
  metadata: { linkCount: 12, imageCount: 4, dominantColors: ['#225577'] },
};

const dataResult = {
  vector: textResult.vector,
  provenance: [],
  palette: {
    dark: [],
    light: [],
    familyId: 'solar-flare',
    harmony: 'complementary',
    mapping: {
      mood: 'cinematic',
      temperatureBias: 'hot',
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: 'vivid',
      contrastPosture: 'bold',
      harmony: 'complementary',
      familyId: 'solar-flare',
      anchorHue: 28,
    },
  },
  summaries: {},
  canonical: 'data-proof-canonical',
  format: 'csv' as const,
  rowCount: 3,
  columnCount: 2,
};

const textState = { stage: 'idle', result: null as typeof textResult | null, generate: textGenerate, reset: textReset };
const urlState = {
  stage: 'idle',
  result: null as typeof urlResult | null,
  error: null as string | null,
  remainingQuota: 8,
  generate: urlGenerate,
  reset: urlReset,
};
const dataState = {
  stage: 'idle',
  result: null as typeof dataResult | null,
  error: null as string | null,
  generate: dataGenerate,
  reset: dataReset,
};

vi.mock('@/hooks/useTextAnalysis', () => ({ useTextAnalysis: () => textState }));
vi.mock('@/hooks/useUrlAnalysis', () => ({ useUrlAnalysis: () => urlState }));
vi.mock('@/hooks/useDataAnalysis', () => ({ useDataAnalysis: () => dataState }));

import Home from '@/app/page';

describe('S04 live art proof contract — app flow acceptance', () => {
  beforeEach(() => {
    cleanup();
    HTMLCanvasElement.prototype.getContext = (HTMLCanvasElement.prototype.getContext ?? originalGetContext);
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

  it('defines proof coverage for text, URL, and data flows with supported-style state at the live result surface', async () => {
    const { rerender } = render(<Home />);

    fireEvent.change(screen.getByLabelText('Text input for artwork generation'), {
      target: { value: 'Cathedral brass and midnight rain' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(textGenerate).toHaveBeenCalledWith('Cathedral brass and midnight rain');

    textState.stage = 'complete';
    textState.result = textResult;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Cathedral brass and midnight rain')).toBeDefined();
    });

    expect(screen.getByRole('tab', { name: 'Typographic' }).getAttribute('aria-disabled')).toBe('false');
    expect(screen.getByRole('tab', { name: 'Organic' })).toBeDefined();
    expect(screen.getByText('proof source')).toBeDefined();
    expect(screen.getByText('text')).toBeDefined();
    expect(screen.getByText('palette family')).toBeDefined();
    expect(screen.getByText('orchid-nocturne')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /new input/i }));
    expect(textReset).toHaveBeenCalled();
    expect(urlReset).toHaveBeenCalled();
    expect(dataReset).toHaveBeenCalled();

    textState.result = null;
    textState.stage = 'idle';
    rerender(<Home />);

    fireEvent.click(screen.getByRole('tab', { name: 'URL' }));
    fireEvent.change(screen.getByLabelText('URL input for artwork generation'), {
      target: { value: 'https://example.com/proof' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(urlGenerate).toHaveBeenCalledWith('https://example.com/proof', 'snapshot');

    urlState.stage = 'complete';
    urlState.result = urlResult;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('https://example.com/proof')).toBeDefined();
    });

    expect(screen.getByText('url')).toBeDefined();
    expect(screen.getByText('lagoon-mist')).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Typographic' }).getAttribute('aria-disabled')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: /new input/i }));
    urlState.result = null;
    urlState.stage = 'idle';
    rerender(<Home />);

    fireEvent.click(screen.getByRole('tab', { name: 'Data' }));
    fireEvent.change(screen.getByLabelText('Paste CSV or JSON data'), {
      target: { value: 'region,sales\nNorth,42\nSouth,18' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Analyze' })[0]);
    expect(dataGenerate).toHaveBeenCalledWith('region,sales\nNorth,42\nSouth,18', 'auto');

    dataState.stage = 'complete';
    dataState.result = dataResult;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('CSV data (3 rows × 2 columns)')).toBeDefined();
    });

    const typographicTab = screen.getByRole('tab', { name: 'Typographic' });
    expect(typographicTab.getAttribute('aria-disabled')).toBe('true');
    expect(typographicTab.getAttribute('data-disabled')).toBe('true');
    expect(screen.getByText('data')).toBeDefined();
    expect(screen.getByText('solar-flare')).toBeDefined();
    expect(screen.getByText('supported styles')).toBeDefined();
    expect(screen.getByText('typographic unavailable for data inputs')).toBeDefined();
  });
});
