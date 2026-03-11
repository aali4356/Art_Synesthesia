# T02: 03-text-analysis-input-ui 02

**Slice:** S03 — **Milestone:** M001

## Description

Build the complete input-to-results UI experience: input zone with tabs, pipeline orchestration hook, page state transition (landing to results), and all results view components (collapsed input, placeholder canvas, parameter panel, progress indicator).

Purpose: This is the first user-facing interactive experience. Users type text, click Generate, see the pipeline run with staged progress, and view their parameter vector with provenance summaries alongside a palette-based placeholder canvas. This plan wires the Phase 2 parameter system and the Plan 03-01 text analyzer to the UI.

Output: A fully interactive page where typing text and clicking Generate produces a results view with real parameter data and palette colors.

## Must-Haves

- [ ] "User can type text into a prominent input zone and click Generate to trigger the analysis pipeline"
- [ ] "Input zone shows tabs for Text (active), URL (disabled), and Data (disabled)"
- [ ] "Private mode toggle (lock icon) sits next to the Generate button"
- [ ] "After clicking Generate, the page transitions from landing view to results view"
- [ ] "Results view shows collapsed input bar, placeholder canvas with palette colors, and parameter panel with 15 bars"
- [ ] "A staged progress indicator shows Parsing, Analyzing, Normalizing, Rendering stages during generation"
- [ ] "Ctrl/Cmd+Enter triggers generation from the textarea"

## Files

- `src/hooks/useTextAnalysis.ts`
- `src/hooks/usePipelineProgress.ts`
- `src/components/input/InputZone.tsx`
- `src/components/input/InputTabs.tsx`
- `src/components/input/TextInput.tsx`
- `src/components/input/GenerateButton.tsx`
- `src/components/input/index.ts`
- `src/components/results/ResultsView.tsx`
- `src/components/results/CollapsedInput.tsx`
- `src/components/results/PlaceholderCanvas.tsx`
- `src/components/results/ParameterPanel.tsx`
- `src/components/results/index.ts`
- `src/components/progress/PipelineProgress.tsx`
- `src/components/progress/index.ts`
- `src/app/page.tsx`
