# S01: Palette Family System

**Goal:** Establish a deterministic curated palette-family system that materially reduces palette repetition while preserving contrast safety and the existing generation entrypoints.
**Demo:** The shared palette generator deterministically assigns named curated families, emits family metadata, and passes diversity-focused tests proving multiple materially distinct family outputs across the existing text/URL/data generation contract.

## Must-Haves

- Multiple named curated palette families are reachable through `generatePalette(params, seed)` rather than a single hue-sweep grammar.
- Palette family identity is deterministic for the same parameter vector and seed.
- `PaletteResult` exposes stable family metadata that downstream slices can inspect without breaking existing `dark`/`light` palette consumers.
- Family realizations remain contrast-safe and near-duplicate-safe after existing deduplication and mode adjustment layers run.
- Diversity-focused verification proves materially distinct family behavior, not just metadata presence.
- The shared palette entrypoint used by text, URL, and data hooks remains the integration seam for this slice.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `src/__tests__/color/palette-family-selection.test.ts` — verifies deterministic family selection, reachable family spread, stable metadata, and family-specific observability on the shared palette contract.
- `src/__tests__/color/palette-family-diversity.test.ts` — verifies materially distinct hue/chroma/lightness territory across curated families, plus contrast/dedup invariants surviving family realization.
- `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts`

## Observability / Diagnostics

- Runtime signals: `PaletteResult` exposes stable family metadata (`familyId`, family descriptors, selection inputs) so future agents can inspect palette-family outcomes without reproducing internal branch logic by hand.
- Inspection surfaces: unit tests assert on family metadata directly via `generatePalette()`; the shared `src/lib/color` exports remain the inspection boundary consumed by hooks and later renderer work.
- Failure visibility: selection contract tests fail with named family expectations and diversity-distance assertions so repetition regressions localize to family selection vs family realization.
- Redaction constraints: no raw user input or secret-bearing data is stored in palette diagnostics; only derived parameter/family descriptors are exposed.

## Integration Closure

- Upstream surfaces consumed: `src/lib/pipeline/mapping.ts` parameter vector contract, existing deterministic PRNG in `src/lib/engine/prng`, and current color primitives in `src/lib/color/{harmony,dedup,contrast}.ts`.
- New wiring introduced in this slice: `generatePalette()` becomes a two-stage family-selection + family-realization boundary while keeping its existing call shape for `useTextAnalysis`, `useUrlAnalysis`, `useDataAnalysis`, and current results rendering consumers.
- What remains before the milestone is truly usable end-to-end: S02 still needs to make synesthetic mapping drive family/mood selection more intentionally, and S03/S04 still need renderer-level expressiveness plus browser-visible proof.

## Tasks

- [x] **T01: Add failing palette-family contract and diversity tests** `est:45m`
  - Why: Lock the slice’s stopping condition before implementation so S01 proves reduced repetition with executable assertions instead of subjective intent.
  - Files: `src/__tests__/color/palette-family-selection.test.ts`, `src/__tests__/color/palette-family-diversity.test.ts`, `src/__tests__/color/palette.test.ts`
  - Do: Create new family-selection and diversity test files that define the curated-family contract on `generatePalette()`, assert deterministic family identity/metadata, require multiple named families to be reachable from representative vectors/seeds, and prove families occupy materially different perceptual territory while preserving existing contrast and dedup invariants; update the existing palette test only where needed to reflect the expanded `PaletteResult` shape without weakening prior guarantees.
  - Verify: `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette.test.ts` (expected to fail initially on missing family system assertions)
  - Done when: The new tests exist, express the full S01 contract, and fail specifically because family selection/metadata/diversity behavior is not implemented yet.
- [x] **T02: Implement deterministic palette-family selection and metadata** `est:1h15m`
  - Why: Replace the single continuous hue-sweep grammar with a first-class curated family selection layer that downstream slices can build on.
  - Files: `src/lib/color/palette.ts`, `src/lib/color/index.ts`, `src/lib/color/palette-families.ts`, `src/lib/color/palette-family-selection.ts`
  - Do: Add a curated family catalog and deterministic selection helper driven by the existing `ParameterVector` plus seeded jitter; extend `PaletteResult` with stable family metadata and selection descriptors; keep `generatePalette(params, seed)` as the shared entrypoint while splitting it into family selection and family realization phases; export the new family contract from the color barrel without breaking existing palette consumers.
  - Verify: `npm run test:run -- src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
  - Done when: The palette generator returns deterministic named family metadata for the same input, multiple family selections are reachable, and all selection/shape assertions pass without changing hook callsites.
- [x] **T03: Realize curated family profiles without regressing safety invariants** `est:1h15m`
  - Why: Named families only matter if they produce materially different palettes that survive deduplication and mode adjustment without collapsing back into the same look.
  - Files: `src/lib/color/palette.ts`, `src/lib/color/palette-families.ts`, `src/lib/color/contrast.ts`, `src/lib/color/dedup.ts`, `src/__tests__/color/palette-family-diversity.test.ts`
  - Do: Implement family-specific hue/chroma/lightness profile realization on top of the existing harmony, deduplication, and contrast layers; tune family outputs so they stay perceptually distinct after dark/light adjustments; add or refine helper logic only where needed to keep duplicate rejection and contrast enforcement compatible with tighter or moodier family profiles.
  - Verify: `npm run test:run -- src/__tests__/color/palette-family-diversity.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
  - Done when: Diversity tests prove families occupy materially different perceptual territory, contrast and deduplication invariants still pass, and the shared palette contract is ready for S02 to consume.

## Files Likely Touched

- `src/lib/color/palette.ts`
- `src/lib/color/palette-families.ts`
- `src/lib/color/palette-family-selection.ts`
- `src/lib/color/index.ts`
- `src/lib/color/contrast.ts`
- `src/lib/color/dedup.ts`
- `src/__tests__/color/palette-family-selection.test.ts`
- `src/__tests__/color/palette-family-diversity.test.ts`
- `src/__tests__/color/palette.test.ts`
