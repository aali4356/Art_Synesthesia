'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { GalleryCard } from './GalleryCard';
import { GalleryFilters } from './GalleryFilters';
import type { GalleryItem } from '@/db/schema/gallery-items';

interface GalleryGridProps {
  items: GalleryItem[];
  currentStyle?: string;
  currentSort: string;
  currentPage: number;
  hasMore: boolean;
}

function buildGalleryHref(style: string | undefined, sort: string, page: number) {
  const params = new URLSearchParams();
  if (style) {
    params.set('style', style);
  }
  if (sort !== 'recent') {
    params.set('sort', sort);
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const query = params.toString();
  return query ? `/gallery?${query}` : '/gallery';
}

/**
 * GalleryGrid — client wrapper for the gallery browse grid.
 *
 * Renders filter controls, item grid (GAL-03), and pagination links.
 * GalleryFilters uses useSearchParams so it is wrapped in Suspense.
 */
export function GalleryGrid({
  items,
  currentStyle,
  currentSort,
  currentPage,
  hasMore,
}: GalleryGridProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <GalleryFilters currentStyle={currentStyle} currentSort={currentSort} />
      </Suspense>

      {items.length === 0 ? (
        <section className="editorial-panel editorial-control-surface" aria-labelledby="gallery-empty-title">
          <div className="space-y-4 max-w-2xl">
            <p className="editorial-note-label">Archive status</p>
            <h2 id="gallery-empty-title" className="text-2xl font-medium text-[var(--foreground)]">
              No artwork found.
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              Generate something and save it to the gallery to populate this collector view.
            </p>
            <div className="editorial-chip-stack" aria-hidden="true">
              <span className="editorial-chip">empty archive</span>
              <span className="editorial-chip">routing preserved</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4" aria-labelledby="gallery-results-title">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="editorial-note-label mb-1">Browse surface</p>
              <h2 id="gallery-results-title" className="text-2xl font-medium text-[var(--foreground)]">
                Public archive editions
              </h2>
            </div>
            <div className="editorial-chip-stack" aria-label="Gallery result metadata">
              <span className="editorial-chip">{items.length} visible</span>
              <span className="editorial-chip">page {currentPage}</span>
              <span className="editorial-chip">{currentStyle ?? 'all styles'}</span>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            data-testid="gallery-grid"
          >
            {items.map((item) => (
              <GalleryCard
                key={item.id}
                id={item.id}
                styleName={item.styleName}
                title={item.title ?? null}
                inputPreview={item.inputPreview ?? null}
                thumbnailData={item.thumbnailData ?? null}
                creatorToken={item.creatorToken ?? null}
                createdAt={item.createdAt.toISOString()}
                upvoteCount={item.upvoteCount}
                reportCount={item.reportCount}
              />
            ))}
          </div>
        </section>
      )}

      <section className="editorial-panel editorial-control-surface" aria-labelledby="gallery-pagination-title">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="editorial-note-label mb-1">Page controls</p>
            <h2 id="gallery-pagination-title" className="text-lg font-medium text-[var(--foreground)]">
              Move through the collector archive.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {currentPage > 1 ? (
              <Link
                href={buildGalleryHref(currentStyle, currentSort, currentPage - 1)}
                className="btn-ghost text-sm"
              >
                Previous
              </Link>
            ) : (
              <span className="editorial-pagination-placeholder" aria-hidden="true" />
            )}
            {hasMore ? (
              <Link
                href={buildGalleryHref(currentStyle, currentSort, currentPage + 1)}
                className="btn-ghost text-sm"
              >
                Next
              </Link>
            ) : (
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                End of current proof set
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
