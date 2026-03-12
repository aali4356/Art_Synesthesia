import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { deriveSeed } from '@/lib/engine/prng';

function csvWithWindowsNewlines() {
  return [
    'quarter,revenue,cost,region',
    'Q1,120,80,North',
    'Q2,140,90,North',
    'Q3,160,100,South',
    'Q4,180,120,South',
  ].join('\r\n');
}

function csvWithUnixNewlines() {
  return [
    'quarter,revenue,cost,region',
    'Q1,120,80,North',
    'Q2,140,90,North',
    'Q3,160,100,South',
    'Q4,180,120,South',
  ].join('\n');
}

describe('useDataAnalysis', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns upgraded synesthetic palette diagnostics through the real data pipeline', async () => {
    const { result } = renderHook(() => useDataAnalysis());

    await act(async () => {
      await result.current.generate(csvWithUnixNewlines(), 'csv');
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
    expect(result.current.result?.format).toBe('csv');
    expect(result.current.result?.rowCount).toBe(4);
    expect(result.current.result?.columnCount).toBe(4);
  });

  it('is deterministic for the same canonical data input', async () => {
    const first = renderHook(() => useDataAnalysis());
    await act(async () => {
      await first.result.current.generate(csvWithUnixNewlines(), 'csv');
    });
    await waitFor(() => expect(first.result.current.stage).toBe('complete'));

    const second = renderHook(() => useDataAnalysis());
    await act(async () => {
      await second.result.current.generate(csvWithWindowsNewlines(), 'csv');
    });
    await waitFor(() => expect(second.result.current.stage).toBe('complete'));

    expect(first.result.current.result?.vector).toEqual(second.result.current.result?.vector);
    expect(first.result.current.result?.palette.familyId).toBe(second.result.current.result?.palette.familyId);
    expect(first.result.current.result?.palette.harmony).toBe(second.result.current.result?.palette.harmony);
    expect(first.result.current.result?.palette.mapping).toEqual(second.result.current.result?.palette.mapping);
  });

  it('keeps organic renderer-ready output available while data inputs remain typographic-ineligible', async () => {
    const { result } = renderHook(() => useDataAnalysis());

    await act(async () => {
      await result.current.generate(csvWithUnixNewlines(), 'csv');
    });

    await waitFor(() => {
      expect(result.current.stage).toBe('complete');
      expect(result.current.result).not.toBeNull();
    });

    const pipelineResult = result.current.result;
    expect(pipelineResult).not.toBeNull();
    if (!pipelineResult) throw new Error('expected data pipeline result');

    const organicSeed = await deriveSeed(pipelineResult.canonical, 'organic', '1.0.0');
    const organicScene = buildOrganicSceneGraph(
      pipelineResult.vector,
      pipelineResult.palette,
      'dark',
      organicSeed,
    );

    expect(organicScene.style).toBe('organic');
    expect(organicScene.curves.length).toBeGreaterThan(0);
    expect(organicScene.expressiveness.layeringDepth).toBeGreaterThan(0);
    expect(pipelineResult.format).toBe('csv');
  });
});
