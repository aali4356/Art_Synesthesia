'use client';

import type { ParameterVector, VersionInfo } from '@/types/engine';

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
 */
export function ShareViewer({
  parameterVector,
  versionInfo,
  styleName,
  createdAt,
}: ShareViewerProps) {
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

        {/* Parameter summary -- shows what was used, not the original input */}
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
