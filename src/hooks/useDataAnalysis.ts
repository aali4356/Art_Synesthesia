'use client';

/**
 * Client-side data analysis pipeline hook.
 *
 * Runs CSV/JSON statistical analysis entirely in the browser -- no server
 * fetch required. Detects format automatically from content prefix, or uses
 * the provided format hint.
 *
 * Pipeline stages: parsing -> analyzing -> normalizing -> rendering -> complete
 */

import { useState, useCallback, useRef } from 'react';
import type { ParameterVector, ParameterProvenance } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';
import { analyzeData } from '@/lib/analysis/data';
import { DATA_MAPPINGS, computeParameterVector } from '@/lib/pipeline/mapping';
import { generateAllSummaries } from '@/lib/pipeline/provenance';
import { generatePalette } from '@/lib/color/palette';
import { sha256 } from '@/lib/engine/hash';
import { loadCorpus, computeCalibrationDistributions } from '@/lib/pipeline/calibration';
import type { CalibrationData } from '@/lib/pipeline/normalize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataFormat = 'csv' | 'json' | 'auto';

export type PipelineStage =
  | 'idle'
  | 'parsing'
  | 'analyzing'
  | 'normalizing'
  | 'rendering'
  | 'complete';

export interface DataPipelineResult {
  vector: ParameterVector;
  provenance: ParameterProvenance[];
  palette: PaletteResult;
  summaries: Record<string, string>;
  canonical: string;
  format: 'csv' | 'json';
  rowCount: number;
  columnCount: number;
}

// ---------------------------------------------------------------------------
// Calibration cache (module-level, computed once)
// ---------------------------------------------------------------------------

let cachedDataCalibration: CalibrationData | null = null;

function getDataCalibration(): CalibrationData {
  if (!cachedDataCalibration) {
    const corpus = loadCorpus();
    cachedDataCalibration = computeCalibrationDistributions(corpus, DATA_MAPPINGS);
  }
  return cachedDataCalibration;
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

function detectFormat(raw: string): 'csv' | 'json' {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  return 'csv';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDataAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<DataPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const generate = useCallback(async (raw: string, hint: DataFormat = 'auto') => {
    abortRef.current = false;
    setError(null);

    try {
      // Stage 1: Parsing
      setStage('parsing');
      const format = hint === 'auto' ? detectFormat(raw) : hint;

      // Stage 2: Analyzing
      setStage('analyzing');
      const signals = analyzeData(raw, format);

      if (abortRef.current) return;

      // Stage 3: Normalizing
      setStage('normalizing');
      const calibration = getDataCalibration();
      const { vector, provenance } = computeParameterVector(signals, calibration, DATA_MAPPINGS);
      const summaries = generateAllSummaries(provenance);

      // Stage 4: Rendering
      setStage('rendering');
      // Canonical: SHA-256 of raw data for deterministic seed
      const canonical = await sha256(raw.trim());
      const palette = generatePalette(vector, canonical);

      if (abortRef.current) return;

      setResult({
        vector,
        provenance,
        palette,
        summaries,
        canonical,
        format,
        rowCount: signals.rowCount,
        columnCount: signals.columnCount,
      });
      setStage('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStage('idle');
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStage('idle');
    setResult(null);
    setError(null);
  }, []);

  return { stage, result, error, generate, reset };
}
