---
id: T03
parent: S02
milestone: M004
provides: []
requires: []
affects: []
key_files: ["src/components/results/ResultsView.tsx", "src/app/page.tsx", "src/__tests__/app/home-editorial-flow.test.tsx", "src/__tests__/app/anonymous-continuity.test.tsx", "src/__tests__/app/product-family-coherence.test.tsx", "src/__tests__/components/results/ResultsView.live-proof.test.tsx", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M004/slices/S02/tasks/T03-SUMMARY.md"]
key_decisions: ["Passed an explicit continuityMode prop from Home into ResultsView so fresh versus reopened recent-local guidance stays truthful at the results seam.", "Locked the results/home/header wording contract through the existing RTL and source-inspection suites instead of introducing a separate acceptance surface."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified the four-file slice regression bundle, a focused ResultsView seam test, and live browser flows for `/`, `/gallery`, and `/compare`. The homepage/browser flow generated a real result and confirmed the new next-step guidance and route links. Gallery and Compare confirmed the shared route-intro copy and active-route semantics."
completed_at: 2026-03-26T17:12:34.889Z
blocker_discovered: false
---

# T03: Added explicit results next-step guidance for fresh versus resumed editions and locked the cross-surface copy contract.

> Added explicit results next-step guidance for fresh versus resumed editions and locked the cross-surface copy contract.

## What Happened
---
id: T03
parent: S02
milestone: M004
key_files:
  - src/components/results/ResultsView.tsx
  - src/app/page.tsx
  - src/__tests__/app/home-editorial-flow.test.tsx
  - src/__tests__/app/anonymous-continuity.test.tsx
  - src/__tests__/app/product-family-coherence.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M004/slices/S02/tasks/T03-SUMMARY.md
key_decisions:
  - Passed an explicit continuityMode prop from Home into ResultsView so fresh versus reopened recent-local guidance stays truthful at the results seam.
  - Locked the results/home/header wording contract through the existing RTL and source-inspection suites instead of introducing a separate acceptance surface.
duration: ""
verification_result: passed
completed_at: 2026-03-26T17:12:34.904Z
blocker_discovered: false
---

# T03: Added explicit results next-step guidance for fresh versus resumed editions and locked the cross-surface copy contract.

**Added explicit results next-step guidance for fresh versus resumed editions and locked the cross-surface copy contract.**

## What Happened

Updated the results surface so fresh and reopened browser-local editions now carry explicit next-step guidance that matches the homepage and shared header contract. ResultsView renders route links back to Home / Recent local work, Compare, and Gallery, and its copy now distinguishes private browser-local recall from public routes. Home now passes an explicit continuity mode into ResultsView instead of forcing the component to infer resume state from display text. I then extended the existing home, anonymous continuity, product-family, and direct ResultsView tests to lock the new wording and route-discovery cues into the regression contract. Finally, I ran live browser verification against the homepage generation flow plus the Gallery and Compare routes on a clean local dev server.

## Verification

Verified the four-file slice regression bundle, a focused ResultsView seam test, and live browser flows for `/`, `/gallery`, and `/compare`. The homepage/browser flow generated a real result and confirmed the new next-step guidance and route links. Gallery and Compare confirmed the shared route-intro copy and active-route semantics.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx` | 0 | ✅ pass | 7500ms |
| 2 | `npm test -- --run src/__tests__/components/results/ResultsView.live-proof.test.tsx` | 0 | ✅ pass | 14800ms |
| 3 | `npm run dev -- --port 3004` | 0 | ✅ pass | 644ms |
| 4 | `browser_verify http://localhost:3004` | 0 | ✅ pass | 0ms |
| 5 | `browser_batch homepage generation + results guidance assertions` | 0 | ✅ pass | 0ms |
| 6 | `browser_verify http://localhost:3004/gallery` | 0 | ✅ pass | 0ms |
| 7 | `browser_verify http://localhost:3004/compare` | 0 | ✅ pass | 0ms |


## Deviations

Used port 3004 for live browser verification because another workspace process already owned port 3000 and a stale local Next listener for this project was non-responsive. This did not change shipped code or the verification target surfaces.

## Known Issues

Live browser console logs surfaced existing hydration-mismatch warnings around textarea caret-color attributes on Home and Compare during dev-mode verification. The task’s shipped guidance and regression contract passed, but that runtime warning remains outside this task’s scope.

## Files Created/Modified

- `src/components/results/ResultsView.tsx`
- `src/app/page.tsx`
- `src/__tests__/app/home-editorial-flow.test.tsx`
- `src/__tests__/app/anonymous-continuity.test.tsx`
- `src/__tests__/app/product-family-coherence.test.tsx`
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M004/slices/S02/tasks/T03-SUMMARY.md`


## Deviations
Used port 3004 for live browser verification because another workspace process already owned port 3000 and a stale local Next listener for this project was non-responsive. This did not change shipped code or the verification target surfaces.

## Known Issues
Live browser console logs surfaced existing hydration-mismatch warnings around textarea caret-color attributes on Home and Compare during dev-mode verification. The task’s shipped guidance and regression contract passed, but that runtime warning remains outside this task’s scope.
