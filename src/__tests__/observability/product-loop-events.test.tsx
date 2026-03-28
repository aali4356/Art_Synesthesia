import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';
import { useUrlAnalysis } from '@/hooks/useUrlAnalysis';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import { useRecentWorks } from '@/hooks/useRecentWorks';
import { ResultsView } from '@/components/results/ResultsView';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';
import { captureClientEvent } from '@/lib/observability/client';

vi.mock('@/lib/observability/client', () => ({
  captureClientEvent: vi.fn(),
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
vi.mock('@/lib/engine/prng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/engine/prng')>();
  return {
    ...actual,
    deriveSeed: vi.fn().mockResolvedValue('product-loop-seed'),
  };
});
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

const baseResult = {
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
    familyName: 'Ember Cascade',
    familyDescriptor: 'dramatic ember family',
    count: 5,
    selectionKey: 'ember-cascade:complementary',
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

function installMatchMediaMock(matches = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function findEventCall(eventName: string, predicate?: (properties: Record<string, unknown>) => boolean) {
  return vi.mocked(captureClientEvent).mock.calls.find(([name, properties]) => {
    if (name !== eventName) {
      return false;
    }

    return predicate ? predicate((properties ?? {}) as Record<string, unknown>) : true;
  });
}

describe('product-loop observability events', () => {
  const originalFetch = global.fetch;
  const originalSetItem = Storage.prototype.setItem;

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    installMatchMediaMock(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
      scale: vi.fn(),
      drawImage: vi.fn(),
    }));
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    Storage.prototype.setItem = originalSetItem;
    global.fetch = originalFetch;
  });

  it('emits started and completed generation events with safe metadata for text, url, and data flows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name === 'X-RateLimit-Remaining' ? '9' : null),
      },
      json: vi.fn().mockResolvedValue({
        signals: {
          lexicalDensity: 0.62,
          sentiment: 0.48,
          complexity: 0.41,
          rhythm: 0.58,
          energy: 0.52,
          warmth: 0.37,
          density: 0.46,
          scaleVariation: 0.44,
          curvature: 0.57,
          saturation: 0.49,
          contrast: 0.55,
          layering: 0.43,
          directionality: 0.51,
          paletteSize: 0.47,
          texture: 0.54,
          regularity: 0.45,
        },
        title: 'Example Domain',
        metadata: {
          linkCount: 12,
          imageCount: 3,
          dominantColors: ['#336699', '#88ccff'],
        },
      }),
    }));

    const textHook = renderHook(() => useTextAnalysis());
    await act(async () => {
      await textHook.result.current.generate('glacial tide murmurs beneath silver clouds');
    });
    await waitFor(() => expect(textHook.result.current.stage).toBe('complete'));

    const urlHook = renderHook(() => useUrlAnalysis());
    await act(async () => {
      await urlHook.result.current.generate('https://Example.com:443/path/?b=2&a=1#frag');
    });
    await waitFor(() => expect(urlHook.result.current.stage).toBe('complete'));

    const dataHook = renderHook(() => useDataAnalysis());
    await act(async () => {
      await dataHook.result.current.generate('quarter,revenue\nQ1,100\nQ2,110', 'csv');
    });
    await waitFor(() => expect(dataHook.result.current.stage).toBe('complete'));

    expect(findEventCall(OBSERVABILITY_EVENTS.generation.started, (properties) => properties.sourceKind === 'text')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.completed, (properties) => properties.sourceKind === 'text' && properties.status === 'completed')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.started, (properties) => properties.sourceKind === 'url' && properties.mode === 'cached')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.completed, (properties) => properties.sourceKind === 'url' && properties.statusBucket === '2xx')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.started, (properties) => properties.sourceKind === 'data' && properties.mode === 'csv')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.completed, (properties) => properties.sourceKind === 'data' && properties.status === 'completed')).toBeDefined();

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('glacial tide murmurs beneath silver clouds');
    expect(serializedCalls).not.toContain('https://example.com/path?a=1&b=2');
    expect(serializedCalls).not.toContain('quarter,revenue');
  });

  it('emits categorized failure events for empty, rate-limited, and unavailable continuity flows without leaking raw content', async () => {
    const textHook = renderHook(() => useTextAnalysis());
    await act(async () => {
      await textHook.result.current.generate('   ');
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: (name: string) => (name === 'X-RateLimit-Remaining' ? '0' : null),
      },
      json: vi.fn().mockResolvedValue({ error: 'Rate limit reached' }),
    }));

    const urlHook = renderHook(() => useUrlAnalysis());
    await act(async () => {
      await urlHook.result.current.generate('https://example.com/private?draft=1');
    });
    await waitFor(() => expect(urlHook.result.current.error).toContain('Rate limit'));

    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const recentWorksHook = renderHook(() => useRecentWorks());
    await waitFor(() => expect(recentWorksHook.result.current.isLoaded).toBe(true));

    let failedSave: ReturnType<typeof recentWorksHook.result.current.saveWork> = null;
    await act(async () => {
      failedSave = recentWorksHook.result.current.saveWork(
        {
          id: 'recent-failure',
          preferredStyle: 'geometric',
          edition: {
            vector: baseResult.vector,
            palette: baseResult.palette,
          },
          source: { kind: 'text' },
        },
        {
          continuityMode: 'fresh',
          sourceKind: 'text',
        }
      );
    });

    expect(failedSave).toBeNull();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.failed, (properties) => properties.sourceKind === 'text' && properties.failureCategory === 'invalid-input')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.generation.failed, (properties) => properties.sourceKind === 'url' && properties.failureCategory === 'rate-limited' && properties.statusBucket === '4xx')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.continuity.failed, (properties) => properties.failureCategory === 'storage-unavailable' && properties.sourceKind === 'text')).toBeDefined();

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('https://example.com/private?draft=1');
    expect(serializedCalls).not.toContain('recent-failure');
  });

  it('tracks recent-local save, resume, and remove actions with continuity-safe metadata only', async () => {
    const { result } = renderHook(() => useRecentWorks());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    let savedRecord: ReturnType<typeof result.current.saveWork> = null;
    await act(async () => {
      savedRecord = result.current.saveWork(
        {
          id: 'recent-text-1',
          preferredStyle: 'organic',
          edition: {
            vector: baseResult.vector,
            palette: baseResult.palette,
          },
          source: { kind: 'text' },
        },
        {
          continuityMode: 'fresh',
          sourceKind: 'text',
        }
      );
    });

    expect(savedRecord?.sourceLabel.primary).toBe('Private text source');

    let reopenedRecord: ReturnType<typeof result.current.reopenWork> = null;
    await act(async () => {
      reopenedRecord = result.current.reopenWork('recent-text-1', { continuityMode: 'resumed' });
    });

    let removed = false;
    await act(async () => {
      removed = result.current.removeWork('recent-text-1', { continuityMode: 'resumed', sourceKind: 'text' });
    });

    expect(reopenedRecord?.id).toBe('recent-text-1');
    expect(removed).toBe(true);
    expect(findEventCall(OBSERVABILITY_EVENTS.continuity.saved, (properties) => properties.action === 'save' && properties.continuityMode === 'fresh' && properties.sourceKind === 'text')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.continuity.resumed, (properties) => properties.action === 'resume' && properties.continuityMode === 'resumed' && properties.sourceKind === 'text')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.continuity.removed, (properties) => properties.action === 'remove' && properties.continuityMode === 'resumed' && properties.sourceKind === 'text')).toBeDefined();

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('sourceText');
    expect(serializedCalls).not.toContain('raw');
  });

  it('keeps results-loop style and save-intent events distinct for fresh and resumed continuity', async () => {
    const onSaveFresh = vi.fn();
    render(
      <ResultsView
        result={baseResult}
        inputText="Private launch memo about confidential findings"
        onRegenerate={vi.fn()}
        stage="complete"
        inputType="text"
        continuityMode="fresh"
        onSaveToRecentLocal={onSaveFresh}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('proof diagnostics')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Organic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save this edition to recent local work' }));

    cleanup();
    const onSaveResumed = vi.fn();
    render(
      <ResultsView
        result={baseResult}
        inputText="Private launch memo about confidential findings"
        onRegenerate={vi.fn()}
        stage="complete"
        inputType="text"
        continuityMode="resumed"
        initialStyle="organic"
        onSaveToRecentLocal={onSaveResumed}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('proof diagnostics')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Particle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save this edition to recent local work' }));

    expect(onSaveFresh).toHaveBeenCalledWith('organic');
    expect(onSaveResumed).toHaveBeenCalledWith('particle');
    expect(findEventCall(OBSERVABILITY_EVENTS.results.styleChanged, (properties) => properties.continuityMode === 'fresh' && properties.styleName === 'organic')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.results.saveIntent, (properties) => properties.continuityMode === 'fresh' && properties.action === 'recent-local-save' && properties.styleName === 'organic')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.results.styleChanged, (properties) => properties.continuityMode === 'resumed' && properties.styleName === 'particle')).toBeDefined();
    expect(findEventCall(OBSERVABILITY_EVENTS.results.saveIntent, (properties) => properties.continuityMode === 'resumed' && properties.action === 'recent-local-save' && properties.styleName === 'particle')).toBeDefined();

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('Private launch memo about confidential findings');
  });
});
