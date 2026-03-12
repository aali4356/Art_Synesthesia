'use client';

import { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { InputZone, QuickStart } from '@/components/input';
import { ResultsView } from '@/components/results';
import { PipelineProgress } from '@/components/progress';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';
import { useUrlAnalysis } from '@/hooks/useUrlAnalysis';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import type { UrlPipelineResult } from '@/hooks/useUrlAnalysis';
import type { DataPipelineResult } from '@/hooks/useDataAnalysis';
import type { PipelineResult } from '@/hooks/useTextAnalysis';

/** Adapt a UrlPipelineResult to the PipelineResult shape for ResultsView. */
function adaptUrlResult(urlResult: UrlPipelineResult): PipelineResult {
  return {
    vector: urlResult.vector,
    provenance: urlResult.provenance,
    palette: urlResult.palette,
    summaries: urlResult.summaries,
    canonical: urlResult.canonical,
    changes: [],
  };
}

/** Adapt a DataPipelineResult to the PipelineResult shape for ResultsView. */
function adaptDataResult(dataResult: DataPipelineResult): PipelineResult {
  return {
    vector: dataResult.vector,
    provenance: dataResult.provenance,
    palette: dataResult.palette,
    summaries: dataResult.summaries,
    canonical: dataResult.canonical,
    changes: [],
  };
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [dataFormatHint, setDataFormatHint] = useState<'csv' | 'json' | 'auto'>('auto');

  const { stage, result, generate, reset } = useTextAnalysis();
  const {
    stage: urlStage,
    result: urlResult,
    error: urlError,
    remainingQuota,
    generate: generateUrl,
    reset: resetUrl,
  } = useUrlAnalysis();
  const {
    stage: dataStage,
    result: dataResult,
    error: dataError,
    generate: generateData,
    reset: resetData,
  } = useDataAnalysis();

  const hasResult = result !== null || urlResult !== null || dataResult !== null;
  const isGenerating = stage !== 'idle' && stage !== 'complete';
  const isAnalyzingUrl = urlStage !== 'idle' && urlStage !== 'complete';
  const isAnalyzingData = dataStage !== 'idle' && dataStage !== 'complete';

  const handleGenerate = useCallback(() => {
    if (inputText.trim().length > 0) {
      generate(inputText);
    }
  }, [inputText, generate]);

  const handleAnalyzeUrl = useCallback(
    (mode: 'snapshot' | 'live') => {
      if (urlInput.trim().length > 0) {
        generateUrl(urlInput, mode);
      }
    },
    [urlInput, generateUrl]
  );

  const handleDataChange = useCallback(
    (data: string, hint: 'csv' | 'json' | 'auto') => {
      setDataInput(data);
      setDataFormatHint(hint);
    },
    []
  );

  const handleAnalyzeData = useCallback(() => {
    if (dataInput.trim().length > 0) {
      generateData(dataInput, dataFormatHint);
    }
  }, [dataInput, dataFormatHint, generateData]);

  const handleQuickStart = useCallback(
    (text: string) => {
      setInputText(text);
      // Pass text directly to generate (not stale inputText state)
      generate(text);
    },
    [generate]
  );

  const handleRegenerate = useCallback(
    (text: string) => {
      setInputText(text);
      generate(text);
    },
    [generate]
  );

  const handleBack = useCallback(() => {
    reset();
    resetUrl();
    resetData();
  }, [reset, resetUrl, resetData]);

  // Determine the active result and stage for display
  const activeResult =
    result ??
    (urlResult ? adaptUrlResult(urlResult) : null) ??
    (dataResult ? adaptDataResult(dataResult) : null);
  const activeStage =
    dataResult && !result && !urlResult
      ? dataStage
      : urlResult && !result
        ? urlStage
        : stage;
  const activeInputType =
    dataResult && !result && !urlResult ? 'data' : urlResult && !result ? 'url' : 'text';
  // For the CollapsedInput display: show canonical or input text
  const activeInputText =
    dataResult && !result && !urlResult
      ? `${dataResult.format.toUpperCase()} data (${dataResult.rowCount} rows × ${dataResult.columnCount} columns)`
      : urlResult && !result
        ? urlResult.canonical
        : inputText;

  return (
    <Shell>
      {!hasResult ? (
        /* Landing view */
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
          {/* Placeholder for showcase artwork (future phases) */}
          <div className="w-full max-w-lg aspect-square bg-muted rounded-lg" />

          {/* Gallery-placard style tagline */}
          <p className="text-lg font-light tracking-wide text-muted">
            Turn anything into art.
          </p>

          {/* Input zone */}
          <InputZone
            text={inputText}
            onTextChange={setInputText}
            onGenerate={handleGenerate}
            isPrivate={isPrivate}
            onTogglePrivate={() => setIsPrivate(!isPrivate)}
            isGenerating={isGenerating}
            url={urlInput}
            onUrlChange={setUrlInput}
            onAnalyzeUrl={handleAnalyzeUrl}
            isAnalyzingUrl={isAnalyzingUrl}
            urlError={urlError}
            urlRemainingQuota={remainingQuota}
            data={dataInput}
            onDataChange={handleDataChange}
            onAnalyzeData={handleAnalyzeData}
            isAnalyzingData={isAnalyzingData}
            dataError={dataError}
            dataFormatHint={dataFormatHint}
          />

          {/* Quick-start buttons (text tab only) */}
          <div className="w-full max-w-2xl">
            <QuickStart
              onQuickStart={handleQuickStart}
              disabled={isGenerating || isAnalyzingUrl || isAnalyzingData}
            />
          </div>

          {/* Pipeline progress (shown during generation on landing) */}
          {(isGenerating || isAnalyzingUrl || isAnalyzingData) && (
            <div className="w-full max-w-2xl">
              <PipelineProgress currentStage={activeStage} />
            </div>
          )}
        </div>
      ) : (
        /* Results view */
        <div>
          <button
            onClick={handleBack}
            className="btn-ghost text-sm mb-4 flex items-center gap-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 2L4 7L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New input
          </button>
          {activeResult && (
            <>
              {activeInputType === 'text' && inputText ? (
                <p className="font-mono text-sm text-[var(--muted-foreground)] mb-3">
                  {inputText}
                </p>
              ) : null}
              <ResultsView
                result={activeResult}
                inputText={activeInputText}
                onRegenerate={handleRegenerate}
                stage={activeStage}
                inputType={activeInputType}
              />
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
