'use client';

import { useState, useCallback } from 'react';
import { InputTabs } from './InputTabs';
import type { TabKey } from './InputTabs';
import { TextInput } from './TextInput';
import { UrlInput } from './UrlInput';
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
    </div>
  );
}
