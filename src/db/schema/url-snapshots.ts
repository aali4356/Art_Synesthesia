import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * URL snapshot cache.
 *
 * INFRA-04: Keyed by canonicalized URL (canonical_url). Permanent until
 * explicitly re-fetched. No expires_at -- these are permanent snapshots.
 *
 * Migrates the in-memory snapshotCache from src/app/api/analyze-url/route.ts.
 */
export const urlSnapshots = pgTable(
  'url_snapshots',
  {
    /** Canonicalized URL -- the primary key and lookup key */
    canonicalUrl: text('canonical_url').primaryKey(),
    /** All extracted analysis signals */
    signals: jsonb('signals').$type<Record<string, number>>().notNull(),
    /** Page title from <title> or og:title */
    title: text('title').notNull(),
    /** Structured metadata: linkCount, imageCount, dominantColors */
    metadata: jsonb('metadata')
      .$type<{
        linkCount: number;
        imageCount: number;
        dominantColors: string[];
      }>()
      .notNull(),
    snapshotTimestamp: timestamp('snapshot_timestamp', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('url_snapshots_timestamp_idx').on(table.snapshotTimestamp),
  ]
);

export type UrlSnapshot = typeof urlSnapshots.$inferSelect;
export type NewUrlSnapshot = typeof urlSnapshots.$inferInsert;
