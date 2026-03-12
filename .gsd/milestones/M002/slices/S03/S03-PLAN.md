# S03: Renderer Expressiveness Pass

**Goal:** Make at least two renderer styles visibly consume `PaletteResult.mapping` so live results feel richer, more premium, and more art-directed without breaking determinism or collapsing style identity.
**Demo:** Given the same canonical result data, the organic and typographic styles render mapping-driven composition changes that are inspectable in scene graphs, visible in ResultsView thumbnails/canvases, and proven by deterministic renderer tests.

## Must-Haves

- Organic scene construction interprets `palette.mapping` directly to change atmospheric composition behavior, not just palette colors.
- Typographic scene construction interprets `palette.mapping` directly to change poster hierarchy and placement behavior while preserving readability laws.
- A shared renderer-facing interpretation seam keeps organic and typographic aligned to the same mapping contract instead of duplicating mood logic.
- ResultsView and existing runtime wiring continue to surface the richer scenes for text, URL, and supported data flows without entrypoint changes.
- Verification proves determinism, mapping-driven scene differences, and thumbnail/runtime wiring for at least two styles.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`

## Observability / Diagnostics

- Runtime signals: stable scene-graph fields and mapping-aware composition outputs on organic and typographic scene builders; no ad hoc console logging.
- Inspection surfaces: `PaletteResult.mapping`, renderer scene graphs from `buildOrganicSceneGraph()` / `buildTypographicSceneGraph()`, and ResultsView/StyleSelector-rendered scene usage in existing tests.
- Failure visibility: renderer tests should localize regressions to named mapping-driven outputs such as gradient richness, curve density, word hierarchy, rotation budget, or layout bias rather than only visual snapshots.
- Redaction constraints: diagnostics remain derived from vectors, palette metadata, and scene graphs; no raw secret material or durable storage of full input text beyond existing typographic scene/test usage.

## Integration Closure

- Upstream surfaces consumed: `src/lib/color/palette.ts`, `src/lib/color/synesthetic-mapping.ts`, `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`
- New wiring introduced in this slice: a shared renderer-expression interpretation module consumed by organic and typographic scene builders, plus scene-builder outputs that make mapping-driven art direction visible in existing results/thumbnails.
- What remains before the milestone is truly usable end-to-end: S04 still needs browser-level live art-quality proof across actual product flows and explicit visual acceptance evidence.

## Tasks

- [x] **T01: Lock renderer expressiveness contracts with failing tests** `est:45m`
  - Why: S03 needs objective proof before implementation so the slice closes on real renderer-visible gains rather than subjective tuning.
  - Files: `src/__tests__/render/organic-scene.test.ts`, `src/__tests__/render/typographic-scene.test.ts`, `src/__tests__/components/StyleSelector.test.tsx`
  - Do: Extend organic and typographic renderer tests to assert deterministic mapping-driven differences using named `PaletteResult.mapping` states and scene-graph outputs, and add/adjust a lightweight component assertion that ResultsView/StyleSelector still surfaces the upgraded scenes without changing existing wiring. Write the assertions first so they fail against the current palette-agnostic scene builders.
  - Verify: `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
  - Done when: The new renderer/selector assertions exist, encode mapping-aware expectations for both organic and typographic styles, and fail for the right reason before implementation.
- [x] **T02: Add shared synesthetic art-direction interpretation for organic and typographic renderers** `est:1h15m`
  - Why: The slice needs one authoritative renderer-facing interpretation seam so two styles consume the same mapping contract without inventing separate mood taxonomies.
  - Files: `src/lib/render/expressiveness.ts`, `src/lib/render/organic/scene.ts`, `src/lib/render/typographic/scene.ts`, `src/lib/render/typographic/layout.ts`, `src/lib/render/types.ts`
  - Do: Create a pure shared interpretation module that maps `palette.mapping` fields into renderer-facing composition posture values, then wire organic scene building to use those values for gradient richness, curve density, stroke/opacity depth, and directional drama, and wire typographic scene/layout to use the same values for hierarchy, font pairing, rotation looseness, placement bias, and density while preserving existing readability constraints and determinism.
  - Verify: `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`
  - Done when: Organic and typographic scene graphs both change composition behavior based on shared mapping interpretation, deterministic tests pass, and no renderer re-derives mood directly from raw params.
- [x] **T03: Prove runtime integration and diagnostic visibility through existing generation flows** `est:45m`
  - Why: S03 is only done if the richer scene builders are actually consumed in the real result fanout and stay compatible with text, URL, and data generation flows.
  - Files: `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`, `src/__tests__/components/StyleSelector.test.tsx`, `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, `src/__tests__/hooks/data-analysis.test.ts`
  - Do: Update any runtime/component typing or scene usage needed so ResultsView and thumbnails expose the richer scene outputs, then extend integration tests only as needed to prove hook-produced palettes with mapping still flow into renderer-ready results for supported input types, including that typographic remains disabled for data inputs while organic stays available.
  - Verify: `npm run test:run -- src/__tests__/components/StyleSelector.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
  - Done when: Existing product wiring still builds and renders mapping-aware organic/typographic scenes, integration tests pass, and failure inspection can localize issues at the shared mapping or scene-graph boundary.

## Files Likely Touched

- `src/lib/render/expressiveness.ts`
- `src/lib/render/organic/scene.ts`
- `src/lib/render/typographic/scene.ts`
- `src/lib/render/typographic/layout.ts`
- `src/lib/render/types.ts`
- `src/components/results/ResultsView.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/__tests__/render/organic-scene.test.ts`
- `src/__tests__/render/typographic-scene.test.ts`
- `src/__tests__/components/StyleSelector.test.tsx`
- `src/__tests__/hooks/text-analysis.test.ts`
- `src/__tests__/hooks/url-analysis.test.ts`
- `src/__tests__/hooks/data-analysis.test.ts`
