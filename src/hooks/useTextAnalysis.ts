'use client';

import { useState, useCallback, useRef } from 'react';
import type { ParameterVector, ParameterProvenance } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';
import { canonicalizeText } from '@/lib/canonicalize/text';
import { analyzeText } from '@/lib/analysis';
import { loadCorpus, computeCalibrationDistributions } from '@/lib/pipeline/calibration';
import { TEXT_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import { generateAllSummaries } from '@/lib/pipeline/provenance';
import { generatePalette } from '@/lib/color/palette';
import { sha256 } from '@/lib/engine/hash';
import type { CalibrationData } from '@/lib/pipeline/normalize';
import { captureClientEvent } from '@/lib/observability/client';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';
import { classifyObservabilityError } from '@/lib/observability/privacy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'idle'
  | 'parsing'
  | 'analyzing'
  | 'normalizing'
  | 'rendering'
  | 'complete';

export interface PipelineResult {
  vector: ParameterVector;
  provenance: ParameterProvenance[];
  palette: PaletteResult;
  summaries: Record<string, string>;
  canonical: string;
  changes: string[];
}

// ---------------------------------------------------------------------------
// Calibration cache (module-level, computed once)
// ---------------------------------------------------------------------------

let cachedCalibration: CalibrationData | null = null;

function getCalibration(): CalibrationData {
  if (!cachedCalibration) {
    const corpus = loadCorpus();
    cachedCalibration = computeCalibrationDistributions(corpus, TEXT_MAPPINGS);
  }
  return cachedCalibration;
}

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function captureGenerationEvent(properties: Record<string, unknown>) {
  try {
    captureClientEvent(OBSERVABILITY_EVENTS.generation.started, properties);
  } catch {
    // Observability is non-blocking by contract.
  }
}

function captureGenerationFailure(properties: Record<string, unknown>) {
  try {
    captureClientEvent(OBSERVABILITY_EVENTS.generation.failed, properties);
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

// ---------------------------------------------------------------------------
// Minimum delay helper (respects reduced motion)
// ---------------------------------------------------------------------------

function minDelay(ms: number): Promise<void> {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTextAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const abortRef = useRef(false);

  const generate = useCallback(async (text: string) => {
    abortRef.current = false;
    const startedAt = getNow();

    captureGenerationEvent({
      sourceKind: 'text',
      mode: 'standard',
      status: 'started',
    });

    if (text.trim().length === 0) {
      captureGenerationFailure({
        sourceKind: 'text',
        mode: 'standard',
        status: 'failed',
        failureCategory: 'invalid-input',
        durationMs: Math.round(getNow() - startedAt),
      });
      setStage('idle');
      setResult(null);
      return;
    }

    try {
      // Stage 1: Parsing
      setStage('parsing');
      await minDelay(200);
      if (abortRef.current) return;
      const { canonical, changes } = canonicalizeText(text);

      // Stage 2: Analyzing
      setStage('analyzing');
      await minDelay(200);
      if (abortRef.current) return;
      const rawSignals = analyzeText(canonical);

      // Stage 3: Normalizing
      setStage('normalizing');
      await minDelay(200);
      if (abortRef.current) return;
      const calibration = getCalibration();
      const { vector, provenance } = computeParameterVector(rawSignals, calibration, TEXT_MAPPINGS);
      const summaries = generateAllSummaries(provenance);

      // Stage 4: Rendering
      setStage('rendering');
      await minDelay(200);
      if (abortRef.current) return;
      const seed = await sha256(canonical);
      const palette = generatePalette(vector, seed);

      // Complete
      setResult({ vector, provenance, palette, summaries, canonical, changes });
      setStage('complete');

      captureGenerationCompleted({
        sourceKind: 'text',
        mode: 'standard',
        status: 'completed',
        durationMs: Math.round(getNow() - startedAt),
      });
    } catch (error) {
      setStage('idle');
      captureGenerationFailure({
        sourceKind: 'text',
        mode: 'standard',
        status: 'failed',
        failureCategory: classifyObservabilityError(error),
        durationMs: Math.round(getNow() - startedAt),
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStage('idle');
    setResult(null);
  }, []);

  return { stage, result, generate, reset };
}
