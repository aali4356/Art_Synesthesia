import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import type { ParameterVector, ParameterProvenance } from '@/types/engine';

/**
 * Analysis result cache.
 *
 * INFRA-02: Keyed by inputHash + analyzerVersion + normalizerVersion.
 * TTL: 7 days for anonymous requests; gallery-linked entries set
 * expiresAt far in the future (permanent) at the application layer.
 *
 * Privacy contract: No raw input stored. cacheKey is the hash, not the input.
 */
export const analysisCache = pgTable(
  'analysis_cache',
  {
    /** Composite key: result of analysisKey(inputHash, version) from src/lib/cache/keys.ts */
    cacheKey: text('cache_key').primaryKey(),
    parameterVector: jsonb('parameter_vector')
      .$type<ParameterVector>()
      .notNull(),
    provenance: jsonb('provenance')
      .$type<ParameterProvenance[]>()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** 7-day TTL for anonymous; set to far future (e.g. year 9999) for permanent gallery entries */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    accessCount: integer('access_count').default(0).notNull(),
  },
  (table) => [index('analysis_cache_expires_at_idx').on(table.expiresAt)]
);

export type AnalysisCacheEntry = typeof analysisCache.$inferSelect;
export type NewAnalysisCacheEntry = typeof analysisCache.$inferInsert;
