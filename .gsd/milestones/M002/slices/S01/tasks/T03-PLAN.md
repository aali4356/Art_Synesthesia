---
estimated_steps: 4
estimated_files: 5
---

# T03: Realize curated family profiles without regressing safety invariants

**Slice:** S01 — Palette Family System
**Milestone:** M002

## Description

Implement family-specific palette realization so the selected curated families produce materially different hue/chroma/lightness behavior that survives deduplication and dark/light contrast adjustment, giving S01 real non-repetitive palette progress rather than metadata-only scaffolding.

## Steps

1. Add family-specific realization profiles for hue banding, chroma behavior, lightness shaping, and harmony tendencies on top of the selected family metadata.
2. Thread those realization profiles through `generatePalette()` so different families produce perceptually distinct candidate palettes before mode adjustment.
3. Tune any needed `contrast` and `dedup` helper interactions so narrower or moodier families remain readable and do not collapse into near-duplicate outputs.
4. Run the targeted diversity and baseline palette tests until the family outputs are materially distinct while preserving deterministic contrast-safe palette generation.

## Must-Haves

- [ ] Curated families occupy materially different perceptual territory after dark/light adjustment, not just before internal candidate generation.
- [ ] Existing safety guarantees remain true: contrast thresholds and near-duplicate rejection still pass on the expanded family system.

## Verification

- `npm run test:run -- src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
- Diversity tests demonstrate distinct family behavior while baseline palette tests still pass for determinism, contrast, and harmony expectations.

## Observability Impact

- Signals added/changed: Family descriptors become meaningful diagnostics because they now correspond to strong, test-validated palette behavior differences.
- How a future agent inspects this: Use the diversity tests plus returned family metadata to localize whether a repetition regression is caused by selection or realization.
- Failure state exposed: Perceptual-distance, contrast, and dedup failures identify whether family realization collapsed outputs or violated safety invariants.

## Inputs

- `src/lib/color/palette-families.ts` — curated family definitions from T02.
- `src/__tests__/color/palette-family-diversity.test.ts` — executable proof that family outputs must be perceptually distinct and safe.

## Expected Output

- `src/lib/color/palette.ts` — family-aware realization logic integrated into the shared palette generator.
- `src/lib/color/palette-families.ts` — tuned family profiles with strong differentiators.
- `src/lib/color/contrast.ts` — any targeted compatibility adjustments required for family-aware realization.
- `src/lib/color/dedup.ts` — any targeted compatibility adjustments required to preserve intended family variation.
- `src/__tests__/color/palette-family-diversity.test.ts` — passing diversity and safety proof for the finished slice.
