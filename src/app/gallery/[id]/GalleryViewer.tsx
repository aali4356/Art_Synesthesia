'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const theme = resolvedTheme ?? 'dark';
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
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to Gallery
          </Link>
        </div>

        <header className="mb-6">
          {title && <h1 className="text-2xl font-semibold">{title}</h1>}
          <p className="text-sm text-muted-foreground mt-1">
            Style: <span className="capitalize">{styleName}</span>
            {' · '}
            {formattedDate}
          </p>

          {/* Input preview (hidden by default — GAL-04) */}
          {inputPreview && (
            <div className="mt-2">
              {previewRevealed ? (
                <p className="text-sm text-muted-foreground italic">&quot;{inputPreview}&quot;</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPreviewRevealed(true)}
                  className="text-sm text-accent underline"
                >
                  Click to reveal input hint
                </button>
              )}
            </div>
          )}
        </header>

        {/* Canvas */}
        <section className="mb-6">
          {scene ? renderCanvas(scene) : <div className="text-muted-foreground">Loading artwork...</div>}
        </section>

        {/* Upvote */}
        <div className="mb-6">
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

        <p className="text-xs text-muted-foreground">
          The original input is not stored. This artwork represents parameters only.
        </p>
      </div>
    </div>
  );
}
