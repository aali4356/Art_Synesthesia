---
id: S02
parent: M004
milestone: M004
provides:
  - Adaptive homepage/editorial intake guidance for first-time, returning, and resumed visitors.
  - A semantic shared navigation landmark with truthful active-route state across Home, Compare, and Gallery.
  - Results next-step guidance that routes users back to Home, to Compare, or toward public routes without blurring browser-local continuity.
requires:
  - slice: S01
    provides: The browser-local recent-work storage/resume seam and privacy-safe local-vs-public language established by anonymous-first continuity.
affects:
  - S03
key_files:
  - src/app/page.tsx
  - src/components/input/InputZone.tsx
  - src/components/continuity/RecentLocalWorkPanel.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Shell.tsx
  - src/app/gallery/page.tsx
  - src/app/compare/CompareMode.tsx
  - src/components/results/ResultsView.tsx
  - src/__tests__/app/home-editorial-flow.test.tsx
  - src/__tests__/app/anonymous-continuity.test.tsx
  - src/__tests__/app/shared-brand-surfaces.test.tsx
  - src/__tests__/app/product-family-coherence.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
  - .gsd/KNOWLEDGE.md
  - .gsd/PROJECT.md
key_decisions:
  - Derived homepage visitor mode from existing recent-work load state and resumed-work presence instead of introducing a new onboarding flag or storage shape.
  - Drove shared-shell active-route semantics from an explicit Shell route-family prop so Header stays truthful without pathname inference.
  - Passed an explicit continuityMode prop into ResultsView so fresh versus reopened browser-local guidance is rendered from real continuity state, not inferred copy.
patterns_established:
  - Derive onboarding and resume UX from existing browser-local continuity state instead of introducing a separate persisted onboarding system.
  - Pass shared route intent (`currentRoute`) and continuity intent (`continuityMode`) explicitly through shell/results seams so semantics and copy stay stable across surfaces.
  - Treat the privacy boundary copy as a cross-surface regression contract: lock Home, Header, Recent local work, and Results wording together in one executable bundle and confirm it in the live browser.
observability_surfaces:
  - Expanded the executable copy-contract proof bundle across home editorial flow, anonymous continuity, shared-brand surfaces, product-family coherence, and a focused ResultsView live-proof seam.
drill_down_paths:
  - .gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M004/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T17:20:23.288Z
blocker_discovered: false
---

# S02: Adaptive onboarding, empty states, and repeat-use navigation

**Delivered adaptive first-visit versus returning-user guidance, shared route navigation, and results next-step cues that make Home, Results, Compare, and Gallery behave like one truthful repeat-use product family.**

## What Happened

S02 turned the anonymous-first continuity seam from S01 into an actual repeat-use product layer. The homepage now adapts editorial guidance from existing browser-local recent-work state so first-time visitors get an immediate how-to-start path, while returning visitors see welcome-back, resume, and start-fresh cues without introducing any new persisted onboarding state. The shared shell now exposes a real primary navigation landmark for Home / Recent local work, Compare, and Gallery with semantic active-route state, and the route intros on Compare and Gallery read as one coherent product family while still keeping browser-local continuity explicitly separate from public routes. ResultsView now carries the same contract forward: fresh and reopened editions both show clear next steps back to Home, out to Compare, and toward Gallery/Share with copy that preserves the browser-local versus public boundary. Together, these changes close the route-discovery guesswork gap and establish a reusable pattern for downstream slices: derive adaptive UX from truthful continuity state, pass route/continuity intent explicitly through shared seams, and lock cross-surface copy contracts with executable regression coverage plus live browser proof.

## Verification

Slice verification passed at both regression and browser-proof levels. `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx` passed (5 files, 14 tests). Live browser verification on a clean `npm run dev -- --port 3004` session confirmed first-visit homepage guidance, generated results with explicit next-step route guidance, same-browser save/return behavior that flipped the homepage into returning-user mode, semantic active-route navigation on Compare and Gallery, and truthful Gallery unavailable messaging in local proof mode without a database.

## Requirements Advanced

- R004 — Home, Header, Compare, Gallery, and Results now share one route-discovery and privacy-boundary contract, reducing cross-surface drift and making the product family coherent for first-time and returning visitors.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Used port 3004 for live browser verification because stale/non-responsive local listeners had previously occupied port 3000 in this workspace. Verification scope and shipped behavior were unchanged; only the local proof port moved.

## Known Limitations

Gallery still shows its truthful local-proof unavailable state when DATABASE_URL is absent, so public archive browsing remains blocked in no-DB verification mode. Dev-mode browser verification also still surfaces a textarea hydration-mismatch warning around caret-color attributes on Home/Compare that this slice did not address.

## Follow-ups

S03 should add privacy-filtered analytics/error-monitoring and accessibility breadth on top of these new home/header/results seams. Separately, the dev-only textarea hydration mismatch warning surfaced during browser verification remains worth investigating if it persists outside this slice.

## Files Created/Modified

- `src/app/page.tsx` — Derived first-visit versus returning/resumed homepage editorial copy from recent local work state without adding persisted onboarding state.
- `src/components/input/InputZone.tsx` — Adapted input guidance so first-time and returning visitors see truthful start/resume cues inside the real generation controls.
- `src/components/continuity/RecentLocalWorkPanel.tsx` — Clarified empty-state and saved-state browser-local continuity messaging for recent local work.
- `src/components/layout/Header.tsx` — Turned the header into a shared primary navigation landmark with explicit browser-local versus public-route framing.
- `src/components/layout/Shell.tsx` — Drove semantic active-route state from an explicit route-family prop so Home, Compare, and Gallery stay aligned.
- `src/app/gallery/page.tsx` — Aligned gallery route-family copy and kept truthful unavailable-state language in local proof mode.
- `src/app/compare/CompareMode.tsx` — Aligned compare intro copy with the shared product family and active-route contract.
- `src/components/results/ResultsView.tsx` — Added fresh-versus-resumed next-step guidance plus route links on results surfaces.
- `src/__tests__/app/home-editorial-flow.test.tsx` — Locked the slice contract with adaptive-home, continuity, shared-brand, product-family, and results live-proof regression coverage.
- `src/__tests__/app/anonymous-continuity.test.tsx` — Locked the slice contract with adaptive-home, continuity, shared-brand, product-family, and results live-proof regression coverage.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — Locked the slice contract with adaptive-home, continuity, shared-brand, product-family, and results live-proof regression coverage.
- `src/__tests__/app/product-family-coherence.test.tsx` — Locked the slice contract with adaptive-home, continuity, shared-brand, product-family, and results live-proof regression coverage.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — Added focused results-seam proof coverage for next-step guidance.
- `.gsd/KNOWLEDGE.md` — Recorded repeat-use verification guidance and updated project state after slice completion.
- `.gsd/PROJECT.md` — Updated project current-state narrative to reflect adaptive onboarding and repeat-use navigation delivery.
