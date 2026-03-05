import { describe, it, expect } from 'vitest';
import { shareLinks } from '@/db/schema/share-links';
import { analysisCache } from '@/db/schema/analysis-cache';
import { renderCache } from '@/db/schema/render-cache';
import { urlSnapshots } from '@/db/schema/url-snapshots';

// Helper: extract column names from a Drizzle table object
function getColumnNames(table: Record<string, unknown>): string[] {
  return Object.entries(table)
    .filter(([, v]) => v !== null && typeof v === 'object' && 'name' in (v as object))
    .map(([, v]) => (v as { name: string }).name);
}

const BANNED_COLUMNS = ['raw_input', 'input_text', 'raw_text', 'user_input'];

describe('Database schema — INFRA-01', () => {
  describe('share_links table', () => {
    it('has required columns', () => {
      const cols = getColumnNames(shareLinks as unknown as Record<string, unknown>);
      expect(cols).toContain('id');
      expect(cols).toContain('parameter_vector');
      expect(cols).toContain('version_info');
      expect(cols).toContain('style_name');
      expect(cols).toContain('created_at');
    });

    it('does not contain raw input columns (PRIV-03)', () => {
      const cols = getColumnNames(shareLinks as unknown as Record<string, unknown>);
      for (const banned of BANNED_COLUMNS) {
        expect(cols).not.toContain(banned);
      }
    });
  });

  describe('analysis_cache table', () => {
    it('has required columns including expires_at (INFRA-02)', () => {
      const cols = getColumnNames(analysisCache as unknown as Record<string, unknown>);
      expect(cols).toContain('cache_key');
      expect(cols).toContain('parameter_vector');
      expect(cols).toContain('provenance');
      expect(cols).toContain('expires_at');
      expect(cols).toContain('access_count');
    });

    it('does not contain raw input columns (PRIV-03)', () => {
      const cols = getColumnNames(analysisCache as unknown as Record<string, unknown>);
      for (const banned of BANNED_COLUMNS) {
        expect(cols).not.toContain(banned);
      }
    });
  });

  describe('render_cache table', () => {
    it('has required columns including expires_at (INFRA-03)', () => {
      const cols = getColumnNames(renderCache as unknown as Record<string, unknown>);
      expect(cols).toContain('cache_key');
      expect(cols).toContain('resolution');
      expect(cols).toContain('style_name');
      expect(cols).toContain('render_data');
      expect(cols).toContain('expires_at');
    });

    it('does not contain raw input columns (PRIV-03)', () => {
      const cols = getColumnNames(renderCache as unknown as Record<string, unknown>);
      for (const banned of BANNED_COLUMNS) {
        expect(cols).not.toContain(banned);
      }
    });
  });

  describe('url_snapshots table', () => {
    it('has required columns (INFRA-04)', () => {
      const cols = getColumnNames(urlSnapshots as unknown as Record<string, unknown>);
      expect(cols).toContain('canonical_url');
      expect(cols).toContain('signals');
      expect(cols).toContain('title');
      expect(cols).toContain('metadata');
      expect(cols).toContain('snapshot_timestamp');
    });

    it('does NOT have expires_at (snapshots are permanent until re-fetch)', () => {
      const cols = getColumnNames(urlSnapshots as unknown as Record<string, unknown>);
      expect(cols).not.toContain('expires_at');
    });

    it('does not contain raw input columns (PRIV-03)', () => {
      const cols = getColumnNames(urlSnapshots as unknown as Record<string, unknown>);
      for (const banned of BANNED_COLUMNS) {
        expect(cols).not.toContain(banned);
      }
    });
  });
});
