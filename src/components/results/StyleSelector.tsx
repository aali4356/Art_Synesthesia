'use client';

import { useRef, useEffect } from 'react';
import type { AnySceneGraph, StyleName, SceneGraph, OrganicSceneGraph, ParticleSceneGraph, TypographicSceneGraph } from '@/lib/render/types';
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

    // Dispatch to correct draw function based on style discriminant
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
}: StyleSelectorProps) {
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

        return (
          <div
            key={style.id}
            data-style={style.id}
            data-active={isActive ? 'true' : undefined}
            data-disabled={isTypographicDisabled ? 'true' : undefined}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isTypographicDisabled}
            title={isTypographicDisabled ? 'Text or URL input required' : undefined}
            onClick={() => {
              if (!isTypographicDisabled) onStyleChange(style.id);
            }}
            className={`
              flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all flex-shrink-0
              ${isActive ? 'ring-2 ring-[var(--color-accent)]' : ''}
              ${isTypographicDisabled ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-[var(--muted)]'}
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
          </div>
        );
      })}
    </div>
  );
}
