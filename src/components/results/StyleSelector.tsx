'use client';

import { useRef, useEffect, useId } from 'react';
import type {
  AnySceneGraph,
  StyleName,
  SceneGraph,
  OrganicSceneGraph,
  ParticleSceneGraph,
  TypographicSceneGraph,
} from '@/lib/render/types';
import { drawSceneComplete } from '@/lib/render/geometric';
import { drawOrganicSceneComplete } from '@/lib/render/organic';
import { drawParticleSceneComplete } from '@/lib/render/particle';
import { drawTypographicSceneComplete } from '@/lib/render/typographic';

interface StyleEntry {
  id: StyleName;
  name: string;
}

const STYLES: StyleEntry[] = [
  { id: 'geometric', name: 'Geometric' },
  { id: 'organic', name: 'Organic' },
  { id: 'particle', name: 'Particle' },
  { id: 'typographic', name: 'Typographic' },
];

interface StyleSelectorProps {
  /** Scene graphs for all styles (null while building) */
  scenes: Record<StyleName, AnySceneGraph | null>;
  /** Currently active style */
  activeStyle: StyleName;
  /** Callback when user selects a different style */
  onStyleChange: (style: StyleName) => void;
  /** Input type — typographic is disabled for 'data' inputs */
  inputType?: 'text' | 'url' | 'data';
  /** Additional CSS classes */
  className?: string;
  /** Stable id prefix for tab ids */
  idPrefix?: string;
  /** Panel that reflects the active style selection */
  panelId?: string;
}

/** Renders any scene type into a 200x200 thumbnail canvas */
function StyleThumbnail({ scene }: { scene: AnySceneGraph }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbSize = 200;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = thumbSize * dpr;
    canvas.height = thumbSize * dpr;

    const scaleFactor = (thumbSize * dpr) / scene.width;
    ctx.scale(scaleFactor, scaleFactor);

    switch (scene.style) {
      case 'geometric':
        drawSceneComplete(ctx, scene as SceneGraph);
        break;
      case 'organic':
        drawOrganicSceneComplete(ctx, scene as OrganicSceneGraph);
        break;
      case 'particle':
        drawParticleSceneComplete(ctx, scene as ParticleSceneGraph, dpr);
        break;
      case 'typographic':
        drawTypographicSceneComplete(ctx, scene as TypographicSceneGraph);
        break;
    }
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded"
      style={{ width: 200, height: 200 }}
    />
  );
}

function DisabledIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-[var(--muted-foreground)]"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function StyleSelector({
  scenes,
  activeStyle,
  onStyleChange,
  inputType = 'text',
  className = '',
  idPrefix,
  panelId,
}: StyleSelectorProps) {
  const autoSelectorId = useId();
  const selectorId = idPrefix ?? autoSelectorId;
  const styleRefs = useRef<Record<StyleName, HTMLButtonElement | null>>({
    geometric: null,
    organic: null,
    particle: null,
    typographic: null,
  });

  const enabledStyles = STYLES.filter(
    (style) => !(style.id === 'typographic' && inputType === 'data'),
  );

  const focusStyle = (style: StyleName) => {
    const nextStyle = enabledStyles.find((candidate) => candidate.id === style);
    if (!nextStyle) {
      return;
    }

    onStyleChange(nextStyle.id);
    styleRefs.current[nextStyle.id]?.focus();
  };

  const getAdjacentStyle = (currentStyle: StyleName, direction: 'next' | 'previous') => {
    const currentIndex = enabledStyles.findIndex((style) => style.id === currentStyle);

    if (currentIndex === -1) {
      return enabledStyles[0]?.id;
    }

    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + enabledStyles.length) % enabledStyles.length;
    return enabledStyles[nextIndex]?.id;
  };

  return (
    <div
      className={`flex flex-row gap-3 items-center overflow-x-auto pb-2 ${className}`}
      role="tablist"
      aria-label="Rendering styles"
    >
      {STYLES.map((style) => {
        const isActive = style.id === activeStyle;
        const isTypographicDisabled = style.id === 'typographic' && inputType === 'data';
        const scene = scenes[style.id];
        const tabId = `${selectorId}-${style.id}-tab`;

        return (
          <button
            key={style.id}
            ref={(node) => {
              styleRefs.current[style.id] = node;
            }}
            type="button"
            id={tabId}
            data-style={style.id}
            data-active={isActive ? 'true' : undefined}
            data-disabled={isTypographicDisabled ? 'true' : undefined}
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            aria-disabled={isTypographicDisabled}
            tabIndex={isActive ? 0 : -1}
            title={isTypographicDisabled ? 'Text or URL input required' : undefined}
            disabled={isTypographicDisabled}
            onClick={() => {
              if (!isTypographicDisabled) {
                onStyleChange(style.id);
              }
            }}
            onKeyDown={(event) => {
              if (isTypographicDisabled) {
                return;
              }

              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                const nextStyle = getAdjacentStyle(style.id, 'next');
                if (nextStyle) {
                  focusStyle(nextStyle);
                }
              }

              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                const previousStyle = getAdjacentStyle(style.id, 'previous');
                if (previousStyle) {
                  focusStyle(previousStyle);
                }
              }

              if (event.key === 'Home') {
                event.preventDefault();
                const firstStyle = enabledStyles[0]?.id;
                if (firstStyle) {
                  focusStyle(firstStyle);
                }
              }

              if (event.key === 'End') {
                event.preventDefault();
                const lastStyle = enabledStyles.at(-1)?.id;
                if (lastStyle) {
                  focusStyle(lastStyle);
                }
              }
            }}
            className={`
              flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all flex-shrink-0 text-left
              ${isActive ? 'ring-2 ring-[var(--color-accent)]' : ''}
              ${isTypographicDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--muted)]'}
            `}
          >
            <div className="w-[200px] h-[200px] rounded overflow-hidden flex-shrink-0">
              {scene ? (
                <StyleThumbnail scene={scene} />
              ) : (
                <div
                  data-placeholder="true"
                  className="w-full h-full bg-[var(--muted)] rounded flex items-center justify-center"
                >
                  {isTypographicDisabled && <DisabledIcon />}
                </div>
              )}
            </div>

            <span
              className={`
                text-xs
                ${isActive ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}
              `}
            >
              {style.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
