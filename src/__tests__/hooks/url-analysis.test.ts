import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUrlAnalysis } from '@/hooks/useUrlAnalysis';

const mockApiPayload = {
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
};

function mockFetchResponse() {
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => (name === 'X-RateLimit-Remaining' ? '9' : null),
    },
    json: vi.fn().mockResolvedValue(mockApiPayload),
  };
}

describe('useUrlAnalysis', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    global.fetch = originalFetch;
  });

  it('returns upgraded synesthetic palette diagnostics through the real URL pipeline', async () => {
    const { result } = renderHook(() => useUrlAnalysis());

    await act(async () => {
      await result.current.generate('https://Example.com:443/path/?b=2&a=1#frag');
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
    expect(result.current.result?.canonical).toBe('https://example.com/path?a=1&b=2');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('is deterministic for the same canonical URL input', async () => {
    const first = renderHook(() => useUrlAnalysis());
    await act(async () => {
      await first.result.current.generate('https://Example.com:443/path/?b=2&a=1#frag');
    });
    await waitFor(() => expect(first.result.current.stage).toBe('complete'));

    const second = renderHook(() => useUrlAnalysis());
    await act(async () => {
      await second.result.current.generate('https://example.com/path?a=1&b=2');
    });

    expect(second.result.current.error).toBeNull();
    expect(second.result.current.stage).toBe('complete');
    expect(first.result.current.result?.canonical).toBe(second.result.current.result?.canonical);
    expect(first.result.current.result?.vector).toEqual(second.result.current.result?.vector);
    expect(first.result.current.result?.palette.familyId).toBe(second.result.current.result?.palette.familyId);
    expect(first.result.current.result?.palette.harmony).toBe(second.result.current.result?.palette.harmony);
    expect(first.result.current.result?.palette.mapping).toEqual(second.result.current.result?.palette.mapping);
  });
});
