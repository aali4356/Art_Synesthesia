---
estimated_steps: 3
estimated_files: 3
---

# T01: Lock renderer expressiveness contracts with failing tests

**Slice:** S03 — Renderer Expressiveness Pass
**Milestone:** M002

## Description

Define the slice gate as executable renderer-facing tests before implementation. This task should make organic and typographic expressiveness measurable by asserting that named `PaletteResult.mapping` states produce deterministic, inspectable scene-graph differences, and that the upgraded scenes still surface through the existing selector/runtime seam.

## Steps

1. Extend `src/__tests__/render/organic-scene.test.ts` with mapping-aware assertions for deterministic organic scene differences such as curve density, gradient richness, opacity/depth posture, or directional drama under contrasting synesthetic mappings.
2. Extend `src/__tests__/render/typographic-scene.test.ts` with mapping-aware assertions for deterministic typographic differences such as hierarchy, rotation looseness, font treatment, or composition density while preserving existing readability laws.
3. Update `src/__tests__/components/StyleSelector.test.tsx` only as needed to assert that the existing selector/runtime seam still accepts and renders the upgraded organic/typographic scene shapes, then run the targeted suite and confirm the new assertions fail before implementation.

## Must-Haves

- [ ] Renderer tests name concrete mapping-driven scene outputs for both organic and typographic styles instead of relying on vague visual judgment.
- [ ] The new assertions fail against the current implementation for the intended reason: scene builders are not yet consuming `palette.mapping` expressively.

## Verification

- `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
- Confirm the targeted failures point to missing mapping-aware renderer behavior rather than unrelated test breakage.

## Observability Impact

- Signals added/changed: Named scene-graph expectations for mapping-driven density, hierarchy, and posture differences.
- How a future agent inspects this: Read the targeted renderer and selector test failures to see which expressive contract regressed.
- Failure state exposed: Missing or incorrect mapping interpretation becomes visible as a specific renderer assertion failure instead of a subjective art-quality complaint.

## Inputs

- `src/__tests__/render/organic-scene.test.ts` — current structural organic invariants that need mapping-aware proof added.
- `src/__tests__/render/typographic-scene.test.ts` — current typographic composition laws that must stay intact while expressiveness coverage grows.
- `src/__tests__/components/StyleSelector.test.tsx` — current runtime thumbnail seam for lightweight integration proof.

## Expected Output

- `src/__tests__/render/organic-scene.test.ts` — failing organic expressiveness assertions tied to `palette.mapping`.
- `src/__tests__/render/typographic-scene.test.ts` — failing typographic expressiveness assertions tied to `palette.mapping`.
- `src/__tests__/components/StyleSelector.test.tsx` — selector/runtime assertion updated if scene-shape expectations change.
