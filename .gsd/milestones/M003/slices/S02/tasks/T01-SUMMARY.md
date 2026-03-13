---
id: T01
parent: S02
milestone: M003
provides:
  - Failing proof coverage for shared branded gallery, compare, and unavailable route surfaces before S02 implementation
key_files:
  - src/__tests__/app/shared-brand-surfaces.test.tsx
  - src/__tests__/compare/compare-mode.test.tsx
  - .gsd/milestones/M003/slices/S02/S02-PLAN.md
key_decisions:
  - Encode S02 shell/action/viewer continuity as deliberate failing assertions against current plain gallery, compare, and unavailable route wrappers
patterns_established:
  - Route-surface proof tests should fail first on branded shell copy, intro posture, action framing, and truthful unavailable-state messaging before implementation begins
observability_surfaces:
  - npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx
  - Localized Vitest failures for gallery shell adoption, compare branded control framing, and share unavailable-state copy
duration: 35m
verification_result: passed
completed_at: 2026-03-11T18:56:00-04:00
blocker_discovered: false
---

# T01: Add failing proof for shared branded route surfaces

**Added failing executable proof for S02 shared branded gallery, compare, and unavailable route surfaces.**

## What Happened

Created `src/__tests__/app/shared-brand-surfaces.test.tsx` to exercise three representative route compositions:
- gallery browse via `src/app/gallery/page.tsx`
- compare mode via `src/app/compare/page.tsx`
- DB-backed unavailable/not-found behavior via `src/app/share/[id]/page.tsx`

The new test asserts the future S02 contract: shared shell branding (`Synesthesia Machine`, `Editorial visual engine`), route-intro posture, branded compare framing (`Compare atelier`, `Viewer stage`, `Action desk`), and explicit unavailable-state messaging that stays inspectable in local no-DB proof mode.

Updated `src/__tests__/compare/compare-mode.test.tsx` with one additional branded-control contract test that preserves the existing two-pane interaction assertions while explicitly naming the branded compare semantics expected in S02. That new assertion currently fails because `CompareMode` still renders the old plain wrapper/header.

Ran the targeted Vitest command and confirmed the expected fail-first boundary:
- gallery proof fails because `/gallery` still renders a standalone plain wrapper instead of the shared editorial shell
- compare proof fails because `CompareMode` still uses the pre-editorial header/layout and lacks branded intro/action/viewer copy
- unavailable-state proof fails because the current share fallback is still a plain centered not-found block rather than a branded, inspectable unavailable surface

## Verification

Ran:
- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx`

Observed expected result:
- command exited with code 1
- `src/__tests__/app/shared-brand-surfaces.test.tsx`: 3 failing assertions
- `src/__tests__/compare/compare-mode.test.tsx`: 1 new failing assertion, existing compare interaction assertions still passed

This matches the task requirement that T01 completes only when the new shared branded surface proof exists and fails against the current implementation.

## Diagnostics

Future agents can inspect this boundary by rerunning:
- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx`

Failure localization:
- gallery failure = shell/route-intro adoption still missing on `/gallery`
- compare failure = branded compare intro/action/viewer framing still missing in `CompareMode`
- unavailable-state failure = DB-backed fallback/not-found route still collapses to plain centered copy instead of explicit branded diagnostics

## Deviations

None.

## Known Issues

- Full slice verification is intentionally not passing yet; only the fail-first proof boundary was added in this task.
- Browser verification and build verification remain for later slice tasks once the branded runtime implementation exists.

## Files Created/Modified

- `src/__tests__/app/shared-brand-surfaces.test.tsx` — new failing integration proof for gallery browse, compare mode, and branded unavailable route expectations
- `src/__tests__/compare/compare-mode.test.tsx` — added a branded compare control contract assertion while preserving existing two-pane semantics coverage
- `.gsd/milestones/M003/slices/S02/S02-PLAN.md` — marked T01 complete
