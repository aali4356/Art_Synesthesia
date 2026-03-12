---
id: T02
parent: S03
milestone: M002
provides:
  - Shared renderer expressiveness seam consumed by organic and typographic scene builders with inspectable scene-graph posture outputs
key_files:
  - src/lib/render/expressiveness.ts
  - src/lib/render/organic/scene.ts
  - src/lib/render/typographic/scene.ts
  - src/lib/render/typographic/layout.ts
  - src/lib/render/types.ts
key_decisions:
  - Keep palette.mapping interpretation centralized in a pure renderer expressiveness helper and expose the resulting posture on scene graphs for inspection
patterns_established:
  - Cross-renderer art direction now flows through interpretRendererExpressiveness() into style-specific composition laws instead of duplicating raw mapping heuristics per renderer
observability_surfaces:
  - OrganicSceneGraph.expressiveness and TypographicSceneGraph.expressiveness stable posture fields plus renderer contract tests
duration: 1h23m
verification_result: passed
completed_at: 2026-03-12T14:19:39-04:00
blocker_discovered: false
---

# T02: Add shared synesthetic art-direction interpretation for organic and typographic renderers

**Added a shared `palette.mapping` interpretation seam and wired both organic and typographic scene builders to consume it through inspectable expressiveness outputs.**

## What Happened

Created `src/lib/render/expressiveness.ts` as a pure interpreter from `PaletteResult.mapping` plus theme-safe palette facts into renderer-facing posture values such as atmospheric richness, directional drama, density lift, hierarchy lift, rotation freedom, font variety, and placement bias. The helper also tolerates older palette fixtures without mapping metadata by falling back to balanced defaults so existing renderer tests and runtime seams stay stable.

Updated `src/lib/render/organic/scene.ts` to consume the shared expressiveness posture for curve count, layer pressure, line width, opacity depth, dominant-direction amplification, and gradient richness. Organic scene graphs now expose an `expressiveness` object so future agents can inspect how mapping affected atmosphere without recomputing private logic.

Updated `src/lib/render/typographic/scene.ts` and `src/lib/render/typographic/layout.ts` so typographic composition also consumes the same shared posture. Word count, prominent-word sizing, font-family variety, rotation looseness, and placement bias now respond to mapping posture while keeping the existing readability laws intact. Typographic scene graphs now expose the applied posture values directly.

Extended `src/lib/render/types.ts` with additive `expressiveness` inspection fields for organic and typographic scenes. This keeps the slice’s diagnostics at the scene-graph boundary instead of hiding mapping interpretation inside per-renderer internals.

## Verification

- Ran `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`
  - Passed. Confirms the new shared mapping-aware renderer contracts (`ORGN-05`, `TYPO-05`) and all pre-existing renderer law checks.
- Ran slice-level verification: `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
  - Passed. Confirms renderer changes did not break the selector/runtime seam.
- Ran slice-level verification: `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
  - Passed. Confirms text/URL/data analysis flows still produce compatible palette + scene inputs after the renderer expressiveness changes.

## Diagnostics

- Inspect `src/lib/render/expressiveness.ts` to see the single authoritative mapping-to-art-direction translation.
- Inspect `OrganicSceneGraph.expressiveness` and `TypographicSceneGraph.expressiveness` to understand exactly which posture values a renderer consumed for a given palette/theme.
- Re-run:
  - `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`
  - These tests localize drift to named outputs like atmospheric richness, density lift, hierarchy lift, rotation freedom, and font variety rather than snapshots.

## Deviations

none

## Known Issues

none

## Files Created/Modified

- `src/lib/render/expressiveness.ts` — Added the shared pure interpreter from synesthetic mapping to renderer-facing art-direction posture.
- `src/lib/render/organic/scene.ts` — Wired organic composition behavior to shared expressiveness values for density, gradient richness, depth, and directional drama.
- `src/lib/render/typographic/scene.ts` — Wired typographic scene setup to the shared expressiveness seam and exposed inspectable posture outputs.
- `src/lib/render/typographic/layout.ts` — Applied shared expressiveness to hierarchy, font pairing, rotation looseness, density, and placement bias while preserving readability laws.
- `src/lib/render/types.ts` — Added stable `expressiveness` inspection fields to organic and typographic scene graphs.
- `.gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md` — Recorded execution, verification, and inspection guidance for T02.
