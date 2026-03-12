---
id: T01
parent: S03
milestone: M002
provides:
  - Failing renderer expressiveness contracts that localize missing palette.mapping consumption in organic and typographic scene builders
key_files:
  - src/__tests__/render/organic-scene.test.ts
  - src/__tests__/render/typographic-scene.test.ts
  - src/__tests__/components/StyleSelector.test.tsx
  - .gsd/milestones/M002/slices/S03/S03-PLAN.md
key_decisions:
  - Slice S03 will use scene-graph assertions, not snapshots, as the expressiveness contract for mapping-driven renderer changes
patterns_established:
  - Renderer tests compare contrasting PaletteResult.mapping fixtures against deterministic scene fields like density, gradient richness, hierarchy, and rotation budget
observability_surfaces:
  - Vitest failures in ORGN-05 and TYPO-05 identifying missing mapping-aware renderer behavior
duration: 20m
verification_result: passed
completed_at: 2026-03-11T18:56:45-04:00
blocker_discovered: false
---

# T01: Lock renderer expressiveness contracts with failing tests

**Added failing, mapping-aware renderer tests for organic and typographic scenes and confirmed the selector/runtime seam still accepts the upgraded scene shapes.**

## What Happened

Extended the organic renderer tests with an ORGN-05 contract that compares calm muted versus bold vivid `PaletteResult.mapping` fixtures and asserts deterministic differences in curve density, gradient richness, opacity posture, and directional drama. Extended the typographic renderer tests with a TYPO-05 contract that compares calm versus dramatic mappings and asserts deterministic differences in word count, prominent-word sizing, rotation looseness, and font-family variety while preserving the existing readability laws already covered by the suite.

Kept the `StyleSelector` test coverage aligned with the existing runtime seam by using concrete organic and typographic scene fixtures that include the richer scene-graph fields the selector thumbnail renderer already consumes. The component suite passed without needing additional runtime changes, which confirms the current selector seam remains compatible with the upgraded scene shapes.

Ran the targeted verification command and confirmed the new failures are the intended slice gate: both render suites fail because current scene builders ignore `palette.mapping` and therefore produce identical composition behavior across contrasting mapping fixtures.

## Verification

- Ran `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
- Confirmed `src/__tests__/components/StyleSelector.test.tsx` passes.
- Confirmed the intended failing contracts:
  - `ORGN-05` fails with `expected 90 to be less than 90`, showing organic curve density is unchanged across contrasting mappings.
  - `TYPO-05` fails with `expected 14 to be less than 14`, showing typographic word density is unchanged across contrasting mappings.
- These failures point to missing mapping-aware renderer behavior rather than unrelated breakage.

## Diagnostics

Read the failing assertions in:
- `src/__tests__/render/organic-scene.test.ts` (`ORGN-05`)
- `src/__tests__/render/typographic-scene.test.ts` (`TYPO-05`)

Re-run:
- `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`

The failure output names the exact scene-graph fields that still need shared `palette.mapping` interpretation in S03/T02.

## Deviations

none

## Known Issues

- The new renderer contracts are intentionally failing until S03/T02 wires shared mapping interpretation into the organic and typographic scene builders.

## Files Created/Modified

- `src/__tests__/render/organic-scene.test.ts` — Added mapping-aware organic expressiveness assertions tied to `PaletteResult.mapping`.
- `src/__tests__/render/typographic-scene.test.ts` — Added mapping-aware typographic expressiveness assertions tied to `PaletteResult.mapping`.
- `src/__tests__/components/StyleSelector.test.tsx` — Preserved selector/runtime seam coverage with scene fixtures compatible with richer organic and typographic scene graphs.
- `.gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md` — Recorded execution, verification, and intended failing-contract diagnostics for T01.
- `.gsd/milestones/M002/slices/S03/S03-PLAN.md` — Marked T01 complete.
- `.gsd/STATE.md` — Updated slice state to reflect completed failing-contract gate for S03/T01.
