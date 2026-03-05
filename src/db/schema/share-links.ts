import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import type { ParameterVector, VersionInfo } from '@/types/engine';

/**
 * Stores share links for generated artwork.
 *
 * Privacy contract (PRIV-02, PRIV-03):
 * - NO raw input text column
 * - Stores ONLY parameter vector, version info, and style name
 * - Share link recipient sees artwork but never the original input
 */
export const shareLinks = pgTable(
  'share_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parameterVector: jsonb('parameter_vector')
      .$type<ParameterVector>()
      .notNull(),
    versionInfo: jsonb('version_info').$type<VersionInfo>().notNull(),
    styleName: text('style_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('share_links_created_at_idx').on(table.createdAt)]
);

export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
