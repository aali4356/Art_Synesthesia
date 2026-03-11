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
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Shared Artwork</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Style: <span className="capitalize">{styleName}</span>
            {' · '}
            Created {createdDate}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Engine v{versionInfo.engineVersion} · Analyzer v{versionInfo.analyzerVersion}
          </p>
        </header>

        {/* Canvas section -- renders the artwork */}
        <section className="mb-6">
          {scene ? renderCanvas(scene, styleName) : <div>Loading artwork...</div>}
        </section>

        {/* Parameter section -- keeps existing parameter grid */}
        <section className="mb-6 p-4 rounded-lg border border-border">
          <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted-foreground">
            Parameter Vector
          </h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {(Object.entries(parameterVector) as [string, number][])
              .filter(([key]) => key !== 'extensions')
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-mono">{value.toFixed(3)}</span>
                </div>
              ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          The original input that generated this artwork is not stored or shown.
          Share links store only the parameter vector used to render the artwork.
        </p>
      </div>
    </div>
  );
}
