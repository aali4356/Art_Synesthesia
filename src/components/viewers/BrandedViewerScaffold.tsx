import type { ReactNode } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { captureUnavailableState } from '@/lib/observability/server';

interface ViewerBadge {
  label: string;
}

interface ViewerMetaItem {
  label: string;
  value: string;
}

interface BrandedViewerScaffoldProps {
  backHref?: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  description: string;
  badges?: ViewerBadge[];
  meta?: ViewerMetaItem[];
  canvasLabel?: string;
  canvas: ReactNode;
  sidebarTitle: string;
  sidebarDescription: string;
  sidebar: ReactNode;
  footerNote: ReactNode;
  actions?: ReactNode;
}

export function BrandedViewerScaffold({
  backHref,
  backLabel,
  eyebrow,
  title,
  description,
  badges = [],
  meta = [],
  canvasLabel = 'Viewer stage',
  canvas,
  sidebarTitle,
  sidebarDescription,
  sidebar,
  footerNote,
  actions,
}: BrandedViewerScaffoldProps) {
  return (
    <Shell>
      <section className="editorial-stage space-y-8" aria-labelledby="viewer-title">
        <div className="space-y-6 max-w-5xl">
          {backHref && backLabel ? (
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              <span aria-hidden="true">←</span>
              <span>{backLabel}</span>
            </Link>
          ) : null}

          <div className="space-y-4">
            <p className="editorial-kicker">{eyebrow}</p>
            <h1 id="viewer-title" className="editorial-display text-4xl sm:text-5xl lg:text-6xl leading-[0.94]">
              {title}
            </h1>
            <p className="max-w-3xl text-base sm:text-lg text-[var(--foreground)]/88 leading-relaxed">
              {description}
            </p>
          </div>

          {badges.length > 0 ? (
            <div className="editorial-marquee" aria-label="Viewer traits">
              {badges.map((badge) => (
                <span key={badge.label}>{badge.label}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="editorial-viewer-grid">
          <div className="space-y-6">
            <section className="editorial-panel editorial-control-surface space-y-4" aria-labelledby="viewer-stage-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="editorial-note-label mb-1">Viewer stage</p>
                  <h2 id="viewer-stage-title" className="text-xl font-medium text-[var(--foreground)]">
                    {canvasLabel}
                  </h2>
                </div>
                {meta.length > 0 ? (
                  <div className="editorial-chip-stack" aria-hidden="true">
                    {meta.map((item) => (
                      <span key={`${item.label}-${item.value}`} className="editorial-chip">
                        {item.label} · {item.value}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="editorial-panel editorial-canvas-frame editorial-viewer-canvas min-h-[340px] sm:min-h-[420px] flex items-center justify-center">
                {canvas}
              </div>
            </section>

            {actions ? (
              <section className="editorial-panel editorial-control-surface space-y-4" aria-labelledby="viewer-actions-title">
                <div>
                  <p className="editorial-note-label mb-1">Action desk</p>
                  <h2 id="viewer-actions-title" className="text-xl font-medium text-[var(--foreground)]">
                    Route-specific controls
                  </h2>
                </div>
                <div className="space-y-4">{actions}</div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="editorial-panel editorial-control-surface space-y-4" aria-labelledby="viewer-sidebar-title">
              <div className="space-y-2">
                <p className="editorial-note-label">Collector metadata</p>
                <h2 id="viewer-sidebar-title" className="text-xl font-medium text-[var(--foreground)]">
                  {sidebarTitle}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {sidebarDescription}
                </p>
              </div>

              {meta.length > 0 ? (
                <dl className="editorial-meta-list">
                  {meta.map((item) => (
                    <div key={`${item.label}-${item.value}`} className="editorial-meta-row">
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="editorial-support-panel space-y-3">{sidebar}</div>
            </section>

            <section className="editorial-note-card space-y-3">
              <p className="editorial-note-label">Privacy posture</p>
              <div className="text-sm leading-relaxed text-[var(--muted-foreground)]">{footerNote}</div>
            </section>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

interface BrandedUnavailableStateProps {
  title: string;
  description: string;
  diagnosticLabel: string;
  diagnosticMessage: string;
  observability?: {
    routeFamily: 'share' | 'gallery' | 'unknown';
    unavailableCategory: string;
    statusBucket?: '4xx' | '5xx';
    localProofMode?: boolean;
    viewerSurface?: 'detail' | 'viewer';
  };
}

export function BrandedUnavailableState({
  title,
  description,
  diagnosticLabel,
  diagnosticMessage,
  observability,
}: BrandedUnavailableStateProps) {
  if (observability) {
    captureUnavailableState(observability);
  }

  return (
    <Shell>
      <section className="editorial-stage max-w-4xl" aria-labelledby="viewer-unavailable-title">
        <div className="editorial-panel editorial-control-surface space-y-6">
          <div className="space-y-3">
            <p className="editorial-note-label">Unavailable state</p>
            <h1 id="viewer-unavailable-title" className="editorial-display text-4xl sm:text-5xl leading-[0.96]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              {description}
            </p>
          </div>

          <div className="editorial-viewer-unavailable-grid">
            <div className="editorial-support-panel space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">{diagnosticLabel}</p>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{diagnosticMessage}</p>
            </div>
            <div className="editorial-note-card space-y-2">
              <p className="editorial-note-label">Proof surface</p>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Truthful diagnostics stay visible so missing DB-backed routes never fail silently.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
