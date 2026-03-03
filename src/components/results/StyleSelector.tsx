'use client';

import { useRef, useEffect } from 'react';
import type { SceneGraph } from '@/lib/render/types';
import { drawSceneComplete } from '@/lib/render/geometric';

/**
 * StyleSelector displays a row of art style entries.
 * Currently only Geometric is active; Organic, Particle, and
 * Typographic are shown as locked placeholders for future phases.
 */

interface StyleEntry {
  id: string;
  name: string;
  locked: boolean;
}

const STYLES: StyleEntry[] = [
  { id: 'geometric', name: 'Geometric', locked: false },
  { id: 'organic', name: 'Organic', locked: true },
  { id: 'particle', name: 'Particle', locked: true },
  { id: 'typographic', name: 'Typographic', locked: true },
];

interface StyleSelectorProps {
  /** Scene graph for generating the active thumbnail */
  scene: SceneGraph | null;
  /** Currently active style ID */
  activeStyle: string;
  /** Additional CSS classes */
  className?: string;
}

/** Lock icon SVG for locked styles */
function LockIcon() {
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

/** Thumbnail canvas that renders a scaled-down version of the scene graph */
function StyleThumbnail({ scene }: { scene: SceneGraph }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbSize = 80;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = thumbSize * dpr;
    canvas.height = thumbSize * dpr;

    // Scale to fit scene into thumbnail
    const scaleFactor = (thumbSize * dpr) / scene.width;
    ctx.scale(scaleFactor, scaleFactor);

    drawSceneComplete(ctx, scene);
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded"
      style={{ width: 80, height: 80 }}
    />
  );
}

export function StyleSelector({
  scene,
  activeStyle,
  className = '',
}: StyleSelectorProps) {
  return (
    <div className={`flex flex-row gap-3 items-center justify-center ${className}`}>
      {STYLES.map((style) => {
        const isActive = style.id === activeStyle;
        const isLocked = style.locked;

        return (
          <div
            key={style.id}
            data-style={style.id}
            data-active={isActive ? 'true' : undefined}
            data-locked={isLocked ? 'true' : undefined}
            className={`
              flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
              ${isActive ? 'ring-2 ring-[var(--color-accent)]' : ''}
              ${isLocked ? 'opacity-50 cursor-default' : 'cursor-pointer'}
            `}
          >
            {/* Thumbnail area */}
            <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
              {isActive && scene ? (
                <StyleThumbnail scene={scene} />
              ) : (
                <div
                  data-placeholder="true"
                  className="w-full h-full bg-[var(--muted)] rounded flex items-center justify-center"
                >
                  {isLocked && <LockIcon />}
                </div>
              )}
            </div>

            {/* Style name */}
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
