---
estimated_steps: 4
estimated_files: 5
skills_used:
  - accessibility
  - react-best-practices
  - test
---

# T01: Adapt homepage onboarding for first-time, returning, and resumed visitors

**Slice:** S02 — Adaptive onboarding, empty states, and repeat-use navigation
**Milestone:** M004

## Description

Adapt the homepage from one static landing state into a derived first-visit/returning/resumed experience that reuses S01’s browser-local continuity seam. This task should make the start path clearer for new visitors, make resume cues obvious for returning visitors, and keep browser-local/private language distinct from public share and gallery routes.

## Steps

1. Derive a visitor-mode render state in `src/app/page.tsx` from `recentWorksLoaded`, `recentWorks.length`, and `resumedWork` instead of adding persisted onboarding flags.
2. Update hero, support, and note-card copy in `src/app/page.tsx` so first-time users see clear start guidance while returning users see truthful resume/start-fresh cues.
3. Thread adaptive guidance into `src/components/input/InputZone.tsx` and, if needed, `src/components/continuity/RecentLocalWorkPanel.tsx` so input instructions and empty/saved states match the visitor mode without exposing raw source content.
4. Extend `src/__tests__/app/home-editorial-flow.test.tsx` and `src/__tests__/app/anonymous-continuity.test.tsx` to assert first-visit versus returning-user behavior and privacy-safe wording.

## Must-Haves

- [ ] First-time visitors see a clear how-to-start path from the landing surface into the existing input controls.
- [ ] Returning visitors with recent local work see resume-oriented guidance without losing the explicit browser-local/private distinction.
- [ ] No new storage shape, onboarding flag, or continuity route is introduced.

## Verification

- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx`
- Rendering `Home` with and without saved recent work proves materially different onboarding states.

## Inputs

- `src/app/page.tsx` — homepage orchestration seam that already owns recent-work state.
- `src/components/input/InputZone.tsx` — current source-mode onboarding copy surface.
- `src/components/continuity/RecentLocalWorkPanel.tsx` — existing browser-local continuity panel from S01.
- `src/__tests__/app/home-editorial-flow.test.tsx` — homepage acceptance seam to extend for adaptive onboarding.
- `src/__tests__/app/anonymous-continuity.test.tsx` — recent-work continuity seam to extend for returning-user cues.

## Expected Output

- `src/app/page.tsx` — derived visitor-mode homepage copy and wiring.
- `src/components/input/InputZone.tsx` — adaptive input guidance tied to visitor mode.
- `src/components/continuity/RecentLocalWorkPanel.tsx` — aligned continuity framing for empty/saved states if copy changes are needed.
- `src/__tests__/app/home-editorial-flow.test.tsx` — assertions for first-time onboarding guidance.
- `src/__tests__/app/anonymous-continuity.test.tsx` — assertions for returning-user resume guidance.
