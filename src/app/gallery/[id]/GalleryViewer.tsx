'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { ParameterVector, VersionInfo } from '@/types/engine';
import type {
  AnySceneGraph,
  SceneGraph,
  OrganicSceneGraph,
  ParticleSceneGraph,
  TypographicSceneGraph,
} from '@/lib/render/types';
import { buildSceneGraph } from '@/lib/render/geometric';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { buildParticleSceneGraph } from '@/lib/render/particle';
import { buildTypographicSceneGraph } from '@/lib/render/typographic';
import { generatePalette } from '@/lib/color/palette';
import { GeometricCanvas } from '@/components/results/GeometricCanvas';
import { OrganicCanvas } from '@/components/results/OrganicCanvas';
import { ParticleCanvas } from '@/components/results/ParticleCanvas';
import { TypographicCanvas } from '@/components/results/TypographicCanvas';
import { BrandedViewerScaffold } from '@/components/viewers/BrandedViewerScaffold';

interface GalleryViewerProps {
  id: string;
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  title: string | null;
  inputPreview: string | null;
  createdAt: string;
  upvoteCount: number;
}

/**
 * GalleryViewer — client component for the gallery detail page (GAL-06).
 *
 * Mirrors ShareViewer from Phase 7. Renders the artwork canvas from stored
 * parameter vector. No raw input ever displayed.
 */
export function GalleryViewer({
  id,
  parameterVector,
  versionInfo,
  styleName,
  title,
  inputPreview,
  createdAt,
  upvoteCount: initialUpvoteCount,
}: GalleryViewerProps) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const [scene, setScene] = useState<AnySceneGraph | null>(null);
  const [previewRevealed, setPreviewRevealed] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount);
  const [upvoted, setUpvoted] = useState(false);

  useEffect(() => {
    const upvotedIds = JSON.parse(localStorage.getItem('synesthesia-upvoted') ?? '[]') as string[];
    if (upvotedIds.includes(id)) setUpvoted(true);
  }, [id]);

  useEffect(() => {
    const seed = 'gallery-' + id + styleName + versionInfo.engineVersion;
    const palette = generatePalette(parameterVector, seed);

    let built: AnySceneGraph;
    switch (styleName) {
      case 'organic':
        built = buildOrganicSceneGraph(parameterVector, palette, theme, seed);
        break;
      case 'particle':
        built = buildParticleSceneGraph(parameterVector, palette, theme, seed, 800, 5000);
        break;
      case 'typographic':
        built = buildTypographicSceneGraph(parameterVector, palette, theme, seed, '');
        break;
      case 'geometric':
      default:
        built = buildSceneGraph(parameterVector, palette, theme, seed);
        break;
    }
    setScene(built);
  }, [parameterVector, styleName, versionInfo.engineVersion, theme, id]);

  async function handleUpvote() {
    if (upvoted) return;
    const res = await fetch(`/api/gallery/${id}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json() as { upvoteCount: number };
      setUpvoteCount(data.upvoteCount);
      setUpvoted(true);
      const upvotedIds = JSON.parse(localStorage.getItem('synesthesia-upvoted') ?? '[]') as string[];
      localStorage.setItem('synesthesia-upvoted', JSON.stringify([...upvotedIds, id]));
    }
  }

  function renderCanvas(s: AnySceneGraph) {
    switch (styleName) {
      case 'organic':
        return <OrganicCanvas scene={s as OrganicSceneGraph} animated={false} className="w-full max-w-2xl mx-auto block" />;
      case 'particle':
        return <ParticleCanvas scene={s as ParticleSceneGraph} animated={false} className="w-full max-w-2xl mx-auto block" />;
      case 'typographic':
        return <TypographicCanvas scene={s as TypographicSceneGraph} animated={false} className="w-full max-w-2xl mx-auto block" />;
      case 'geometric':
      default:
        return <GeometricCanvas scene={s as SceneGraph} animated={false} className="w-full max-w-2xl mx-auto block" />;
    }
  }

  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <BrandedViewerScaffold
      backHref="/gallery"
      backLabel="Back to Gallery"
      eyebrow="Collector viewer"
      title={title ?? 'Gallery edition'}
      description="A branded collector surface for public opt-in editions, carrying the same results-to-route action family with route-safe metadata, optional input-hint reveal, and gallery-specific engagement controls."
      badges={[
        { label: 'public opt-in archive' },
        { label: 'shared viewer family' },
        { label: 'gallery-safe actions' },
      ]}
      meta={[
        { label: 'Style', value: styleName },
        { label: 'Published', value: formattedDate },
        { label: 'Engine', value: `v${versionInfo.engineVersion}` },
        { label: 'Likes', value: `${upvoteCount}` },
      ]}
      canvasLabel="Collector render"
      canvas={scene ? renderCanvas(scene) : <div className="text-[var(--muted-foreground)]">Loading artwork...</div>}
      sidebarTitle="Parameter vector"
      sidebarDescription="Gallery detail keeps the same collector/viewer framing as results and share links while preserving gallery-only affordances and truthful public metadata."
      sidebar={
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {(Object.entries(parameterVector) as [string, number][])
            .filter(([key]) => key !== 'extensions')
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 rounded-2xl border border-[var(--border-soft)] bg-[color-mix(in_oklch,var(--surface)_62%,transparent)] px-3 py-2">
                <span className="text-[var(--muted-foreground)] capitalize">{key}</span>
                <span className="font-mono text-[var(--foreground)]">{value.toFixed(3)}</span>
              </div>
            ))}
        </div>
      }
      actions={
        <>
          {inputPreview ? (
            <div className="editorial-action-card space-y-3">
              <div>
                <p className="editorial-note-label mb-1">Input hint</p>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Reveal the optional contributor-approved hint for this gallery edition without exposing raw stored source text.
                </p>
              </div>
              {previewRevealed ? (
                <p className="text-sm italic text-[var(--muted-foreground)]">&quot;{inputPreview}&quot;</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPreviewRevealed(true)}
                  className="btn-ghost text-sm"
                >
                  Click to reveal input hint
                </button>
              )}
            </div>
          ) : null}

          <div className="editorial-action-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="editorial-note-label mb-1">Support the edition</p>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Public reactions stay route-local and keep this collector edition lightweight.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoted}
              className="btn-ghost text-sm disabled:opacity-50"
              aria-label={upvoted ? 'Already upvoted' : 'Upvote this artwork'}
            >
              {upvoted ? '♥' : '♡'} {upvoteCount} {upvoteCount === 1 ? 'like' : 'likes'}
            </button>
          </div>
        </>
      }
      footerNote={
        <p>
          The original input is not stored. This artwork represents parameters only, even when the gallery route offers an optional contributor-approved hint.
        </p>
      }
    />
  );
}
