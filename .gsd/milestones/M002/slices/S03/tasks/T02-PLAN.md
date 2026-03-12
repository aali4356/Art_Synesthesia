---
estimated_steps: 5
estimated_files: 5
---

# T02: Add shared synesthetic art-direction interpretation for organic and typographic renderers

**Slice:** S03 — Renderer Expressiveness Pass
**Milestone:** M002

## Description

Implement the actual renderer expressiveness seam for S03. This task creates a shared pure interpretation layer from `PaletteResult.mapping` into renderer-facing composition posture, then wires both organic and typographic scene builders to consume it so the same synesthetic contract produces richer but style-distinct outputs.

## Steps

1. Create `src/lib/render/expressiveness.ts` as a pure helper that translates `palette.mapping` and theme-safe palette facts into shared art-direction posture values consumable by multiple renderers.
2. Update `src/lib/render/organic/scene.ts` to consume that interpretation for mapping-driven gradient atmosphere, curve count/density, width/opacity depth, and directional drama while preserving determinism and existing scene-builder purity.
3. Update `src/lib/render/typographic/scene.ts` to derive layout/art-direction inputs from the shared interpretation instead of raw param-only logic.
4. Update `src/lib/render/typographic/layout.ts` and any affected `src/lib/render/types.ts` fields so typographic hierarchy, font pairing, rotation looseness, and placement bias respond to shared mapping posture while keeping overlap/readability laws enforceable.
5. Run targeted renderer tests, tune implementation until both organic and typographic suites pass, and keep all mapping interpretation localized to the shared seam rather than duplicating mood logic per renderer.

## Must-Haves

- [ ] Organic and typographic renderers both consume one shared interpretation of `palette.mapping` rather than inventing independent mood heuristics.
- [ ] Deterministic renderer laws remain intact: same params + palette + theme + seed + text still produce the same scene graph, and typographic readability constraints continue to hold.

## Verification

- `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`
- Confirm the previously failing mapping-aware assertions now pass alongside the pre-existing structural/readability checks.

## Observability Impact

- Signals added/changed: Shared renderer-expression outputs make mapping-driven art direction inspectable as stable scene-graph properties.
- How a future agent inspects this: Inspect `src/lib/render/expressiveness.ts` plus the resulting organic/typographic scene graphs and renderer tests.
- Failure state exposed: If a renderer drifts from the shared mapping contract, the break localizes to the interpretation helper or the specific scene-builder consumption point.

## Inputs

- `src/lib/color/synesthetic-mapping.ts` — authoritative mapping shape and naming that S03 must consume directly.
- `src/lib/render/organic/scene.ts` — existing organic composition seam ready for mapping-aware upgrades.
- `src/lib/render/typographic/scene.ts` and `src/lib/render/typographic/layout.ts` — existing poster composition seam where mapping-aware hierarchy should land.
- T01 summary insight — the failing tests define the exact expressive contract this implementation must satisfy.

## Expected Output

- `src/lib/render/expressiveness.ts` — shared pure interpretation of synesthetic mapping for renderer art direction.
- `src/lib/render/organic/scene.ts` — mapping-aware organic scene graph behavior.
- `src/lib/render/typographic/scene.ts` — mapping-aware typographic scene setup.
- `src/lib/render/typographic/layout.ts` — mapping-aware typographic layout behavior that still obeys readability laws.
- `src/lib/render/types.ts` — additive scene metadata only if required for inspectable expressiveness outputs.
