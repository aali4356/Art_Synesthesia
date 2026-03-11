# Phase 7: Database, Sharing & Privacy - Research

**Researched:** 2026-03-04
**Domain:** PostgreSQL database, share links, caching infrastructure, privacy model, content moderation
**Confidence:** HIGH

## Summary

Phase 7 introduces the first persistent storage layer to the Synesthesia Machine. The core challenge is storing just enough data for share links, caching, and gallery (Phase 8 prep) while enforcing a strict privacy contract: raw user input is never stored server-side. The existing codebase already has in-memory caching (URL snapshot cache in `src/app/api/analyze-url/route.ts`), cache key functions (`src/lib/cache/keys.ts`), and a well-defined `ParameterVector` type with `VersionInfo` -- all of which need to migrate to PostgreSQL-backed persistence.

The stack is clear: Drizzle ORM (stable release, ~0.45.x) with the Neon serverless driver (`@neondatabase/serverless`) for Vercel deployment compatibility. Vercel Postgres has been deprecated in favor of Neon's native integration, so going directly with Neon is the correct path. TTL-based cache expiry will use a scheduled cleanup approach (application-level cron or Vercel Cron) rather than PostgreSQL extensions, keeping the deployment simple. Share links use `crypto.randomUUID()` in API routes to generate v4 UUIDs stored alongside the parameter vector, version info, and style name -- never the raw input.

**Primary recommendation:** Use Drizzle ORM 0.45.x + `@neondatabase/serverless` + `drizzle-orm/neon-http` driver, with 4 core tables (share_links, analysis_cache, render_cache, url_snapshots), and a client-side privacy gate that prevents server requests when local-only mode is active.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | PostgreSQL database via Drizzle ORM for gallery, cached analyses, version tracking | Drizzle ORM schema patterns, Neon serverless driver, table design |
| INFRA-02 | Analysis cache keyed by inputHash + versions with 7-day TTL for anonymous, permanent for gallery | Cache key functions already exist in `src/lib/cache/keys.ts`; TTL via `expiresAt` timestamp column + cleanup job |
| INFRA-03 | Render cache keyed by full version + style + resolution with 24h TTL for thumbnails, 7 days for full renders | Same cache key pattern; separate TTL values per use case |
| INFRA-04 | URL snapshot cache keyed by canonicalizedUrl + timestamp, permanent until re-fetch | Migrates existing in-memory `snapshotCache` Map to DB table |
| SHARE-01 | User can generate share link with random UUID; stores only parameter vector, version info, and style | `crypto.randomUUID()` in API route; JSONB column for vector; no raw input column |
| SHARE-02 | Share link recipient sees artwork, parameter panel, and metadata but NOT original input text | `/share/[id]` dynamic route loads vector + version + style; re-renders client-side |
| SHARE-03 | Original input only shown to creator if they have the generation in their session | Session-scoped state only (React state / sessionStorage); never fetched from server |
| PRIV-01 | Generating art does not publish anything; it is local and ephemeral | Default flow stays client-side; share/save are explicit opt-in actions |
| PRIV-02 | Raw input text never logged server-side beyond duration of analysis request | API routes process-and-forget; no raw text column in any DB table |
| PRIV-03 | Gallery entries store parameters, metadata, version info, thumbnail -- NOT raw input | Gallery table schema enforces this structurally (no raw_input column) |
| PRIV-04 | Local-only mode for text: analysis runs client-side, no server requests except initial page load, lock icon indicator | `useTextAnalysis` already runs entirely client-side; add explicit gate + lock icon state |
| SEC-04 | Gallery rate limiting: max 10 saves per IP per day | Rate limiter pattern already established in URL analysis route; adapt for gallery |
| SEC-05 | Profanity/abuse filter on gallery titles and visible input previews | `obscenity` library with `englishDataset` + `englishRecommendedTransformers` |
| SEC-06 | Gallery items flagged for review after 3 reports; admin route to review and remove | `report_count` column + `flagged` boolean; `/admin/review` protected route |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.x | Type-safe ORM for PostgreSQL | SQL-like API with full TypeScript inference; no code generation; works with Neon serverless |
| drizzle-kit | ^0.31.x | Schema migrations CLI | Generates SQL migrations from TypeScript schema; `push` for dev, `migrate` for prod |
| @neondatabase/serverless | ^0.10.x | Serverless PostgreSQL driver | HTTP-based queries for Vercel serverless functions; Vercel's recommended Postgres solution |
| obscenity | ^0.4.x | Profanity/abuse filter | Transformer-based design catches Unicode evasion, variant spelling; better than `bad-words` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | ^16.x | Environment variable loading | Dev-only; Vercel injects env vars in production |
| pg | ^8.x | Node-postgres driver (optional) | Only if local dev needs direct TCP connection instead of Neon HTTP |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Neon serverless | Vercel Postgres (@vercel/postgres) | Vercel Postgres is deprecated; Neon is the replacement |
| Neon serverless | pg (node-postgres) | pg uses TCP, incompatible with Vercel Edge; Neon HTTP works everywhere |
| drizzle-orm | Prisma | Prisma has heavier runtime, code generation step, larger bundle; Drizzle is lighter and SQL-native |
| obscenity | bad-words | bad-words last updated 2+ years ago, no transformer support for Unicode evasion |

**Installation:**
```bash
npm install drizzle-orm @neondatabase/serverless obscenity dotenv
npm install -D drizzle-kit
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── index.ts              # Drizzle client singleton (neon-http driver)
│   ├── schema/
│   │   ├── share-links.ts    # share_links table
│   │   ├── analysis-cache.ts # analysis_cache table
│   │   ├── render-cache.ts   # render_cache table
│   │   ├── url-snapshots.ts  # url_snapshots table
│   │   ├── gallery.ts        # gallery_items table (prep for Phase 8)
│   │   └── index.ts          # Re-export all tables
│   └── migrate.ts            # Migration runner script
├── app/
│   ├── api/
│   │   ├── share/
│   │   │   └── route.ts      # POST: create share link
│   │   ├── share/[id]/
│   │   │   └── route.ts      # GET: resolve share link
│   │   ├── cache/
│   │   │   └── route.ts      # GET/PUT: analysis + render cache
│   │   └── cron/
│   │       └── cleanup/
│   │           └── route.ts  # Vercel Cron: TTL cleanup
│   └── share/
│       └── [id]/
│           └── page.tsx       # Share link viewer page (Server Component)
├── lib/
│   ├── cache/
│   │   ├── index.ts           # Existing re-exports
│   │   ├── keys.ts            # Existing cache key functions
│   │   └── db-cache.ts        # DB-backed cache read/write functions
│   └── moderation/
│       └── profanity.ts       # Obscenity filter singleton
drizzle/                       # Generated migration SQL files
drizzle.config.ts              # Drizzle Kit configuration
```

### Pattern 1: Drizzle Client Singleton
**What:** Single database connection instance shared across all API routes
**When to use:** Every server-side database operation
**Example:**
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

### Pattern 2: Share Link Data Flow
**What:** Create share link stores only parameter vector, version, and style; viewer reconstructs artwork client-side
**When to use:** User clicks "Share" on their generated artwork
**Example:**
```typescript
// POST /api/share — creates share link
import { db } from '@/db';
import { shareLinks } from '@/db/schema';

export async function POST(request: Request) {
  const { vector, version, style } = await request.json();
  const id = crypto.randomUUID();
  await db.insert(shareLinks).values({
    id,
    parameterVector: vector,  // JSONB
    versionInfo: version,     // JSONB
    styleName: style,
    createdAt: new Date(),
  });
  return Response.json({ shareId: id, url: `/share/${id}` });
}
```

### Pattern 3: Privacy-First Local Analysis
**What:** Text analysis runs entirely in the browser; server is never contacted
**When to use:** All text input analysis (already implemented this way)
**Example:**
```typescript
// The existing useTextAnalysis hook already runs client-side:
// canonicalizeText -> analyzeText -> computeParameterVector -> generatePalette
// No fetch() calls. This IS the local-only mode.
// Phase 7 adds: explicit UI indicator (lock icon) + prevents accidental server calls
```

### Pattern 4: TTL Cache with Cleanup
**What:** Cached rows include `expires_at` timestamp; Vercel Cron job deletes expired rows
**When to use:** Analysis cache (7-day TTL), render cache (24h thumbnails, 7d full renders)
**Example:**
```typescript
// Vercel Cron: /api/cron/cleanup/route.ts
import { db } from '@/db';
import { analysisCache, renderCache } from '@/db/schema';
import { lt } from 'drizzle-orm';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  await db.delete(analysisCache).where(lt(analysisCache.expiresAt, now));
  await db.delete(renderCache).where(lt(renderCache.expiresAt, now));

  return Response.json({ status: 'ok' });
}
```

### Pattern 5: Share Viewer Server Component
**What:** `/share/[id]` page fetches share data on server, passes to client components
**When to use:** When someone opens a share link
**Example:**
```typescript
// src/app/share/[id]/page.tsx
import { db } from '@/db';
import { shareLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ShareViewer } from './ShareViewer';

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.id, id),
  });

  if (!link) return <div>Share link not found</div>;

  return (
    <ShareViewer
      vector={link.parameterVector}
      version={link.versionInfo}
      style={link.styleName}
    />
  );
}
```

### Anti-Patterns to Avoid
- **Storing raw input text in the database:** The privacy contract explicitly forbids this. Share links store only parameter vectors. Gallery items store optional titles and 50-char previews (user-edited), never raw input.
- **Using `pg` driver in Vercel serverless:** TCP connections don't work well in serverless; use Neon's HTTP driver.
- **Running migrations in API routes:** Migrations run via `drizzle-kit push` (dev) or `drizzle-kit migrate` (CI/CD), never at runtime.
- **In-memory rate limiting for gallery saves:** The existing in-memory rate limiter for URL analysis resets on each serverless cold start. For SEC-04 (gallery saves), use a database-backed counter or Vercel KV if strict enforcement is needed. However, for a portfolio project with low traffic, in-memory is acceptable initially.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generation | `crypto.randomUUID()` | Built into Node.js, cryptographically secure, RFC 4122 v4 compliant |
| Profanity detection | Regex word list | `obscenity` library | Unicode evasion, variant spelling, false positive reduction require specialized algorithms |
| Database migrations | Manual ALTER TABLE SQL | `drizzle-kit generate` + `drizzle-kit migrate` | Type-safe, diffable, reversible schema changes |
| Cache key computation | New key format | Existing `analysisKey()` and `renderKey()` from `src/lib/cache/keys.ts` | Already tested, already matches CORE-05 and CORE-06 specs |
| JSONB type safety | Manual casting | Drizzle `jsonb().$type<T>()` | Compile-time type checking on insert/select |

**Key insight:** The existing codebase already has the hardest pieces solved: cache key generation, fully client-side text analysis, and the ParameterVector type. Phase 7 is primarily about wrapping these in database persistence and adding the share link flow.

## Common Pitfalls

### Pitfall 1: Accidentally Storing Raw Input
**What goes wrong:** A developer adds a `rawInput` column for debugging, or logs request bodies server-side
**Why it happens:** Natural instinct to store inputs for reproducibility; debugging convenience
**How to avoid:** No column named `raw_input`, `input_text`, or similar in any table. Code review rule: any PR touching `/db/schema/` must verify no raw input columns exist. API routes must not log request bodies.
**Warning signs:** Any `text()` column without a clear non-input purpose

### Pitfall 2: Neon Connection String Mismatch
**What goes wrong:** Using `pg` driver import with Neon HTTP connection string, or vice versa
**Why it happens:** Multiple Drizzle driver imports exist (`drizzle-orm/node-postgres`, `drizzle-orm/neon-http`, `drizzle-orm/neon-serverless`)
**How to avoid:** Use exactly `drizzle-orm/neon-http` for the serverless environment. The import path determines the driver.
**Warning signs:** "Connection refused" errors in Vercel but works locally

### Pitfall 3: TTL Cleanup Race Conditions
**What goes wrong:** A cache entry expires between when it's read and when the artwork renders
**Why it happens:** Cleanup cron runs while user is viewing cached content
**How to avoid:** Check expiry on read (SELECT WHERE expires_at > NOW()), not just via cleanup. Cleanup is for storage reclamation, not access control.
**Warning signs:** 404s on previously-working share links (share links should NOT have TTL -- they are permanent)

### Pitfall 4: Share Link Vector Schema Drift
**What goes wrong:** ParameterVector changes in a future phase but stored JSONB has old shape
**Why it happens:** JSONB doesn't enforce schema; old vectors missing new fields
**How to avoid:** Store `versionInfo` alongside vector. The rendering code must handle version-specific parameter defaults. When loading a share link, check version and apply defaults for any missing parameters.
**Warning signs:** Rendering errors when viewing old share links after a version bump

### Pitfall 5: crypto.randomUUID() in Server Components
**What goes wrong:** Next.js prerendering fails with "Cannot access crypto.randomUUID() before other uncached data"
**Why it happens:** Next.js restricts sync crypto in Server Components during prerendering
**How to avoid:** Only call `crypto.randomUUID()` inside API routes (Route Handlers), never in Server Components or page-level code.
**Warning signs:** Build errors mentioning `next-prerender-crypto`

### Pitfall 6: Gallery Table Premature Design
**What goes wrong:** Phase 7 creates gallery table, then Phase 8 needs different columns
**Why it happens:** Gallery requirements (GAL-01 through GAL-08) are Phase 8 scope
**How to avoid:** In Phase 7, only create the tables explicitly needed: share_links, analysis_cache, render_cache, url_snapshots. Gallery table is Phase 8 responsibility. Phase 7 prepares the infrastructure but does not implement gallery features.
**Warning signs:** Adding columns for upvotes, reports, thumbnails in Phase 7

## Code Examples

### Database Schema: Share Links Table
```typescript
// src/db/schema/share-links.ts
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import type { ParameterVector, VersionInfo } from '@/types/engine';
import type { StyleName } from '@/lib/render/types';

export const shareLinks = pgTable('share_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  parameterVector: jsonb('parameter_vector').$type<ParameterVector>().notNull(),
  versionInfo: jsonb('version_info').$type<VersionInfo>().notNull(),
  styleName: text('style_name').$type<StyleName>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('share_links_created_at_idx').on(table.createdAt),
]);
```

### Database Schema: Analysis Cache Table
```typescript
// src/db/schema/analysis-cache.ts
import { pgTable, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const analysisCache = pgTable('analysis_cache', {
  // Composite key: inputHash + analyzerVersion + normalizerVersion
  cacheKey: text('cache_key').primaryKey(),
  parameterVector: jsonb('parameter_vector').notNull(),
  provenance: jsonb('provenance').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  accessCount: integer('access_count').default(0).notNull(),
}, (table) => [
  index('analysis_cache_expires_at_idx').on(table.expiresAt),
]);
```

### Database Schema: URL Snapshots Table
```typescript
// src/db/schema/url-snapshots.ts
import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const urlSnapshots = pgTable('url_snapshots', {
  // Key: canonicalized URL
  canonicalUrl: text('canonical_url').primaryKey(),
  signals: jsonb('signals').notNull(),
  title: text('title').notNull(),
  metadata: jsonb('metadata').notNull(),
  snapshotTimestamp: timestamp('snapshot_timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('url_snapshots_timestamp_idx').on(table.snapshotTimestamp),
]);
```

### Drizzle Configuration
```typescript
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Profanity Filter Singleton
```typescript
// src/lib/moderation/profanity.ts
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Check if text contains profanity.
 * Used for gallery titles and input previews (SEC-05).
 */
export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text);
}

/**
 * Get details about profanity matches for moderation logging.
 */
export function getProfanityMatches(text: string) {
  return matcher.getAllMatches(text);
}
```

### Vercel Cron Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel Postgres (@vercel/postgres) | Neon serverless driver (@neondatabase/serverless) | Q4 2024 - Q1 2025 | Must use Neon directly; Vercel Postgres deprecated |
| serial/SERIAL columns | Identity columns (generatedAlwaysAsIdentity) | PostgreSQL 10+ (2017), Drizzle full support 2024 | Use identity columns for auto-incrementing IDs |
| Prisma for Next.js ORM | Drizzle ORM gaining rapid adoption | 2023-2025 | Drizzle is lighter, no code generation, SQL-native |
| bad-words for profanity | obscenity library | 2022+ | bad-words unmaintained; obscenity handles Unicode evasion |

**Deprecated/outdated:**
- `@vercel/postgres`: Deprecated; replaced by Neon Marketplace integration
- `bad-words` npm package: Last updated 2+ years ago; no Unicode evasion support
- Drizzle `serial()`: Still works but `integer().generatedAlwaysAsIdentity()` is recommended for new tables

## Open Questions

1. **Database hosting for local development**
   - What we know: Neon provides free tier with 0.5 GB storage; alternatively, use Docker PostgreSQL locally
   - What's unclear: Whether to use Neon dev branch or local Docker for development
   - Recommendation: Use `drizzle-kit push` against a Neon dev branch (simpler than Docker; consistent with prod). Add `.env.local` with dev database URL.

2. **Gallery table timing**
   - What we know: Phase 8 owns GAL-01 through GAL-08. Phase 7 sets up the database infrastructure.
   - What's unclear: Whether to create the gallery_items table in Phase 7 or defer entirely to Phase 8
   - Recommendation: Defer gallery table to Phase 8. Phase 7 creates only the tables it directly uses (share_links, analysis_cache, render_cache, url_snapshots). This avoids premature schema design.

3. **Rate limiting persistence for gallery saves**
   - What we know: SEC-04 requires max 10 gallery saves per IP per day. Current URL rate limiter is in-memory.
   - What's unclear: Whether in-memory rate limiting is sufficient for a portfolio project
   - Recommendation: Use in-memory rate limiting initially (same pattern as URL analysis). For a portfolio project, cold-start resets are acceptable. If needed later, a `rate_limits` table or Vercel KV can be added.

4. **Share link expiration policy**
   - What we know: Requirements don't specify share link expiration. Share links are "permanent."
   - What's unclear: Whether to add a soft expiration (e.g., 1 year) to prevent unbounded storage growth
   - Recommendation: No expiration for share links. They store tiny payloads (~500 bytes each). Even 100,000 links would be ~50MB. Add `created_at` index for potential future cleanup.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.x |
| Config file | `vitest.config.mts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Drizzle schema defines all required tables with correct columns and types | unit | `npx vitest run src/__tests__/db/schema.test.ts -x` | No -- Wave 0 |
| INFRA-02 | Analysis cache read/write respects TTL and cache keys | unit | `npx vitest run src/__tests__/db/analysis-cache.test.ts -x` | No -- Wave 0 |
| INFRA-03 | Render cache read/write respects separate TTLs for thumbnails vs full renders | unit | `npx vitest run src/__tests__/db/render-cache.test.ts -x` | No -- Wave 0 |
| INFRA-04 | URL snapshot cache migrates from in-memory to DB; read/write/re-fetch works | unit | `npx vitest run src/__tests__/db/url-snapshots.test.ts -x` | No -- Wave 0 |
| SHARE-01 | Share link stores UUID + vector + version + style; no raw input | unit | `npx vitest run src/__tests__/api/share.test.ts -x` | No -- Wave 0 |
| SHARE-02 | Share viewer page loads vector from DB and renders artwork | integration | `npx vitest run src/__tests__/share/viewer.test.ts -x` | No -- Wave 0 |
| SHARE-03 | Share viewer never exposes original input text | unit | `npx vitest run src/__tests__/api/share.test.ts -x` | No -- Wave 0 |
| PRIV-01 | Default generation flow makes no server requests for text input | unit | `npx vitest run src/__tests__/privacy/ephemeral.test.ts -x` | No -- Wave 0 |
| PRIV-02 | API routes do not log or persist raw input text | unit | `npx vitest run src/__tests__/privacy/no-raw-input.test.ts -x` | No -- Wave 0 |
| PRIV-03 | No DB table has a column for raw input storage | unit | `npx vitest run src/__tests__/db/schema.test.ts -x` | No -- Wave 0 |
| PRIV-04 | Local-only mode indicator shows lock icon; no fetch calls during text analysis | unit | `npx vitest run src/__tests__/privacy/local-only.test.ts -x` | No -- Wave 0 |
| SEC-04 | Gallery save rate limiter caps at 10/IP/day | unit | `npx vitest run src/__tests__/api/rate-limit.test.ts -x` | No -- Wave 0 |
| SEC-05 | Profanity filter detects bad words including Unicode variants | unit | `npx vitest run src/__tests__/moderation/profanity.test.ts -x` | No -- Wave 0 |
| SEC-06 | Items with 3+ reports get flagged; admin can review/remove | unit | `npx vitest run src/__tests__/api/moderation.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/db/schema.test.ts` -- covers INFRA-01, PRIV-03 (schema shape validation)
- [ ] `src/__tests__/db/analysis-cache.test.ts` -- covers INFRA-02
- [ ] `src/__tests__/db/render-cache.test.ts` -- covers INFRA-03
- [ ] `src/__tests__/db/url-snapshots.test.ts` -- covers INFRA-04
- [ ] `src/__tests__/api/share.test.ts` -- covers SHARE-01, SHARE-02, SHARE-03
- [ ] `src/__tests__/moderation/profanity.test.ts` -- covers SEC-05
- [ ] `src/__tests__/privacy/local-only.test.ts` -- covers PRIV-04

Note: Database tests will need to mock the Drizzle client (no real DB connection in CI). Use `vi.mock('@/db')` pattern established in the project.

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM - PostgreSQL setup](https://orm.drizzle.team/docs/get-started/postgresql-new) - installation, driver, configuration
- [Drizzle ORM - Column types](https://orm.drizzle.team/docs/column-types/pg) - uuid, jsonb, timestamp, text types
- [Drizzle ORM - Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) - index creation, unique constraints
- [Drizzle ORM - Schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration) - multi-file schema, enums, shared columns
- [Drizzle ORM - Neon Next.js tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon) - Neon serverless driver setup
- [Neon docs - Vercel Postgres transition](https://neon.com/docs/guides/vercel-postgres-transition-guide) - Vercel Postgres deprecated, use Neon
- [GitHub - jo3-l/obscenity](https://github.com/jo3-l/obscenity) - profanity filter API, transformers, whitelisting
- [Next.js docs - Dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) - `[id]` param handling in App Router
- [Next.js docs - crypto prerender restriction](https://nextjs.org/docs/messages/next-prerender-crypto) - crypto.randomUUID() placement rules
- [MDN - crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) - v4 UUID generation
- Existing codebase: `src/lib/cache/keys.ts`, `src/app/api/analyze-url/route.ts`, `src/types/engine.ts`

### Secondary (MEDIUM confidence)
- [Sequin blog - PostgreSQL time-based retention](https://blog.sequinstream.com/time-based-retention-strategies-in-postgres/) - TTL strategies (pg_cron vs pg_partman vs app-level)
- [Vercel templates - Postgres + Drizzle starter](https://vercel.com/templates/next.js/postgres-drizzle) - reference architecture
- [Neon for Vercel marketplace](https://vercel.com/marketplace/neon) - integration setup and billing

### Tertiary (LOW confidence)
- [npm - obscenity](https://www.npmjs.com/package/obscenity) - version verified (^0.4.x), weekly downloads healthy
- [npm - drizzle-orm](https://www.npmjs.com/package/drizzle-orm) - version 0.45.1 confirmed as latest stable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle ORM + Neon is well-documented, officially recommended by Vercel, verified via official docs
- Architecture: HIGH - Patterns follow official Drizzle tutorials and established Next.js App Router conventions; existing codebase patterns inform design
- Pitfalls: HIGH - Common issues documented in official Next.js docs (crypto prerender), Drizzle GitHub issues (JSONB binding), and project-specific knowledge (privacy contract)
- Validation: MEDIUM - Test patterns are straightforward but DB mocking approach needs validation during implementation

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain, 30-day validity)