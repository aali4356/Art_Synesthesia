---
phase: 07-database-sharing-privacy
plan: "07-03"
subsystem: database
tags: [drizzle-orm, neon, postgresql, cache, vercel-cron]

requires:
  - phase: 07-02
    provides: Drizzle ORM schemas for analysis_cache, render_cache, url_snapshots
provides:
  - DB-backed cache read/write utility module (src/lib/cache/db-cache.ts)
  - analyze-url route migrated from in-memory Map to PostgreSQL via db-cache
  - GET/PUT /api/cache route for server-side analysis and render cache operations
  - GET /api/cron/cleanup route with CRON_SECRET auth for daily TTL cleanup
  - vercel.json with cron schedule at 03:00 UTC daily
affects: [07-04, 07-05, 07-06, 08-01]

tech-stack:
  added: []
  patterns:
    - DB-backed cache helpers (getAnalysisCache, setAnalysisCache, etc.) are the sole importers of @/db in the cache layer
    - Cron routes protected by CRON_SECRET bearer token
    - Analysis/render cache tests mock @/lib/cache/db-cache instead of @/db directly

key-files:
  created:
    - src/lib/cache/db-cache.ts
    - src/app/api/cache/route.ts
    - src/app/api/cron/cleanup/route.ts
    - vercel.json
  modified:
    - src/app/api/analyze-url/route.ts
    - src/__tests__/api/analyze-url.test.ts

key-decisions:
  - "db-cache.ts is the only module that imports @/db in the cache layer -- isolation principle"
  - "TTL helpers: analysisTtl()=7d, renderTtl(res)=24h for res<=200 else 7d"
  - "permanent option uses far-future 9999-12-31 date (not a separate DB flag)"
  - "analyze-url tests mock @/lib/cache/db-cache with vi.fn() -- no real DB in CI"
  - "Cron cleanup protected by CRON_SECRET bearer token; returns 401 if missing/wrong"
  - "vercel.json cron schedule: 0 3 * * * (03:00 UTC daily)"

patterns-established:
  - "Cache isolation: db-cache.ts centralizes all DB access for cache tables"
  - "Mock pattern: vi.mock('@/lib/cache/db-cache') in route tests -- no DB connection needed"

requirements-completed:
  - INFRA-02
  - INFRA-03
  - INFRA-04

duration: ~15min
completed: "2026-03-04"
---

# Plan 07-03: Caching Infrastructure Summary

**DB-backed analysis, render, and URL snapshot caches with GET/PUT API route and daily Vercel Cron cleanup, migrating analyze-url from in-memory Map to PostgreSQL**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-04T23:10:00Z
- **Completed:** 2026-03-04T23:25:00Z
- **Tasks:** 4 (plus prerequisite 07-02 executed in same session)
- **Files modified:** 6

## Accomplishments

- Created `src/lib/cache/db-cache.ts` with 8 exported async functions covering all three cache tables (analysis, render, URL snapshots) plus TTL helpers and cleanup
- Migrated `/api/analyze-url` from ephemeral in-memory `snapshotCache` Map to PostgreSQL via `getUrlSnapshot`/`setUrlSnapshot`
- Added GET/PUT `/api/cache` route for server-side analysis and render cache operations with full input validation
- Added GET `/api/cron/cleanup` route with CRON_SECRET bearer auth for daily TTL cleanup of expired rows
- Added `vercel.json` with Vercel Cron schedule at 03:00 UTC daily
- Updated analyze-url tests to mock `@/lib/cache/db-cache` -- all 426 tests pass with zero failures

## Task Commits

Each task was committed atomically:

1. **Task 07-02 (prerequisite)** - `9185226` (feat: define drizzle schema)
2. **Task 07-03-01: Create DB-backed cache utility module** - `ae7b807` (feat)
3. **Task 07-03-02: Migrate analyze-url route to DB snapshot cache** - `0fcd25d` (feat)
4. **Task 07-03-03 + 07-03-04: Cache API route, cron cleanup, vercel.json** - `28bc20a` (feat)

## Files Created/Modified

- `src/lib/cache/db-cache.ts` - DB-backed cache helpers: getAnalysisCache, setAnalysisCache, getRenderCache, setRenderCache, getUrlSnapshot, setUrlSnapshot, deleteUrlSnapshot, cleanupExpiredCache
- `src/app/api/analyze-url/route.ts` - Replaced snapshotCache Map with db-cache imports
- `src/__tests__/api/analyze-url.test.ts` - Updated to mock @/lib/cache/db-cache
- `src/app/api/cache/route.ts` - GET/PUT routes for analysis and render cache
- `src/app/api/cron/cleanup/route.ts` - Cron cleanup route with CRON_SECRET auth
- `vercel.json` - Cron schedule: /api/cron/cleanup at 03:00 UTC daily

## Decisions Made

- **db-cache.ts isolation**: Only this module imports `@/db` in the cache layer. Route files and tests mock at the db-cache level, not db level.
- **analysisTtl = 7 days, renderTtl = 24h (thumbnail) / 7d (full)**: resolution <= 200 maps to thumbnail TTL.
- **permanent = year 9999**: Gallery-linked entries use `new Date('9999-12-31T23:59:59Z')` rather than a separate boolean column.
- **CRON_SECRET required**: Cron cleanup returns 401 if CRON_SECRET env var is unset or authorization header mismatches.
- **02-02 prerequisite**: plan 07-02 was not yet committed when this session started; executed 07-02 first before 07-03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Prerequisite] Plan 07-02 not executed before 07-03**
- **Found during:** Session start (reading STATE.md showed 07-02 as next plan)
- **Issue:** 07-03 depends on 07-02 (schema tables must exist); db schema was placeholder
- **Fix:** Executed 07-02 (render-cache, url-snapshots, barrel, migrate script, all 4 test files) then proceeded with 07-03
- **Verification:** All 19 db schema tests pass before 07-03 work began
- **Committed in:** `9185226`

**2. [Missing validation] analyze-url tests broke after db-cache migration**
- **Found during:** Task 07-03-02 (migrate analyze-url route)
- **Issue:** Existing tests used in-memory snapshotCache; after migration they fail with "No database connection string"
- **Fix:** Added `vi.mock('@/lib/cache/db-cache', () => ({ getUrlSnapshot: vi.fn()... }))` per plan spec; also added 2 new snapshot tests (cached: true flag, setUrlSnapshot call verification)
- **Verification:** All 11 analyze-url tests pass
- **Committed in:** `0fcd25d`

---

**Total deviations:** 2 auto-fixed (1 prerequisite execution, 1 test mock update)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## Next Phase Readiness

- INFRA-02, INFRA-03, INFRA-04 complete; all three cache tables have DB-backed read/write helpers
- analyze-url route now persists URL snapshots to PostgreSQL instead of ephemeral in-memory Map
- GET/PUT /api/cache and /api/cron/cleanup routes ready for integration
- Next: Plan 07-04 (share link generation and resolution) or 07-05 (privacy model/local-only mode) can proceed

---
*Phase: 07-database-sharing-privacy*
*Completed: 2026-03-04*
