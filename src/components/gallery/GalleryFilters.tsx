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
      router.push(`/gallery?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex gap-4 items-center mb-6 flex-wrap">
      {/* Style filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="gallery-style-filter" className="text-sm text-muted-foreground">
          Style
        </label>
        <select
          id="gallery-style-filter"
          value={currentStyle ?? 'all'}
          onChange={(e) => navigate('style', e.target.value)}
          className="border border-border rounded px-2 py-1 text-sm bg-background"
          aria-label="Filter by style"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Sort selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="gallery-sort" className="text-sm text-muted-foreground">
          Sort
        </label>
        <select
          id="gallery-sort"
          value={currentSort}
          onChange={(e) => navigate('sort', e.target.value)}
          className="border border-border rounded px-2 py-1 text-sm bg-background"
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
  );
}
