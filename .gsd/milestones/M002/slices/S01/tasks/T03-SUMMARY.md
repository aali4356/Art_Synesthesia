---
id: T03
parent: S01
milestone: M002
provides:
  - Family-specific palette realization profiles wired into generatePalette(), with stronger curated hue/chroma/lightness shaping and targeted contrast/dedup helper extension points.
key_files:
  - src/lib/color/palette.ts
  - src/lib/color/palette-families.ts
  - src/lib/color/contrast.ts
  - src/lib/color/dedup.ts
key_decisions:
  - Palette families now carry explicit realization-profile parameters rather than relying on metadata-only selection, so family diagnostics correspond to concrete hue/chroma/lightness shaping behavior.
patterns_established:
  - Palette generation uses family-owned realization coefficients plus shared post-processing helpers, keeping family tuning data-driven while preserving the existing generatePalette(params, seed) seam.
observability_surfaces:
  - Targeted Vitest contracts on src/__tests__/color/palette-family-diversity.test.ts and src/__tests__/color/palette.test.ts; returned PaletteResult family metadata remains the runtime inspection surface.
duration: 1h35m
verification_result: failed
completed_at: 2026-03-11
blocker_discovered: false
---

# T03: Realize curated family profiles without regressing safety invariants

**Added family-specific realization profiles and threaded them through palette generation, but baseline dedup/chroma invariants still fail and the task is not complete.**

## What Happened

I extended `src/lib/color/palette-families.ts` with concrete realization-profile fields for hue offsets, jitter, chroma slope/boost, lightness shaping, and dedup thresholds, then rewired `src/lib/color/palette.ts` to build family-shaped candidate palettes from those coefficients instead of the prior metadata-only path. I also expanded `adjustForMode()` to accept a tunable contrast floor and `rejectNearDuplicates()` to accept configurable hue/lightness shift behavior so narrower family profiles could push against the shared helpers.

That got the family-selection contract passing and, at one point, the diversity test’s perceptual-separation assertions passing. But the current implementation still regresses baseline safety guarantees: near-duplicate rejection in realized outputs is failing, and dark/light chroma drift still exceeds the existing tolerance on at least one palette path. Because the slice contract requires the family diversity tests and baseline palette tests to pass together, this task remains incomplete even though the realization scaffolding is now in place.

## Verification

Ran:

- `npm run test:run -- src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`

Current status:

- `src/__tests__/color/palette-family-selection.test.ts` passes.
- `src/__tests__/color/palette-family-diversity.test.ts` still fails on near-duplicate rejection within curated outputs.
- `src/__tests__/color/palette.test.ts` still fails on:
  - baseline near-duplicate rejection (`deltaE < 10` in realized dark palettes)
  - dark/light chroma parity tolerance

## Diagnostics

To resume, rerun:

- `npm run test:run -- src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`

Key failure surfaces:

- `src/__tests__/color/palette-family-diversity.test.ts` → curated family outputs still collapse after realization/mode adjustment.
- `src/__tests__/color/palette.test.ts` → shared generator safety invariants now localize to post-realization dedup and mode-adjusted chroma drift.

Most relevant files to inspect next:

- `src/lib/color/palette.ts` — family-shaped candidate generation and post-processing sequence
- `src/lib/color/dedup.ts` — duplicate-shift strategy now mutates hue and lightness, but still does not guarantee >=10 deltaE after full realization
- `src/lib/color/contrast.ts` — contrast-floor tuning may be interacting with gamut-mapping/chroma drift in light mode

## Deviations

None.

## Known Issues

- T03 is not actually done yet despite the realization scaffolding landing.
- The required slice-level verification command still fails.
- Do not treat the current palette-family realization as safe to consume downstream until dedup/chroma invariants are restored.

## Files Created/Modified

- `src/lib/color/palette.ts` — family-aware realization now uses explicit hue/chroma/lightness profile coefficients and tuned post-processing hooks.
- `src/lib/color/palette-families.ts` — curated families now define concrete realization-profile parameters, not just selection metadata.
- `src/lib/color/contrast.ts` — mode adjustment now accepts a caller-provided minimum contrast floor.
- `src/lib/color/dedup.ts` — dedup helper now supports configurable hue/lightness shifting during duplicate resolution.
- `.gsd/milestones/M002/slices/S01/tasks/T03-SUMMARY.md` — recorded current incomplete state and resumption diagnostics.
