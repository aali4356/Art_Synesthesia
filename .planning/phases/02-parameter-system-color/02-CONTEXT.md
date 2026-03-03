# Phase 2: Parameter System & Color - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Universal 15-dimension parameter vector schema, quantile-based normalization engine with calibration harness (30+ text reference inputs), and OKLCH palette generation with perceptual coherence. This phase produces the intermediate representation that connects analysis (Phase 3) to rendering (Phase 4+). Text analysis pipeline and input UI are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Parameter-to-signal mapping
- Weighted blend approach: each parameter is a weighted sum of multiple raw analysis signals (not one-to-one)
- Per-input-type mapping tables: text, URL, and data each have their own weight configurations optimized for their signal types
- Cross-type comparison is not a priority; each type's mapping is independently tuned for expressive distribution
- Extensions field (`Record<string, number>`) kept as a future escape hatch only — 15 core dimensions for now

### Provenance display
- Both-layer approach: plain English summary visible by default ("Energy is high because your text has lots of exclamation marks and short, punchy sentences")
- Expandable to show raw signal breakdown underneath (signal name, weight, raw value)
- ParameterProvenance type already supports this structure

### Calibration reference corpus
- Maximum diversity: single words, names, sentences, paragraphs, poems, code snippets, recipes, song lyrics, emoticon-heavy texts, technical writing, foreign language samples
- Goal: every parameter distributes broadly — no dimension should cluster
- Corpus stored in a data file (JSON/YAML), separate from test logic, version-controlled
- Calibration is a hard test gate: if any parameter has >50% of values in a 0.2-wide band, the test fails
- Changing the corpus file automatically bumps the normalizer version (enforced by pre-commit check or test)

### Palette generation
- Palette size driven by `paletteSize` parameter: 0 maps to 3 colors, 1 maps to 8 colors
- All palette colors are generated OKLCH art colors — no neutrals in the palette; background comes from the theme
- First color in the palette is the "dominant" (largest area in renderers), remaining are accents
- Palette harmony/mood driven by parameters: high symmetry + low contrast = analogous, high contrast + high energy = complementary/triadic
- Renderers handle opacity/transparency themselves — palette provides solid OKLCH colors only

### Color mode adaptation
- Same hue angles and chroma across dark/light modes; OKLCH lightness adjusted to maintain readable contrast against each background
- One palette algorithm, two lightness profiles — artwork feels consistent across modes

### Claude's Discretion
- Exact parameter-to-color-property mapping (which parameters drive hue vs chroma vs lightness)
- deltaE threshold for near-duplicate color rejection (requirements say <10 in LAB, tune by visual testing)
- Exact harmony algorithm implementation
- Calibration corpus curation (specific reference texts within the diversity guidelines)

</decisions>

<specifics>
## Specific Ideas

- Provenance should feel like a museum exhibit label — inviting curiosity, not overwhelming
- The palette "mood" reflecting input character is a key differentiator: a calm poem should generate an analogous palette, an angry rant should generate high-contrast complementary colors
- Dark mode near-black background (~#0a0a0a, oklch(0.09 0.005 250)) from Phase 1 is the primary contrast target

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ParameterVector` interface (src/types/engine.ts): 15 named dimensions + extensions field — ready to use as-is
- `ParameterProvenance` interface (src/types/engine.ts): contributors array with signal, rawValue, weight, explanation — supports both-layer display
- `VersionInfo` + `CURRENT_VERSION` (src/lib/engine/version.ts): normalizerVersion field ready for auto-bump on corpus change
- `analysisKey` / `renderKey` (src/lib/cache/keys.ts): cache key functions already incorporate version info
- PRNG infrastructure (src/lib/engine/prng.ts): Alea-based seeded PRNG available for any randomness in palette generation
- SHA-256 hashing (src/lib/engine/hash.ts): available for deterministic seed generation

### Established Patterns
- Engine module pattern: src/lib/engine/ with index.ts re-exports — new parameter/color modules should follow same structure
- Test structure: src/__tests__/ mirrors src/lib/ directory structure
- TypeScript strict mode with path aliases (@/types, @/lib)

### Integration Points
- Parameter vector is consumed by renderers (Phase 4+) and translation panel (Phase 4)
- Palette is consumed by all four rendering styles (Phases 4-5)
- Normalizer version feeds into cache key generation (already wired)
- Calibration harness tests will import from src/lib/pipeline/ (new directory)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-parameter-system-color*
*Context gathered: 2026-03-02*
