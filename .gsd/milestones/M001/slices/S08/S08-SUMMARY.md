---
id: S08
parent: M001
milestone: M001
provides:
  - DB-backed gallery save/browse/detail/report/upvote flows and compare mode with parameter diff summaries
requires:
  - slice: S07
    provides: Database, sharing, privacy, and cache primitives used by gallery and compare surfaces
affects:
  - S09
key_files:
  - src/app/api/gallery/route.ts
  - src/app/api/gallery/[id]/route.ts
  - src/app/gallery/page.tsx
  - src/app/gallery/[id]/GalleryViewer.tsx
  - src/app/compare/CompareMode.tsx
  - src/lib/compare/diff.ts
  - src/lib/compare/summary.ts
  - src/app/api/moderation/report/route.ts
  - src/app/api/admin/review/route.ts
key_decisions:
  - Gallery and moderation route tests mock db-gallery because route imports transitively initialize Neon without DATABASE_URL in test/build environments
  - Compare mode uses one shared style selector for both panes and non-animated canvases with particle count capped at 5000 for memory safety
  - GalleryViewer uses a gallery-specific seed prefix including item id while ShareViewer uses a share-specific seed prefix
  - API routes that depend on DB-backed runtime state are marked force-dynamic to avoid static data collection assumptions
patterns_established:
  - Route handlers delegate all persistence operations through src/lib/gallery/db-gallery rather than inline DB code
  - jsdom tests that exercise localStorage-backed ownership/upvote behavior stub localStorage explicitly
  - Parallel parameter diff UX is built from sorted absDelta output plus a threshold helper for significance highlighting
observability_surfaces:
  - GET /api/gallery returns items, page, and limit for browse inspection
  - GET /api/gallery/[id] returns explicit 404 when an item is missing
  - POST /api/moderation/report returns reportCount, flagged, and a human-readable message
  - GET /api/admin/review returns flagged items and total count when authorized
  - POST /api/gallery exposes X-RateLimit-Remaining on success and failure paths
  - npm test (518 passing) is the authoritative regression signal for this slice
  - next build currently exposes a missing DATABASE_URL failure during page-data collection if the env is absent; force-dynamic alone did not eliminate that runtime dependency
 drill_down_paths:
  - .gsd/milestones/M001/slices/S08/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S08/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S08/tasks/T03-SUMMARY.md
  - .gsd/milestones/M001/slices/S08/tasks/T04-SUMMARY.md
 duration: multi-task slice execution compressed from four completed task plans
verification_result: passed
completed_at: 2026-03-11
---

# S08: Gallery Compare

**DB-backed gallery workflows, moderation surfaces, and compare mode now exist with passing slice-level tests and explicit diagnostic responses.**

## What Happened

S08 completed the public-facing gallery and compare experience on top of the database/privacy work from S07. The slice first replaced the gallery save stub with a real DB-backed flow, extending `gallery_items` with `upvoteCount` and `creatorToken`, introducing `src/lib/gallery/db-gallery.ts` as the persistence boundary, and wiring a `GallerySaveModal` into `ResultsView` so save-to-gallery remains explicit, editable, and privacy-preserving.

It then added the browse/view layer: `/gallery` for listing items with style and sort filters, `GalleryCard` for reveal/report/upvote/delete affordances, `GalleryGrid` for pagination and filter composition, and `/gallery/[id]` via `GalleryViewer` for full-size viewing with a parameter panel. Moderation and single-item detail flows were upgraded from in-memory stubs to DB-backed route handlers, including report thresholds and admin review deletion.

In parallel, the slice shipped compare mode. `src/lib/compare/diff.ts` computes sorted signed parameter deltas, `src/lib/compare/summary.ts` converts the largest differences into plain-English text, and `/compare` renders two independent inputs with a shared style selector and side-by-side canvases plus a parameter diff panel.

During closeout verification, two real integration issues surfaced outside the original task summaries. First, `CompareMode` accepted a broad `string` theme where renderer builders require `'dark' | 'light'`; this passed tests but failed type-checking in production build, so the hook signature was narrowed. Second, `ShareViewer` and `GalleryViewer` had the same theme typing gap and were corrected the same way. Build verification then exposed a deeper runtime concern already hinted at by the test mocking pattern: DB-backed route modules still initialize Neon during build-time page-data collection when `DATABASE_URL` is absent. The routes were marked `force-dynamic`, which is the correct runtime intent, but the missing-env build failure remains a known limitation for environments that run `next build` without database configuration.

## Verification

- `npm test` passes: **518/518 tests**, 64/64 files.
- Slice-specific proof exists for:
  - gallery save route and privacy gate (`src/__tests__/api/gallery-save.test.ts`)
  - owner delete route (`src/__tests__/api/gallery-delete.test.ts`)
  - save modal UI (`src/__tests__/gallery/save-modal.test.tsx`)
  - gallery browse/filter paging (`src/__tests__/api/gallery-browse.test.ts`)
  - gallery card behavior (`src/__tests__/gallery/gallery-card.test.tsx`)
  - compare diff math (`src/__tests__/compare/diff.test.ts`)
  - compare summary text (`src/__tests__/compare/summary.test.ts`)
  - compare mode UI (`src/__tests__/compare/compare-mode.test.tsx`)
  - DB-backed moderation/report flows (`src/__tests__/moderation/db-report.test.ts`)
  - upvote and single-item detail (`src/__tests__/api/gallery-upvote.test.ts`)
- `next build` was run as an observability check and surfaced two issues:
  - fixed: theme type mismatch in compare/share/gallery viewers
  - still externally visible: build fails without `DATABASE_URL` because DB-backed route imports trigger Neon init during page-data collection
- Route error states are externally visible and actionable:
  - `401` for missing creator token
  - `403` for delete token mismatch/not-found delete path
  - `404` for missing gallery item/report target
  - `422` for profanity violations
  - `429` for gallery save rate limit
  - moderation report responses expose `reportCount` and `flagged`

## Requirements Advanced

- GAL-01 — Save flow is explicit opt-in with previewed public fields and real persistence.
- GAL-02 — Save modal allows editing/removing the preview before save.
- GAL-03 — Gallery browse page and cards render thumbnails, style, date, and optional title.
- GAL-04 — Input previews remain hidden by default and reveal on demand.
- GAL-05 — Gallery browse supports style filtering, recent/popular sorting, and upvote-backed popularity.
- GAL-06 — Gallery detail page renders full-size work with parameter display.
- GAL-07 — Report actions now hit DB-backed moderation routes and expose flagging state.
- GAL-08 — Creator-token-based delete ownership works end-to-end.
- COMP-01 — Two inputs render side by side in the same style.
- COMP-02 — Parameter vectors are shown in parallel with visual diff highlighting.
- COMP-03 — Auto-generated diff summary text is computed from real deltas.
- COMP-04 — Shared style selector drives both comparison panes simultaneously.

## Requirements Validated

- GAL-01 — Proven by save route tests, save modal tests, and ResultsView integration.
- GAL-02 — Proven by `save-modal.test.tsx` edit/remove/truncation coverage.
- GAL-03 — Proven by gallery browse API tests and gallery card rendering tests.
- GAL-04 — Proven by gallery card reveal-default behavior tests.
- GAL-05 — Proven by browse API sort/filter tests and upvote endpoint tests.
- GAL-06 — Proven by single-item GET coverage and shipped `/gallery/[id]` viewer.
- GAL-07 — Proven by card affordance tests plus DB-backed report/admin review tests.
- GAL-08 — Proven by owner delete API coverage and creator-token UI behavior.
- COMP-01 — Proven by compare mode rendering tests.
- COMP-02 — Proven by diff unit tests and diff panel implementation.
- COMP-03 — Proven by summary unit tests.
- COMP-04 — Proven by compare mode shared style selector tests.

## New Requirements Surfaced

- Candidate: Build/runtime environments that evaluate App Router route modules during `next build` must either provide `DATABASE_URL` or the DB bootstrap layer must defer Neon initialization until request time.

## Requirements Invalidated or Re-scoped

- none

## Deviations

- The plan assumed compare mode would use a `useTextAnalysis` API exposing `analyze`; the real hook exposes `generate`, so the implementation and tests were corrected inline.
- Closeout verification uncovered production type gaps and a build-time DB bootstrap dependency that were not called out in the original task plans.

## Known Limitations

- `next build` still fails in environments without `DATABASE_URL` because DB-backed route imports trigger Neon initialization during page-data collection.
- Popular upvote protection is client-side only (`localStorage` dedupe); server-side IP/user dedupe remains out of scope for v1.
- Gallery/moderation verification is artifact-driven; no live browser walkthrough was run in this completion step.

## Follow-ups

- Refactor DB bootstrap so Neon is initialized lazily at request time or behind an env guard compatible with build-time route analysis.
- Decide whether to add a lightweight build-safe DB adapter/mocking strategy for CI environments that run `next build` without secrets.
- Consider documenting the required `DATABASE_URL` precondition explicitly in developer setup/build instructions.

## Files Created/Modified

- `src/lib/gallery/db-gallery.ts` — persistence boundary for gallery CRUD, browse, moderation, and counters
- `src/lib/gallery/creator-token.ts` — local creator ownership token utility
- `src/app/api/gallery/route.ts` — DB-backed save and browse routes with rate-limit header
- `src/app/api/gallery/[id]/route.ts` — single-item get, owner delete, and upvote route
- `src/components/gallery/GallerySaveModal.tsx` — explicit opt-in modal for public gallery save fields
- `src/components/results/ResultsView.tsx` — wired gallery save flow into result experience
- `src/app/gallery/page.tsx` — gallery browse shell
- `src/components/gallery/GalleryFilters.tsx` — style/sort filter UI
- `src/components/gallery/GalleryCard.tsx` — reveal/report/upvote/delete card interactions
- `src/components/gallery/GalleryGrid.tsx` — paginated gallery grid composition
- `src/app/gallery/[id]/page.tsx` — gallery detail page loader
- `src/app/gallery/[id]/GalleryViewer.tsx` — full-size gallery viewer and upvote interaction
- `src/lib/compare/diff.ts` — numeric diff computation sorted by absolute delta
- `src/lib/compare/summary.ts` — plain-English difference summary generation
- `src/app/compare/page.tsx` — compare page shell
- `src/app/compare/CompareMode.tsx` — two-pane compare UI with shared style strip and diff panel
- `src/app/api/moderation/report/route.ts` — DB-backed report endpoint
- `src/app/api/admin/review/route.ts` — DB-backed admin review endpoint
- `src/app/share/[id]/ShareViewer.tsx` — theme typing fix discovered during closeout build verification

## Forward Intelligence

### What the next slice should know
- The gallery feature set is functionally complete by test evidence, but build-time behavior in env-poor contexts is still constrained by eager DB bootstrap. If S09 adds more server routes, expect the same failure mode unless the DB import story is fixed.
- Compare mode already has a reusable diff/summary core in `src/lib/compare/*`; export/accessibility work can leverage those summaries for alt text or export metadata if desired.

### What's fragile
- `@/db` eager initialization — it breaks `next build` without secrets and forces aggressive mocking in tests.
- Client-side ownership/upvote state via `localStorage` — useful for v1 UX, but easy to bypass and not authoritative.

### Authoritative diagnostics
- `npm test` — strongest proof that slice behavior is correct at the unit/API/component level.
- `npm run build` — strongest proof that production typing and build-time module evaluation are safe; it currently reveals the outstanding DATABASE_URL limitation.
- `src/__tests__/moderation/db-report.test.ts` — best concentrated proof that moderation/report observability is real and externally visible.

### What assumptions changed
- “Slice done once tests pass” — closeout build verification found additional production issues, so build checks remain necessary even for test-complete slices.
- “force-dynamic will fully prevent build-time DB evaluation” — in this setup it did not eliminate the Neon env dependency during page-data collection.
