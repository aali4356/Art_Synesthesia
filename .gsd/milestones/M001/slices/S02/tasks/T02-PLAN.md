# T02: 02-parameter-system-color 02

**Slice:** S02 — **Milestone:** M001

## Description

Create the calibration reference corpus and harness that validates parameter distribution quality, plus enforce automatic normalizer version bumping when corpus changes.

Purpose: Without calibration, parameter normalization is meaningless — values cluster instead of spreading across [0, 1]. The calibration harness is a hard quality gate per user decision: if any parameter has >50% of values in a 0.2-wide band, the test FAILS.

Output: `src/data/calibration-corpus.json` with 30+ diverse texts, `src/lib/pipeline/calibration.ts` with distribution computation and quality checks, enforced version-corpus coupling.

## Must-Haves

- [ ] "Calibration corpus contains 30+ diverse text reference inputs covering single words, names, sentences, paragraphs, poems, code, recipes, song lyrics, emoticon-heavy texts, technical writing, and foreign language samples"
- [ ] "Running the calibration harness against the corpus produces parameter distributions where no dimension has more than 50% of values in any 0.2-wide band"
- [ ] "Changing the calibration corpus file without bumping normalizerVersion causes a test to fail with an actionable error message"
- [ ] "Calibration distributions are pre-computed sorted arrays stored alongside the corpus for runtime use"

## Files

- `src/data/calibration-corpus.json`
- `src/lib/pipeline/calibration.ts`
- `src/lib/engine/version.ts`
- `src/__tests__/pipeline/calibration.test.ts`
