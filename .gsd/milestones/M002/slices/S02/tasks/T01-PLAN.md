---
estimated_steps: 3
estimated_files: 3
---

# T01: Lock the synesthetic mapping contract with failing tests

**Slice:** S02 — Synesthetic Mapping Upgrade
**Milestone:** M002

## Description

Define the slice gate before implementation by writing executable tests that describe how full-vector synesthetic intent should behave and how `generatePalette()` must expose and consume that intent. These tests should fail initially and become the authoritative contract for the rest of S02.

## Steps

1. Add `src/__tests__/color/synesthetic-mapping.test.ts` with representative vector scenarios that assert deterministic mood, harmony authority, hue-anchor strategy, chroma posture, and contrast posture on a new mapping artifact and on `generatePalette()` output.
2. Extend `src/__tests__/color/harmony.test.ts` and `src/__tests__/color/palette.test.ts` so they assert the new family- and mapping-driven behavior instead of the current legacy warmth-only hue path.
3. Run the targeted color verification command, confirm the new assertions fail for the expected reasons, and keep those failures as the implementation target for T02.

## Must-Haves

- [ ] The new mapping test names specific deterministic scenarios and expected mapping fields rather than generic “has metadata” assertions.
- [ ] Existing palette/harmony tests are updated to reflect authoritative mapping/family behavior and fail against the current implementation.

## Verification

- `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette.test.ts`
- The run fails because the new synesthetic mapping behavior is not implemented yet, and the failing assertions identify the missing fields/behavior clearly.

## Observability Impact

- Signals added/changed: named mapping diagnostics become test-visible expectations (`mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, `contrastPosture`).
- How a future agent inspects this: read the new test file and rerun the targeted color verification command.
- Failure state exposed: the exact mapping dimension that regressed becomes visible through assertion names instead of only visual palette drift.

## Inputs

- `src/lib/color/palette.ts` — current shared seam and current legacy hue/harmony behavior.
- `src/lib/color/harmony.ts` — existing threshold-based harmony logic that T02 will likely refactor.
- `src/__tests__/color/palette-family-selection.test.ts` — current family contract and deterministic metadata baseline.

## Expected Output

- `src/__tests__/color/synesthetic-mapping.test.ts` — failing contract tests for the new mapping artifact and palette exposure.
- `src/__tests__/color/harmony.test.ts` — updated expectations for intent-driven harmony selection.
- `src/__tests__/color/palette.test.ts` — updated expectations proving palette realization must follow the new mapping contract.
