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
    <div>
      {/* Filter controls (GAL-05) */}
      <Suspense fallback={null}>
        <GalleryFilters currentStyle={currentStyle} currentSort={currentSort} />
      </Suspense>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No artwork found.</p>
          <p className="text-sm mt-1">Generate something and save it to the gallery!</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-8">
        {currentPage > 1 ? (
          <Link
            href={`/gallery?style=${currentStyle ?? ''}&sort=${currentSort}&page=${currentPage - 1}`}
            className="text-sm btn-ghost"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link
            href={`/gallery?style=${currentStyle ?? ''}&sort=${currentSort}&page=${currentPage + 1}`}
            className="text-sm btn-ghost ml-auto"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
