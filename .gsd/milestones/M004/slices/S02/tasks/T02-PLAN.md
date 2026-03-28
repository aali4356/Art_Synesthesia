---
estimated_steps: 4
estimated_files: 6
skills_used:
  - accessibility
  - react-best-practices
  - test
---

# T02: Add shared-shell route discovery with active navigation semantics

**Slice:** S02 — Adaptive onboarding, empty states, and repeat-use navigation
**Milestone:** M004

## Description

Turn the shared shell from a branded header plus one continuity CTA into a real route-discovery system. This task should give users a keyboard-usable nav landmark for Home/Recent local work, Compare, and Gallery, expose the active route semantically, and keep browser-local continuity language clearly separate from public routes.

## Steps

1. Refactor `src/components/layout/Header.tsx` into a semantic navigation landmark with links for Home/Recent local work, Compare, and Gallery while keeping the continuity note explicit about browser-local privacy.
2. Use `src/components/layout/Shell.tsx` and the current route family to expose correct `aria-current` state and shared-shell composition without route-local drift.
3. Align route intro wording in `src/app/gallery/page.tsx` and `src/app/compare/CompareMode.tsx` so the nav reads as one coherent product family and correct the stale compare phrasing already drifting in tests.
4. Update `src/__tests__/app/shared-brand-surfaces.test.tsx` and `src/__tests__/app/product-family-coherence.test.tsx` to assert nav landmark semantics, active-route cues, and corrected family copy.

## Must-Haves

- [ ] The header becomes a real, accessible navigation landmark rather than a single continuity CTA.
- [ ] Active-route state is exposed semantically and stays consistent on homepage, gallery, and compare.
- [ ] Public routes remain clearly distinct from browser-local recent work.

## Verification

- `npm test -- --run src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- Homepage, gallery, and compare renders expose the expected nav landmark and `aria-current` state.

## Observability Impact

- Signals added/changed: visible active-route state and shared nav landmark semantics.
- How a future agent inspects this: render homepage/gallery/compare routes and inspect `aria-current` plus route-intro text.
- Failure state exposed: broken route discovery fails in shared-brand/coherence suites instead of silently degrading.

## Inputs

- `src/components/layout/Header.tsx` — current header with only one continuity CTA.
- `src/components/layout/Shell.tsx` — shared wrapper that composes all main routes.
- `src/app/gallery/page.tsx` — gallery route intro inside the shared shell.
- `src/app/compare/CompareMode.tsx` — compare route intro and wording seam.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — route-surface semantic/copy regression suite.
- `src/__tests__/app/product-family-coherence.test.tsx` — cross-surface wording contract suite.

## Expected Output

- `src/components/layout/Header.tsx` — shared nav landmark with product-family route discovery.
- `src/components/layout/Shell.tsx` — active-route wiring or shell structure needed for nav semantics.
- `src/app/gallery/page.tsx` — route intro aligned with the shared nav family.
- `src/app/compare/CompareMode.tsx` — corrected compare intro/family wording.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — assertions for nav discovery and route semantics.
- `src/__tests__/app/product-family-coherence.test.tsx` — updated wording/contract assertions.
