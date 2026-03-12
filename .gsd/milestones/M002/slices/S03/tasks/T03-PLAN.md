---
estimated_steps: 4
estimated_files: 6
---

# T03: Prove runtime integration and diagnostic visibility through existing generation flows

**Slice:** S03 — Renderer Expressiveness Pass
**Milestone:** M002

## Description

Close the loop from upgraded renderer logic to actual product wiring. This task ensures ResultsView and StyleSelector still build and surface the richer organic and typographic scenes from hook-produced results, and that supported text/URL/data flows remain compatible with the mapping-aware renderer seam.

## Steps

1. Inspect `ResultsView` and `StyleSelector` usage against the updated scene builders and add any minimal runtime typing or scene-field plumbing needed so thumbnails/canvases consume the richer scene outputs without entrypoint changes.
2. Extend `src/__tests__/components/StyleSelector.test.tsx` as needed to prove the runtime selector surface still renders mapping-aware organic and typographic scenes using the existing fanout contract.
3. Extend `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, and `src/__tests__/hooks/data-analysis.test.ts` only where necessary to prove hook-produced palettes with mapping remain compatible with renderer consumption, including that typographic stays disabled for data inputs while organic remains available.
4. Run the integration suites and fix any wiring regressions until runtime/component and hook-level proof passes together.

## Must-Haves

- [ ] Existing generation entrypoints still feed mapping-aware palettes into renderer-ready ResultsView scenes for supported flows without new public API seams.
- [ ] Integration proof covers both behavior and inspectability: failures can be localized to hook palette output, ResultsView fanout, or selector rendering.

## Verification

- `npm run test:run -- src/__tests__/components/StyleSelector.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
- Confirm data-input behavior remains intentional: typographic is still disabled there, while organic scene availability is unaffected.

## Observability Impact

- Signals added/changed: Existing hook result objects and renderer scene fanout remain the stable runtime inspection surfaces for mapping-aware rendering.
- How a future agent inspects this: Read hook integration tests, ResultsView fanout, and StyleSelector test expectations to see where mapping-driven renderer output is wired.
- Failure state exposed: Breaks in propagation are localized to hook palette output, scene-builder fanout, or thumbnail rendering rather than hidden in browser-only behavior.

## Inputs

- `src/components/results/ResultsView.tsx` — authoritative runtime fanout that builds all scenes from `result.vector` and `result.palette`.
- `src/components/results/StyleSelector.tsx` — thumbnail runtime surface for scene visibility.
- `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, `src/__tests__/hooks/data-analysis.test.ts` — current proof that mapping reaches real generation results.
- T02 summary insight — shared renderer expression seam and updated scene builders are now the runtime dependency.

## Expected Output

- `src/components/results/ResultsView.tsx` — any minimal compatibility/wiring adjustments needed for richer scenes.
- `src/components/results/StyleSelector.tsx` or `src/__tests__/components/StyleSelector.test.tsx` — integration proof that selector/runtime surfaces the upgraded scenes.
- `src/__tests__/hooks/text-analysis.test.ts` — maintained or extended renderer-compatibility proof for text flow.
- `src/__tests__/hooks/url-analysis.test.ts` — maintained or extended renderer-compatibility proof for URL flow.
- `src/__tests__/hooks/data-analysis.test.ts` — maintained or extended supported-flow proof for data flow.
