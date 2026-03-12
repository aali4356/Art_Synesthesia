---
estimated_steps: 4
estimated_files: 6
---

# T02: Wire live proof diagnostics and restore operational health

**Slice:** S04 — Live Art Quality Integration Proof
**Milestone:** M002

## Description

Implement the runtime acceptance seam required by S04 and remove the known build blocker. This task adds a minimal but real live-proof surface to the results UI so browser verification can inspect family/mapping/expressiveness state, while also fixing the `HarmonyType` mismatch that currently prevents `npm run build` from succeeding.

## Steps

1. Fix the `HarmonyType` / `HARMONY_SPREAD` mismatch in the render expressiveness boundary so the type contract matches the actual harmony union and `npm run build` can pass again.
2. Extend the live results surface to expose current palette family, mapping, renderer expressiveness, and supported-style diagnostics in a concise acceptance-oriented UI that avoids raw-input leakage.
3. Ensure the proof surface reflects real input-type constraints, including typographic disabled state for data, and thread any needed metadata from page-level flow into `ResultsView` without introducing a fake harness.
4. Run the targeted proof tests, existing hook/style integration suites, and `npm run build`; iterate until the new proof contract and operational verification both pass.

## Must-Haves

- [ ] The live UI shows enough structured diagnostics to explain whether a weak result is a mapping/rendering issue or a wiring/input-type issue.
- [ ] `npm run build` passes after the harmony-type repair, with no regression to existing text/URL/data flow behavior.

## Verification

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx`
- `npm run build`

## Observability Impact

- Signals added/changed: Browser-visible proof metadata for family/mapping/expressiveness and explicit supported-style state.
- How a future agent inspects this: Use the live results UI plus the new test files and existing hook/renderer suites.
- Failure state exposed: Build breakage, wrong harmony typing, missing expressiveness diagnostics, or incorrect style support becomes visible through build output, tests, and the proof UI.

## Inputs

- `src/lib/render/expressiveness.ts` — authoritative mapping-to-renderer posture seam and current source of the build blocker.
- T01 failing contracts — executable definition of the acceptance UI and diagnostics that must now exist.

## Expected Output

- `src/components/results/ResultsView.tsx` (and related wiring files) — real acceptance/proof surface for current result diagnostics and supported-style state.
- `src/lib/render/expressiveness.ts` and any necessary type files — corrected harmony typing and restored build health.
