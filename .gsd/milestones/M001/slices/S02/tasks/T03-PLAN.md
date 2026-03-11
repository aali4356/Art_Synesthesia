# T03: 02-parameter-system-color 03

**Slice:** S02 — **Milestone:** M001

## Description

Build the OKLCH palette generation system with harmony algorithms, near-duplicate rejection, and dual lightness profiles for dark/light mode.

Purpose: Every artwork needs a perceptually coherent color palette derived from the parameter vector. The palette must look intentional (harmony-driven), maintain contrast in both modes, and never contain near-duplicate colors.

Output: `src/lib/color/` module with palette generation, harmony, contrast, and deduplication — fully tested with TDD.

## Must-Haves

- [ ] "generatePalette produces N OKLCH colors where N is derived from paletteSize parameter (3 when 0, 8 when 1)"
- [ ] "No two palette colors have deltaE < 10 in LAB space (near-duplicates rejected and hue-shifted)"
- [ ] "All palette colors have WCAG contrast ratio >= 3.0 against dark mode background oklch(0.09 0.005 250)"
- [ ] "All palette colors have WCAG contrast ratio >= 3.0 against light mode background (white)"
- [ ] "High symmetry + low contrast inputs produce analogous harmony (tight hue spread)"
- [ ] "High contrast + high energy inputs produce complementary harmony (wide hue spread)"
- [ ] "Saturation parameter modulates chroma but never below a readable floor"
- [ ] "First color in palette is the dominant color (largest area intent)"
- [ ] "Same parameters always produce the same palette (deterministic via seeded PRNG)"

## Files

- `src/lib/color/palette.ts`
- `src/lib/color/harmony.ts`
- `src/lib/color/contrast.ts`
- `src/lib/color/dedup.ts`
- `src/lib/color/index.ts`
- `src/__tests__/color/palette.test.ts`
- `src/__tests__/color/harmony.test.ts`
- `src/__tests__/color/contrast.test.ts`
- `src/__tests__/color/dedup.test.ts`
- `package.json`
