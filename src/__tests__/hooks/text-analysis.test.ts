import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { buildTypographicSceneGraph } from '@/lib/render/typographic';
import { deriveSeed } from '@/lib/engine/prng';

function installMatchMediaMock() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
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

describe('useTextAnalysis', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installMatchMediaMock();
  });

  it('returns upgraded synesthetic palette diagnostics through the real text pipeline', async () => {
    const { result } = renderHook(() => useTextAnalysis());
    const input = 'glacial tide murmurs beneath silver clouds';

    await act(async () => {
      await result.current.generate(input);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe('complete');
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.palette.mapping).toMatchObject({
      mood: expect.any(String),
      temperatureBias: expect.any(String),
      harmonySource: 'family',
      hueAnchor: 'family-base',
      chromaPosture: expect.any(String),
      contrastPosture: expect.any(String),
      harmony: expect.any(String),
      familyId: expect.any(String),
      anchorHue: expect.any(Number),
    });
    expect(result.current.result?.palette.familyId).toBe(result.current.result?.palette.mapping.familyId);
    expect(result.current.result?.palette.harmony).toBe(result.current.result?.palette.mapping.harmony);
  });

  it('is deterministic for the same canonical text input', async () => {
    const canonicalA = 'Hello world\n';
    const canonicalB = 'Hello world\r\n';

    const first = renderHook(() => useTextAnalysis());
    await act(async () => {
      await first.result.current.generate(canonicalA);
    });
    await waitFor(() => expect(first.result.current.stage).toBe('complete'));

    const second = renderHook(() => useTextAnalysis());
    await act(async () => {
      await second.result.current.generate(canonicalB);
    });
    await waitFor(() => expect(second.result.current.stage).toBe('complete'));

    expect(first.result.current.result?.canonical).toBe(second.result.current.result?.canonical);
    expect(first.result.current.result?.vector).toEqual(second.result.current.result?.vector);
    expect(first.result.current.result?.palette).toEqual(second.result.current.result?.palette);
    expect(first.result.current.result?.palette.mapping).toEqual(second.result.current.result?.palette.mapping);
  });

  it('builds renderer-ready organic and typographic scenes from hook output', async () => {
    const { result } = renderHook(() => useTextAnalysis());
    const input = 'glacial tide murmurs beneath silver clouds';

    await act(async () => {
      await result.current.generate(input);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe('complete');
      expect(result.current.result).not.toBeNull();
    });

    const pipelineResult = result.current.result;
    expect(pipelineResult).not.toBeNull();
    if (!pipelineResult) throw new Error('expected text pipeline result');

    const [organicSeed, typographicSeed] = await Promise.all([
      deriveSeed(pipelineResult.canonical, 'organic', '1.0.0'),
      deriveSeed(pipelineResult.canonical, 'typographic', '1.0.0'),
    ]);

    const organicScene = buildOrganicSceneGraph(
      pipelineResult.vector,
      pipelineResult.palette,
      'dark',
      organicSeed,
    );
    const typographicScene = buildTypographicSceneGraph(
      pipelineResult.vector,
      pipelineResult.palette,
      'dark',
      typographicSeed,
      input,
    );

    expect(organicScene.style).toBe('organic');
    expect(organicScene.curves.length).toBeGreaterThan(0);
    expect(organicScene.expressiveness.densityLift).toBeGreaterThan(0);

    expect(typographicScene.style).toBe('typographic');
    expect(typographicScene.words.length).toBeGreaterThan(0);
    expect(typographicScene.expressiveness.fontVariety).toBeGreaterThan(0);
  });
});
