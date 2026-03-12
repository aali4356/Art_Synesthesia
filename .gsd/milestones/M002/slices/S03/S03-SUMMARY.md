---
id: S03
parent: M002
milestone: M002
provides:
  - Mapping-aware organic and typographic scene builders driven by a shared renderer expressiveness seam, with runtime proof across text, URL, and data result flows
requires:
  - slice: S01
    provides: Deterministic curated palette families and contrast-safe palette metadata exposed through PaletteResult
  - slice: S02
    provides: Deterministic synesthetic mapping diagnostics on PaletteResult consumed by downstream renderers
affects:
  - S04
key_files:
  - src/lib/render/expressiveness.ts
  - src/lib/render/organic/scene.ts
  - src/lib/render/typographic/scene.ts
  - src/lib/render/typographic/layout.ts
  - src/lib/render/types.ts
  - src/__tests__/render/organic-scene.test.ts
  - src/__tests__/render/typographic-scene.test.ts
  - src/__tests__/components/StyleSelector.test.tsx
  - src/__tests__/hooks/text-analysis.test.ts
  - src/__tests__/hooks/url-analysis.test.ts
  - src/__tests__/hooks/data-analysis.test.ts
key_decisions:
  - Centralize palette.mapping interpretation in a pure renderer expressiveness helper and expose applied posture values on organic and typographic scene graphs
  - Use mapping-aware scene-field assertions plus existing selector/hook integration tests as the slice gate instead of snapshots or new runtime APIs
patterns_established:
  - Cross-renderer art direction now flows through interpretRendererExpressiveness() into style-specific scene laws while remaining inspectable at the scene-graph boundary
  - Runtime proof derives renderer seeds from hook-produced canonical results and exercises existing ResultsView/StyleSelector fanout without entrypoint changes
observability_surfaces:
  - PaletteResult.mapping
  - OrganicSceneGraph.expressiveness
  - TypographicSceneGraph.expressiveness
  - src/__tests__/render/organic-scene.test.ts
  - src/__tests__/render/typographic-scene.test.ts
  - src/__tests__/components/StyleSelector.test.tsx
  - src/__tests__/hooks/text-analysis.test.ts
  - src/__tests__/hooks/url-analysis.test.ts
  - src/__tests__/hooks/data-analysis.test.ts
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T03-SUMMARY.md
duration: 2h18m
verification_result: passed
completed_at: 2026-03-12T14:24:33-04:00
---

# S03: Renderer Expressiveness Pass

**Shipped a shared mapping-to-expressiveness seam that makes organic and typographic renderers change composition behavior — not just colors — and proved those richer scenes still flow through the existing runtime generation surfaces.**

## What Happened

S03 started by locking the slice contract with failing renderer tests instead of subjective visual tuning. Organic renderer coverage now compares contrasting calm versus bold mapping fixtures and checks deterministic scene-graph differences in curve density, gradient richness, opacity posture, and directional drama. Typographic coverage does the same for hierarchy, word density, rotation looseness, and font-family variety. The selector/runtime seam was kept under test with real scene fixtures so the slice would prove integration, not only internal renderer changes.

With those failures in place, the slice introduced `src/lib/render/expressiveness.ts` as the single renderer-facing interpretation seam for `PaletteResult.mapping`. That helper translates mapping diagnostics and palette facts into stable posture values such as atmospheric richness, density lift, hierarchy lift, directional drama, rotation freedom, font variety, and placement bias. Organic and typographic scene builders now consume that shared posture rather than re-deriving mood directly from raw vectors, which keeps cross-style behavior aligned and deterministic.

Organic scene construction now uses the shared posture to control curve count, layer pressure, line width, opacity depth, dominant-direction amplification, and gradient richness. Typographic composition uses the same seam to adjust word count, prominent-word sizing, font-family variety, rotation looseness, and placement bias while preserving the existing readability laws. Both scene graphs expose additive `expressiveness` fields so failures localize at the renderer output boundary instead of hiding inside implementation details.

The final task closed the runtime proof loop without adding new public APIs. Existing `ResultsView` and `StyleSelector` fanout already accepted the richer scene graphs, so the slice extended component and hook integration tests to build real scenes from hook-produced palettes. Text and URL flows now prove compatibility for both organic and typographic renderers. Data flow proves that mapping-aware organic scenes still work while typographic remains intentionally unavailable for that input type.

## Verification

- Ran `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
  - Passed: 35 tests across renderer expressiveness contracts and selector/runtime seam coverage.
- Ran `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
  - Passed: 9 tests across text, URL, and data generation-flow integration.
- Confirmed slice observability surfaces are real and actionable:
  - `PaletteResult.mapping` remains the upstream mapping diagnostic contract.
  - `OrganicSceneGraph.expressiveness` and `TypographicSceneGraph.expressiveness` expose the applied renderer posture directly.
  - Failures localize to named fields like gradient richness, density lift, hierarchy lift, rotation freedom, and placement bias instead of snapshots or console output.
- Confirmed no hidden-success pattern: runtime proof stays at existing hook result, scene builder, and selector boundaries; typographic remains explicitly excluded for data inputs rather than silently failing.

## Requirements Advanced

- R001 — Renderer consumption of the richer palette/mapping system now reaches live scene composition in two styles, increasing visible output variety beyond palette selection alone.
- R002 — Organic and typographic styles now respond to synesthetic mapping through deterministic composition posture, proving the mapping influences real renderer behavior instead of stopping at palette generation.
- R005 — The product is closer to a credible launch because two live result styles now feel more art-directed and diagnostically verifiable in existing product flows.

## Requirements Validated

- R002 — Validated status remains justified and is strengthened by new proof that deterministic synesthetic mapping now drives renderer composition behavior across organic and typographic scenes in text/URL/data-compatible runtime flows.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

none

## Known Limitations

- S03 proves integration through renderer, selector, and hook boundaries, but it does not provide browser-level visual acceptance evidence; S04 still owns live art-quality proof in the actual app.
- This slice upgrades organic and typographic renderers only. Cross-style expressiveness consistency for geometric and particle remains outside S03 scope.
- Data-input typographic rendering remains intentionally unavailable; this slice preserved that boundary rather than expanding supported styles for data.

## Follow-ups

- Execute S04 with browser-level generation runs that visibly compare multiple inputs and confirm the richer organic and typographic outputs in the real results experience.
- Use the new `expressiveness` scene fields during S04 investigation to explain any live visual regressions before reaching for screenshots or broad browser inspection.

## Files Created/Modified

- `src/lib/render/expressiveness.ts` — Added the shared pure interpreter from synesthetic mapping to renderer-facing art-direction posture.
- `src/lib/render/organic/scene.ts` — Wired organic scene density, depth, directional drama, and gradient richness to shared expressiveness values.
- `src/lib/render/typographic/scene.ts` — Applied shared expressiveness posture to typographic scene setup and exposed inspectable posture outputs.
- `src/lib/render/typographic/layout.ts` — Used shared posture to adjust hierarchy, density, rotation looseness, font variety, and placement bias while preserving readability laws.
- `src/lib/render/types.ts` — Added stable `expressiveness` inspection fields to organic and typographic scene graphs.
- `src/__tests__/render/organic-scene.test.ts` — Added mapping-aware organic expressiveness contracts.
- `src/__tests__/render/typographic-scene.test.ts` — Added mapping-aware typographic expressiveness contracts.
- `src/__tests__/components/StyleSelector.test.tsx` — Proved selector/runtime compatibility with richer organic and typographic scene outputs.
- `src/__tests__/hooks/text-analysis.test.ts` — Proved text-flow hook results build renderer-ready mapping-aware organic and typographic scenes.
- `src/__tests__/hooks/url-analysis.test.ts` — Proved URL-flow hook results build renderer-ready mapping-aware organic and typographic scenes.
- `src/__tests__/hooks/data-analysis.test.ts` — Proved data-flow hook results remain organic-renderer compatible while typographic stays intentionally disabled.
- `.gsd/milestones/M002/slices/S03/S03-PLAN.md` — Marked all S03 tasks complete.
- `.gsd/milestones/M002/slices/S03/S03-SUMMARY.md` — Recorded slice-level completion, proof, diagnostics, and requirement impact.

## Forward Intelligence

### What the next slice should know
- The strongest inspection seam for live S04 debugging is not the canvas output itself; it is `palette.mapping` plus the `expressiveness` objects on organic and typographic scene graphs, which explain why a generation looks calm, dense, dramatic, or restrained.
- Existing ResultsView/StyleSelector wiring already accepts the richer scene graphs, so S04 should treat browser proof as an acceptance/visibility task, not a component API redesign task.

### What's fragile
- Data-flow determinism is still slightly asymmetric because seed derivation is not fully canonicalized for trimmed-equivalent raw inputs; this does not break S03 but can confuse live comparison if S04 chooses nearly identical multiline data fixtures.
- Browser-level judgments remain qualitative — the automated proof localizes renderer posture changes, but only S04 will confirm those differences are visually legible enough in the actual UI.

### Authoritative diagnostics
- `src/lib/render/expressiveness.ts` — This is the single source of truth for mapping-to-posture translation across renderers.
- `src/__tests__/render/organic-scene.test.ts` and `src/__tests__/render/typographic-scene.test.ts` — These suites are the most trustworthy regression alarms because they assert named scene fields rather than visual snapshots.
- `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, and `src/__tests__/hooks/data-analysis.test.ts` — These are the right place to check whether a live-looking failure is actually a hook/palette compatibility problem.

### What assumptions changed
- The slice plan allowed for possible ResultsView/StyleSelector runtime edits, but existing runtime fanout already handled the richer scene graphs; the real work was strengthening tests at the existing seam rather than introducing new runtime wiring.
- The initial risk was that renderer expressiveness might require per-style mood logic, but the shared interpreter proved sufficient for both organic atmosphere and typographic hierarchy without collapsing style identity.
