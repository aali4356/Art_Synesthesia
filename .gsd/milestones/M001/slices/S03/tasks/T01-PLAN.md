# T01: 03-text-analysis-input-ui 01

**Slice:** S03 — **Milestone:** M001

## Description

Build the real text analyzer that replaces `extractMockSignals` with genuine NLP features: AFINN-165 sentiment, syllable counting via the `syllable` package, and all statistical text features. Then update the calibration harness to use the real analyzer and ensure the distribution quality gate still passes.

Purpose: This is the core analysis pipeline -- the text analyzer produces the 31 signals that feed into the parameter mapping system from Phase 2. Without this, the UI in plans 03-02/03-03 has nothing to display.

Output: A tested, calibrated text analyzer module at `src/lib/analysis/` that produces the exact signals TEXT_MAPPINGS expects, with the calibration quality gate passing.

## Must-Haves

- [ ] "analyzeText(text) returns all 31 signal names referenced by TEXT_MAPPINGS"
- [ ] "Sentiment scoring uses AFINN-165 lexicon with simple negation handling"
- [ ] "Syllable features use the syllable package, not hand-rolled regex"
- [ ] "Analysis completes in under 500ms for 10,000 character input"
- [ ] "Calibration distribution quality gate passes with real analyzer (no >50% in any 0.2-wide band for any parameter)"

## Files

- `src/lib/analysis/text.ts`
- `src/lib/analysis/sentiment.ts`
- `src/lib/analysis/syllables.ts`
- `src/lib/analysis/index.ts`
- `src/lib/pipeline/calibration.ts`
- `src/lib/engine/version.ts`
- `src/data/calibration-corpus.json`
- `src/__tests__/analysis/text.test.ts`
- `src/__tests__/pipeline/calibration.test.ts`
