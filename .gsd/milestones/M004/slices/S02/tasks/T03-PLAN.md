---
estimated_steps: 4
estimated_files: 5
skills_used:
  - accessibility
  - react-best-practices
  - test
---

# T03: Carry repeat-use guidance through results and lock the cross-surface contract

**Slice:** S02 — Adaptive onboarding, empty states, and repeat-use navigation
**Milestone:** M004

## Description

Finish the slice by making the results surface reinforce the same repeat-use navigation story introduced on the homepage and in the header. This task should ensure live results and reopened recent-local results point users toward the right next step, preserve the private-vs-public persistence contract, and close with one regression bundle plus live browser verification.

## Steps

1. Update `src/components/results/ResultsView.tsx` so both fresh results and reopened recent-local results offer clear next-step guidance: return home to resume/start fresh, compare for side-by-side evaluation, and use share/gallery only with explicit public wording.
2. Tighten any remaining homepage/results/header wording seams so the adaptive onboarding work still reads as one product family and advances active requirement `R004`.
3. Finalize regression coverage across `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, and `src/__tests__/app/product-family-coherence.test.tsx`.
4. Run live browser verification on `/`, `/gallery`, and `/compare` after the automated suite to confirm route discovery and repeat-use cues in the real UI.

## Must-Haves

- [ ] Results surfaces reinforce the same navigation and continuity story introduced on the homepage/header.
- [ ] Browser-local recall versus public share/gallery persistence remains explicit in every changed surface.
- [ ] The slice ends with one regression bundle that proves the shipped user journey.

## Verification

- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- Live browser verification on `http://localhost:3000`, `http://localhost:3000/gallery`, and `http://localhost:3000/compare` confirms adaptive homepage copy, shared nav discovery, and repeat-use results cues.

## Observability Impact

- Signals added/changed: repeat-use guidance and route-next-step copy visible in results/resume states.
- How a future agent inspects this: run the full RTL bundle, then verify the rendered homepage/results routes in the browser.
- Failure state exposed: cross-surface copy drift shows up as targeted test failures instead of subjective review.

## Inputs

- `src/components/results/ResultsView.tsx` — results action/guidance surface from S01.
- `src/app/page.tsx` — homepage wording seam to stay coherent with results guidance.
- `src/components/layout/Header.tsx` — shared route-discovery copy that results guidance must echo.
- `src/__tests__/app/home-editorial-flow.test.tsx` — homepage/results acceptance seam.
- `src/__tests__/app/anonymous-continuity.test.tsx` — resume/reopen continuity seam.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — route-family branded surface seam.
- `src/__tests__/app/product-family-coherence.test.tsx` — cross-surface contract seam.

## Expected Output

- `src/components/results/ResultsView.tsx` — repeat-use next-step guidance aligned with the homepage/header story.
- `src/__tests__/app/home-editorial-flow.test.tsx` — updated homepage/results assertions.
- `src/__tests__/app/anonymous-continuity.test.tsx` — updated continuity/results assertions.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — updated shared-route family assertions as needed.
- `src/__tests__/app/product-family-coherence.test.tsx` — final cross-surface contract assertions.
