---
estimated_steps: 4
estimated_files: 3
---

# T01: Add failing palette-family contract and diversity tests

**Slice:** S01 — Palette Family System
**Milestone:** M002

## Description

Define the slice’s executable proof before implementation by adding failing tests that assert deterministic palette-family selection, stable family metadata, and materially distinct family outputs on the shared `generatePalette()` contract.

## Steps

1. Create `src/__tests__/color/palette-family-selection.test.ts` covering deterministic family identity, named family reachability from representative vectors/seeds, and stable metadata on `PaletteResult`.
2. Create `src/__tests__/color/palette-family-diversity.test.ts` covering perceptual distance between curated family outputs plus contrast/dedup invariants surviving family realization.
3. Update `src/__tests__/color/palette.test.ts` only where necessary to acknowledge the expanded `PaletteResult` contract without weakening existing deterministic, contrast, or harmony assertions.
4. Run the targeted color tests and confirm they fail specifically on missing family-selection and diversity behavior rather than unrelated regressions.

## Must-Haves

- [ ] New tests require `generatePalette()` to expose stable family metadata and deterministic family identity for the same parameter vector and seed.
- [ ] New tests prove multiple curated families must be reachable and materially distinct in perceptual palette territory, not merely present as string metadata.

## Verification

- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`
- Test run fails for missing S01 family behavior and not because of unrelated setup problems.

## Observability Impact

- Signals added/changed: Test assertions become the first durable diagnostic surface for family identity, family metadata, and diversity regressions.
- How a future agent inspects this: Run the targeted Vitest command and inspect the named failing assertions in the new test files.
- Failure state exposed: Whether a regression is in family selection determinism, metadata shape, or palette diversity becomes explicit from the failing test names.

## Inputs

- `src/lib/color/palette.ts` — current shared palette contract that still reflects a single-generator grammar.
- `src/__tests__/color/palette.test.ts` — existing correctness baseline for determinism, contrast, and harmony behavior.

## Expected Output

- `src/__tests__/color/palette-family-selection.test.ts` — failing contract tests for family selection and metadata.
- `src/__tests__/color/palette-family-diversity.test.ts` — failing diversity and safety tests for curated family realization.
- `src/__tests__/color/palette.test.ts` — existing palette tests updated only as needed for the expanded contract.
