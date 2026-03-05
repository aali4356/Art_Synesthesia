'use client';

import { useState, useCallback } from 'react';
import { InputTabs } from './InputTabs';
import type { TabKey } from './InputTabs';
import { TextInput } from './TextInput';
import { UrlInput } from './UrlInput';
import { DataInput } from './DataInput';
import { GenerateButton } from './GenerateButton';

interface InputZoneProps {
  // Text tab props
  text: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  isGenerating: boolean;
  // URL tab props
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyzeUrl: (mode: 'snapshot' | 'live') => void;
  isAnalyzingUrl: boolean;
  urlError: string | null;
  urlRemainingQuota: number | null;
  // Data tab props
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <InputTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'text' && (
        <>
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
          {activeTab === 'text' && (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground mt-2"
              title="Local analysis — your text never leaves your browser"
              aria-label="Local analysis mode: your text never leaves your browser"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3 h-3"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1zm2 5V4.5a2 2 0 1 0-4 0V6h4z"
                  clipRule="evenodd"
                />
              </svg>
              Local only
            </span>
          )}
        </>
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
  );
}
