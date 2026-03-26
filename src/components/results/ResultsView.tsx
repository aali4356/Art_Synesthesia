'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import type { PipelineResult, PipelineStage } from '@/hooks/useTextAnalysis';
import type { RecentWorkSaveState } from '@/hooks/useRecentWorks';
import { CURRENT_VERSION } from '@/lib/engine/version';
import { deriveSeed } from '@/lib/engine/prng';
import { buildSceneGraph } from '@/lib/render/geometric';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { buildParticleSceneGraph } from '@/lib/render/particle';
import { buildTypographicSceneGraph } from '@/lib/render/typographic';
import type {
  AnySceneGraph,
  StyleName,
  SceneGraph,
  OrganicSceneGraph,
  ParticleSceneGraph,
  TypographicSceneGraph,
} from '@/lib/render/types';
import { CollapsedInput } from './CollapsedInput';
import { GeometricCanvas } from './GeometricCanvas';
import { OrganicCanvas } from './OrganicCanvas';
import { ParticleCanvas } from './ParticleCanvas';
import { TypographicCanvas } from './TypographicCanvas';
import { StyleSelector } from './StyleSelector';
import { ParameterPanel } from './ParameterPanel';
import { PipelineProgress } from '@/components/progress';
import { ShareButton } from './ShareButton';
import { ExportControls } from './ExportControls';
import { GallerySaveModal } from '@/components/gallery/GallerySaveModal';
import { captureClientEvent } from '@/lib/observability/client';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';

interface ResultsViewProps {
  result: PipelineResult;
  inputText: string;
  onRegenerate: (text: string) => void;
  stage: PipelineStage;
  /** Input type — typographic style is disabled for 'data' inputs */
  inputType?: 'text' | 'url' | 'data';
  initialStyle?: StyleName;
  continuityMode?: 'fresh' | 'resumed';
  onSaveToRecentLocal?: (style: StyleName) => unknown;
  recentLocalSaveState?: RecentWorkSaveState;
}

interface ProofDiagnosticRow {
  label: string;
  value: string;
}

function formatExpressivenessValue(value: number): string {
  return value.toFixed(2);
}

export function ResultsView({
  result,
  inputText,
  onRegenerate,
  stage,
  inputType = 'text',
  initialStyle = 'geometric',
  continuityMode = 'fresh',
  onSaveToRecentLocal,
  recentLocalSaveState = { status: 'idle' },
}: ResultsViewProps) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const isGenerating = stage !== 'complete' && stage !== 'idle';

  const [scenes, setScenes] = useState<Record<StyleName, AnySceneGraph | null>>({
    geometric: null,
    organic: null,
    particle: null,
    typographic: null,
  });
  const [activeStyle, setActiveStyle] = useState<StyleName>(initialStyle);
  const [animationKey, setAnimationKey] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedGalleryId, setSavedGalleryId] = useState<string | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const prevCanonicalRef = useRef<string>('');
  const prevThemeRef = useRef<string>(theme);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const maxParticles = typeof window !== 'undefined' && window.innerWidth < 768 ? 2000 : 10000;

  useEffect(() => {
    setActiveStyle(inputType === 'data' && initialStyle === 'typographic' ? 'geometric' : initialStyle);
  }, [initialStyle, inputType, result.canonical]);

  useEffect(() => {
    let cancelled = false;

    async function buildAllScenes() {
      const isThemeChange =
        prevCanonicalRef.current === result.canonical &&
        prevThemeRef.current !== theme;

      const isNewGeneration = prevCanonicalRef.current !== result.canonical;

      const [geoSeed, orgSeed, ptclSeed, typoSeed] = await Promise.all([
        deriveSeed(result.canonical, 'geometric', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'organic', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'particle', CURRENT_VERSION.engineVersion),
        deriveSeed(result.canonical, 'typographic', CURRENT_VERSION.engineVersion),
      ]);

      if (cancelled) return;

      const geoScene = buildSceneGraph(result.vector, result.palette, theme, geoSeed);
      const orgScene = buildOrganicSceneGraph(result.vector, result.palette, theme, orgSeed);
      const ptclScene = buildParticleSceneGraph(result.vector, result.palette, theme, ptclSeed, 800, maxParticles);
      const typoScene = inputType === 'data'
        ? null
        : buildTypographicSceneGraph(result.vector, result.palette, theme, typoSeed, inputText);

      prevCanonicalRef.current = result.canonical;
      prevThemeRef.current = theme;

      const animate = isNewGeneration && !prefersReducedMotion;
      setShouldAnimate(animate);
      setScenes({
        geometric: geoScene,
        organic: orgScene,
        particle: ptclScene,
        typographic: typoScene,
      });

      void isThemeChange;
    }

    buildAllScenes();

    return () => {
      cancelled = true;
    };
  }, [result.canonical, result.vector, result.palette, theme, prefersReducedMotion, inputType, inputText, maxParticles]);

  useEffect(() => {
    if (activeStyle === 'typographic' && inputType === 'data') {
      setActiveStyle('geometric');
    }
  }, [activeStyle, inputType]);

  const handleStyleChange = useCallback((style: StyleName) => {
    if (style === activeStyle) {
      return;
    }

    setActiveStyle(style);
    setShouldAnimate(true);
    setAnimationKey((k) => k + 1);

    try {
      captureClientEvent(OBSERVABILITY_EVENTS.results.styleChanged, {
        continuityMode,
        sourceKind: inputType,
        styleName: style,
      });
    } catch {
      // Observability is non-blocking by contract.
    }
  }, [activeStyle, continuityMode, inputType]);

  const handleRenderComplete = useCallback(() => {
    setShouldAnimate(false);
  }, []);

  const handleSaveLocal = useCallback(() => {
    if (!onSaveToRecentLocal) return;

    try {
      captureClientEvent(OBSERVABILITY_EVENTS.results.saveIntent, {
        continuityMode,
        sourceKind: inputType,
        styleName: activeStyle,
        action: 'recent-local-save',
      });
    } catch {
      // Observability is non-blocking by contract.
    }

    onSaveToRecentLocal(activeStyle);
  }, [activeStyle, continuityMode, inputType, onSaveToRecentLocal]);

  function captureCurrentThumbnail(): string {
    if (!mainCanvasRef.current) return '';
    const size = 200;
    const thumb = document.createElement('canvas');
    thumb.width = size;
    thumb.height = size;
    const ctx = thumb.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(mainCanvasRef.current, 0, 0, size, size);
    return thumb.toDataURL('image/png');
  }

  const supportedStylesSummary = useMemo(() => {
    if (inputType === 'data') {
      return 'geometric, organic, particle · typographic unavailable for data inputs';
    }
    return 'geometric, organic, particle, typographic';
  }, [inputType]);

  const proofSource = useMemo(() => {
    switch (inputType) {
      case 'url':
        return 'url';
      case 'data':
        return 'data';
      default:
        return 'text';
    }
  }, [inputType]);

  const mappingPosture = useMemo(() => {
    const mapping = result.palette.mapping;
    return `${mapping.mood} · ${mapping.chromaPosture} · ${mapping.contrastPosture}`;
  }, [result.palette.mapping]);

  const expressivenessRows = useMemo<ProofDiagnosticRow[]>(() => {
    const rows: ProofDiagnosticRow[] = [];
    const organicScene = scenes.organic;
    const typographicScene = scenes.typographic;

    if (organicScene?.style === 'organic') {
      rows.push(
        {
          label: 'organic.atmosphericRichness',
          value: formatExpressivenessValue(organicScene.expressiveness.atmosphericRichness),
        },
        {
          label: 'organic.densityLift',
          value: formatExpressivenessValue(organicScene.expressiveness.densityLift),
        },
        {
          label: 'organic.layeringDepth',
          value: formatExpressivenessValue(organicScene.expressiveness.layeringDepth),
        },
        {
          label: 'organic.directionalDrama',
          value: formatExpressivenessValue(organicScene.expressiveness.directionalDrama),
        },
      );
    }

    if (typographicScene?.style === 'typographic') {
      rows.push(
        {
          label: 'typographic.hierarchyLift',
          value: formatExpressivenessValue(typographicScene.expressiveness.hierarchyLift),
        },
        {
          label: 'typographic.densityLift',
          value: formatExpressivenessValue(typographicScene.expressiveness.densityLift),
        },
        {
          label: 'typographic.rotationFreedom',
          value: formatExpressivenessValue(typographicScene.expressiveness.rotationFreedom),
        },
        {
          label: 'typographic.fontVariety',
          value: formatExpressivenessValue(typographicScene.expressiveness.fontVariety),
        },
      );
    }

    return rows;
  }, [scenes.organic, scenes.typographic]);

  const nextStepContent = useMemo(() => {
    if (continuityMode === 'resumed') {
      return {
        label: 'Repeat-use guidance',
        title: 'Return home for private browser-local recall, or step into public routes deliberately.',
        body: 'This reopened edition came from recent local work in this browser. Return Home when you want to resume or start fresh from the editorial desk, use Compare for side-by-side evaluation, and treat Share or Gallery as explicit public routes.',
        localCue: 'Home keeps browser-local recall and fresh-start controls in one place for this device only.',
      };
    }

    return {
      label: 'Next steps',
      title: 'Keep the same edition moving without guessing where each route leads.',
      body: 'Return Home to start fresh or revisit recent local work, use Compare for side-by-side evaluation, and treat Share or Gallery as explicit public routes rather than browser-local recall.',
      localCue: 'Recent local work stays private to this browser, while Compare and Gallery stay route-based and shareable.',
    };
  }, [continuityMode]);

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
    <div className="space-y-6">
      <section className="editorial-panel editorial-control-surface overflow-hidden">
        {inputType === 'text' ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="editorial-note-label mb-0">Source state</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                text input ready
              </p>
            </div>
            <div className="editorial-chip">proof-safe continuity maintained</div>
          </div>
        ) : (
          <CollapsedInput text={inputText} onRegenerate={onRegenerate} />
        )}

        {isGenerating && (
          <div className="mt-5 editorial-support-panel">
            <p className="editorial-note-label mb-3">Generation progress</p>
            <PipelineProgress currentStage={stage} />
          </div>
        )}
      </section>

      <section className="editorial-results-grid">
        <div className="space-y-6">
          <section className="editorial-panel editorial-control-surface overflow-hidden">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <p className="editorial-note-label mb-0">Results salon</p>
                <h2 className="editorial-display text-3xl sm:text-4xl leading-[0.92]">
                  The artwork, proof, and controls stay on the same editorial stage.
                </h2>
                <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
                  Review the active render, switch the visual language, and inspect derived proof
                  signals without exposing the underlying source material.
                </p>
              </div>
              <div className="editorial-chip-stack" aria-label="Results continuity cues">
                <span className="editorial-chip">active style · {activeStyle}</span>
                <span className="editorial-chip">proof source · {proofSource}</span>
                <span className="editorial-chip">palette family · {result.palette.familyId}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border-soft)] pt-5">
              <StyleSelector
                scenes={scenes}
                activeStyle={activeStyle}
                onStyleChange={handleStyleChange}
                inputType={inputType}
              />
            </div>
          </section>

          <section className="editorial-panel editorial-canvas-frame overflow-hidden">
            <div
              className={`transition-opacity duration-500 ${isGenerating ? 'opacity-40' : 'opacity-100'}`}
            >
              <div ref={(node) => {
                const canvas = node?.querySelector('canvas') ?? null;
                mainCanvasRef.current = canvas;
              }}>
                {renderCanvas()}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section
            aria-label="Proof diagnostics"
            className="editorial-panel editorial-control-surface"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-[var(--muted-foreground)]">
                  proof diagnostics
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  derived diagnostics only — raw input hidden
                </p>
              </div>
              <div className="editorial-chip">
                <span>active style</span>
                <span className="sr-only">: </span>
                <span className="ml-1">{activeStyle}</span>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">proof source</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">{proofSource}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">palette family</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">{result.palette.familyId}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">harmony</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">{result.palette.mapping.harmony}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">mapping posture</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">{mappingPosture}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">supported styles</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">
                  {inputType === 'data' ? (
                    <>
                      <span>geometric, organic, particle</span>
                      <span className="mx-1">·</span>
                      <span>typographic unavailable for data inputs</span>
                    </>
                  ) : (
                    supportedStylesSummary
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
              <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
                renderer expressiveness
              </h3>
              {expressivenessRows.length > 0 ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {expressivenessRows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-[var(--muted-foreground)]">{row.label}</dt>
                      <dd className="font-medium text-[var(--foreground)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Waiting for renderer diagnostics.
                </p>
              )}
            </div>
          </section>

          <section className="editorial-panel editorial-control-surface">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <p className="editorial-note-label mb-1">Action desk</p>
                <h3 className="text-lg font-medium text-[var(--foreground)]">Collect, export, or share this edition.</h3>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                public actions remain privacy-safe
              </p>
            </div>

            <div className="editorial-action-card mb-4 space-y-4">
              <div className="space-y-2">
                <p className="editorial-note-label mb-0">{nextStepContent.label}</p>
                <h3 className="text-base font-medium text-[var(--foreground)]">{nextStepContent.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {nextStepContent.body}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3" aria-label="Results next-step routes">
                <Link href="/" className="btn-ghost text-sm text-center">
                  Home / Recent local work
                </Link>
                <Link href="/compare" className="btn-ghost text-sm text-center">
                  Compare side by side
                </Link>
                <Link href="/gallery" className="btn-ghost text-sm text-center">
                  Browse public gallery
                </Link>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {nextStepContent.localCue}
              </p>
            </div>

            <div className="space-y-4">
              <div className="editorial-action-card continuity-save-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="editorial-note-label mb-0">Recent local work</p>
                    <h3 className="text-base font-medium text-[var(--foreground)]">Keep a browser-local continuity copy.</h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      Save this edition family for private same-browser recall. This is distinct from Share and Save to Gallery, and it never stores the raw source.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveLocal}
                    className="btn-ghost text-sm"
                    aria-label="Save this edition to recent local work"
                  >
                    {recentLocalSaveState.status === 'saved' ? 'Saved in this browser' : 'Save in this browser'}
                  </button>
                </div>

                {recentLocalSaveState.status === 'saved' && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]" role="status">
                    Saved to recent local work. Reopen it later from the homepage continuity panel.
                  </p>
                )}
                {recentLocalSaveState.status === 'error' && (
                  <p className="mt-3 text-xs text-[var(--color-accent)]" role="alert">
                    {recentLocalSaveState.message}
                  </p>
                )}
              </div>

              <ExportControls
                parameterVector={result.vector}
                versionInfo={CURRENT_VERSION}
                styleName={activeStyle}
                continuityMode={continuityMode}
              />
              <ShareButton
                parameterVector={result.vector}
                versionInfo={CURRENT_VERSION}
                styleName={activeStyle}
                continuityMode={continuityMode}
              />

              <div className="editorial-action-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Gallery archive</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Publish only the artwork, style, and optional short preview — never the full raw source.
                    </p>
                  </div>
                  {savedGalleryId ? (
                    <a href={`/gallery/${savedGalleryId}`} className="btn-ghost text-sm text-center">
                      View saved artwork
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(true)}
                      className="btn-accent text-sm"
                    >
                      Save to Gallery
                    </button>
                  )}
                </div>
                {savedGalleryId && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    Gallery save complete. Use “View saved artwork” to open the public detail page.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="editorial-panel editorial-control-surface">
            <ParameterPanel
              vector={result.vector}
              provenance={result.provenance}
              summaries={result.summaries}
              version={CURRENT_VERSION}
            />
          </section>
        </div>
      </section>

      {showSaveModal && (
        <GallerySaveModal
          parameterVector={result.vector}
          versionInfo={CURRENT_VERSION}
          styleName={activeStyle}
          continuityMode={continuityMode}
          inputTextPreview={inputText.slice(0, 50)}
          thumbnailDataUrl={captureCurrentThumbnail()}
          onClose={() => setShowSaveModal(false)}
          onSaved={(id) => {
            setSavedGalleryId(id);
            setShowSaveModal(false);
          }}
        />
      )}
    </div>
  );
}
