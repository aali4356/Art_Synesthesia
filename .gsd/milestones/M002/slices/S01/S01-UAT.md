# S01: Palette Family System — UAT

**Milestone:** M002
**Written:** 2026-03-11

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a contract-level slice whose planned proof is deterministic test coverage on the shared palette seam rather than live browser behavior.

## Preconditions

- Dependencies installed
- Vitest runnable in the project workspace
- Current palette-family implementation present in `src/lib/color/*`

## Smoke Test

Run the slice verification command and confirm the family-selection contract is exercised at all:

- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`

## Test Cases

### 1. Family diagnostics are exposed on the shared palette seam

1. Run `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts`
2. Inspect the passing assertions for `familyId`, `familyName`, `familyDescriptor`, `selectionKey`, and `selectionVector`.
3. **Expected:** `generatePalette()` returns stable family metadata and deterministic family identity for the same vector and seed.

### 2. Curated families are reachable across representative scenarios

1. Run `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts`
2. Confirm the representative cases for `solar-flare`, `lagoon-mist`, `orchid-nocturne`, and `meadow-bloom` are exercised.
3. **Expected:** multiple named curated families are reachable without changing the `generatePalette(params, seed)` call shape.

### 3. Slice gate still blocks completion on unresolved realization regressions

1. Run `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`
2. Review the failure output.
3. **Expected:** current failure surfaces localize to realization-level diversity/safety issues rather than missing metadata or missing family-selection wiring.

## Edge Cases

### Baseline palette contract regressions after family tuning

1. Run `npm run test:run -- src/__tests__/color/palette.test.ts`
2. **Expected:** if regressions exist, they surface explicitly in near-duplicate rejection and dark/light chroma parity assertions.

## Failure Signals

- Missing `PaletteResult` family metadata
- Representative scenarios collapsing to the same family
- Curated-family diversity assertions failing on hue/chroma/lightness separation
- Baseline palette tests failing on near-duplicate deltaE or dark/light chroma tolerance

## Requirements Proved By This UAT

- none — the full slice proof is not complete because the planned verification set does not fully pass.

## Not Proven By This UAT

- R001 — the project has advanced toward richer deterministic palette families, but this UAT does not prove the slice complete because diversity and safety gates still fail together.
- Any live runtime or browser-visible art-quality improvement; those are deferred to later slices and milestone-level integration proof.

## Notes for Tester

The current implementation is partially landed, not slice-complete. Trust the combined Vitest command as the source of truth: it shows that the family-system seam exists, but also that realization tuning still needs work before S01 can honestly be closed.
