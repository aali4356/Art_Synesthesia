# Roadmap: Synesthesia Machine

## Overview

This roadmap delivers a deterministic input-to-art web application in 9 phases, structured around the core dependency chain: determinism infrastructure must exist before parameters, parameters before analysis, analysis before rendering, rendering before sharing/gallery/export. The first four phases deliver the end-to-end MVP (text input through geometric art with translation panel). Phases 5-6 expand input types and rendering styles. Phases 7-9 add social features, persistence, and polish. Every phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Determinism Infrastructure** - Project scaffold, seeded PRNG, canonicalization, engine versioning, design system
- [x] **Phase 2: Parameter System & Color** - Parameter vector schema, quantile normalization, calibration harness, OKLCH palette generation
- [ ] **Phase 3: Text Analysis & Input UI** - Text analyzer pipeline, input zone with tabs, quick-start buttons, progress animation
- [ ] **Phase 4: Geometric Renderer & Canvas UI** - First rendering style, canvas display, translation panel with provenance
- [ ] **Phase 5: Additional Renderers** - Organic, particle, and typographic styles with style selector previews
- [ ] **Phase 6: URL & Data Input** - URL analyzer with SSRF protection, data analyzer for CSV/JSON, rate limiting
- [ ] **Phase 7: Database, Sharing & Privacy** - PostgreSQL schema, share links, caching infrastructure, privacy model
- [ ] **Phase 8: Gallery & Compare** - Gallery browse/save/filter, compare mode with parameter diff, moderation
- [ ] **Phase 9: Export & Accessibility** - High-res PNG export, SVG export, frame option, keyboard navigation, alt text

## Phase Details

### Phase 1: Foundation & Determinism Infrastructure
**Goal**: The determinism contract and project skeleton are established so all subsequent code inherits correctness by default
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CANON-01, CANON-02, CANON-03, CANON-04, CANON-05, DS-01, DS-02, DS-03, DS-04
**Success Criteria** (what must be TRUE):
  1. Running the same text input through canonicalization and hashing produces identical output across multiple invocations
  2. ESLint fails the build if Math.random() appears anywhere in lib/render/ or lib/pipeline/ directories
  3. The app renders in dark mode by default, switches to light mode via toggle, and persists the user's preference across sessions
  4. All four canonicalizers (text, JSON, CSV, URL) produce stable output for edge-case inputs (Unicode, empty, whitespace-only, special characters)
  5. Engine version object (analyzerVersion, normalizerVersion, rendererVersion, engineVersion) is available and can be displayed
**Plans**: TBD

Plans:
- [x] 01-01: Project scaffold and toolchain
- [x] 01-02: Determinism infrastructure (PRNG, hashing, versioning, ESLint rule)
- [x] 01-03: Input canonicalization suite
- [x] 01-04: Design system and responsive layout shell

### Phase 2: Parameter System & Color
**Goal**: Any analysis output can be mapped to a universal 15-dimension parameter vector with calibrated normalization and perceptually coherent color palettes
**Depends on**: Phase 1
**Requirements**: PARAM-01, PARAM-02, PARAM-03, PARAM-04, PARAM-05, COLOR-01, COLOR-02, COLOR-03, COLOR-04
**Success Criteria** (what must be TRUE):
  1. A mock analysis output normalizes to a 15-dimension vector where all values fall in the 0-1 range
  2. Running the calibration harness against 30+ reference text inputs produces parameter distribution histograms with no dimension having more than 50% of values in any 0.2-wide band
  3. Generated palettes use OKLCH color space, reject near-duplicate colors, and maintain readable contrast against both dark and light backgrounds
  4. Every parameter carries provenance metadata showing contributing signals, weights, and a plain-English explanation
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Quantile normalization engine, weighted-blend parameter mapping, provenance generation (Wave 1)
- [x] 02-02-PLAN.md — Calibration reference corpus (35+ texts), distribution quality gate, version-corpus coupling (Wave 2)
- [x] 02-03-PLAN.md — OKLCH palette generation with harmony, near-duplicate rejection, dual lightness profiles (Wave 1)

### Phase 3: Text Analysis & Input UI
**Goal**: Users can type or paste text and see it flow through the analysis pipeline with real-time feedback
**Depends on**: Phase 2
**Requirements**: TEXT-01, TEXT-02, TEXT-03, TEXT-04, TEXT-05, TEXT-06, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-16, UI-17, UI-18
**Success Criteria** (what must be TRUE):
  1. User can type text into a prominent input zone and click Generate to trigger the analysis pipeline
  2. Text analysis extracts character frequency, sentiment, entropy, syllable patterns, and vocabulary richness in under 500ms for inputs up to 10,000 characters
  3. Input zone shows tabs for Text, URL, and Data (URL and Data are placeholder/disabled until Phase 6)
  4. Quick-start buttons ("Try: your name / a haiku / a recipe") and "Surprise me" insert text and trigger generation
  5. A staged progress bar shows real pipeline stages (Parsing, Analyzing, Normalizing, Rendering) tied to actual progress
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Text analyzer with AFINN-165 sentiment, syllable counting, all 31 signals, calibration update (Wave 1, TDD)
- [ ] 03-02-PLAN.md — Input zone UI with tabs, pipeline hook, page transition, parameter panel, placeholder canvas, progress indicator (Wave 2)
- [ ] 03-03-PLAN.md — Quick-start buttons, Surprise me with curated phrase pool, end-to-end verification checkpoint (Wave 3)

### Phase 4: Geometric Renderer & Canvas UI
**Goal**: Users see their text transformed into a geometric artwork with a full translation panel explaining every parameter
**Depends on**: Phase 3
**Requirements**: GEOM-01, GEOM-02, GEOM-03, GEOM-04, GEOM-05, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13, UI-14, UI-15
**Success Criteria** (what must be TRUE):
  1. Text input produces a geometric composition of rectangles, circles, triangles, and lines on an 800x800 canvas that respects all composition laws (minimum element size, padding, stroke weight limits)
  2. The same text input always produces the identical artwork (deterministic rendering verified by visual snapshot tests)
  3. Canvas builds progressively over 0.5-1 seconds with elements appearing incrementally (renders complete immediately when prefers-reduced-motion is set)
  4. Translation panel displays all 15 parameters as labeled bars with numeric values, grouped by source signal, with plain-English explanations and engine version
  5. Rendering completes in under 1 second at 800x800 resolution
**Plans**: TBD

Plans:
- [ ] 04-01: Geometric renderer with composition laws
- [ ] 04-02: Canvas display and progressive building animation
- [ ] 04-03: Translation panel UI

### Phase 5: Additional Renderers
**Goal**: Users can view their input in four distinct visual styles and compare them via thumbnail previews
**Depends on**: Phase 4
**Requirements**: ORGN-01, ORGN-02, ORGN-03, ORGN-04, PTCL-01, PTCL-02, PTCL-03, PTCL-04, PTCL-05, TYPO-01, TYPO-02, TYPO-03, TYPO-04
**Success Criteria** (what must be TRUE):
  1. Organic style renders flowing curves and gradient fields using Perlin/simplex noise with 2-6 octaves and a dominant flow direction
  2. Particle style renders force-directed particle arrangements capped at 2,000 on mobile and 10,000 on desktop, with visible clustering and negative space
  3. Typographic style renders input text as visual medium (text/URL inputs only) with 3 most prominent words fully readable and controlled overlap
  4. Style selector shows 4 real thumbnail previews (200x200) rendered from the same parameter vector, and switching styles re-renders the main canvas
  5. Particle idle animation respects prefers-reduced-motion (static when reduced motion preferred)
**Plans**: TBD

Plans:
- [ ] 05-01: Organic renderer (Perlin noise, flow fields)
- [ ] 05-02: Particle renderer (force-directed, mobile caps)
- [ ] 05-03: Typographic renderer (text as visual medium)
- [ ] 05-04: Style selector with live mini-preview thumbnails

### Phase 6: URL & Data Input
**Goal**: Users can analyze URLs and structured data (CSV/JSON) as input to the art pipeline, with security protections in place
**Depends on**: Phase 2, Phase 4
**Requirements**: URL-01, URL-02, URL-03, URL-04, URL-05, URL-06, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. User can enter a URL and receive generated artwork based on scraped page content, title, link density, and metadata within 5 seconds
  2. SSRF protection blocks private IP ranges, internal hostnames, and non-http(s) schemes; DNS is resolved before connecting; requests timeout at 10 seconds with 5MB limit
  3. URL snapshot mode caches results by default; user can opt into live mode or explicitly re-fetch
  4. User can upload CSV/JSON files or paste raw data and receive artwork based on statistical analysis (distributions, correlations, cardinality) within 2 seconds
  5. URL analysis is rate-limited to 10 per IP per hour with remaining quota visible in the UI
**Plans**: TBD

Plans:
- [ ] 06-01: SSRF protection and URL fetch infrastructure
- [ ] 06-02: URL analyzer (scraping, content extraction, metadata)
- [ ] 06-03: Data analyzer (CSV/JSON parsing, statistical features)
- [ ] 06-04: Calibration harness expansion (URL + data reference inputs)

### Phase 7: Database, Sharing & Privacy
**Goal**: Users can share their artwork via permanent links and the system enforces privacy-by-default with no raw input ever stored server-side
**Depends on**: Phase 4
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, SHARE-01, SHARE-02, SHARE-03, PRIV-01, PRIV-02, PRIV-03, PRIV-04, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. PostgreSQL database stores gallery items, cached analyses, URL snapshots, and share links with proper indexing
  2. User can generate a share link (random UUID) that stores only parameter vector, version info, and style -- never raw input
  3. Share link recipient sees artwork and translation panel but never the original input text
  4. Generating artwork is private and ephemeral by default; nothing is published or stored without explicit user action
  5. Local-only mode for text input runs analysis entirely client-side with no server requests, indicated by a lock icon
**Plans**: TBD

Plans:
- [ ] 07-01: PostgreSQL schema and Drizzle ORM setup
- [ ] 07-02: Caching infrastructure (analysis, render, URL snapshot caches)
- [ ] 07-03: Share link generation and resolution
- [ ] 07-04: Privacy model and local-only mode

### Phase 8: Gallery & Compare
**Goal**: Users can browse, save, and compare artwork in a public gallery with moderation controls
**Depends on**: Phase 7
**Requirements**: GAL-01, GAL-02, GAL-03, GAL-04, GAL-05, GAL-06, GAL-07, GAL-08, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. User can opt-in to save artwork to the gallery with preview of public-facing content (thumbnail, input preview, title, style) and can edit or remove input preview before saving
  2. Gallery page displays thumbnails with style, date, and optional title; input preview is hidden by default with "click to reveal"
  3. User can filter gallery by style, sort by recent or popular, click any card to view full size with translation panel, and delete their own entries
  4. Compare mode shows two inputs side-by-side in the same style with parallel parameter bars, visual diff highlighting, and auto-generated difference summary
  5. Report button exists on every gallery item; items with 3+ reports are flagged; profanity filter catches abusive titles
**Plans**: TBD

Plans:
- [ ] 08-01: Gallery save flow (opt-in, preview, edit)
- [ ] 08-02: Gallery browse page (filter, sort, pagination)
- [ ] 08-03: Compare mode (side-by-side rendering and parameter diff)
- [ ] 08-04: Moderation (report, profanity filter, admin review)

### Phase 9: Export & Accessibility
**Goal**: Users can download publication-quality artwork and the entire application is fully accessible
**Depends on**: Phase 5, Phase 7
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):
  1. User can download high-resolution PNG (4096x4096) re-rendered server-side in under 3 seconds
  2. User can download SVG export for Geometric and Typographic styles
  3. Frame toggle adds/removes a subtle border matte for exports (on by default for exports, off for in-app display)
  4. All interactive elements are fully keyboard-navigable; canvas has auto-generated alt text as aria-label; parameter bars use labels and numeric values, not color alone
  5. prefers-reduced-motion is respected everywhere: no particle animation, no progressive building, no hover transitions
**Plans**: TBD

Plans:
- [ ] 09-01: Server-side high-resolution PNG export (node-canvas)
- [ ] 09-02: SVG export for vector styles
- [ ] 09-03: Frame option for exports
- [ ] 09-04: Accessibility audit and implementation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Determinism Infrastructure | 4/4 | Complete | 2026-03-02 |
| 2. Parameter System & Color | 3/3 | Complete | 2026-03-03 |
| 3. Text Analysis & Input UI | 1/3 | In progress | - |
| 4. Geometric Renderer & Canvas UI | 0/3 | Not started | - |
| 5. Additional Renderers | 0/4 | Not started | - |
| 6. URL & Data Input | 0/4 | Not started | - |
| 7. Database, Sharing & Privacy | 0/4 | Not started | - |
| 8. Gallery & Compare | 0/4 | Not started | - |
| 9. Export & Accessibility | 0/4 | Not started | - |
