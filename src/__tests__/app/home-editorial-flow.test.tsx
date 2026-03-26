import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('S02 editorial homepage onboarding contract', () => {
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

  it('guides first-time visitors from the landing surface into the existing private-by-default controls', async () => {
    const { rerender } = render(<Home />);

    expect(screen.getByText('First visit')).toBeDefined();
    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(
      screen.getByText(
        'Start with text, a reference URL, or a dataset, then generate your first editorial chromatic portrait from the controls below.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'The homepage is the full start path: choose a source, keep it private by default, and move directly into the existing input controls.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Pick Text for the fastest first edition, or switch to URL/Data when the work should answer to a live reference or table.'
      )
    ).toBeDefined();
    expect(screen.getByText('Choose a source and generate your first edition')).toBeDefined();
    expect(
      screen.getByText(
        'Private-by-default generation. Raw source stays off the proof surface, and recent local work stays in this browser only when you choose to save it.'
      )
    ).toBeDefined();
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
    expect(screen.getByText('Next steps')).toBeDefined();
    expect(screen.getByText('Keep the same edition moving without guessing where each route leads.')).toBeDefined();
    expect(
      screen.getByText(
        'Return Home to start fresh or revisit recent local work, use Compare for side-by-side evaluation, and treat Share or Gallery as explicit public routes rather than browser-local recall.'
      )
    ).toBeDefined();
    expect(screen.getByRole('link', { name: 'Home / Recent local work' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Compare side by side' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Browse public gallery' })).toBeDefined();
    expect(
      screen.getByText(
        'Recent local work stays private to this browser, while Compare and Gallery stay route-based and shareable.'
      )
    ).toBeDefined();
    expect(screen.queryByText('Cathedral brass and midnight rain')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /back to the editorial desk/i }));
    expect(textReset).toHaveBeenCalled();
    expect(urlReset).toHaveBeenCalled();
    expect(dataReset).toHaveBeenCalled();
  });

  it('switches to truthful returning-visitor guidance when this browser already has recent local work', async () => {
    localStorage.setItem(
      RECENT_WORK_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'recent-home-proof',
          contractVersion: 1,
          posture: 'edition-family-recall',
          preferredStyle: 'organic',
          sourceLabel: {
            kind: 'text',
            primary: 'Private text source',
            secondary: 'Same-browser continuity only',
          },
          edition: {
            vector: textResult.vector,
            palette: textResult.palette,
          },
          savedAt: '2026-03-20T12:00:00.000Z',
          lastOpenedAt: '2026-03-21T12:00:00.000Z',
        },
      ])
    );

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Resume a recent local edition from this browser or start a fresh text, URL, or dataset study from the same editorial desk.'
        )
      ).toBeDefined();
    });

    expect(
      screen.getByText(
        'Resume a recent local edition from this browser or start a fresh text, URL, or dataset study from the same editorial desk.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Recent local work above is private to this device only. Share links and Gallery saves remain separate public routes.'
      )
    ).toBeDefined();
    expect(screen.getByText('Resume path')).toBeDefined();
    expect(
      screen.getByText(
        'Reopen a saved local edition from this browser when you want to continue from prior palette and vector metadata.'
      )
    ).toBeDefined();
    expect(screen.getByText('Resume private browser-local editions from this device.')).toBeDefined();
    expect(screen.getByText('Resume in results')).toBeDefined();
    expect(screen.getByText('Resume recent local work or start a fresh edition')).toBeDefined();
    expect(
      screen.getByText(
        'Recent local work stays browser-local to this device. Share links and Gallery saves remain separate public routes and never expose your raw source here.'
      )
    ).toBeDefined();
    expect(screen.queryByText(/Cathedral brass and midnight rain/)).toBeNull();
  });
});
