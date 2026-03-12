---
estimated_steps: 5
estimated_files: 6
---

# T03: Reframe ResultsView and adjacent actions into the same premium system

**Slice:** S01 — Editorial landing, generation, and results journey
**Milestone:** M003

## Description

Restructure the real results experience so it feels like a continuation of the editorial landing surface rather than a fallback tool screen. This task keeps `ResultsView`’s diagnostics, style switching, and privacy posture intact while bringing export/share/save surfaces and the gallery save modal into the same branded system and eliminating undefined utility-class drift.

## Steps

1. Recompose `src/components/results/ResultsView.tsx` so the back action, results framing, proof diagnostics, canvas/viewer area, and panel hierarchy use the same editorial language established on landing.
2. Keep proof diagnostics explicit and privacy-safe, preserving active style, palette/mapping posture, and renderer expressiveness as visible inspection surfaces.
3. Replace undefined semantic utility usage in `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, and related results actions with normalized shared tokens or explicit valid classes.
4. Update `src/components/gallery/GallerySaveModal.tsx` so the results-triggered modal inherits the same premium system and keeps its public-preview/privacy messaging truthful.
5. Adjust any necessary page-level framing in `src/app/page.tsx` and `src/app/globals.css` so landing → results reads as one route-level journey rather than two unrelated layouts.

## Must-Haves

- [ ] ResultsView still exposes privacy-safe proof diagnostics and never surfaces raw input in that diagnostic panel.
- [ ] Export, share, and save-to-gallery actions remain clearly usable and no longer rely on undefined styling semantics.
- [ ] The results route visually and structurally feels continuous with the landing experience rather than resetting into a neutral tool layout.

## Verification

- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- In-browser smoke check of results actions/state visibility after generating artwork locally.

## Observability Impact

- Signals added/changed: Results diagnostics remain the primary live-debug seam, while action success/error states become visually clearer within the branded system.
- How a future agent inspects this: Generate once in the app, then inspect the diagnostics panel and results action states directly.
- Failure state exposed: Styling-token regressions, missing diagnostics, or broken action states become visible on the main results surface and modal entrypoint.

## Inputs

- `src/components/results/ResultsView.tsx` — existing canonical diagnostics/action seam that must be preserved.
- `src/components/results/{ExportControls,ShareButton}.tsx` — current undefined semantic utility usage to normalize.
- `src/components/gallery/GallerySaveModal.tsx` — results-adjacent modal whose styling consistency affects S01 continuity proof.

## Expected Output

- `src/components/results/ResultsView.tsx` — editorial results composition with preserved diagnostics/privacy contract.
- `src/components/results/{ExportControls,ShareButton}.tsx` — normalized branded action surfaces.
- `src/components/gallery/GallerySaveModal.tsx` and `src/app/globals.css` — save flow and shared tokens aligned to the new system.
