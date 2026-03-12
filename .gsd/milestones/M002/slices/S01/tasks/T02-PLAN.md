---
estimated_steps: 4
estimated_files: 4
---

# T02: Implement deterministic palette-family selection and metadata

**Slice:** S01 — Palette Family System
**Milestone:** M002

## Description

Introduce a first-class curated palette-family selection boundary that deterministically maps the existing parameter vector and seed into a named family plus stable metadata, while keeping `generatePalette(params, seed)` as the shared integration seam for all current generation flows.

## Steps

1. Add a curated family catalog module describing the stable family IDs, descriptors, and realization inputs S01 needs.
2. Add a deterministic family-selection helper that uses the existing `ParameterVector` dimensions plus seeded jitter to choose among the curated families without introducing nondeterminism.
3. Refactor `generatePalette()` into explicit family-selection and downstream realization stages while extending `PaletteResult` with stable family metadata and selection descriptors.
4. Export the new family contract from `src/lib/color/index.ts` and run the targeted tests to prove the shared palette entrypoint now returns deterministic family metadata without requiring hook callsite changes.

## Must-Haves

- [ ] Same parameters and seed always produce the same family ID and family metadata through `generatePalette()`.
- [ ] Multiple named curated families are actually reachable through the shared palette entrypoint, and the expanded `PaletteResult` remains backwards-compatible for existing palette consumers.

## Verification

- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
- All family-selection assertions pass without changing `useTextAnalysis`, `useUrlAnalysis`, or `useDataAnalysis` call signatures.

## Observability Impact

- Signals added/changed: `PaletteResult` now exposes durable family metadata and selection descriptors that future slices and agents can inspect directly.
- How a future agent inspects this: Call `generatePalette()` in tests or REPL code and inspect the returned `familyId` and related metadata.
- Failure state exposed: Selection-stage regressions become visible as wrong/missing family metadata instead of hidden internal branch behavior.

## Inputs

- `src/__tests__/color/palette-family-selection.test.ts` — executable contract for deterministic family selection and metadata.
- `src/lib/color/palette.ts` — existing single-stage palette generator to split into family selection plus realization.

## Expected Output

- `src/lib/color/palette-families.ts` — curated family catalog and stable descriptors.
- `src/lib/color/palette-family-selection.ts` — deterministic selection helper using vector traits plus seeded jitter.
- `src/lib/color/palette.ts` — expanded `PaletteResult` and refactored shared palette entrypoint.
- `src/lib/color/index.ts` — barrel exports for the new family contract.
