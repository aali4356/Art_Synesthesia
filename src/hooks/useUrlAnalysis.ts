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
import { captureClientEvent } from '@/lib/observability/client';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';
import { classifyObservabilityError } from '@/lib/observability/privacy';

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

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function getGenerationMode(mode: UrlMode, refetch: boolean): 'live' | 'cached' | 'standard' {
  if (mode === 'live') {
    return 'live';
  }

  return refetch ? 'standard' : 'cached';
}

function getStatusBucket(status: number): '2xx' | '4xx' | '5xx' {
  if (status >= 500) {
    return '5xx';
  }

  if (status >= 400) {
    return '4xx';
  }

  return '2xx';
}

function captureGenerationStarted(properties: Record<string, unknown>) {
  try {
    captureClientEvent(OBSERVABILITY_EVENTS.generation.started, properties);
  } catch {
    // Observability is non-blocking by contract.
  }
}

function captureGenerationCompleted(properties: Record<string, unknown>) {
  try {
    captureClientEvent(OBSERVABILITY_EVENTS.generation.completed, properties);
  } catch {
    // Observability is non-blocking by contract.
  }
}

function captureGenerationFailed(properties: Record<string, unknown>) {
  try {
    captureClientEvent(OBSERVABILITY_EVENTS.generation.failed, properties);
  } catch {
    // Observability is non-blocking by contract.
  }
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
    const startedAt = getNow();
    const generationMode = getGenerationMode(mode, refetch);

    captureGenerationStarted({
      sourceKind: 'url',
      mode: generationMode,
      status: 'started',
    });

    // Stage 1: Parsing
    setStage('parsing');
    let canonical: string;
    try {
      const result = canonicalizeUrl(url);
      canonical = result.canonical;
    } catch {
      setError('Invalid URL. Please enter a valid URL starting with https:// or http://');
      setStage('idle');
      captureGenerationFailed({
        sourceKind: 'url',
        mode: generationMode,
        status: 'failed',
        failureCategory: 'invalid-input',
        durationMs: Math.round(getNow() - startedAt),
      });
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
        captureGenerationFailed({
          sourceKind: 'url',
          mode: generationMode,
          status: 'failed',
          failureCategory: 'rate-limited',
          statusBucket: '4xx',
          durationMs: Math.round(getNow() - startedAt),
        });
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError((body as { error?: string } | null)?.error ?? `Request failed: ${response.status}`);
        setStage('idle');
        captureGenerationFailed({
          sourceKind: 'url',
          mode: generationMode,
          status: 'failed',
          failureCategory: body ? 'request-failed' : 'malformed-payload',
          statusBucket: getStatusBucket(response.status),
          durationMs: Math.round(getNow() - startedAt),
        });
        return;
      }

      const data = await response.json() as {
        signals?: Record<string, number>;
        title?: string;
        metadata?: { linkCount: number; imageCount: number; dominantColors: string[] };
      };

      if (!data.signals || typeof data.signals !== 'object') {
        setError('URL analysis returned an unexpected response. Please try again.');
        setStage('idle');
        captureGenerationFailed({
          sourceKind: 'url',
          mode: generationMode,
          status: 'failed',
          failureCategory: 'malformed-payload',
          statusBucket: '2xx',
          durationMs: Math.round(getNow() - startedAt),
        });
        return;
      }

      signals = data.signals;
      title = data.title ?? '';
      metadata = data.metadata ?? metadata;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStage('idle');
      captureGenerationFailed({
        sourceKind: 'url',
        mode: generationMode,
        status: 'failed',
        failureCategory: classifyObservabilityError(err),
        statusBucket: classifyObservabilityError(err) === 'timeout' ? 'timeout' : 'network',
        durationMs: Math.round(getNow() - startedAt),
      });
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

    captureGenerationCompleted({
      sourceKind: 'url',
      mode: generationMode,
      status: 'completed',
      statusBucket: '2xx',
      durationMs: Math.round(getNow() - startedAt),
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStage('idle');
    setResult(null);
    setError(null);
  }, []);

  return { stage, result, error, remainingQuota, generate, reset };
}
