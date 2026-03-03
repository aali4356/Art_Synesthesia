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
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStage('idle');
    setResult(null);
  }, []);

  return { stage, result, generate, reset };
}
