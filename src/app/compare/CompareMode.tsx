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
import type { AnySceneGraph, StyleName, SceneGraph, OrganicSceneGraph, ParticleSceneGraph, TypographicSceneGraph } from '@/lib/render/types';
import { GeometricCanvas } from '@/components/results/GeometricCanvas';
import { OrganicCanvas } from '@/components/results/OrganicCanvas';
import { ParticleCanvas } from '@/components/results/ParticleCanvas';
import { TypographicCanvas } from '@/components/results/TypographicCanvas';
import { computeParameterDiff } from '@/lib/compare/diff';
import { generateDiffSummary, isSignificantDiff } from '@/lib/compare/summary';
import type { ParameterVector } from '@/types/engine';

const STYLE_NAMES: StyleName[] = ['geometric', 'organic', 'particle', 'typographic'];

// ---------------------------------------------------------------------------
// Single-input pane (text input + generate button + canvas)
// ---------------------------------------------------------------------------

interface ComparePaneResult {
  vector: ParameterVector | null;
  pane: React.ReactNode;
}

function useComparePaneState(activeStyle: StyleName, theme: string, label: string): ComparePaneResult {
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
          // Cap at 5000 for compare mode to avoid memory pressure (RESEARCH pitfall 4)
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

  // Rebuild scene when style changes if we have a result
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
    // Compare canvases: animated=false, 600x600 (set via CSS max-w)
    switch (activeStyle) {
      case 'organic':
        return <OrganicCanvas scene={scene as OrganicSceneGraph} animated={false} className="w-full max-w-sm mx-auto block" />;
      case 'particle':
        return <ParticleCanvas scene={scene as ParticleSceneGraph} animated={false} className="w-full max-w-sm mx-auto block" />;
      case 'typographic':
        return <TypographicCanvas scene={scene as TypographicSceneGraph} animated={false} className="w-full max-w-sm mx-auto block" />;
      case 'geometric':
      default:
        return <GeometricCanvas scene={scene as SceneGraph} animated={false} className="w-full max-w-sm mx-auto block" />;
    }
  }

  const pane = (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste any text here..."
        className="w-full h-24 border border-border rounded px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-accent font-mono"
        aria-label={`${label} input text`}
      />
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!inputText.trim()}
        className="btn-primary text-sm w-full disabled:opacity-50"
      >
        Generate
      </button>

      {/* Canvas */}
      <div className="min-h-[200px] flex items-center justify-center">
        {scene ? renderCanvas() : (
          <div className="text-muted-foreground text-sm text-center">
            Enter text and click Generate
          </div>
        )}
      </div>
    </div>
  );

  return { vector: result?.vector ?? null, pane };
}

// ---------------------------------------------------------------------------
// Shared style selector strip
// ---------------------------------------------------------------------------

function StyleStrip({ activeStyle, onStyleChange }: { activeStyle: StyleName; onStyleChange: (s: StyleName) => void }) {
  return (
    <div className="flex gap-2 justify-center mb-6" role="group" aria-label="Select style for both canvases">
      {STYLE_NAMES.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onStyleChange(style)}
          className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
            activeStyle === style
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          aria-pressed={activeStyle === style}
        >
          {style}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parameter diff display (COMP-02)
// ---------------------------------------------------------------------------

function ParameterDiffPanel({ leftVector, rightVector }: { leftVector: ParameterVector; rightVector: ParameterVector }) {
  const diffs = computeParameterDiff(leftVector, rightVector);
  const summary = generateDiffSummary(diffs);

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
        Parameter Comparison
      </h2>

      {/* Auto-generated summary (COMP-03) */}
      <p className="text-sm text-foreground mb-4 italic">{summary}</p>

      {/* Parallel parameter bars */}
      <div className="space-y-3">
        {diffs.map((diff) => {
          const significant = isSignificantDiff(diff.absDelta);
          return (
            <div key={diff.parameter} className={`${significant ? 'bg-accent/5 rounded p-2 -mx-2' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-mono text-xs ${significant ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {diff.parameter}
                </span>
                <span className={`font-mono text-xs ${diff.delta > 0.1 ? 'text-green-500' : diff.delta < -0.1 ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {diff.delta >= 0 ? '+' : ''}{diff.delta.toFixed(2)}
                </span>
              </div>
              {/* Left bar (blue-ish) */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-0.5">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(1, diff.leftValue * 100)}%`, backgroundColor: 'var(--color-accent)', opacity: 0.5 }}
                />
              </div>
              {/* Right bar (solid) */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(1, diff.rightValue * 100)}%`, backgroundColor: significant ? 'var(--color-accent)' : 'var(--muted-foreground)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1 rounded" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.5 }} /> Left
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1 rounded" style={{ backgroundColor: 'var(--color-accent)' }} /> Right
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareMode root component (COMP-01, COMP-04)
// ---------------------------------------------------------------------------

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
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Compare</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter two inputs to see how they differ in artwork and parameters.
          </p>
        </header>

        {/* Shared style selector (COMP-04) */}
        <StyleStrip activeStyle={activeStyle} onStyleChange={setActiveStyle} />

        {/* Two-pane layout (COMP-01) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>{leftPane.pane}</div>
          <div>{rightPane.pane}</div>
        </div>

        {/* Parameter diff (COMP-02, COMP-03) — only when both have results */}
        {bothHaveVectors && (
          <ParameterDiffPanel
            leftVector={leftPane.vector!}
            rightVector={rightPane.vector!}
          />
        )}
      </div>
    </div>
  );
}
