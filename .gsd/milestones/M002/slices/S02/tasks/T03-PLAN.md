---
estimated_steps: 3
estimated_files: 7
---

# T03: Prove the upgraded mapping survives real generation flows

**Slice:** S02 — Synesthetic Mapping Upgrade
**Milestone:** M002

## Description

Close the slice at the integration level by proving the text, URL, and data analysis paths still converge on the shared palette seam and now surface the richer synesthetic diagnostics to downstream consumers. This task is about real pipeline wiring, not new UI invention.

## Steps

1. Add or extend `src/__tests__/hooks/text-analysis.test.ts`, `src/__tests__/hooks/url-analysis.test.ts`, and `src/__tests__/hooks/data-analysis.test.ts` so each hook asserts its returned palette includes the new mapping diagnostics and remains deterministic for the same canonical input.
2. Make any additive typing/wiring updates needed in `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`, and `src/components/results/ResultsView.tsx` so the richer `PaletteResult` flows through the existing result contract without breaking consumers.
3. Run the hook-level verification command and confirm all three generation paths preserve the upgraded mapping contract through their real outputs.

## Must-Haves

- [ ] Text, URL, and data hooks all prove they return the upgraded palette mapping diagnostics through their existing result objects.
- [ ] Any runtime wiring changes remain additive and do not fork the shared generation seam or introduce path-specific palette logic.

## Verification

- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts`
- The hook suites pass and explicitly assert the presence and determinism of the new synesthetic palette metadata across all three generation flows.

## Observability Impact

- Signals added/changed: hook results carry richer palette diagnostics all the way to the results surface without re-derivation.
- How a future agent inspects this: rerun the hook tests or inspect `PipelineResult.palette` in the hook outputs.
- Failure state exposed: integration drift becomes visible at the hook boundary, isolating whether a regression is in color generation or pipeline wiring.

## Inputs

- `src/lib/color/palette.ts` — upgraded shared palette seam from T02.
- `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts` — real generation entrypoints that must continue to use the shared seam.
- `src/components/results/ResultsView.tsx` — downstream consumer that must remain compatible with additive palette metadata.

## Expected Output

- `src/__tests__/hooks/text-analysis.test.ts` — integration proof for text flow propagation of mapping diagnostics.
- `src/__tests__/hooks/url-analysis.test.ts` — integration proof for URL flow propagation of mapping diagnostics.
- `src/__tests__/hooks/data-analysis.test.ts` — integration proof for data flow propagation of mapping diagnostics.
- `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`, `src/components/results/ResultsView.tsx` — additive compatibility updates if required by the richer palette contract.
