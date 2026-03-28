---
estimated_steps: 5
estimated_files: 4
---

# T03: Add final assembled proof and close the slice in browser truth

**Slice:** S03 — Cohesive gallery, compare, share, and export product family
**Milestone:** M003

## Description

Convert S03 from attractive local changes into milestone-level proof by adding the final assembled route-family contract, running build/test verification, and closing the slice with explicit browser confirmation of continuity, accessibility-aware controls, and truthful unavailable-state handling.

## Steps

1. Create or finalize `src/__tests__/app/product-family-coherence.test.tsx` so it asserts the assembled family relationship across homepage-derived action language, gallery browse cards, compare framing, and share/detail or unavailable-state surfaces.
2. Run the named slice verification suite and production build, fixing any gaps until the executable contract is green.
3. Start or reuse the local app, then browser-walk the real homepage to results and the supporting routes `/gallery`, `/compare`, and one DB-backed detail/share route.
4. In the browser, explicitly verify keyboard-usable controls, privacy/export truth messaging, and branded unavailable diagnostics when DB-backed routes are not available locally.
5. Update project state and any structural decision needed to record the final acceptance boundary for this slice.

## Must-Haves

- [ ] Final slice acceptance is anchored to an executable route-family proof contract plus passing build.
- [ ] Browser verification explicitly checks keyboard/accessibility-aware interactions and truthful unavailable-state behavior, not just visuals.

## Verification

- `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
- Browser assertions on localhost confirming continuity across results, gallery, compare, and share/detail or unavailable-state routes.

## Observability Impact

- Signals added/changed: final route-family test contract and browser-visible acceptance evidence for action continuity and failure-path truthfulness
- How a future agent inspects this: one named test file, slice verification commands, browser assertions/logs, and updated `.gsd/STATE.md`
- Failure state exposed: assembly regressions surface as failing route-family assertions, build failures, or inspectable browser unavailable-state/action-state mismatches

## Inputs

- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — slice acceptance contract that this task must fully close
- Outputs from T01 and T02 — aligned action-family surfaces and editorialized gallery cards ready for final assembly proof

## Expected Output

- `src/__tests__/app/product-family-coherence.test.tsx` — final assembled proof file for S03
- `.gsd/DECISIONS.md` — any structural decision recorded if acceptance boundaries are clarified during proof
- `.gsd/STATE.md` — state advanced from planning to execution-ready/completed next action context after slice plan work
