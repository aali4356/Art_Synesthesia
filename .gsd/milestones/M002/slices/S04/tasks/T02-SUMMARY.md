---
id: T02
parent: S04
milestone: M002
provides:
  - Browser-visible live proof diagnostics for palette family, mapping posture, renderer expressiveness, and supported-style state at the real results surface
  - Restored build health for harmony typing and local proof builds without a configured database URL
key_files:
  - src/components/results/ResultsView.tsx
  - src/app/page.tsx
  - src/lib/color/harmony.ts
  - src/lib/render/expressiveness.ts
  - src/app/api/moderation/report/route.ts
  - src/db/index.ts
key_decisions:
  - Keep the proof seam derived-only in ResultsView and surface raw text only at the page shell level for live text flow acceptance
  - Defer DB-backed moderation route access behind a runtime import guard so local slice builds fail visibly at request time instead of during next build data collection
patterns_established:
  - Use a dedicated proof diagnostics card in the real results UI as the first inspection surface for mapping/rendering/wiring health
  - Guard database-backed route imports at runtime when slice verification must support local no-DB proof builds
observability_surfaces:
  - ResultsView proof diagnostics card
  - Supported-style state in the live results UI
  - Build-time and route-level explicit DATABASE_URL failure surface
duration: ~2h
verification_result: passed
completed_at: 2026-03-12T18:42:00Z
blocker_discovered: false
---

# T02: Wire live proof diagnostics and restore operational health

**Added a real live-proof diagnostics surface, repaired harmony typing, and restored local buildability for S04 verification.**

## What Happened

Implemented the missing S04 acceptance seam in the real `ResultsView` and fixed the harmony/build blockers.

- Added a `proof diagnostics` card to `src/components/results/ResultsView.tsx` that exposes:
  - proof source (`text`, `url`, `data`)
  - palette family
  - harmony
  - mapping posture
  - active style
  - supported-style state, including explicit typographic unavailability for data inputs
  - renderer expressiveness rows pulled from the real organic and typographic scene graphs
- Preserved the privacy boundary by keeping the diagnostics card derived-only and not exposing canonical/raw values there.
- Threaded the text-flow acceptance preview from `src/app/page.tsx` so the app-level proof contract can still verify the real text input path while `ResultsView` itself stays raw-input-safe.
- Expanded `HarmonyType` to match the actual harmony vocabulary used by palette mapping and `HARMONY_SPREAD`, including camel-case and legacy split-complementary variants plus `monochromatic` and `tetradic`.
- Updated `src/lib/render/expressiveness.ts` so the harmony spread record covers both `split-complementary` and `splitComplementary`.
- Removed a local build blocker caused by eager database initialization during route/page evaluation:
  - `src/db/index.ts` now throws an explicit `DATABASE_URL is not set` error instead of constructing the Neon client with a non-null assertion.
  - `src/app/api/moderation/report/route.ts` now imports its DB-backed gallery function lazily and returns `503` with an explicit error when the DB backend is unavailable, rather than crashing `next build` during route data collection.

## Verification

Passed:

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx`
- `npm run build`

What these prove:

- The new proof diagnostics surface satisfies the locked T01 acceptance contracts.
- Existing text/URL/data hook suites and `StyleSelector` behavior still pass.
- The harmony typing mismatch is resolved.
- Local build health is restored for the slice verification path.

## Diagnostics

Inspect later using:

- `src/components/results/ResultsView.tsx` — live proof diagnostics card and supported-style messaging
- `src/__tests__/app/live-art-proof.test.tsx` — app-level proof contract across text/URL/data
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — ResultsView metadata/privacy contract
- `npm run build` — now succeeds in local proof mode without `DATABASE_URL`
- `src/app/api/moderation/report/route.ts` — explicit 503 failure path when DB-backed moderation is unavailable

## Deviations

- Fixed an additional operability issue beyond the written harmony blocker: `next build` also failed because DB-backed modules were imported eagerly during route/page evaluation without `DATABASE_URL`. This was not called out in the plan text but was required to satisfy the task’s build-health must-have.

## Known Issues

- Other DB-backed routes/pages may still assume `DATABASE_URL` is present at runtime; this task only addressed the blocker surfaced by the S04 verification build path.
- Slice-level browser proof at `http://localhost:3000` still belongs to T03.

## Files Created/Modified

- `src/components/results/ResultsView.tsx` — added the live proof diagnostics card, supported-style messaging, and derived expressiveness surface
- `src/app/page.tsx` — surfaced the live text input preview at the page shell so app-level proof coverage remains real without leaking raw input inside ResultsView diagnostics
- `src/lib/color/harmony.ts` — expanded harmony typing to match runtime mapping/build expectations
- `src/lib/render/expressiveness.ts` — repaired harmony spread typing coverage for all supported harmony labels
- `src/db/index.ts` — made missing `DATABASE_URL` fail explicitly instead of via unsafe non-null construction
- `src/app/api/moderation/report/route.ts` — deferred DB access behind runtime import and exposed explicit 503 behavior when moderation storage is unavailable
