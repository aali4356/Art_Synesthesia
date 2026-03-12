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
  const activeInputText =
    dataResult && !result && !urlResult
      ? `${dataResult.format.toUpperCase()} data (${dataResult.rowCount} rows × ${dataResult.columnCount} columns)`
      : urlResult && !result
        ? urlResult.canonical
        : inputText;

  return (
    <Shell>
      {!hasResult ? (
        <section className="editorial-stage editorial-grid min-h-[calc(100vh-9rem)] items-start lg:items-center">
          <div className="space-y-8">
            <div className="editorial-kicker">Edition M003 · private visual synthesis</div>

            <div className="space-y-5 max-w-3xl">
              <h1 className="editorial-display text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
                Synesthesia Machine
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl text-[var(--foreground)]/88 leading-relaxed">
                Editorial chromatic portraits for text, links, and living datasets.
              </p>
              <p className="max-w-xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
                A launch gallery for language, references, and research artifacts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
              <article className="editorial-note-card">
                <span className="editorial-note-label">What it is</span>
                <p>
                  A private-by-default visual engine that turns source material into deterministic,
                  gallery-grade renderings.
                </p>
              </article>
              <article className="editorial-note-card">
                <span className="editorial-note-label">Why it is distinct</span>
                <p>
                  One editorial workspace: intake, progress, proof diagnostics, and artwork stay in
                  the same branded rhythm.
                </p>
              </article>
              <article className="editorial-note-card">
                <span className="editorial-note-label">How to begin</span>
                <p>
                  Choose a source, refine the mode, and generate from the live controls below.
                </p>
              </article>
            </div>

            <div className="editorial-marquee max-w-3xl" aria-hidden="true">
              <span>text essays</span>
              <span>reference URLs</span>
              <span>research tables</span>
              <span>proof-safe diagnostics</span>
            </div>
          </div>

          <div className="space-y-6 lg:pl-6 xl:pl-10">
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

            <div className="editorial-support-panel max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="editorial-note-label">Curated prompts</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                    Start with a known motif, then watch the proof surface inherit the same luxury
                    language as the landing state.
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  keyboard ready · cmd/ctrl + enter
                </p>
              </div>
              <QuickStart
                onQuickStart={handleQuickStart}
                disabled={isGenerating || isAnalyzingUrl || isAnalyzingData}
              />
            </div>

            {(isGenerating || isAnalyzingUrl || isAnalyzingData) && (
              <div className="editorial-support-panel max-w-3xl">
                <p className="editorial-note-label mb-3">Generation progress</p>
                <PipelineProgress currentStage={activeStage} />
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="editorial-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="editorial-note-label">Synesthesia Machine</p>
                <p className="editorial-note-label">Editorial result</p>
                <h1 className="editorial-display text-3xl sm:text-4xl">From source to proof</h1>
                <p className="max-w-2xl text-sm sm:text-base text-[var(--muted-foreground)]">
                  A continuous editorial workspace from intake to render.
                </p>
              </div>
              <button
                onClick={handleBack}
                className="btn-ghost text-sm flex items-center gap-2 justify-start sm:justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M9 2L4 7L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to the editorial desk
              </button>
            </div>
          </div>

          {activeResult && (
            <ResultsView
              result={activeResult}
              inputText={activeInputText}
              onRegenerate={handleRegenerate}
              stage={activeStage}
              inputType={activeInputType}
            />
          )}
        </section>
      )}
    </Shell>
  );
}
