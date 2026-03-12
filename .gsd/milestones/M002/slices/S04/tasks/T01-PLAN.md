---
estimated_steps: 3
estimated_files: 4
---

# T01: Lock live-proof acceptance contracts and proof fixtures

**Slice:** S04 — Live Art Quality Integration Proof
**Milestone:** M002

## Description

Define the S04 stopping condition as executable proof instead of subjective review. This task adds failing tests that describe what the live result experience must expose for browser verification: real input-path coverage, supported versus disabled style behavior, and a stable acceptance metadata surface for the current result that future browser work can inspect.

## Steps

1. Add an app-level acceptance test that exercises the shared page/result flow with contrasting text, URL, and data fixtures and asserts the right result-surface states appear for each input path.
2. Add a ResultsView-focused test that defines the expected live-proof metadata surface for current palette family, mapping posture, and renderer expressiveness without depending on raw-input disclosure.
3. Run the new targeted test command, confirm the tests fail for the intended missing proof behavior, and keep the failure focused on S04 acceptance gaps rather than unrelated regressions.

## Must-Haves

- [ ] The new tests name the real proof boundary: text, URL, and data flows through the live results surface, with typographic intentionally unavailable for data.
- [ ] The failing assertions require an inspectable acceptance surface for palette/mapping/expressiveness diagnostics so S04 browser work has a trustworthy debugging seam.

## Verification

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- The test run fails specifically because the acceptance/proof UI contract is not implemented yet.

## Observability Impact

- Signals added/changed: Test-defined requirements for stable live-proof metadata and supported-style state on the real results surface.
- How a future agent inspects this: Read the new Vitest files and rerun the targeted test command.
- Failure state exposed: Missing or incomplete proof diagnostics, missing input-path coverage, or wrong style availability behavior becomes explicit in named assertions.

## Inputs

- `src/app/page.tsx` — existing shared entrypoint for text, URL, and data flows into `ResultsView`.
- `src/components/results/ResultsView.tsx` and `src/components/results/StyleSelector.tsx` — current acceptance surface and supported-style behavior from prior slices.

## Expected Output

- `src/__tests__/app/live-art-proof.test.tsx` — failing contract for real live-proof input-path and style-availability coverage.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — failing contract for inspectable acceptance diagnostics on the current result surface.
