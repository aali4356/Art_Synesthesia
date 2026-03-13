'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useTextAnalysis } from '@/hooks/useTextAnalysis';
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
import { GeometricCanvas } from '@/components/results/GeometricCanvas';
import { OrganicCanvas } from '@/components/results/OrganicCanvas';
import { ParticleCanvas } from '@/components/results/ParticleCanvas';
import { TypographicCanvas } from '@/components/results/TypographicCanvas';
import { computeParameterDiff } from '@/lib/compare/diff';
import { generateDiffSummary, isSignificantDiff } from '@/lib/compare/summary';
import type { ParameterVector } from '@/types/engine';
import { Shell } from '@/components/layout/Shell';

const STYLE_NAMES: StyleName[] = ['geometric', 'organic', 'particle', 'typographic'];

interface ComparePaneResult {
  vector: ParameterVector | null;
  pane: React.ReactNode;
}

function useComparePaneState(
  activeStyle: StyleName,
  theme: 'dark' | 'light',
  label: string
): ComparePaneResult {
  const [inputText, setInputText] = useState('');
  const { result, generate } = useTextAnalysis();
  const [scene, setScene] = useState<AnySceneGraph | null>(null);
  const prevCanonical = useRef('');

  const handleGenerate = useCallback(() => {
    if (inputText.trim()) generate(inputText);
  }, [inputText, generate]);

  useEffect(() => {
    if (!result || result.canonical === prevCanonical.current) return;
    prevCanonical.current = result.canonical;

    async function buildScene() {
      if (!result) return;
      const seed = await deriveSeed(result.canonical, activeStyle, CURRENT_VERSION.engineVersion);
      let built: AnySceneGraph;
      switch (activeStyle) {
        case 'organic':
          built = buildOrganicSceneGraph(result.vector, result.palette, theme, seed);
          break;
        case 'particle':
          built = buildParticleSceneGraph(result.vector, result.palette, theme, seed, 600, 5000);
          break;
        case 'typographic':
          built = buildTypographicSceneGraph(result.vector, result.palette, theme, seed, inputText);
          break;
        case 'geometric':
        default:
          built = buildSceneGraph(result.vector, result.palette, theme, seed);
          break;
      }
      setScene(built);
    }

    buildScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.canonical, activeStyle, theme]);

  useEffect(() => {
    if (!result || !prevCanonical.current) return;

    async function rebuildForStyle() {
      if (!result) return;
      const seed = await deriveSeed(result.canonical, activeStyle, CURRENT_VERSION.engineVersion);
      let built: AnySceneGraph;
      switch (activeStyle) {
        case 'organic':
          built = buildOrganicSceneGraph(result.vector, result.palette, theme, seed);
          break;
        case 'particle':
          built = buildParticleSceneGraph(result.vector, result.palette, theme, seed, 600, 5000);
          break;
        case 'typographic':
          built = buildTypographicSceneGraph(result.vector, result.palette, theme, seed, inputText);
          break;
        case 'geometric':
        default:
          built = buildSceneGraph(result.vector, result.palette, theme, seed);
          break;
      }
      setScene(built);
    }

    rebuildForStyle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStyle]);

  function renderCanvas() {
    if (!scene) return null;
    switch (activeStyle) {
      case 'organic':
        return (
          <OrganicCanvas
            scene={scene as OrganicSceneGraph}
            animated={false}
            className="w-full max-w-sm mx-auto block"
          />
        );
      case 'particle':
        return (
          <ParticleCanvas
            scene={scene as ParticleSceneGraph}
            animated={false}
            className="w-full max-w-sm mx-auto block"
          />
        );
      case 'typographic':
        return (
          <TypographicCanvas
            scene={scene as TypographicSceneGraph}
            animated={false}
            className="w-full max-w-sm mx-auto block"
          />
        );
      case 'geometric':
      default:
        return (
          <GeometricCanvas
            scene={scene as SceneGraph}
            animated={false}
            className="w-full max-w-sm mx-auto block"
          />
        );
    }
  }

  const pane = (
    <section className="editorial-panel editorial-control-surface space-y-5" aria-label={`${label} compare pane`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="editorial-note-label mb-1">Action desk</p>
          <h2 className="text-xl font-medium text-[var(--foreground)]">{label}</h2>
        </div>
        <span className="editorial-chip">proof-safe input</span>
      </div>

      <div>
        <label htmlFor={`${label}-input`} className="editorial-field-label">
          {label} source text
        </label>
        <textarea
          id={`${label}-input`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste any text here..."
          className="editorial-textarea"
          aria-label={`${label} input text`}
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!inputText.trim()}
        className="btn-accent text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate
      </button>

      <div className="editorial-panel editorial-canvas-frame editorial-compare-canvas min-h-[240px] flex items-center justify-center">
        {scene ? (
          renderCanvas()
        ) : (
          <div className="text-center space-y-2">
            <p className="editorial-note-label">Canvas idle</p>
            <p className="text-sm text-[var(--muted-foreground)]">Enter text and click Generate</p>
          </div>
        )}
      </div>
    </section>
  );

  return { vector: result?.vector ?? null, pane };
}

function StyleStrip({
  activeStyle,
  onStyleChange,
}: {
  activeStyle: StyleName;
  onStyleChange: (s: StyleName) => void;
}) {
  return (
    <section className="editorial-panel editorial-control-surface space-y-4" aria-labelledby="compare-style-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="editorial-note-label mb-1">Viewer stage</p>
          <h2 id="compare-style-heading" className="text-xl font-medium text-[var(--foreground)]">
            Shared renderer selection.
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            One style control drives both panes so the comparison stays visually aligned.
          </p>
        </div>
        <div className="editorial-chip-stack" aria-hidden="true">
          <span className="editorial-chip">one style · two panes</span>
          <span className="editorial-chip">keyboard-usable toggles</span>
        </div>
      </div>

      <div className="editorial-chip-stack" role="group" aria-label="Select style for both canvases">
        {STYLE_NAMES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => onStyleChange(style)}
            className={`editorial-chip-button ${activeStyle === style ? 'is-active' : ''}`}
            aria-pressed={activeStyle === style}
          >
            {style}
          </button>
        ))}
      </div>
    </section>
  );
}

function ParameterDiffPanel({
  leftVector,
  rightVector,
}: {
  leftVector: ParameterVector;
  rightVector: ParameterVector;
}) {
  const diffs = computeParameterDiff(leftVector, rightVector);
  const summary = generateDiffSummary(diffs);

  return (
    <section className="editorial-panel editorial-control-surface space-y-5" aria-labelledby="compare-diff-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="editorial-note-label mb-1">Parameter comparison</p>
          <h2 id="compare-diff-heading" className="text-xl font-medium text-[var(--foreground)]">
            Delta summary
          </h2>
        </div>
        <span className="editorial-chip">significant shifts highlighted</span>
      </div>

      <p className="text-sm text-[var(--foreground)] italic">{summary}</p>

      <div className="space-y-3">
        {diffs.map((diff) => {
          const significant = isSignificantDiff(diff.absDelta);
          return (
            <div
              key={diff.parameter}
              className={`rounded-[1rem] ${significant ? 'bg-[color-mix(in_oklch,var(--surface-veil)_76%,transparent)] p-3' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-mono text-xs ${significant ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]'}`}
                >
                  {diff.parameter}
                </span>
                <span
                  className={`font-mono text-xs ${diff.delta > 0.1 ? 'text-green-500' : diff.delta < -0.1 ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}
                >
                  {diff.delta >= 0 ? '+' : ''}
                  {diff.delta.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-0.5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(1, diff.leftValue * 100)}%`,
                    backgroundColor: 'var(--color-accent)',
                    opacity: 0.5,
                  }}
                />
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(1, diff.rightValue * 100)}%`,
                    backgroundColor: significant ? 'var(--color-accent)' : 'var(--muted-foreground)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-1 rounded"
            style={{ backgroundColor: 'var(--color-accent)', opacity: 0.5 }}
          />{' '}
          Left
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-1 rounded"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />{' '}
          Right
        </span>
      </div>
    </section>
  );
}

/**
 * CompareMode — renders two independent input zones with two canvases
 * in the same actively-selected style (COMP-01, COMP-04).
 *
 * A shared style selector controls both canvases simultaneously.
 * A parameter diff panel below shows parallel bars and auto-summary (COMP-02, COMP-03).
 */
export function CompareMode() {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const [activeStyle, setActiveStyle] = useState<StyleName>('geometric');

  const leftPane = useComparePaneState(activeStyle, theme, 'Input A');
  const rightPane = useComparePaneState(activeStyle, theme, 'Input B');

  const bothHaveVectors = leftPane.vector !== null && rightPane.vector !== null;

  return (
    <Shell>
      <section className="editorial-stage space-y-8" aria-labelledby="compare-atelier-title">
        <div className="space-y-6 max-w-4xl">
          <div className="editorial-kicker">Route intro</div>
          <div className="space-y-4">
            <h1 id="compare-atelier-title" className="editorial-display text-4xl sm:text-5xl lg:text-6xl leading-[0.94]">
              Compare atelier
            </h1>
            <p className="max-w-2xl text-base sm:text-lg text-[var(--foreground)]/88 leading-relaxed">
              Two proof-safe inputs, one collector stage, shared style control.
            </p>
            <p className="max-w-3xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              Compare two editions under one renderer family, then inspect the vector deltas without leaving the same editorial language used by results, share, gallery, and export.
            </p>
          </div>
          <div className="editorial-marquee" aria-label="Compare route traits">
            <span>two collector editions</span>
            <span>shared style selector</span>
            <span>viewer-safe diagnostics</span>
          </div>
        </div>

        <StyleStrip activeStyle={activeStyle} onStyleChange={setActiveStyle} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{leftPane.pane}{rightPane.pane}</div>

        {bothHaveVectors && (
          <ParameterDiffPanel leftVector={leftPane.vector!} rightVector={rightPane.vector!} />
        )}
      </section>
    </Shell>
  );
}
