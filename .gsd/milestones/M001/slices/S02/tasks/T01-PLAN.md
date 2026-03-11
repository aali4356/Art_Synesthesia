# T01: 02-parameter-system-color 01

**Slice:** S02 — **Milestone:** M001

## Description

Build the quantile-based normalization engine, weighted-blend parameter mapping tables, and provenance generation system.

Purpose: This is the core intermediate representation layer that connects future analysis (Phase 3) to future rendering (Phase 4+). Every input ultimately becomes a 15-dimension parameter vector through this pipeline.

Output: `src/lib/pipeline/` module with normalization, mapping, and provenance — fully tested with TDD.

## Must-Haves

- [ ] "percentileRank returns 0 for values at or below the minimum of a sorted reference array"
- [ ] "percentileRank returns 1 for values at or above the maximum of a sorted reference array"
- [ ] "percentileRank returns ~0.5 for the median value of a sorted reference array"
- [ ] "percentileRank returns 0.5 (midpoint) for empty reference distributions"
- [ ] "computeParameterVector produces a 15-dimension object with all values clamped to [0, 1]"
- [ ] "Each parameter value is a weighted sum of normalized signal values with weights summing to 1"
- [ ] "Parameter provenance lists contributing signals with rawValue, weight, and plain-English explanation"
- [ ] "Text mapping table covers all 15 parameters with at least 2 signals each"

## Files

- `src/lib/pipeline/normalize.ts`
- `src/lib/pipeline/mapping.ts`
- `src/lib/pipeline/provenance.ts`
- `src/lib/pipeline/index.ts`
- `src/__tests__/pipeline/normalize.test.ts`
- `src/__tests__/pipeline/mapping.test.ts`
- `src/__tests__/pipeline/provenance.test.ts`
