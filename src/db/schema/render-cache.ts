import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Render result cache.
 *
 * INFRA-03: Keyed by full version + style + resolution (renderKey from cache/keys.ts).
 * TTL: 24h for thumbnails; 7 days for full renders (distinguished by resolution at app layer).
 */
export const renderCache = pgTable(
  'render_cache',
  {
    /** Composite key: result of renderKey(inputHash, version, styleName, resolution) */
    cacheKey: text('cache_key').primaryKey(),
    /** Resolution in pixels (e.g. 200 for thumbnail, 800 for full render, 4096 for export) */
    resolution: integer('resolution').notNull(),
    styleName: text('style_name').notNull(),
    /** Serialized scene graph or render output -- never raw input */
    renderData: jsonb('render_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** 24h for thumbnails (resolution<=200), 7d for full renders */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    accessCount: integer('access_count').default(0).notNull(),
  },
  (table) => [index('render_cache_expires_at_idx').on(table.expiresAt)]
);

export type RenderCacheEntry = typeof renderCache.$inferSelect;
export type NewRenderCacheEntry = typeof renderCache.$inferInsert;
