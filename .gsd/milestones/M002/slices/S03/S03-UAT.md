# S03: Renderer Expressiveness Pass — UAT

**Milestone:** M002
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S03 is an integration slice whose acceptance contract is deterministic renderer behavior plus existing runtime fanout compatibility, both of which are fully inspectable through scene graphs and targeted automated tests. Browser-level human visual proof is explicitly deferred to S04.

## Preconditions

- The repository is on the S03 slice branch with T01-T03 implementation present.
- Test dependencies are installed.
- Renderer and hook suites can run locally with Vitest.

## Smoke Test

Run `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx` and confirm all suites pass, proving mapping-aware organic/typographic scenes and selector integration are intact.

## Test Cases

### 1. Organic and typographic renderers consume mapping posture deterministically

1. Run `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`.
2. Inspect the passing ORGN-05 and TYPO-05 cases.
3. **Expected:** Contrasting `PaletteResult.mapping` fixtures produce deterministic, named scene-graph differences in organic density/gradient richness and typographic hierarchy/rotation/font variety, while existing renderer safety/readability laws remain green.

### 2. Existing runtime fanout still surfaces richer scenes

1. Run `npm run test:run -- src/__tests__/components/StyleSelector.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`.
2. Inspect the selector and hook integration assertions.
3. **Expected:** Text and URL flows build renderer-ready organic and typographic scenes from hook output; data flow builds renderer-ready organic scenes while typographic stays intentionally disabled; selector thumbnails render the richer scenes without prop-shape changes.

## Edge Cases

### Data inputs remain typographic-ineligible

1. Run `npm run test:run -- src/__tests__/hooks/data-analysis.test.ts`.
2. **Expected:** Data analysis still yields a mapping-aware palette and renderer-ready organic scene, but typographic style remains out of scope rather than silently degrading or partially rendering.

## Failure Signals

- ORGN-05 or TYPO-05 fails because scene fields like curve density, gradient richness, hierarchy lift, or rotation freedom no longer differ across contrasting mapping fixtures.
- StyleSelector integration fails because richer scene graphs are not accepted by the existing thumbnail/runtime seam.
- Hook integration fails because text, URL, or data results no longer produce renderer-compatible palette + scene inputs.
- Any test regression that forces new ResultsView/StyleSelector APIs or ad hoc logging to explain renderer posture is a slice failure.

## Requirements Proved By This UAT

- R002 — Proves that synesthetic mapping now drives real renderer composition behavior in at least two styles through deterministic, inspectable scene outputs and existing runtime generation flows.
- R001 — Partially proves that richer palette/mapping outcomes reach scene composition and increase visible renderer variation, though browser-level visual repetition checks remain for later slices.
- R005 — Partially proves the product is more launch-ready by keeping richer renderer behavior stable and diagnosable through the existing runtime fanout.

## Not Proven By This UAT

- Browser-level human visual acceptance that the app feels materially more premium in the live interface; that belongs to S04.
- End-to-end multi-input art-quality comparison in a real browser session.
- Expressiveness upgrades for geometric or particle renderers.
- Build/deploy reliability, analytics, continuity, or broader branded-site coherence outside this renderer integration slice.

## Notes for Tester

Use the scene-graph diagnostics before assuming a visual issue is subjective. `PaletteResult.mapping`, `OrganicSceneGraph.expressiveness`, and `TypographicSceneGraph.expressiveness` are the authoritative surfaces for understanding why a renderer changed behavior. If these stay stable and the browser later looks wrong, the likely problem is in live presentation or acceptance criteria rather than the S03 mapping seam itself.
