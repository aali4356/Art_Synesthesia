---
id: T03
parent: S03
milestone: M002
provides:
  - Runtime integration proof that existing text, URL, and data generation flows still produce renderer-ready mapping-aware scenes through ResultsView fanout and StyleSelector thumbnails
key_files:
  - src/__tests__/components/StyleSelector.test.tsx
  - src/__tests__/hooks/text-analysis.test.ts
  - src/__tests__/hooks/url-analysis.test.ts
  - src/__tests__/hooks/data-analysis.test.ts
  - .gsd/milestones/M002/slices/S03/S03-PLAN.md
key_decisions:
  - Keep runtime proof at the existing hook result and scene-builder boundaries rather than adding new ResultsView APIs or browser-only diagnostics
patterns_established:
  - Integration tests derive real renderer seeds from hook-produced canonical values and build scene graphs directly to localize failures to hook palette output, fanout compatibility, or selector rendering
observability_surfaces:
  - Hook result palette.mapping plus organic/typographic scene graph expressiveness fields exercised in StyleSelector and analysis integration tests
duration: 35m
verification_result: passed
completed_at: 2026-03-12T14:24:00-04:00
blocker_discovered: false
---

# T03: Prove runtime integration and diagnostic visibility through existing generation flows

**Extended selector and hook integration tests to prove mapping-aware organic and typographic scenes still flow through the existing runtime generation surfaces without new public APIs.**

## What Happened

Verified that `ResultsView` and `StyleSelector` already consumed the richer organic and typographic scene graphs from the existing fanout contract, so no runtime code changes were required. The runtime seam remained `result.vector` + `result.palette` + canonical-derived renderer seed, with typographic still conditionally disabled for data inputs.

Extended `src/__tests__/components/StyleSelector.test.tsx` to build real organic and typographic scene graphs from a mapping-aware palette fixture and assert that the selector renders those scenes as canvases without any prop-shape changes. The test also checks the exposed expressiveness posture values so failures point at scene-builder output rather than only canvas presence.

Extended hook integration tests so each supported generation flow now proves renderer compatibility directly:
- text flow builds real organic and typographic scenes from hook output
- URL flow builds real organic and typographic scenes from hook output
- data flow builds a real organic scene from hook output while keeping typographic intentionally out of scope for that input type

This closes the runtime proof loop for S03 at the inspectable boundaries called out in the slice plan: hook palette output, scene-builder compatibility, and selector thumbnail rendering.

## Verification

- Ran `npm run test:run -- src/__tests__/components/StyleSelector.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
  - Passed.
  - Confirms selector rendering still accepts mapping-aware organic/typographic scenes and hook-produced palettes remain renderer-compatible across text, URL, and data flows.
- Ran `npm run test:run -- src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts src/__tests__/components/StyleSelector.test.tsx`
  - Passed.
  - Confirms slice-level renderer expressiveness contracts still hold alongside runtime selector proof.
- Confirmed intentional data-input behavior in tests: typographic remains disabled for data inputs, while organic scene availability is unaffected.

## Diagnostics

- Inspect `src/__tests__/components/StyleSelector.test.tsx` for the runtime fanout proof that mapping-aware organic and typographic scene graphs render through the existing selector contract.
- Inspect `src/__tests__/hooks/text-analysis.test.ts` and `src/__tests__/hooks/url-analysis.test.ts` for the canonical-seed-to-scene proof that hook output remains compatible with organic and typographic renderers.
- Inspect `src/__tests__/hooks/data-analysis.test.ts` for the supported-flow boundary: data inputs still produce mapping-aware palettes and renderer-ready organic scenes while typographic stays intentionally excluded.
- The main inspection surfaces remain `palette.mapping`, `OrganicSceneGraph.expressiveness`, and `TypographicSceneGraph.expressiveness`; failures now localize to hook output, scene construction, or selector rendering instead of browser-only behavior.

## Deviations

none

## Known Issues

none

## Files Created/Modified

- `src/__tests__/components/StyleSelector.test.tsx` — Added mapping-aware selector runtime proof using real organic and typographic scene builders plus partial-module mocks for canvas draw functions.
- `src/__tests__/hooks/text-analysis.test.ts` — Added text-flow proof that hook output builds renderer-ready organic and typographic scenes.
- `src/__tests__/hooks/url-analysis.test.ts` — Added URL-flow proof that hook output builds renderer-ready organic and typographic scenes.
- `src/__tests__/hooks/data-analysis.test.ts` — Added data-flow proof that organic scene readiness remains intact while data inputs stay typographic-ineligible.
- `.gsd/milestones/M002/slices/S03/S03-PLAN.md` — Marked T03 complete.
- `.gsd/milestones/M002/slices/S03/tasks/T03-SUMMARY.md` — Recorded execution, verification, and inspection guidance for T03.
