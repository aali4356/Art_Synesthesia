'use client';

import { useState, useCallback } from 'react';
import { InputTabs } from './InputTabs';
import type { TabKey } from './InputTabs';
import { TextInput } from './TextInput';
import { UrlInput } from './UrlInput';
import { DataInput } from './DataInput';
import { GenerateButton } from './GenerateButton';

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

  const activeNarrative = tabNarrative[activeTab];

  return (
    <section className="editorial-panel editorial-control-surface w-full max-w-3xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="editorial-note-label">Choose your source</p>
            <h2 className="editorial-display text-3xl sm:text-4xl leading-[0.95]">
              {activeNarrative.title}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              {activeNarrative.body}
            </p>
          </div>

          <div className="editorial-meta-stack space-y-4">
            <div>
              <p className="editorial-note-label">Current mode</p>
              <p className="text-base text-[var(--foreground)]">{activeNarrative.eyebrow}</p>
            </div>
            <div>
              <p className="editorial-note-label">Privacy posture</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                Private-by-default generation. Raw source stays off the proof surface.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>• Text, URL, and data inputs stay available inside one control surface.</li>
              <li>• Keyboard submission remains active for text and URL flows.</li>
              <li>• Diagnostics stay derived and legible without surfacing source material.</li>
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
