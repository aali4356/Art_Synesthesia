'use client';

import { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { InputZone, QuickStart } from '@/components/input';
import { ResultsView } from '@/components/results';
import { RecentLocalWorkPanel } from '@/components/continuity/RecentLocalWorkPanel';
import { PipelineProgress } from '@/components/progress';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';
import { useUrlAnalysis } from '@/hooks/useUrlAnalysis';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import { useRecentWorks } from '@/hooks/useRecentWorks';
import type { UrlPipelineResult } from '@/hooks/useUrlAnalysis';
import type { DataPipelineResult } from '@/hooks/useDataAnalysis';
import type { PipelineResult } from '@/hooks/useTextAnalysis';
import type { RecentWorkRecord, SaveRecentWorkInput } from '@/lib/continuity/types';
import type { StyleName } from '@/lib/render/types';

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

function adaptRecentWorkResult(record: RecentWorkRecord): PipelineResult {
  return {
    vector: record.edition.vector,
    provenance: [],
    palette: record.edition.palette,
    summaries: {},
    canonical: `recent-local-work:${record.id}:${record.savedAt}`,
    changes: ['Resumed from browser-local recent work without replaying the original source.'],
  };
}

function buildRecentWorkInputText(record: RecentWorkRecord): string {
  return [record.sourceLabel.primary, record.sourceLabel.secondary].filter(Boolean).join(' · ');
}

function buildLiveSourceDescriptor(
  urlResult: UrlPipelineResult | null,
  dataResult: DataPipelineResult | null
): SaveRecentWorkInput['source'] {
  if (dataResult) {
    return {
      kind: 'data',
      format: dataResult.format,
      rowCount: dataResult.rowCount,
      columnCount: dataResult.columnCount,
    };
  }

  if (urlResult) {
    try {
      return {
        kind: 'url',
        hostname: new URL(urlResult.canonical).hostname,
      };
    } catch {
      return { kind: 'url' };
    }
  }

  return { kind: 'text' };
}

function buildResumedSourceDescriptor(record: RecentWorkRecord): SaveRecentWorkInput['source'] {
  switch (record.sourceLabel.kind) {
    case 'data':
      return { kind: 'data' };
    case 'url':
      return { kind: 'url' };
    case 'text':
    default:
      return { kind: 'text' };
  }
}

type VisitorMode = 'loading' | 'first-visit' | 'returning' | 'resumed';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [dataFormatHint, setDataFormatHint] = useState<'csv' | 'json' | 'auto'>('auto');
  const [resumedWork, setResumedWork] = useState<RecentWorkRecord | null>(null);

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
  const {
    recentWorks,
    isLoaded: recentWorksLoaded,
    saveState: recentWorkSaveState,
    saveWork,
    reopenWork,
    dismissSaveState,
  } = useRecentWorks();

  const liveResult =
    result ??
    (urlResult ? adaptUrlResult(urlResult) : null) ??
    (dataResult ? adaptDataResult(dataResult) : null);
  const resumedResult = resumedWork ? adaptRecentWorkResult(resumedWork) : null;
  const activeResult = liveResult ?? resumedResult;
  const hasRecentWork = recentWorks.length > 0;
  const visitorMode: VisitorMode = resumedWork
    ? 'resumed'
    : !recentWorksLoaded
      ? 'loading'
      : hasRecentWork
        ? 'returning'
        : 'first-visit';

  const visitorContent = {
    loading: {
      supportLabel: 'Preparing your desk',
      headline: 'Synesthesia Machine',
      body: 'Editorial chromatic portraits for text, links, and living datasets.',
      subcopy: 'Checking this browser for private local continuity before we tell you where to begin.',
      noteCards: [
        {
          label: 'What it is',
          body: 'A private-by-default visual engine that turns source material into deterministic, gallery-grade renderings.',
        },
        {
          label: 'Continuity check',
          body: 'We look for browser-local recent work first so guidance stays truthful without adding a separate onboarding flag.',
        },
        {
          label: 'What happens next',
          body: 'You can start from text, URL, or data as soon as the local continuity state finishes loading.',
        },
      ],
      quickStartLabel: 'Curated prompts',
      quickStartBody:
        'Warm up with a known motif while the same editorial language carries into diagnostics and results.',
    },
    'first-visit': {
      supportLabel: 'First visit',
      headline: 'Synesthesia Machine',
      body: 'Start with text, a reference URL, or a dataset, then generate your first editorial chromatic portrait from the controls below.',
      subcopy: 'The homepage is the full start path: choose a source, keep it private by default, and move directly into the existing input controls.',
      noteCards: [
        {
          label: 'Start here',
          body: 'Pick Text for the fastest first edition, or switch to URL/Data when the work should answer to a live reference or table.',
        },
        {
          label: 'Private by default',
          body: 'Your raw source stays off the proof surface, and browser-local continuity only appears if you choose to save a result on this device.',
        },
        {
          label: 'How to begin',
          body: 'Use the input surface below to paste, choose a mode, and generate without hunting for another route.',
        },
      ],
      quickStartLabel: 'Curated prompts',
      quickStartBody:
        'New here? Start with a motif, then watch the proof surface inherit the same luxury language as the landing state.',
    },
    returning: {
      supportLabel: 'Welcome back',
      headline: 'Synesthesia Machine',
      body: 'Resume a recent local edition from this browser or start a fresh text, URL, or dataset study from the same editorial desk.',
      subcopy: 'Recent local work above is private to this device only. Share links and Gallery saves remain separate public routes.',
      noteCards: [
        {
          label: 'Resume path',
          body: 'Reopen a saved local edition from this browser when you want to continue from prior palette and vector metadata.',
        },
        {
          label: 'Start fresh',
          body: 'The same controls below can begin a new edition immediately without clearing or replacing your saved continuity history.',
        },
        {
          label: 'Privacy boundary',
          body: 'Browser-local continuity never exposes raw source content, while public share and gallery routes stay clearly separate.',
        },
      ],
      quickStartLabel: 'Fresh prompts',
      quickStartBody:
        'Use a prompt chip to spin up a new edition, or resume from Recent local work when you want to pick up where this browser left off.',
    },
    resumed: {
      supportLabel: 'Resumed session',
      headline: 'Synesthesia Machine',
      body: 'Continue from saved local edition metadata or head back to the editorial desk for a fresh source.',
      subcopy: 'Reopened local work stays private to this browser and uses saved edition metadata only.',
      noteCards: [
        {
          label: 'Resumed state',
          body: 'This session was reopened from browser-local continuity without replaying or storing the original source.',
        },
        {
          label: 'Next step',
          body: 'Review the active result, save a new style variant, or return to the desk to start another edition.',
        },
        {
          label: 'Privacy boundary',
          body: 'Raw source remains hidden here, and public share/gallery routes still represent distinct public surfaces.',
        },
      ],
      quickStartLabel: 'Fresh prompts',
      quickStartBody:
        'When you go back to the desk, prompt chips are ready if you want to start a new edition instead of continuing the resumed one.',
    },
  } satisfies Record<VisitorMode, {
    supportLabel: string;
    headline: string;
    body: string;
    subcopy: string;
    noteCards: Array<{ label: string; body: string }>;
    quickStartLabel: string;
    quickStartBody: string;
  }>;

  const activeVisitorContent = visitorContent[visitorMode];

  const hasResult = activeResult !== null;
  const isGenerating = stage !== 'idle' && stage !== 'complete';
  const isAnalyzingUrl = urlStage !== 'idle' && urlStage !== 'complete';
  const isAnalyzingData = dataStage !== 'idle' && dataStage !== 'complete';

  const activeStage = liveResult
    ? dataResult && !result && !urlResult
      ? dataStage
      : urlResult && !result
        ? urlStage
        : stage
    : resumedWork
      ? 'complete'
      : stage;
  const activeInputType = resumedWork
    ? resumedWork.sourceLabel.kind
    : dataResult && !result && !urlResult
      ? 'data'
      : urlResult && !result
        ? 'url'
        : 'text';
  const activeInputText = resumedWork
    ? buildRecentWorkInputText(resumedWork)
    : dataResult && !result && !urlResult
      ? `${dataResult.format.toUpperCase()} data (${dataResult.rowCount} rows × ${dataResult.columnCount} columns)`
      : urlResult && !result
        ? urlResult.canonical
        : inputText;
  const activePreferredStyle = resumedWork?.preferredStyle;

  const clearResumeState = useCallback(() => {
    setResumedWork(null);
    dismissSaveState();
  }, [dismissSaveState]);

  const handleGenerate = useCallback(() => {
    clearResumeState();
    if (inputText.trim().length > 0) {
      generate(inputText);
    }
  }, [clearResumeState, inputText, generate]);

  const handleAnalyzeUrl = useCallback(
    (mode: 'snapshot' | 'live') => {
      clearResumeState();
      if (urlInput.trim().length > 0) {
        generateUrl(urlInput, mode);
      }
    },
    [clearResumeState, urlInput, generateUrl]
  );

  const handleDataChange = useCallback(
    (data: string, hint: 'csv' | 'json' | 'auto') => {
      setDataInput(data);
      setDataFormatHint(hint);
    },
    []
  );

  const handleAnalyzeData = useCallback(() => {
    clearResumeState();
    if (dataInput.trim().length > 0) {
      generateData(dataInput, dataFormatHint);
    }
  }, [clearResumeState, dataInput, dataFormatHint, generateData]);

  const handleQuickStart = useCallback(
    (text: string) => {
      clearResumeState();
      setInputText(text);
      generate(text);
    },
    [clearResumeState, generate]
  );

  const handleRegenerate = useCallback(
    (text: string) => {
      clearResumeState();
      setInputText(text);
      generate(text);
    },
    [clearResumeState, generate]
  );

  const handleBack = useCallback(() => {
    clearResumeState();
    reset();
    resetUrl();
    resetData();
  }, [clearResumeState, reset, resetUrl, resetData]);

  const handleSaveLocal = useCallback(
    (preferredStyle: StyleName) => {
      if (!activeResult) return null;

      const source = resumedWork
        ? buildResumedSourceDescriptor(resumedWork)
        : buildLiveSourceDescriptor(urlResult, dataResult);

      return saveWork({
        id: resumedWork?.id,
        preferredStyle,
        edition: {
          vector: activeResult.vector,
          palette: activeResult.palette,
        },
        source,
      });
    },
    [activeResult, resumedWork, urlResult, dataResult, saveWork]
  );

  const handleResumeRecentWork = useCallback(
    (id: string) => {
      const reopened = reopenWork(id);
      if (!reopened) return;

      dismissSaveState();
      reset();
      resetUrl();
      resetData();
      setResumedWork(reopened);
    },
    [dismissSaveState, reopenWork, reset, resetUrl, resetData]
  );

  return (
    <Shell>
      {!hasResult ? (
        <section className="editorial-stage editorial-grid min-h-[calc(100vh-9rem)] items-start lg:items-center">
          <div className="space-y-8">
            <div className="editorial-kicker">Edition M004 · browser-local continuity</div>

            <div className="space-y-5 max-w-3xl">
              <p className="editorial-note-label">{activeVisitorContent.supportLabel}</p>
              <h1 className="editorial-display text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
                {activeVisitorContent.headline}
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl text-[var(--foreground)]/88 leading-relaxed">
                {activeVisitorContent.body}
              </p>
              <p className="max-w-xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
                {activeVisitorContent.subcopy}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
              {activeVisitorContent.noteCards.map((card) => (
                <article key={card.label} className="editorial-note-card">
                  <span className="editorial-note-label">{card.label}</span>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>

            <div className="editorial-marquee max-w-3xl" aria-hidden="true">
              <span>text essays</span>
              <span>reference URLs</span>
              <span>research tables</span>
              <span>browser-local continuity</span>
            </div>
          </div>

          <div className="space-y-6 lg:pl-6 xl:pl-10">
            <RecentLocalWorkPanel
              items={recentWorks}
              isLoaded={recentWorksLoaded}
              onResume={handleResumeRecentWork}
            />

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
              visitorMode={visitorMode}
            />

            <div className="editorial-support-panel max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="editorial-note-label">{activeVisitorContent.quickStartLabel}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                    {activeVisitorContent.quickStartBody}
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
                <p className="editorial-note-label">
                  {resumedWork ? 'Recent local reopen' : 'Editorial result'}
                </p>
                <h1 className="editorial-display text-3xl sm:text-4xl">From source to proof</h1>
                <p className="max-w-2xl text-sm sm:text-base text-[var(--muted-foreground)]">
                  {resumedWork
                    ? 'Reopened from browser-local continuity using saved edition metadata only.'
                    : 'A continuous editorial workspace from intake to render.'}
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
              initialStyle={activePreferredStyle}
              onSaveToRecentLocal={handleSaveLocal}
              recentLocalSaveState={recentWorkSaveState}
            />
          )}
        </section>
      )}
    </Shell>
  );
}
