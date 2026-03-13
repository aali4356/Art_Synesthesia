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

interface ShareViewerProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  createdAt: string;
}

/**
 * ShareViewer renders artwork from a share link.
 *
 * Privacy contract (SHARE-02, SHARE-03):
 * - Receives ONLY parameterVector, versionInfo, styleName, createdAt
 * - No raw input text is ever passed to this component
 * - The original input is NOT shown (it was never stored on the server)
 *
 * The scene is rebuilt from the stored parameter vector using a placeholder
 * seed. The rendered artwork authentically represents the stored parameters
 * but may not be pixel-identical to the creator's original view (the original
 * PRNG seed is not stored).
 */
export function ShareViewer({
  parameterVector,
  versionInfo,
  styleName,
  createdAt,
}: ShareViewerProps) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const [scene, setScene] = useState<AnySceneGraph | null>(null);

  useEffect(() => {
    const seed = 'share-' + styleName + versionInfo.engineVersion;
    const palette = generatePalette(parameterVector, seed);

    let built: AnySceneGraph;
    switch (styleName) {
      case 'organic':
        built = buildOrganicSceneGraph(parameterVector, palette, theme, seed);
        break;
      case 'particle':
        built = buildParticleSceneGraph(parameterVector, palette, theme, seed, 800, 10000);
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
  }, [parameterVector, styleName, versionInfo.engineVersion, theme]);

  function renderCanvas(s: AnySceneGraph, style: string) {
    switch (style) {
      case 'organic':
        return (
          <OrganicCanvas
            scene={s as OrganicSceneGraph}
            animated={false}
            className="w-full max-w-2xl mx-auto block"
          />
        );
      case 'particle':
        return (
          <ParticleCanvas
            scene={s as ParticleSceneGraph}
            animated={false}
            className="w-full max-w-2xl mx-auto block"
          />
        );
      case 'typographic':
        return (
          <TypographicCanvas
            scene={s as TypographicSceneGraph}
            animated={false}
            className="w-full max-w-2xl mx-auto block"
          />
        );
      case 'geometric':
      default:
        return (
          <GeometricCanvas
            scene={s as SceneGraph}
            animated={false}
            className="w-full max-w-2xl mx-auto block"
          />
        );
    }
  }

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BrandedViewerScaffold
      eyebrow="Shared viewer"
      title="Shared artwork"
      description="A privacy-safe collector surface for viewing parameter-only editions outside the original generation session."
      badges={[
        { label: 'parameter-only payload' },
        { label: 'shared viewer family' },
        { label: 'privacy-safe diagnostics' },
      ]}
      meta={[
        { label: 'Style', value: styleName },
        { label: 'Created', value: createdDate },
        { label: 'Engine', value: `v${versionInfo.engineVersion}` },
        { label: 'Analyzer', value: `v${versionInfo.analyzerVersion}` },
      ]}
      canvasLabel="Shared collector render"
      canvas={scene ? renderCanvas(scene, styleName) : <div className="text-[var(--muted-foreground)]">Loading artwork...</div>}
      sidebarTitle="Parameter vector"
      sidebarDescription="The share route exposes the stored rendering parameters and version metadata without revealing any original source text."
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
      footerNote={
        <p>
          The original input that generated this artwork is not stored or shown. Share links store only the parameter vector used to render the artwork.
        </p>
      }
    />
  );
}
