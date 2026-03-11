# S03: Text Analysis Input Ui

**Goal:** Build the real text analyzer that replaces `extractMockSignals` with genuine NLP features: AFINN-165 sentiment, syllable counting via the `syllable` package, and all statistical text features.
**Demo:** Build the real text analyzer that replaces `extractMockSignals` with genuine NLP features: AFINN-165 sentiment, syllable counting via the `syllable` package, and all statistical text features.

## Must-Haves


## Tasks

- [x] **T01: 03-text-analysis-input-ui 01** `est:~45min`
  - Build the real text analyzer that replaces `extractMockSignals` with genuine NLP features: AFINN-165 sentiment, syllable counting via the `syllable` package, and all statistical text features. Then update the calibration harness to use the real analyzer and ensure the distribution quality gate still passes.

Purpose: This is the core analysis pipeline -- the text analyzer produces the 31 signals that feed into the parameter mapping system from Phase 2. Without this, the UI in plans 03-02/03-03 has nothing to display.

Output: A tested, calibrated text analyzer module at `src/lib/analysis/` that produces the exact signals TEXT_MAPPINGS expects, with the calibration quality gate passing.
- [x] **T02: 03-text-analysis-input-ui 02** `est:~10min`
  - Build the complete input-to-results UI experience: input zone with tabs, pipeline orchestration hook, page state transition (landing to results), and all results view components (collapsed input, placeholder canvas, parameter panel, progress indicator).

Purpose: This is the first user-facing interactive experience. Users type text, click Generate, see the pipeline run with staged progress, and view their parameter vector with provenance summaries alongside a palette-based placeholder canvas. This plan wires the Phase 2 parameter system and the Plan 03-01 text analyzer to the UI.

Output: A fully interactive page where typing text and clicking Generate produces a results view with real parameter data and palette colors.
- [x] **T03: 03-text-analysis-input-ui 03** `est:~5min`
  - Add quick-start buttons and the "Surprise me" feature to the landing page, then verify the complete end-to-end flow with a visual checkpoint.

Purpose: Quick-start buttons provide instant gratification -- one click inserts text AND triggers generation. This is critical for first-time user experience: the user sees art immediately without having to think of what to type. The "Surprise me" button adds delight and replayability.

Output: Quick-start buttons and Surprise me on the landing page, wired to auto-trigger generation. Human-verified end-to-end flow.

## Files Likely Touched

- `src/lib/analysis/text.ts`
- `src/lib/analysis/sentiment.ts`
- `src/lib/analysis/syllables.ts`
- `src/lib/analysis/index.ts`
- `src/lib/pipeline/calibration.ts`
- `src/lib/engine/version.ts`
- `src/data/calibration-corpus.json`
- `src/__tests__/analysis/text.test.ts`
- `src/__tests__/pipeline/calibration.test.ts`
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
- `src/components/input/QuickStart.tsx`
- `src/components/input/index.ts`
- `src/data/surprise-phrases.ts`
- `src/app/page.tsx`
