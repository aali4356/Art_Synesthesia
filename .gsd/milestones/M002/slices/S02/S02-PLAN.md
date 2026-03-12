# S02: Synesthetic Mapping Upgrade

**Goal:** Upgrade the shared color mapping seam so the full parameter vector deterministically produces richer synesthetic intent that materially changes palette realization and exposes stable diagnostics for downstream renderers and verification.
**Demo:** Given representative text, URL, and data vectors, the app now produces distinct family/mood/intensity outcomes through `generatePalette(vector, seed)` and the live results surface can inspect those outcomes through stable metadata without changing hook entrypoints.

## Must-Haves

- Add a first-class deterministic synesthetic mapping artifact derived from the full `ParameterVector`, not only warmth/energy/contrast buckets.
- Make palette realization consume synesthetic intent so family anchor, harmony, hue strategy, chroma posture, and contrast posture are driven by the new mapping rather than legacy warmth-based hue logic.
- Preserve the existing shared generation seam used by text, URL, and data flows: `generatePalette(vector, seed)` remains the integration point.
- Expose stable mapping diagnostics on palette results so future agents and later slices can inspect mood/family/selection behavior without re-deriving hidden branch logic.
- Prove with executable tests that representative vectors produce intentionally different mapping outcomes and that real generation paths still return upgraded palette metadata through their existing hook/result contracts.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`

## Observability / Diagnostics

- Runtime signals: stable palette diagnostics on `PaletteResult` for synesthetic intent (`mapping`, `familyId`, `selectionKey`, `selectionVector`) and deterministic hook results carrying the upgraded palette object through existing pipeline outputs.
- Inspection surfaces: `generatePalette()` return value, hook result objects from `useTextAnalysis`, `useUrlAnalysis`, and `useDataAnalysis`, plus the new mapping-focused test suite in `src/__tests__/color/synesthetic-mapping.test.ts`.
- Failure visibility: mapping regressions localize to named diagnostics such as mood, temperature bias, harmony source, hue anchor, chroma posture, and contrast posture instead of only visible color drift.
- Redaction constraints: diagnostics must remain derived from normalized vectors and seeds only; no raw user input, URLs, or secrets should be surfaced in durable metadata.

## Integration Closure

- Upstream surfaces consumed: `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`, `src/lib/color/palette-family-selection.ts`, `src/lib/color/palette-families.ts`, `src/lib/color/harmony.ts`, `src/components/results/ResultsView.tsx`.
- New wiring introduced in this slice: a deterministic synesthetic mapping module consumed by `generatePalette()`, additive palette metadata exported through the shared color barrel, and hook-level integration proof that existing analysis flows propagate the upgraded mapping object unchanged.
- What remains before the milestone is truly usable end-to-end: S03 still needs renderer-level consumption so at least two styles visibly interpret the new intent beyond palette color changes, and S04 still needs browser-level live art-quality proof.

## Tasks

- [x] **T01: Lock the synesthetic mapping contract with failing tests** `est:45m`
  - Why: S02 needs an objective gate before implementation so mapping behavior is proven by executable contracts instead of metadata-only claims.
  - Files: `src/__tests__/color/synesthetic-mapping.test.ts`, `src/__tests__/color/harmony.test.ts`, `src/__tests__/color/palette.test.ts`
  - Do: Add a new mapping-focused color test suite that defines representative vectors and asserts deterministic mood, harmony authority, hue-anchor behavior, chroma posture, and contrast posture on a new mapping artifact surfaced through `generatePalette()`; extend existing palette and harmony tests so they expect family-driven harmony/base-hue behavior instead of the current legacy warmth-only logic; keep tests targeted to the shared color seam and intentionally failing until the implementation lands.
  - Verify: `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette.test.ts`
  - Done when: The repo contains concrete failing assertions that define S02 behavior for deterministic mapping, palette consumption of that mapping, and compatibility with existing palette contracts.
- [x] **T02: Implement deterministic synesthetic intent and wire it into palette generation** `est:1h`
  - Why: This is the core slice increment that turns full-vector behavior into real palette changes while preserving the existing `generatePalette(vector, seed)` call shape.
  - Files: `src/lib/color/synesthetic-mapping.ts`, `src/lib/color/palette.ts`, `src/lib/color/harmony.ts`, `src/lib/color/palette-family-selection.ts`, `src/lib/color/index.ts`, `src/lib/color/palette-families.ts`
  - Do: Create a pure synesthetic mapping module that derives mood and palette-driving intent from the full parameter vector; refactor palette generation so family anchor hue, harmony, chroma posture, and contrast posture are driven by the mapping and family metadata rather than the legacy warmth-based base hue path; expose the additive mapping object on `PaletteResult` and export the new types/functions through the color barrel without breaking existing palette consumers.
  - Verify: `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
  - Done when: `generatePalette()` deterministically returns upgraded mapping diagnostics and the color-layer contract suites pass with the new intent-driven behavior.
- [x] **T03: Prove the upgraded mapping survives real generation flows** `est:45m`
  - Why: S02 owns integration, so it must prove text, URL, and data entrypoints still converge on the upgraded shared seam and expose the new diagnostics to downstream consumers.
  - Files: `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, `src/__tests__/hooks/data-analysis.test.ts`, `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`, `src/components/results/ResultsView.tsx`
  - Do: Add or extend hook integration tests so each analysis path asserts the returned palette includes the new synesthetic mapping diagnostics and remains deterministic for the same canonical input; make only additive hook/result typing updates if needed, and keep `ResultsView` compatible with the richer palette object without UI placeholder work.
  - Verify: `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
  - Done when: All three generation paths are proven to preserve the upgraded palette mapping contract through their real hook outputs, closing S02 at the claimed integration proof level.

## Files Likely Touched

- `src/lib/color/synesthetic-mapping.ts`
- `src/lib/color/palette.ts`
- `src/lib/color/harmony.ts`
- `src/lib/color/palette-family-selection.ts`
- `src/lib/color/palette-families.ts`
- `src/lib/color/index.ts`
- `src/__tests__/color/synesthetic-mapping.test.ts`
- `src/__tests__/color/harmony.test.ts`
- `src/__tests__/color/palette.test.ts`
- `src/__tests__/hooks/text-analysis.test.ts`
- `src/__tests__/hooks/url-analysis.test.ts`
- `src/__tests__/hooks/data-analysis.test.ts`
- `src/hooks/useTextAnalysis.ts`
- `src/hooks/useUrlAnalysis.ts`
- `src/hooks/useDataAnalysis.ts`
- `src/components/results/ResultsView.tsx`
