---
estimated_steps: 3
estimated_files: 6
---

# T02: Implement deterministic synesthetic intent and wire it into palette generation

**Slice:** S02 — Synesthetic Mapping Upgrade
**Milestone:** M002

## Description

Create the new synesthetic mapping boundary and make it authoritative in palette generation. This task converts the full parameter vector into stable aesthetic intent, replaces the split-brain legacy hue/harmony path inside `generatePalette()`, and exposes additive diagnostics for downstream consumers.

## Steps

1. Create `src/lib/color/synesthetic-mapping.ts` with a pure mapper that derives mood, family-driving intent, harmony source, hue anchor strategy, chroma posture, and contrast posture from the full `ParameterVector` plus deterministic seed inputs where necessary.
2. Refactor `src/lib/color/palette.ts`, `src/lib/color/harmony.ts`, `src/lib/color/palette-family-selection.ts`, and `src/lib/color/palette-families.ts` so palette realization uses the new mapping and family metadata as the authoritative source for hue anchor, harmony, chroma shaping, and contrast floors rather than the current legacy warmth-driven base hue path.
3. Export the new mapping types/functions through `src/lib/color/index.ts`, surface the additive mapping object on `PaletteResult`, and rerun the targeted color contract suites until they pass.

## Must-Haves

- [ ] `generatePalette(vector, seed)` remains the public integration seam while returning additive mapping diagnostics on `PaletteResult`.
- [ ] Palette realization behavior is actually changed by the mapping object, not merely annotated after the fact.

## Verification

- `npm run test:run -- src/__tests__/color/synesthetic-mapping.test.ts src/__tests__/color/harmony.test.ts src/__tests__/color/palette-family-selection.test.ts src/__tests__/color/palette.test.ts`
- All targeted color tests pass, proving the new mapping is deterministic, authoritative, and backward-compatible with existing palette consumers.

## Observability Impact

- Signals added/changed: `PaletteResult` gains stable synesthetic intent diagnostics that downstream renderers/tests can inspect directly.
- How a future agent inspects this: call `generatePalette()` in tests or REPL and inspect `result.mapping`, `familyId`, `selectionKey`, and `selectionVector`.
- Failure state exposed: mapping-level drift localizes to explicit palette diagnostics rather than hidden calculations inside `palette.ts`.

## Inputs

- `src/__tests__/color/synesthetic-mapping.test.ts` — authoritative contract added in T01.
- `src/lib/color/palette-families.ts` — curated family metadata that should become authoritative instead of advisory.
- `src/lib/color/palette.ts` — existing split-brain palette realization path that this task must replace.

## Expected Output

- `src/lib/color/synesthetic-mapping.ts` — pure synesthetic intent module for S02 and downstream S03 use.
- `src/lib/color/palette.ts` — palette generation rewritten to consume the new mapping as the primary art-direction boundary.
- `src/lib/color/index.ts` — exported synesthetic mapping types/functions for downstream consumers and tests.
