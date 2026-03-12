# S02: Synesthetic Mapping Upgrade — UAT

**Milestone:** M002
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: The slice plan explicitly defines S02 as integration proof with no real runtime or human-experience requirement. The shipped behavior is deterministic palette mapping and hook propagation, and those are fully exercised through executable color and hook suites.

## Preconditions

- Dependencies are installed
- The S02 implementation is present in the working tree
- Vitest can run local color and hook suites

## Smoke Test

Run:

- `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/hooks/text-analysis.test.ts`

This quickly proves both the core mapping seam and one real hook path expose `PaletteResult.mapping`.

## Test Cases

### 1. Color seam returns deterministic synesthetic mapping diagnostics

1. Run `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/palette.test.ts`
2. Inspect the passing assertions for `PaletteResult.mapping`, `familyId`, `harmony`, and `anchorHue`.
3. **Expected:** Representative vectors produce stable named mapping diagnostics and family-authoritative palette behavior through `generatePalette()`.

### 2. Text, URL, and data hooks preserve upgraded palette diagnostics

1. Run `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
2. Confirm each suite reaches `stage === 'complete'` and asserts `result.palette.mapping`.
3. **Expected:** All three real hook entrypoints return palette results that preserve mapping diagnostics, family identity, and harmony linkage without contract changes.

## Edge Cases

### Canonically equivalent inputs

1. Run the hook test suites and inspect the determinism assertions for newline/URL normalization scenarios.
2. **Expected:** Text and URL equivalent canonical inputs produce matching vectors and mapping-aware palette results; data equivalents produce matching vectors and mapping diagnostics even though full palette equality is not yet guaranteed.

## Failure Signals

- `PaletteResult.mapping` is missing or only partially populated
- `palette.familyId` and `palette.mapping.familyId` diverge
- `palette.harmony` and `palette.mapping.harmony` diverge
- Hook suites fail to reach `stage === 'complete'`
- Tests start failing on named diagnostics like `mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, or `contrastPosture`

## Requirements Proved By This UAT

- R002 — Proves the palette-level synesthetic mapping is deterministic, art-directed through named intent diagnostics, and preserved across text, URL, and data generation flows.

## Not Proven By This UAT

- R001 — This UAT does not re-prove the broader family-diversity success criteria beyond relying on S01’s validated family system.
- Renderer-level consumption of synesthetic mapping in live artwork output is not proven here; that remains S03 work.
- Browser-visible art-quality improvement and live product verification are not proven here; that remains S04 work.
- Production build/deploy reliability is not proven here.

## Notes for Tester

This slice intentionally uses artifact-driven UAT. If a future slice needs stricter determinism for equivalent structured data inputs, inspect `useDataAnalysis` seed derivation first; current coverage proves stable vector and mapping diagnostics there, not strict full-palette equality.
