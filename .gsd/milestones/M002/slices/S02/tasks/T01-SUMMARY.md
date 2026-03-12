---
id: T01
parent: S02
milestone: M002
provides:
  - Failing executable contracts for synesthetic mapping diagnostics and family-authoritative palette behavior
key_files:
  - src/__tests__/color/synesthetic-mapping.test.ts
  - src/__tests__/color/harmony.test.ts
  - src/__tests__/color/palette.test.ts
key_decisions:
  - Use explicit named mapping expectations on PaletteResult (`mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, `contrastPosture`) as the slice gate instead of generic metadata-presence assertions
patterns_established:
  - Lock new palette behavior by adding failing contract tests before runtime implementation, while preserving unrelated baseline regressions as known carry-forward issues
observability_surfaces:
  - Targeted Vitest command covering mapping, harmony, and palette contracts
  - PaletteResult.mapping expectations in color test suites
duration: 35m
verification_result: passed
completed_at: 2026-03-12T01:29:01Z
blocker_discovered: false
---

# T01: Lock the synesthetic mapping contract with failing tests

**Added failing color-layer contract tests that define the required synesthetic mapping diagnostics and family-authoritative palette behavior for S02.**

## What Happened

Created `src/__tests__/color/synesthetic-mapping.test.ts` with named deterministic scenarios for lagoon, solar, and orchid vectors. Those tests now assert the intended mapping artifact fields on `generatePalette()` output, including `mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, `contrastPosture`, `harmony`, `familyId`, and `anchorHue`.

Updated `src/__tests__/color/harmony.test.ts` so the raw `selectHarmony()` contract remains documented while also asserting the future family-authoritative palette behavior through `generatePalette()`. Updated `src/__tests__/color/palette.test.ts` to replace legacy warmth-only hue expectations with mapping-driven/family-driven expectations and to assert that `PaletteResult` should expose the new mapping diagnostics.

Ran the targeted color verification command and confirmed the intended failures are now centered on missing `PaletteResult.mapping` support and missing family-authoritative mapping diagnostics. Two pre-existing palette baseline failures also remain visible (`deltaE < 10` and dark/light chroma tolerance drift); they were not introduced by this task and should be handled separately from the new S02 mapping implementation.

## Verification

- Ran: `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette.test.ts`
- Result: command failed as intended for T01.
- Confirmed new failing assertions clearly identify the missing implementation target:
  - `PaletteResult` does not yet expose `mapping`
  - mapping fields like `mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, and `contrastPosture` are not yet implemented
  - palette-level family-authoritative harmony diagnostics are not yet surfaced
- Also observed existing unrelated failures still present in `src/__tests__/color/palette.test.ts`:
  - near-duplicate rejection deltaE threshold regression
  - dark/light chroma tolerance regression

## Diagnostics

- Inspect the contract by reading `src/__tests__/color/synesthetic-mapping.test.ts`.
- Reproduce the current implementation gap with:
  - `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette.test.ts`
- The missing behavior is localized by assertion names and error messages on `result.mapping` and mapping field expectations.

## Deviations

- None.

## Known Issues

- `src/__tests__/color/palette.test.ts` still has pre-existing baseline failures unrelated to the new mapping contract: LAB deltaE duplicate rejection and dark/light chroma tolerance.
- The new mapping contract currently fails because `generatePalette()` does not yet return a `mapping` artifact.

## Files Created/Modified

- `src/__tests__/color/synesthetic-mapping.test.ts` — new failing contract suite for synesthetic mapping diagnostics and family-authoritative palette behavior
- `src/__tests__/color/harmony.test.ts` — added palette-level harmony authority contract alongside raw harmony selector coverage
- `src/__tests__/color/palette.test.ts` — replaced legacy warmth-only expectations with mapping/family-driven palette assertions
