'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { PipelineResult, PipelineStage } from '@/hooks/useTextAnalysis';
import { CURRENT_VERSION } from '@/lib/engine/version';
import { deriveSeed } from '@/lib/engine/prng';
import { buildSceneGraph } from '@/lib/render/geometric';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { buildParticleSceneGraph } from '@/lib/render/particle';
import { buildTypographicSceneGraph } from '@/lib/render/typographic';
import type { AnySceneGraph, StyleName, SceneGraph, OrganicSceneGraph, ParticleSceneGraph, TypographicSceneGraph } from '@/lib/render/types';
import { CollapsedInput } from './CollapsedInput';
import { GeometricCanvas } from './GeometricCanvas';
import { OrganicCanvas } from './OrganicCanvas';
import { ParticleCanvas } from './ParticleCanvas';
import { TypographicCanvas } from './TypographicCanvas';
import { StyleSelector } from './StyleSelector';
import { ParameterPanel } from './ParameterPanel';
import { PipelineProgress } from '@/components/progress';
import { ShareButton } from './ShareButton';

interface ResultsViewProps {
  result: PipelineResult;
  inputText: string;
  onRegenerate: (text: string) => void;
  stage: PipelineStage;
  /** Input type — typographic style is disabled for 'data' inputs */
  inputType?: 'text' | 'url' | 'data';
}

export function ResultsView({
  result,
  inputText,
  onRegenerate,
  stage,
  inputType = 'text',
}: ResultsViewProps) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const isGenerating = stage !== 'complete' && stage !== 'idle';

  // Multi-style scene state
  const [scenes, setScenes] = useState<Record<StyleName, AnySceneGraph | null>>({
    geometric: null,
    organic: null,
    particle: null,
    typographic: null,
  });
  const [activeStyle, setActiveStyle] = useState<StyleName>('geometric');
  const [animationKey, setAnimationKey] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Track previous values to detect theme-only changes
  const prevCanonicalRef = useRef<string>('');
  const prevThemeRef = useRef<string>(theme);

  // Detect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Determine maxParticles based on screen width (mobile cap)
  const maxParticles = typeof window !== 'undefined' && window.innerWidth < 768 ? 2000 : 10000;

  // Build all 4 scene graphs when result or theme changes
  useEffect(() => {
    let cancelled = false;

    async function buildAllScenes() {
      const isThemeChange =
        prevCanonicalRef.current === result.canonical &&
        prevThemeRef.current !== theme;

      const isNewGeneration = prevCanonicalRef.current !== result.canonical;

      // Derive seeds for all 4 renderers
      const [geoSeed, orgSeed, ptclSeed, typoSeed] = await Promise.all([
        deriveSeed(result.canonical, 'geometric', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'organic', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'particle', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'typographic', CURRENT_VERSION.engineVersion),
      ]);

      if (cancelled) return;

      // Build all 4 scenes
      const geoScene = buildSceneGraph(result.vector, result.palette, theme, geoSeed);
      const orgScene = buildOrganicSceneGraph(result.vector, result.palette, theme, orgSeed);
      const ptclScene = buildParticleSceneGraph(result.vector, result.palette, theme, ptclSeed, 800, maxParticles);
      // Typographic scene is null for data inputs
      const typoScene = inputType === 'data'
        ? null
        : buildTypographicSceneGraph(result.vector, result.palette, theme, typoSeed, inputText);

      // Update refs
      prevCanonicalRef.current = result.canonical;
      prevThemeRef.current = theme;

      // Animate only on new generation, not theme change
      const animate = isNewGeneration && !prefersReducedMotion;
      setShouldAnimate(animate);
      setScenes({
        geometric: geoScene,
        organic: orgScene,
        particle: ptclScene,
        typographic: typoScene,
      });

      // Suppress unused variable warning
      void isThemeChange;
    }

    buildAllScenes();

    return () => {
      cancelled = true;
    };
  }, [result.canonical, result.vector, result.palette, theme, prefersReducedMotion, inputType, inputText, maxParticles]);

  // Style switch handler — triggers full progressive animation for new style
  const handleStyleChange = useCallback((style: StyleName) => {
    setActiveStyle(style);
    setShouldAnimate(true);
    setAnimationKey((k) => k + 1);
  }, []);

  // Render complete callback
  const handleRenderComplete = useCallback(() => {
    setShouldAnimate(false);
  }, []);

  // Render the active canvas component
  function renderCanvas() {
    const key = `${activeStyle}-${animationKey}`;
    switch (activeStyle) {
      case 'geometric': {
        const scene = scenes.geometric as SceneGraph | null;
        return scene ? (
          <GeometricCanvas
            key={key}
            scene={scene}
            animated={shouldAnimate}
            onRenderComplete={handleRenderComplete}
            className="w-full"
          />
        ) : null;
      }
      case 'organic': {
        const scene = scenes.organic as OrganicSceneGraph | null;
        return scene ? (
          <OrganicCanvas
            key={key}
            scene={scene}
            animated={shouldAnimate}
            onRenderComplete={handleRenderComplete}
            className="w-full"
          />
        ) : null;
      }
      case 'particle': {
        const scene = scenes.particle as ParticleSceneGraph | null;
        return scene ? (
          <ParticleCanvas
            key={key}
            scene={scene}
            animated={shouldAnimate}
            onRenderComplete={handleRenderComplete}
            className="w-full"
          />
        ) : null;
      }
      case 'typographic': {
        const scene = scenes.typographic as TypographicSceneGraph | null;
        return scene ? (
          <TypographicCanvas
            key={key}
            scene={scene}
            animated={shouldAnimate}
            onRenderComplete={handleRenderComplete}
            className="w-full"
          />
        ) : null;
      }
    }
  }

  return (
    <div className="w-full">
      {/* Collapsed input bar */}
      <CollapsedInput text={inputText} onRegenerate={onRegenerate} />

      {/* Progress indicator during generation */}
      {isGenerating && <PipelineProgress currentStage={stage} />}

      {/* Style selector between input and canvas */}
      <div className="mt-4 mb-2">
        <StyleSelector
          scenes={scenes}
          activeStyle={activeStyle}
          onStyleChange={handleStyleChange}
          inputType={inputType}
        />
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
          {renderCanvas()}
        </div>

        {/* Parameter panel */}
        <div className="w-full md:w-1/2">
          <ParameterPanel
            vector={result.vector}
            provenance={result.provenance}
            summaries={result.summaries}
            version={CURRENT_VERSION}
          />
          <div className="mt-4">
            <ShareButton
              parameterVector={result.vector}
              versionInfo={CURRENT_VERSION}
              styleName={activeStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
