---
id: T01
parent: S01
milestone: M002
provides:
  - Failing executable contract coverage for palette-family selection metadata and diversity on generatePalette()
key_files:
  - src/__tests__/color/palette-family-selection.test.ts
  - src/__tests__/color/palette-family-diversity.test.ts
  - src/__tests__/color/palette.test.ts
key_decisions:
  - Representative vector+seed fixtures now define the expected curated family reachability contract for later implementation tasks.
patterns_established:
  - Contract-first slice execution uses targeted failing Vitest coverage to separate missing family metadata/selection behavior from unrelated palette regressions.
observability_surfaces:
  - Targeted Vitest assertions and failure names for family metadata, curated family reachability, perceptual diversity, contrast safety, and dedup safety.
duration: 35m
verification_result: passed
completed_at: 2026-03-11T21:00:00-04:00
blocker_discovered: false
---

# T01: Add failing palette-family contract and diversity tests

**Added failing contract tests that lock palette-family metadata, reachability, and diversity expectations onto `generatePalette()`.**

## What Happened

Created `src/__tests__/color/palette-family-selection.test.ts` to require stable family metadata on `PaletteResult`, deterministic family identity for the same vector+seed, and curated family reachability across representative scenarios (`solar-flare`, `lagoon-mist`, `orchid-nocturne`, `meadow-bloom`).

Created `src/__tests__/color/palette-family-diversity.test.ts` to require those curated families to occupy materially different perceptual territory and to preserve contrast and near-duplicate safety after family realization.

Updated `src/__tests__/color/palette.test.ts` only at the `PaletteResult` shape assertion so the baseline suite now acknowledges the expanded family metadata contract without weakening existing palette invariants.

The targeted Vitest run failed for the intended reasons: missing family metadata/selection fields and missing curated-family realization behavior. Existing baseline palette tests stayed green except for the single intentional structure assertion added for the expanded contract.

## Verification

Ran:

- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`

Observed:

- `src/__tests__/color/palette-family-selection.test.ts` fails on missing `familyId`, curated family reachability, and family observability fields.
- `src/__tests__/color/palette-family-diversity.test.ts` fails on missing family identity plus current palette behavior not yet meeting the intended contrast/dedup/diversity contract for curated families.
- Existing assertions in `src/__tests__/color/palette.test.ts` still pass except the newly added structure check for family metadata.

This matches the task goal: the proof surface now fails specifically on missing S01 palette-family behavior rather than unrelated test setup problems.

## Diagnostics

Future agents can inspect this task’s contract surface by rerunning:

- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`

Failure names localize the missing behavior to one of:

- family metadata shape on `PaletteResult`
- deterministic curated family reachability
- perceptual diversity between curated family outputs
- contrast safety after family realization
- near-duplicate rejection after family realization

## Deviations

none

## Known Issues

- `generatePalette()` does not yet expose `familyId`, `familyName`, `familyDescriptor`, `selectionKey`, or `selectionVector`.
- Current single-generator palette behavior does not yet satisfy the curated-family diversity and safety expectations encoded by the new tests.

## Files Created/Modified

- `src/__tests__/color/palette-family-selection.test.ts` — new failing contract tests for family metadata, deterministic identity, and curated family reachability.
- `src/__tests__/color/palette-family-diversity.test.ts` — new failing contract tests for perceptual family diversity plus contrast and dedup invariants.
- `src/__tests__/color/palette.test.ts` — expanded the `PaletteResult` shape assertion to include family metadata fields.
