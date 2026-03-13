'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const STYLES = ['all', 'geometric', 'organic', 'particle', 'typographic'] as const;
const SORTS = ['recent', 'popular'] as const;

interface GalleryFiltersProps {
  currentStyle?: string;
  currentSort: string;
}

/**
 * GalleryFilters — client component for style filter + sort selector (GAL-05).
 * Navigates using search params on change; server re-renders with new filters.
 */
export function GalleryFilters({ currentStyle, currentSort }: GalleryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all' || value === 'recent') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page'); // reset pagination on filter change
      const query = params.toString();
      router.push(query ? `/gallery?${query}` : '/gallery');
    },
    [router, searchParams]
  );

  return (
    <section className="editorial-panel editorial-control-surface space-y-5" aria-labelledby="gallery-filter-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="editorial-note-label mb-1">Filter desk</p>
          <h2 id="gallery-filter-heading" className="text-xl font-medium text-[var(--foreground)]">
            Shape the archive view.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)] leading-relaxed">
            Filter renderer families and reorder the browse surface without changing the underlying gallery route behavior.
          </p>
        </div>
        <div className="editorial-chip-stack" aria-hidden="true">
          <span className="editorial-chip">route-stable filters</span>
          <span className="editorial-chip">page resets on change</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="editorial-filter-group">
          <label htmlFor="gallery-style-filter" className="editorial-field-label">
            Style filter
          </label>
          <select
            id="gallery-style-filter"
            value={currentStyle ?? 'all'}
            onChange={(e) => navigate('style', e.target.value)}
            className="editorial-select"
            aria-label="Filter by style"
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="editorial-filter-group">
          <label htmlFor="gallery-sort" className="editorial-field-label">
            Sort order
          </label>
          <select
            id="gallery-sort"
            value={currentSort}
            onChange={(e) => navigate('sort', e.target.value)}
            className="editorial-select"
            aria-label="Sort gallery"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
