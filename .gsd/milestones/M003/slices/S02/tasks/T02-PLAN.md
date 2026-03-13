---
estimated_steps: 5
estimated_files: 5
---

# T02: Normalize gallery browse and compare into the shared shell/action system

**Slice:** S02 — Shared brand system across shell, actions, and viewer surfaces
**Milestone:** M003

## Description

Move the gallery browse route and compare mode onto the shared editorial shell and control language already proven in S01. This task closes the biggest route-level coherence gaps by removing compare’s undefined utility classes, introducing reusable branded route-intro/filter patterns, and wiring those patterns into the real browse/compare surfaces without changing business logic.

## Steps

1. Refactor `src/app/gallery/page.tsx` to use the shared shell-driven composition and branded route-intro/unavailable-state structure instead of a standalone `min-h-screen` wrapper.
2. Update `src/components/gallery/GalleryGrid.tsx` and `src/components/gallery/GalleryFilters.tsx` so filter controls, empty states, and pagination adopt the editorial panel/chip/action posture from S01 while keeping the same routing behavior.
3. Refactor `src/app/compare/CompareMode.tsx` to use the same route-intro, panel, canvas frame, and button semantics, replacing undefined utility classes with shared editorial utilities and preserving the shared style selector plus two-pane compare behavior.
4. Extend `src/app/globals.css` only with the minimal new shared route/filter/control utilities needed by both gallery and compare rather than page-local classes.
5. Run the targeted tests and fix any regressions until gallery/compare proof passes.

## Must-Haves

- [ ] Gallery browse and compare visibly consume the shared branded shell/action language instead of page-local wrappers or undefined semantic classes.
- [ ] Compare mode still preserves two input panes, one shared style selector, and keyboard-usable control semantics under the new styling.

## Verification

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx`
- Gallery browse and compare assertions in `src/__tests__/app/shared-brand-surfaces.test.tsx` pass without regressing existing gallery-card or compare behavior tests.

## Observability Impact

- Signals added/changed: Route-level headings, filter labels, and compare control states become consistent inspection seams across branded surfaces.
- How a future agent inspects this: Use the targeted tests plus the live `/gallery` and `/compare` UI to verify shell adoption and control-state clarity.
- Failure state exposed: Shell breakage, missing route intro content, or compare-control regressions remain visible in both DOM assertions and live route UI.

## Inputs

- `src/components/layout/Shell.tsx` — canonical branded shell wrapper established in S01 and required for downstream route coherence.
- `src/app/globals.css` — existing editorial token layer that must be extended rather than replaced.

## Expected Output

- `src/app/gallery/page.tsx` — gallery browse route wrapped in shared branded route composition with explicit unavailable states.
- `src/components/gallery/GalleryGrid.tsx` and `src/components/gallery/GalleryFilters.tsx` — browse controls/pagination normalized to editorial action and filter styling.
- `src/app/compare/CompareMode.tsx` — compare surface normalized onto the shared branded shell/action grammar without losing tested behavior.
