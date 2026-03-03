# Phase 3: Text Analysis & Input UI - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Text analyzer pipeline extracting NLP features (character frequency, sentiment, entropy, syllable patterns, vocabulary richness), input zone UI with tabs (Text active, URL/Data disabled), quick-start buttons with "Surprise me", and staged progress animation. This phase delivers the first user-facing input experience and the analysis pipeline that feeds the parameter system from Phase 2. Rendering is Phase 4 — this phase uses a placeholder canvas.

</domain>

<decisions>
## Implementation Decisions

### Input zone layout
- Input zone sits below the showcase artwork and tagline on the landing page
- Generous, inviting textarea (~150px default height) with visible placeholder text — feels like a writing surface
- Subtle underline-style tabs above the input: Text (active, violet underline), URL (dimmed/disabled), Data (dimmed/disabled)
- Private mode toggle (lock icon) positioned next to the Generate button as a companion control

### Quick-start content & behavior
- Playful, inviting tone for button labels: "Try: your name / a haiku / a recipe / a famous quote" style
- 4-5 diverse quick-start buttons covering different text types to show the tool's range
- "Surprise me" button draws from a curated pool of ~50 interesting phrases (evocative sentences, famous quotes, fun facts), different each click
- Clicking any quick-start button or "Surprise me" inserts text AND auto-triggers generation — instant gratification, one click does everything

### Post-generate page transition
- Full page transition after clicking Generate: landing page transforms into results view
- Input zone collapses into a compact top bar showing a text preview snippet, expandable to edit and regenerate
- Showcase artwork disappears; canvas area + parameter panel take the main stage
- Canvas area shows a placeholder artwork using generated palette colors (Claude's discretion on exact treatment — should demonstrate the palette without setting false expectations about Phase 4 renderers)
- Parameter panel shows the 15-dimension parameter bars with provenance summaries alongside the canvas

### Progress animation
- Horizontal row of step labels (Parsing, Analyzing, Normalizing, Rendering) with active stage highlighted in violet, completed stages get a checkmark or dim
- Progress indicator appears over the canvas area during generation; result fades in when complete
- Real pipeline timing with smoothing: tied to actual stages but minimum ~200ms display per stage so fast steps don't flash by

### Claude's Discretion
- Placeholder canvas artwork treatment (palette-based, should look intentional not broken)
- Light mode color adjustments for the input zone and tabs
- Reduced motion handling for progress indicator
- Exact spacing, padding, and responsive breakpoints for the input zone
- Character count or length indicator behavior (if any)
- Generate button click feedback style
- Exact quick-start button text and curated "Surprise me" phrase pool content
- Transition animation details (landing → results view)

</decisions>

<specifics>
## Specific Ideas

- Gallery-wall feel maintained: showcase artwork first, input below — users see what the app does before interacting
- Quick-start should feel playful and curious — "Try: your name" invites experimentation, not instruction
- The full-page transition after Generate gives a "reveal" moment — the app transforms from gallery showcase to personal creation
- Input collapsing to a top bar keeps the canvas/results as hero, consistent with Phase 1's "artwork is the hero" principle
- Progress steps are a pipeline visualization, not a generic loading bar — shows users the analysis is multi-stage and real

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Shell` component (src/components/layout/Shell.tsx): responsive layout shell with Header, gallery-padding, max-w-6xl container
- `Header` component (src/components/layout/Header.tsx): app header with theme toggle
- `ThemeProvider` + `ThemeToggle` (src/components/theme/): dark/light mode infrastructure ready
- `TEXT_MAPPINGS` (src/lib/pipeline/mapping.ts): signal names the text analyzer must produce (vocabRichness, avgSentenceLength, charEntropy, etc.)
- `computeParameterVector` (src/lib/pipeline/mapping.ts): takes raw signals + calibration data, produces ParameterVector + provenance
- `normalizeSignals` + `percentileRank` (src/lib/pipeline/normalize.ts): quantile normalization engine
- `generateAllSummaries` (src/lib/pipeline/provenance.ts): plain-English provenance summaries
- `loadCorpus` + `computeCalibrationDistributions` (src/lib/pipeline/calibration.ts): calibration harness with 44-entry text corpus
- `generatePalette` (src/lib/color/palette.ts): OKLCH palette generation from ParameterVector
- Text canonicalizer (src/lib/canonicalize/text.ts): Unicode NFC normalization ready
- Seeded PRNG (src/lib/engine/prng.ts) + SHA-256 hashing (src/lib/engine/hash.ts): determinism infrastructure

### Established Patterns
- Engine module pattern: src/lib/{module}/index.ts barrel exports
- Test structure: src/__tests__/ mirrors src/lib/ directory structure
- TypeScript strict mode with path aliases (@/types, @/lib, @/components)
- Tailwind CSS with custom design tokens in globals.css (gallery-padding, accent colors, muted backgrounds)
- Near-black dark mode background oklch(0.09 0.005 250), violet accent oklch(0.65 0.25 285)

### Integration Points
- Current page.tsx has placeholder divs for showcase artwork and input zone — replace with real components
- Text analyzer signals must match names in TEXT_MAPPINGS (src/lib/pipeline/mapping.ts)
- Calibration data from calibration.ts feeds into computeParameterVector for normalization
- New components go in src/components/ (input zone, progress, quick-start)
- New analysis code goes in src/lib/analysis/ or src/lib/pipeline/ (text analyzer)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-text-analysis-input-ui*
*Context gathered: 2026-03-03*
