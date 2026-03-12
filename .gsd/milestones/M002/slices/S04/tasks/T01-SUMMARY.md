---
id: T01
parent: S04
milestone: M002
provides:
  - Failing executable acceptance contracts for live text, URL, and data proof coverage plus results-surface diagnostics requirements
key_files:
  - src/__tests__/app/live-art-proof.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
key_decisions:
  - S04 acceptance is locked at the real Home→ResultsView seam, with proof assertions targeting derived diagnostics and supported-style state rather than private implementation snapshots
patterns_established:
  - Use failing Vitest contracts to define browser-proof metadata seams before wiring runtime UI
observability_surfaces:
  - New failing Vitest files documenting required proof source, palette family, mapping posture, renderer expressiveness, and supported-style diagnostics
duration: ~1h40m
verification_result: passed
completed_at: 2026-03-12T18:36:30Z
blocker_discovered: false
---

# T01: Lock live-proof acceptance contracts and proof fixtures

**Added failing S04 proof-contract tests for live input-path coverage and inspectable results diagnostics.**

## What Happened

Created two new test files that define the slice acceptance boundary before runtime implementation exists.

- `src/__tests__/app/live-art-proof.test.tsx` exercises the real `src/app/page.tsx` flow contract across text, URL, and data inputs using contrasting fixtures. It asserts that each path reaches the results surface, that typographic stays available for text and URL, and that typographic is explicitly unavailable for data.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` defines the missing proof-diagnostics seam on `ResultsView`: palette family, mapping posture, renderer expressiveness, active style, and a derived-only/no-raw-input contract.

The tests are intentionally failing. The failures are concentrated on the missing S04 acceptance surface (`proof source`, `proof diagnostics`, palette/mapping/expressiveness labels) instead of unrelated pipeline regressions.

## Verification

Ran:

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`

Observed result:

- Command failed as expected.
- Failures are specifically due to missing proof-contract UI on `ResultsView` / live result surface:
  - missing `proof source`
  - missing `proof diagnostics`
- No unrelated hook/pipeline failures blocked the contract run.

## Diagnostics

Future agents can inspect the acceptance contract by reading:

- `src/__tests__/app/live-art-proof.test.tsx`
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx`

Re-run the focused command to confirm current gap state:

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`

The named assertions expose the exact missing browser-proof seam S04 must implement.

## Deviations

None.

## Known Issues

- The new tests include lightweight renderer/canvas mocks to keep the contract focused on acceptance behavior rather than canvas internals.
- Full slice-level verification remains incomplete until T02/T03 implement the proof UI, restore build health, run broader test suites, and execute browser proof.

## Files Created/Modified

- `src/__tests__/app/live-art-proof.test.tsx` — failing app-level acceptance contract for live text/URL/data proof coverage and supported-style state
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — failing ResultsView contract for inspectable palette/mapping/expressiveness diagnostics without raw-input disclosure
