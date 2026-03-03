---
phase: 01-foundation-determinism-infrastructure
plan: 03
subsystem: canonicalize
tags: [canonicalization, unicode, nfc, papaparse, csv, json, url, normalization]

# Dependency graph
requires:
  - phase: 01-01
    provides: Project scaffold, vitest runner, papaparse dependency
provides:
  - Text canonicalization (NFC, newline normalization, whitespace trimming)
  - JSON canonicalization (recursive key sorting, JSONC comment stripping)
  - CSV canonicalization (PapaParse, cell trimming, empty-to-null)
  - URL canonicalization (scheme/host lowercase, default port removal, query sorting)
  - Unified canonicalize router dispatching by input type
affects: [03-01, 06-02, 06-03, all-analysis-phases]

# Tech tracking
tech-stack:
  added: [papaparse (CSV parsing)]
  patterns: [CanonResult return type with canonical string + changes log, input type detection and routing]

key-files:
  created: [src/lib/canonicalize/text.ts, src/lib/canonicalize/json.ts, src/lib/canonicalize/csv.ts, src/lib/canonicalize/url.ts, src/lib/canonicalize/index.ts]
  modified: []

key-decisions:
  - "URL default port detection reads from original input string (URL API auto-strips default ports)"
  - "JSON canonicalization strips JSONC-style comments (// and /* */) before parsing"
  - "CSV uses PapaParse with dynamicTyping:false to keep all values as strings for canonical consistency"
  - "Empty CSV cells normalized to 'null' string in canonical output"

patterns-established:
  - "All canonicalizers return CanonResult {canonical, changes, inputType}"
  - "Changes array tracks each normalization applied for transparency"
  - "canonicalize() router auto-detects input type and dispatches"

requirements-completed: [CANON-01, CANON-02, CANON-03, CANON-04, CANON-05]

# Metrics
duration: 15min
completed: 2026-03-02
---

# Plan 01-03: Input Canonicalization Suite Summary

**Four canonicalizers (text, JSON, CSV, URL) with unified router, producing stable canonical output for all input types**

## Performance

- **Duration:** ~15 min
- **Tasks:** 5
- **Files modified:** 5
- **Tests:** 43 passing

## Accomplishments
- Text canonicalization: NFC normalization, \r\n to \n, trailing whitespace trim per line
- JSON canonicalization: Recursive key sorting, JSONC comment stripping, number normalization
- CSV canonicalization: PapaParse integration, cell trimming, empty-to-null normalization
- URL canonicalization: Lowercase scheme/host, default port removal, query param sorting, fragment removal
- Unified router with auto-detection and barrel exports
- Comprehensive edge case coverage (Unicode, empty inputs, whitespace-only, special characters)

## Task Commits

1. **Tasks 1-5: Full canonicalization suite** - `1942fa0` (feat)

## Files Created/Modified
- `src/lib/canonicalize/text.ts` - NFC, newline normalization, whitespace trimming
- `src/lib/canonicalize/json.ts` - Recursive key sorting, comment stripping
- `src/lib/canonicalize/csv.ts` - PapaParse integration, cell normalization
- `src/lib/canonicalize/url.ts` - URL API normalization with default port detection
- `src/lib/canonicalize/index.ts` - Router and barrel exports

## Decisions Made
- Default port detection parses from original input string because URL API constructor auto-strips default ports (443 for https, 80 for http), making `url.port` always empty for default ports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] URL default port detection**
- **Found during:** Task 4 (URL canonicalization)
- **Issue:** URL API auto-strips default ports during construction, so `url.port === '443'` never matches
- **Fix:** Extract port from original input string via regex `/:\/\/[^/:]+:(\d+)/` and compare against defaults
- **Files modified:** src/lib/canonicalize/url.ts
- **Verification:** All 12 URL tests pass including explicit default port test cases
- **Committed in:** `1942fa0`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary for correctness. No scope creep.

## Issues Encountered
- URL API default port stripping behavior required alternative detection approach (documented above)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four input types can be canonicalized deterministically
- Router dispatches by type, ready for analysis pipeline integration in Phase 3
- CanonResult provides change tracking for future translation panel

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*
