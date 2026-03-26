'use client';

import { useState, useCallback } from 'react';
import { InputTabs } from './InputTabs';
import type { TabKey } from './InputTabs';
import { TextInput } from './TextInput';
import { UrlInput } from './UrlInput';
import { DataInput } from './DataInput';
import { GenerateButton } from './GenerateButton';

export type VisitorMode = 'loading' | 'first-visit' | 'returning' | 'resumed';

interface InputZoneProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  isGenerating: boolean;
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyzeUrl: (mode: 'snapshot' | 'live') => void;
  isAnalyzingUrl: boolean;
  urlError: string | null;
  urlRemainingQuota: number | null;
  data: string;
  onDataChange: (data: string, hint: 'csv' | 'json' | 'auto') => void;
  onAnalyzeData: () => void;
  isAnalyzingData: boolean;
  dataError: string | null;
  dataFormatHint: 'csv' | 'json' | 'auto';
  visitorMode?: VisitorMode;
}

export function InputZone({
  text,
  onTextChange,
  onGenerate,
  isPrivate,
  onTogglePrivate,
  isGenerating,
  url,
  onUrlChange,
  onAnalyzeUrl,
  isAnalyzingUrl,
  urlError,
  urlRemainingQuota,
  data,
  onDataChange,
  onAnalyzeData,
  isAnalyzingData,
  dataError,
  dataFormatHint,
  visitorMode = 'first-visit',
}: InputZoneProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('text');

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const tabNarrative = {
    text: {
      eyebrow: 'Text atelier',
      title: 'Compose from language',
      body: 'Paste a phrase, memo, poem, or note. Generate with keyboard shortcuts intact and keep the proof surface private by default.',
    },
    url: {
      eyebrow: 'Reference capture',
      title: 'Analyze a live or snapped link',
      body: 'Bring in a URL when the visual should answer to a published reference. Snapshot and live modes remain truthful about runtime limits.',
    },
    data: {
      eyebrow: 'Dataset studio',
      title: 'Transform tables into visual evidence',
      body: 'Drop CSV or JSON, or paste raw data directly. The same branded surface holds structure, upload cues, and diagnostics.',
    },
  } satisfies Record<TabKey, { eyebrow: string; title: string; body: string }>;

  const visitorNarrative = {
    loading: {
      eyebrow: 'Continuity check',
      title: 'Preparing your start surface',
      body: 'We are checking this browser for saved local editions so the guidance below stays truthful before you begin.',
      privacy: 'Browser-local continuity only. Private-by-default generation keeps raw source off the proof surface.',
      bullets: [
        'Text, URL, and data inputs stay available inside one control surface.',
        'Saved local editions stay on this device and never publish raw source.',
        'Diagnostics stay derived and legible without surfacing source material.',
      ],
    },
    'first-visit': {
      eyebrow: 'Start here',
      title: 'Choose a source and generate your first edition',
      body: 'Begin with text, a reference URL, or structured data. The controls on the right are the full start path—paste, choose a mode, and generate.',
      privacy: 'Private-by-default generation. Raw source stays off the proof surface, and recent local work stays in this browser only when you choose to save it.',
      bullets: [
        'Start with text for the fastest first edition.',
        'Use URL or data tabs when the visual should answer to a live reference or table.',
        'Keyboard submission remains active for text and URL flows.',
      ],
    },
    returning: {
      eyebrow: 'Welcome back',
      title: 'Resume recent local work or start a fresh edition',
      body: 'This browser already has saved private continuity. Reopen a recent edition above, or use the controls on the right to begin something new without losing the private/public boundary.',
      privacy: 'Recent local work stays browser-local to this device. Share links and Gallery saves remain separate public routes and never expose your raw source here.',
      bullets: [
        'Resume from Recent local work when you want to continue from saved edition metadata.',
        'Start fresh from text, URL, or data without adding a new onboarding state.',
        'Diagnostics stay derived and legible without surfacing source material.',
      ],
    },
    resumed: {
      eyebrow: 'Resumed session',
      title: 'Continue from saved local edition metadata',
      body: 'You reopened a browser-local edition. Regenerate from the results surface or head back here to start a fresh source.',
      privacy: 'Resumed local editions recall saved visual metadata only. Raw source stays off the proof surface.',
      bullets: [
        'Recent local work remains private to this browser.',
        'Fresh text, URL, and data inputs stay available when you return to the desk.',
        'Diagnostics stay derived and legible without surfacing source material.',
      ],
    },
  } satisfies Record<VisitorMode, { eyebrow: string; title: string; body: string; privacy: string; bullets: [string, string, string] }>;

  const activeNarrative = tabNarrative[activeTab];
  const activeVisitorNarrative = visitorNarrative[visitorMode];

  return (
    <section className="editorial-panel editorial-control-surface w-full max-w-3xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="editorial-note-label">{activeVisitorNarrative.eyebrow}</p>
            <h2 className="editorial-display text-3xl sm:text-4xl leading-[0.95]">
              {activeVisitorNarrative.title}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              {activeVisitorNarrative.body}
            </p>
          </div>

          <div className="editorial-meta-stack space-y-4">
            <div>
              <p className="editorial-note-label">Current mode</p>
              <p className="text-base text-[var(--foreground)]">{activeNarrative.eyebrow}</p>
            </div>
            <div>
              <p className="editorial-note-label">Source guidance</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {activeNarrative.body}
              </p>
            </div>
            <div>
              <p className="editorial-note-label">Privacy posture</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {activeVisitorNarrative.privacy}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              {activeVisitorNarrative.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <InputTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {activeTab === 'text' && (
            <div className="space-y-4">
              <TextInput
                value={text}
                onChange={onTextChange}
                onSubmit={onGenerate}
                disabled={isGenerating}
              />
              <GenerateButton
                onGenerate={onGenerate}
                isPrivate={isPrivate}
                onTogglePrivate={onTogglePrivate}
                disabled={isGenerating || text.trim().length === 0}
              />
            </div>
          )}

          {activeTab === 'url' && (
            <UrlInput
              url={url}
              onUrlChange={onUrlChange}
              onAnalyze={onAnalyzeUrl}
              disabled={isAnalyzingUrl}
              remainingQuota={urlRemainingQuota}
              error={urlError}
            />
          )}

          {activeTab === 'data' && (
            <DataInput
              data={data}
              onDataChange={onDataChange}
              onAnalyze={onAnalyzeData}
              disabled={isAnalyzingData}
              error={dataError}
              formatHint={dataFormatHint}
            />
          )}
        </div>
      </div>
    </section>
  );
}
