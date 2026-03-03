'use client';

import { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { InputZone, QuickStart } from '@/components/input';
import { ResultsView } from '@/components/results';
import { PipelineProgress } from '@/components/progress';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const { stage, result, generate, reset } = useTextAnalysis();

  const hasResult = result !== null;
  const isGenerating = stage !== 'idle' && stage !== 'complete';

  const handleGenerate = useCallback(() => {
    if (inputText.trim().length > 0) {
      generate(inputText);
    }
  }, [inputText, generate]);

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
  }, [reset]);

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
          />

          {/* Quick-start buttons */}
          <div className="w-full max-w-2xl">
            <QuickStart
              onQuickStart={handleQuickStart}
              disabled={isGenerating}
            />
          </div>

          {/* Pipeline progress (shown during generation on landing) */}
          {isGenerating && (
            <div className="w-full max-w-2xl">
              <PipelineProgress currentStage={stage} />
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
          <ResultsView
            result={result}
            inputText={inputText}
            onRegenerate={handleRegenerate}
            stage={stage}
          />
        </div>
      )}
    </Shell>
  );
}
