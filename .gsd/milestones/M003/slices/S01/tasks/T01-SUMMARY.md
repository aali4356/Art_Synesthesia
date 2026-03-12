---
id: T01
parent: S01
milestone: M003
provides:
  - Failing executable proof for the editorial homepage landing-to-results journey
key_files:
  - src/__tests__/app/home-editorial-flow.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
  - .gsd/milestones/M003/slices/S01/S01-PLAN.md
key_decisions:
  - Encode the editorial redesign gap as a homepage integration-style test that asserts branded continuity and privacy-safe results posture before implementation
patterns_established:
  - Use mocked analysis hooks around the real homepage route to prove landing and results belong to one branded flow while diagnostics remain privacy-safe
observability_surfaces:
  - Targeted Vitest failures in src/__tests__/app/home-editorial-flow.test.tsx and src/__tests__/components/results/ResultsView.live-proof.test.tsx
duration: 25m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T01: Add failing proof for the editorial homepage journey

**Added a failing homepage proof test that localizes the missing editorial landing/results continuity while preserving the existing diagnostics/privacy contract.**

## What Happened

Created `src/__tests__/app/home-editorial-flow.test.tsx` to exercise the real `src/app/page.tsx` flow with mocked analysis hooks. The new proof asserts branded landing narrative, editorial continuity cues across landing and results, a branded back action, visible results actions, and privacy-safe diagnostics that reject raw input leakage.

Kept `src/__tests__/components/results/ResultsView.live-proof.test.tsx` focused on the existing diagnostics/privacy seam so it still names the required proof metadata surface without weakening the raw-input redaction contract.

Updated the slice plan checkbox to mark T01 complete after the executable proof boundary was added and verified in failing form.

## Verification

- Ran `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- Confirmed the command fails for the current UI because the homepage does not yet render the required editorial landing narrative and branded continuity framing
- Confirmed the existing `ResultsView` live-proof test still passes once the unnecessary branded-copy assertion was removed, keeping the failure localized to the new homepage journey contract

## Diagnostics

Run:

- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`

The expected current failure is in `src/__tests__/app/home-editorial-flow.test.tsx`, where missing editorial landing/results copy and continuity framing are reported as direct DOM assertion failures. The results proof file remains the privacy-safe diagnostics seam for future redesign work.

## Deviations

none

## Known Issues

- `src/app/page.tsx` still presents the old sparse landing/results split, so the new homepage proof intentionally fails until T02/T03 implement the editorial redesign

## Files Created/Modified

- `src/__tests__/app/home-editorial-flow.test.tsx` — new failing integration-style proof for the homepage editorial landing-to-results journey
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — preserved the privacy-safe diagnostics proof seam while keeping expectations aligned to the current explicit results contract
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T01 complete
