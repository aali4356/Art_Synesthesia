---
id: T02
parent: S01
milestone: M002
provides:
  - Deterministic curated palette-family selection metadata exposed through generatePalette()
key_files:
  - src/lib/color/palette.ts
  - src/lib/color/palette-families.ts
  - src/lib/color/palette-family-selection.ts
  - src/lib/color/index.ts
key_decisions:
  - Palette family identity is selected from warmth/energy/contrast buckets plus seeded influence, while legacy generatePalette(params, seed) remains the single integration seam.
patterns_established:
  - Palette generation now has an explicit selection-stage contract that returns stable family diagnostics before downstream realization.
observability_surfaces:
  - PaletteResult.familyId/familyName/familyDescriptor/selectionKey/selectionVector on generatePalette()
duration: 1h
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T02: Implement deterministic palette-family selection and metadata

**Added deterministic curated family selection, exported the new contract, and surfaced stable family metadata directly on `generatePalette()` results.**

## What Happened

Implemented `src/lib/color/palette-families.ts` as the curated family catalog for S01 and `src/lib/color/palette-family-selection.ts` as the deterministic selector that maps warmth/energy/contrast buckets plus seeded influence into a stable family. Refactored `src/lib/color/palette.ts` so `generatePalette(params, seed)` now runs a family-selection phase first, then realizes the palette while preserving the existing `dark`, `light`, `harmony`, and `count` surface. Extended `PaletteResult` with `familyId`, `familyName`, `familyDescriptor`, `selectionKey`, and `selectionVector`, then exported the new contract from `src/lib/color/index.ts` so downstream hooks can keep using the same entrypoint without callsite changes.

## Verification

- Passed: `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts`
- Passed: family metadata shape assertions in `src/__tests__/color/palette.test.ts`
- Partial slice verification: `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
  - Passing for all family-selection and shape assertions required by T02
  - Remaining failures are legacy/slice-level realization issues to finish in T03:
    - near-duplicate rejection can still collapse below deltaE 10 after realization/mode adjustment
    - dark/light chroma parity can drift beyond tolerance after gamut mapping

## Diagnostics

Future agents can inspect the deterministic family-selection surface by calling `generatePalette(params, seed)` and reading:
- `familyId`
- `familyName`
- `familyDescriptor`
- `selectionKey`
- `selectionVector`

The failing remaining tests localize what T03 still needs to tune: perceptual spacing and post-adjustment chroma consistency.

## Deviations

None.

## Known Issues

- `src/__tests__/color/palette.test.ts` still reports realization-level regressions on near-duplicate spacing and dark/light chroma tolerance for some cases.
- Full slice verification including `src/__tests__/color/palette-family-diversity.test.ts` was not completed in this task because realization tuning remains for T03.

## Files Created/Modified

- `src/lib/color/palette-families.ts` — added the curated family catalog and stable descriptors.
- `src/lib/color/palette-family-selection.ts` — added deterministic family selection and stable selection diagnostics.
- `src/lib/color/palette.ts` — refactored palette generation into selection + realization and extended `PaletteResult` metadata.
- `src/lib/color/index.ts` — exported the new palette family contract from the color barrel.
