import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { RECENT_WORK_STORAGE_KEY } from '@/lib/continuity/recent-work';

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
  deriveSeed: vi.fn().mockResolvedValue('continuity-proof-seed'),
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
    familyName: 'Orchid Nocturne',
    familyDescriptor: 'dramatic violet-neon family',
    count: 5,
    selectionKey: 'orchid-nocturne:triadic',
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

const textState = {
  stage: 'idle',
  result: null as typeof textResult | null,
  generate: textGenerate,
  reset: textReset,
};
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

describe('anonymous continuity seam', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
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

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('shows a branded empty continuity state when this browser has no saved local work', async () => {
    render(<Home />);

    expect(screen.getByText('Recent local work')).toBeDefined();
    expect(screen.getByText('Reopen private browser-local editions from this device.')).toBeDefined();
    expect(screen.getByText('Private-first browser-local continuity for this device only. Share links are public parameter-only routes, and Gallery saves are public opt-in editions.')).toBeDefined();
    expect(screen.getByText('No recent local work saved in this browser yet.')).toBeDefined();
    expect(screen.getByText('no raw source stored')).toBeDefined();
  });

  it('saves from results, survives a reload-like rerender, and resumes the saved edition from homepage continuity', async () => {
    const { rerender, unmount } = render(<Home />);

    textState.stage = 'complete';
    textState.result = textResult;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Collect, export, or share this edition.')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Organic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save this edition to recent local work' }));

    await waitFor(() => {
      expect(screen.getByText('Saved to recent local work. Reopen it later from the homepage continuity panel.')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /back to the editorial desk/i }));
    textState.stage = 'idle';
    textState.result = null;
    rerender(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Resume in results')).toBeDefined();
    });

    expect(screen.getByText('Private text source')).toBeDefined();
    expect(screen.getByText('Same-browser continuity only')).toBeDefined();

    unmount();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Resume in results')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resume in results' }));

    await waitFor(() => {
      expect(screen.getByText('Recent local reopen')).toBeDefined();
    });

    expect(screen.getByText('Reopened from browser-local continuity using saved edition metadata only.')).toBeDefined();
    expect(screen.getByText('active style · organic')).toBeDefined();
    expect(screen.getByText('proof diagnostics')).toBeDefined();
    expect(screen.queryByText(/Cathedral brass and midnight rain/)).toBeNull();
  });

  it('falls back to the empty continuity state when recent-work storage is corrupt', async () => {
    localStorage.setItem(RECENT_WORK_STORAGE_KEY, '{not-valid-json');

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No recent local work saved in this browser yet.')).toBeDefined();
    });

    expect(screen.queryByText('Resume in results')).toBeNull();
  });
});
