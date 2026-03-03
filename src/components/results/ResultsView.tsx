'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { PipelineResult, PipelineStage } from '@/hooks/useTextAnalysis';
import { CURRENT_VERSION } from '@/lib/engine/version';
import { deriveSeed } from '@/lib/engine/prng';
import { buildSceneGraph } from '@/lib/render/geometric';
import type { SceneGraph } from '@/lib/render/types';
import { CollapsedInput } from './CollapsedInput';
import { GeometricCanvas } from './GeometricCanvas';
import { StyleSelector } from './StyleSelector';
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

  // Scene graph state
  const [scene, setScene] = useState<SceneGraph | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Track previous values to detect theme-only changes
  const prevCanonicalRef = useRef<string>('');
  const prevThemeRef = useRef<string>(theme);

  // Detect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Build scene graph when result or theme changes
  useEffect(() => {
    let cancelled = false;

    async function buildScene() {
      const seed = await deriveSeed(
        result.canonical,
        'geometric',
        CURRENT_VERSION.engineVersion,
      );

      if (cancelled) return;

      const newScene = buildSceneGraph(
        result.vector,
        result.palette,
        theme,
        seed,
      );

      // Determine if this is a theme-only change (no animation replay)
      const isThemeChange =
        prevCanonicalRef.current === result.canonical &&
        prevThemeRef.current !== theme;

      const isNewGeneration = prevCanonicalRef.current !== result.canonical;

      // Update refs
      prevCanonicalRef.current = result.canonical;
      prevThemeRef.current = theme;

      // Animate only on new generation, not theme change
      // Never animate if prefers-reduced-motion is set
      setShouldAnimate(isNewGeneration && !prefersReducedMotion);
      setScene(newScene);
    }

    buildScene();

    return () => {
      cancelled = true;
    };
  }, [result.canonical, result.vector, result.palette, theme, prefersReducedMotion]);

  // Render complete callback
  const handleRenderComplete = useCallback(() => {
    // Animation is done; subsequent renders (like theme change) should be instant
    setShouldAnimate(false);
  }, []);

  return (
    <div className="w-full">
      {/* Collapsed input bar */}
      <CollapsedInput text={inputText} onRegenerate={onRegenerate} />

      {/* Progress indicator during generation */}
      {isGenerating && <PipelineProgress currentStage={stage} />}

      {/* Style selector between input and canvas */}
      <div className="mt-4 mb-2">
        <StyleSelector scene={scene} activeStyle="geometric" />
      </div>

      {/* Main content: canvas + parameter panel */}
      <div className="flex flex-col md:flex-row gap-8 mt-4">
        {/* Canvas area */}
        <div
          className={`
            w-full md:w-1/2 max-w-lg mx-auto md:mx-0
            transition-opacity duration-500
            ${isGenerating ? 'opacity-40' : 'opacity-100'}
          `}
        >
          {scene ? (
            <GeometricCanvas
              scene={scene}
              animated={shouldAnimate}
              onRenderComplete={handleRenderComplete}
              className="w-full"
            />
          ) : null}
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
