# S02: Parameter System Color

**Goal:** Build the quantile-based normalization engine, weighted-blend parameter mapping tables, and provenance generation system.
**Demo:** Build the quantile-based normalization engine, weighted-blend parameter mapping tables, and provenance generation system.

## Must-Haves


## Tasks

- [x] **T01: 02-parameter-system-color 01** `est:4min`
  - Build the quantile-based normalization engine, weighted-blend parameter mapping tables, and provenance generation system.

Purpose: This is the core intermediate representation layer that connects future analysis (Phase 3) to future rendering (Phase 4+). Every input ultimately becomes a 15-dimension parameter vector through this pipeline.

Output: `src/lib/pipeline/` module with normalization, mapping, and provenance — fully tested with TDD.
- [x] **T02: 02-parameter-system-color 02** `est:10min`
  - Create the calibration reference corpus and harness that validates parameter distribution quality, plus enforce automatic normalizer version bumping when corpus changes.

Purpose: Without calibration, parameter normalization is meaningless — values cluster instead of spreading across [0, 1]. The calibration harness is a hard quality gate per user decision: if any parameter has >50% of values in a 0.2-wide band, the test FAILS.

Output: `src/data/calibration-corpus.json` with 30+ diverse texts, `src/lib/pipeline/calibration.ts` with distribution computation and quality checks, enforced version-corpus coupling.
- [x] **T03: 02-parameter-system-color 03** `est:6min`
  - Build the OKLCH palette generation system with harmony algorithms, near-duplicate rejection, and dual lightness profiles for dark/light mode.

Purpose: Every artwork needs a perceptually coherent color palette derived from the parameter vector. The palette must look intentional (harmony-driven), maintain contrast in both modes, and never contain near-duplicate colors.

Output: `src/lib/color/` module with palette generation, harmony, contrast, and deduplication — fully tested with TDD.

## Files Likely Touched

- `src/lib/pipeline/normalize.ts`
- `src/lib/pipeline/mapping.ts`
- `src/lib/pipeline/provenance.ts`
- `src/lib/pipeline/index.ts`
- `src/__tests__/pipeline/normalize.test.ts`
- `src/__tests__/pipeline/mapping.test.ts`
- `src/__tests__/pipeline/provenance.test.ts`
- `src/data/calibration-corpus.json`
- `src/lib/pipeline/calibration.ts`
- `src/lib/engine/version.ts`
- `src/__tests__/pipeline/calibration.test.ts`
- `src/lib/color/palette.ts`
- `src/lib/color/harmony.ts`
- `src/lib/color/contrast.ts`
- `src/lib/color/dedup.ts`
- `src/lib/color/index.ts`
- `src/__tests__/color/palette.test.ts`
- `src/__tests__/color/harmony.test.ts`
- `src/__tests__/color/contrast.test.ts`
- `src/__tests__/color/dedup.test.ts`
- `package.json`
