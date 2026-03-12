---
id: T03
parent: S02
milestone: M002
provides:
  - Hook-level integration proof that text, URL, and data generation flows preserve upgraded synesthetic palette diagnostics through real pipeline outputs
key_files:
  - src/__tests__/hooks/text-analysis.test.ts
  - src/__tests__/hooks/url-analysis.test.ts
  - src/__tests__/hooks/data-analysis.test.ts
  - .gsd/milestones/M002/slices/S02/S02-PLAN.md
key_decisions:
  - Treat hook-level determinism as canonical-input stability of vector and palette mapping diagnostics, not full palette byte equality when data inputs are not canonicalized before seed derivation
patterns_established:
  - Prove shared palette seam integration by exercising each hook entrypoint end-to-end and asserting PaletteResult.mapping plus family/harmony parity on returned results
observability_surfaces:
  - Hook test suites at src/__tests__/hooks/text-analysis.test.ts, src/__tests__/hooks/url-analysis.test.ts, and src/__tests__/hooks/data-analysis.test.ts
duration: 35m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T03: Prove the upgraded mapping survives real generation flows

**Added hook integration tests that prove text, URL, and data flows carry synesthetic mapping diagnostics through their real palette outputs.**

## What Happened

I added new hook-level integration suites for `useTextAnalysis`, `useUrlAnalysis`, and `useDataAnalysis`. Each suite exercises the real pipeline entrypoint, waits for completion, and asserts that the returned `palette` contains the upgraded synesthetic diagnostics (`mapping`) plus consistent family/harmony linkage.

For determinism coverage, the text and URL tests prove canonical-input stability by using equivalent inputs that normalize to the same canonical representation and then asserting matching vectors and mapping-aware palette metadata. While implementing the data-path proof, I confirmed the hook currently hashes trimmed raw input rather than a canonicalized payload before palette generation. That means newline-only input differences can change the seed and full rendered palette even when the analyzed vector is identical. To keep T03 aligned with the actual runtime contract instead of asserting a false guarantee, the data test verifies stable vector, family, harmony, and `mapping` diagnostics for equivalent inputs rather than full palette byte equality.

No runtime hook or UI code changes were required. The existing shared `generatePalette(vector, seed)` seam already propagates the richer `PaletteResult` object through the hooks and remains compatible with `ResultsView`.

## Verification

Passed:

- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`

Confirmed:

- Text flow returns `PaletteResult.mapping` through `useTextAnalysis`
- URL flow returns `PaletteResult.mapping` through `useUrlAnalysis`
- Data flow returns `PaletteResult.mapping` through `useDataAnalysis`
- All three flows preserve family/harmony/mapping diagnostics at the hook boundary
- Slice-level color and hook verification suites both pass

## Diagnostics

Future agents can inspect this integration proof by rerunning:

- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`

If a regression appears, inspect `result.palette.mapping`, `result.palette.familyId`, and `result.palette.harmony` from the failing hook suite to determine whether drift is happening in shared color generation or hook wiring.

## Deviations

Adjusted the determinism assertions to match the real hook behavior: for URL and data flows, the tests assert canonical-input stability of vector and mapping diagnostics instead of strict full-palette equality when equivalent raw inputs can still produce different seeds.

## Known Issues

Equivalent data inputs with different newline formatting currently produce identical vectors but different full palettes because `useDataAnalysis` seeds palette generation from `sha256(raw.trim())` rather than from a canonicalized payload. This did not block T03 because the upgraded mapping diagnostics still survive the real generation flow, but it is a real determinism limitation if stricter canonical seeding is desired later.

## Files Created/Modified

- `src/__tests__/hooks/text-analysis.test.ts` — added end-to-end text hook tests for mapping propagation and canonical-input determinism
- `src/__tests__/hooks/url-analysis.test.ts` — added URL hook tests with mocked fetch responses, mapping propagation assertions, and canonical URL determinism checks
- `src/__tests__/hooks/data-analysis.test.ts` — added data hook tests for mapping propagation and stable vector/mapping diagnostics across equivalent inputs
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — marked T03 complete
