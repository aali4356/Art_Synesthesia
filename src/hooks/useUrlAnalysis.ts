'use client';

import { useState, useCallback, useRef } from 'react';
import type { ParameterVector, ParameterProvenance } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';
import { canonicalizeUrl } from '@/lib/canonicalize/url';
import { URL_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import { generateAllSummaries } from '@/lib/pipeline/provenance';
import { generatePalette } from '@/lib/color/palette';
import { sha256 } from '@/lib/engine/hash';
import { loadCorpus, computeCalibrationDistributions } from '@/lib/pipeline/calibration';
import type { CalibrationData } from '@/lib/pipeline/normalize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UrlMode = 'snapshot' | 'live';

export type PipelineStage =
  | 'idle' | 'parsing' | 'analyzing' | 'normalizing' | 'rendering' | 'complete';

export interface UrlPipelineResult {
  vector: ParameterVector;
  provenance: ParameterProvenance[];
  palette: PaletteResult;
  summaries: Record<string, string>;
  canonical: string;
  title: string;
  metadata: { linkCount: number; imageCount: number; dominantColors: string[] };
}

// ---------------------------------------------------------------------------
// Calibration cache (module-level, computed once)
// ---------------------------------------------------------------------------

let cachedUrlCalibration: CalibrationData | null = null;

function getUrlCalibration(): CalibrationData {
  if (!cachedUrlCalibration) {
    const corpus = loadCorpus();
    // Use URL_MAPPINGS for calibration; corpus entries are text but provide
    // a baseline -- Phase 06-04 expands with URL/data corpus entries
    cachedUrlCalibration = computeCalibrationDistributions(corpus, URL_MAPPINGS);
  }
  return cachedUrlCalibration;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUrlAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<UrlPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const abortRef = useRef(false);

  const generate = useCallback(async (url: string, mode: UrlMode = 'snapshot', refetch = false) => {
    abortRef.current = false;
    setError(null);

    // Stage 1: Parsing
    setStage('parsing');
    let canonical: string;
    try {
      const result = canonicalizeUrl(url);
      canonical = result.canonical;
    } catch {
      setError('Invalid URL. Please enter a valid URL starting with https:// or http://');
      setStage('idle');
      return;
    }

    // Stage 2: Analyzing (server-side)
    setStage('analyzing');
    let signals: Record<string, number>;
    let title = '';
    let metadata: { linkCount: number; imageCount: number; dominantColors: string[] } = {
      linkCount: 0,
      imageCount: 0,
      dominantColors: [],
    };

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canonical, mode, refetch }),
      });

      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining !== null) setRemainingQuota(parseInt(remaining, 10));

      if (response.status === 429) {
        setError('Rate limit reached. You can analyze 10 URLs per hour.');
        setStage('idle');
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError((body as { error?: string }).error ?? `Request failed: ${response.status}`);
        setStage('idle');
        return;
      }

      const data = await response.json() as {
        signals: Record<string, number>;
        title?: string;
        metadata?: { linkCount: number; imageCount: number; dominantColors: string[] };
      };
      signals = data.signals;
      title = data.title ?? '';
      metadata = data.metadata ?? metadata;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStage('idle');
      return;
    }

    if (abortRef.current) return;

    // Stage 3: Normalizing
    setStage('normalizing');
    const calibration = getUrlCalibration();
    const { vector, provenance } = computeParameterVector(signals, calibration, URL_MAPPINGS);
    const summaries = generateAllSummaries(provenance);

    // Stage 4: Rendering
    setStage('rendering');
    const seed = await sha256(canonical);
    const palette = generatePalette(vector, seed);

    setResult({ vector, provenance, palette, summaries, canonical, title, metadata });
    setStage('complete');
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStage('idle');
    setResult(null);
    setError(null);
  }, []);

  return { stage, result, error, remainingQuota, generate, reset };
}
