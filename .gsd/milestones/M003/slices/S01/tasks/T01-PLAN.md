---
estimated_steps: 3
estimated_files: 3
---

# T01: Add failing proof for the editorial homepage journey

**Slice:** S01 — Editorial landing, generation, and results journey
**Milestone:** M003

## Description

Create the executable proof boundary for S01 before implementation by adding a homepage integration-style test for the real landing/results journey and tightening the existing `ResultsView` live-proof test only where the redesigned branded posture needs explicit coverage. The task is complete only when the new expectations fail against the current UI, making the missing editorial continuity concrete.

## Steps

1. Add `src/__tests__/app/home-editorial-flow.test.tsx` to render the real homepage flow with mocked analysis hooks and assert the required launch-facing narrative, editorial continuity cues, branded generation entry, and results-state back/diagnostics framing.
2. Update `src/__tests__/components/results/ResultsView.live-proof.test.tsx` only as needed to preserve the privacy-safe diagnostics seam while naming any new branded results copy or framing the redesign must keep.
3. Run the targeted test command and confirm it fails for the current implementation because the required editorial landing/results experience does not yet exist.

## Must-Haves

- [ ] The homepage test covers both empty and results states, including at least one continuity assertion that would fail if landing and results still felt like separate products.
- [ ] The proof still enforces privacy-safe diagnostics visibility and explicitly rejects raw-input leakage in the results surface.

## Verification

- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- The command fails because the new editorial journey assertions are not yet satisfied by the current UI.

## Observability Impact

- Signals added/changed: Encodes branded continuity, launch narrative, and diagnostics/privacy expectations as executable test failures instead of informal design intent.
- How a future agent inspects this: Run the targeted Vitest command and inspect which landing/results assertions fail.
- Failure state exposed: Missing copy, missing continuity framing, or broken diagnostics/privacy posture become localized test failures.

## Inputs

- `src/app/page.tsx` — current landing/results seam and back action behavior to target with the new test.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — existing privacy-safe proof contract that must remain intact while the results surface changes.

## Expected Output

- `src/__tests__/app/home-editorial-flow.test.tsx` — failing executable proof for the editorial homepage journey.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — updated branded-proof assertions that still preserve privacy diagnostics constraints.
