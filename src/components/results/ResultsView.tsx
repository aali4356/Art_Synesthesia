'use client';

import { useTheme } from 'next-themes';
import type { PipelineResult, PipelineStage } from '@/hooks/useTextAnalysis';
import { CURRENT_VERSION } from '@/lib/engine/version';
import { CollapsedInput } from './CollapsedInput';
import { PlaceholderCanvas } from './PlaceholderCanvas';
import { ParameterPanel } from './ParameterPanel';
import { PipelineProgress } from '@/components/progress';

interface ResultsViewProps {
  result: PipelineResult;
  inputText: string;
  onRegenerate: (text: string) => void;
  stage: PipelineStage;
}

export function ResultsView({
  result,
  inputText,
  onRegenerate,
  stage,
}: ResultsViewProps) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const isGenerating = stage !== 'complete' && stage !== 'idle';

  return (
    <div className="w-full">
      {/* Collapsed input bar */}
      <CollapsedInput text={inputText} onRegenerate={onRegenerate} />

      {/* Progress indicator during generation */}
      {isGenerating && <PipelineProgress currentStage={stage} />}

      {/* Main content: canvas + parameter panel */}
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Canvas area */}
        <div
          className={`
            w-full md:w-1/2 max-w-lg mx-auto md:mx-0
            transition-opacity duration-500
            ${isGenerating ? 'opacity-40' : 'opacity-100'}
          `}
        >
          <PlaceholderCanvas palette={result.palette} theme={theme} />
        </div>

        {/* Parameter panel */}
        <div className="w-full md:w-1/2">
          <ParameterPanel
            vector={result.vector}
            provenance={result.provenance}
            summaries={result.summaries}
            version={CURRENT_VERSION}
          />
        </div>
      </div>
    </div>
  );
}
