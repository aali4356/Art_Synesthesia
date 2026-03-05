import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import type { ParameterVector, VersionInfo } from '@/types/engine';

/**
 * Stores gallery entries saved by users (opt-in only, GAL-01).
 *
 * Privacy contract (PRIV-03):
 * - No column stores the user's verbatim input (banned names: see no-raw-input.test.ts)
 * - input_preview is a max-50-char user-edited summary, NOT the verbatim input
 * - Stores parameters, metadata, version info, and thumbnail only
 *
 * Phase 7 stub: table definition present for INFRA-01.
 * Phase 8 wires the gallery API to write/read this table.
 */
export const galleryItems = pgTable(
  'gallery_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parameterVector: jsonb('parameter_vector')
      .$type<ParameterVector>()
      .notNull(),
    versionInfo: jsonb('version_info').$type<VersionInfo>().notNull(),
    styleName: text('style_name').notNull(),
    /** Optional user-provided title (SEC-05: profanity-filtered before save) */
    title: text('title'),
    /**
     * Optional 50-char user-edited preview of what was analyzed.
     * This is NOT verbatim input — it is a user-provided summary the user
     * chooses to make public. Verbatim input is never stored (PRIV-03).
     */
    inputPreview: text('input_preview'),
    /** Base64-encoded PNG thumbnail (~200x200) for gallery grid display */
    thumbnailData: text('thumbnail_data'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** Number of reports received; items with 3+ are flagged (SEC-06) */
    reportCount: integer('report_count').default(0).notNull(),
    /** True when reportCount >= REPORT_FLAG_THRESHOLD (SEC-06) */
    flagged: boolean('flagged').default(false).notNull(),
  },
  (table) => [
    index('gallery_items_created_at_idx').on(table.createdAt),
    index('gallery_items_style_name_idx').on(table.styleName),
    index('gallery_items_flagged_idx').on(table.flagged),
  ]
);

export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;
