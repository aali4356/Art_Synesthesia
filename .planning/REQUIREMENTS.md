# Requirements: Synesthesia Machine

**Defined:** 2026-03-02
**Core Value:** Any input deterministically produces beautiful, unique artwork with fully transparent translation rules

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Engine

- [ ] **CORE-01**: System produces identical parameter vectors for identical canonicalized inputs across runs
- [ ] **CORE-02**: All rendering randomness uses seeded PRNG (seedrandom/Alea), never Math.random()
- [ ] **CORE-03**: PRNG seed derives from SHA-256(canonicalized_input + styleName + engineVersion)
- [ ] **CORE-04**: Engine versioning tracks analyzerVersion, normalizerVersion, rendererVersion, engineVersion independently
- [ ] **CORE-05**: Cache keys include inputHash + analyzerVersion + normalizerVersion for analysis results
- [ ] **CORE-06**: Render cache keys include inputHash + all versions + styleName + resolution
- [ ] **CORE-07**: ESLint rule bans Math.random() in all rendering and analysis code paths

### Input Canonicalization

- [ ] **CANON-01**: Text input normalized via Unicode NFC, newline normalization (\\r\\n and \\r to \\n), trailing whitespace trimmed per line
- [ ] **CANON-02**: JSON input parsed and re-serialized with stable alphabetical key ordering, normalized number formatting
- [ ] **CANON-03**: CSV input parsed with explicit rules (comma delimiter, double-quote escaping, UTF-8), cell whitespace trimmed, empty cells normalized to null
- [ ] **CANON-04**: URL input normalized: lowercase scheme/host, remove default ports, sort query params alphabetically, remove trailing slashes and fragments
- [ ] **CANON-05**: Canonicalization changes displayed in translation panel when applied

### Text Analysis

- [x] **TEXT-01**: User can enter any text (single word to multiple paragraphs) and receive generated artwork
- [x] **TEXT-02**: Text analyzer extracts character frequency distribution, word count, average word length, sentence count, average sentence length
- [x] **TEXT-03**: Text analyzer computes vocabulary richness (unique words / total words)
- [x] **TEXT-04**: Text analyzer computes sentiment polarity and magnitude via lexicon-based method (AFINN-165 or equivalent)
- [x] **TEXT-05**: Text analyzer computes punctuation density, syllable pattern variance, character entropy (Shannon), uppercase ratio
- [x] **TEXT-06**: Analysis completes in under 500ms for inputs up to 10,000 characters

### URL Analysis

- [ ] **URL-01**: User can enter a URL and receive generated artwork based on page content
- [ ] **URL-02**: URL analyzer extracts page title, main text content, dominant colors from CSS/styles, link density, content-to-HTML ratio
- [ ] **URL-03**: URL snapshot mode (default) stores parameters and content fingerprint; subsequent requests return stored result
- [ ] **URL-04**: URL live mode (opt-in) always fetches fresh content with warning that art may change
- [ ] **URL-05**: User can explicitly re-fetch a snapshot to create a new one
- [ ] **URL-06**: URL analysis completes in under 5 seconds including fetch

### Data Analysis

- [ ] **DATA-01**: User can upload CSV or JSON files or paste raw data to receive generated artwork
- [ ] **DATA-02**: Data analyzer computes column/key count, row count, numeric column distributions (mean, variance, skew, kurtosis)
- [ ] **DATA-03**: Data analyzer computes null/missing ratio, correlation strength between numeric columns, categorical cardinality
- [ ] **DATA-04**: Data analyzer identifies data type mix (numeric vs string vs date proportions)
- [ ] **DATA-05**: Data analysis completes in under 2 seconds for CSVs up to 10,000 rows

### Parameter System

- [x] **PARAM-01**: All input types produce a normalized parameter vector of ~15 fixed dimensions (complexity, warmth, symmetry, rhythm, energy, density, scaleVariation, curvature, saturation, contrast, layering, directionality, paletteSize, texture, regularity)
- [x] **PARAM-02**: All parameter values normalized to 0-1 range using quantile-based scaling against calibration dataset
- [x] **PARAM-03**: Calibration harness includes 30+ text, 15+ URL, and 15+ data reference inputs *(Text corpus complete: 44 entries. URL/data corpus deferred to Phase 6 when those analyzers are built.)*
- [x] **PARAM-04**: Parameter provenance tracks contributing signals with weights and plain-English explanations per parameter
- [x] **PARAM-05**: Calibration distributions stored as part of normalizer version; updating calibration bumps version

### Rendering — Geometric

- [x] **GEOM-01**: Geometric style renders grid-based compositions using rectangles, circles, triangles, and lines
- [x] **GEOM-02**: Composition law: minimum element size never thinner than 4px; at high density, reduce grid count rather than element size
- [x] **GEOM-03**: Composition law: minimum 2% padding between composition edge and frame
- [x] **GEOM-04**: Composition law: all strokes use at most 2 different weights (primary and secondary)
- [x] **GEOM-05**: Canvas rendering completes in under 1 second at 800x800

### Rendering — Organic

- [ ] **ORGN-01**: Organic style renders flowing curves, blob shapes, and gradient fields using Perlin/simplex noise
- [ ] **ORGN-02**: Composition law: minimum 2 octaves of noise, maximum 6
- [ ] **ORGN-03**: Composition law: maximum 5 overlapping transparent layers; beyond that, reduce opacity
- [ ] **ORGN-04**: Composition law: flow fields must have a dominant direction set by directionality parameter

### Rendering — Particle

- [ ] **PTCL-01**: Particle style renders thousands of small elements arranged by force-directed or physics-based rules
- [ ] **PTCL-02**: Composition law: max 2,000 particles on mobile (viewport width detection), max 10,000 on desktop
- [ ] **PTCL-03**: Composition law: particles form at least 2 visible clusters or flows; uniform random scatter prohibited
- [ ] **PTCL-04**: Composition law: at least 15% canvas area is empty/negative space unless density > 0.85
- [ ] **PTCL-05**: Subtle idle animation (slow drift) respects prefers-reduced-motion; renders static when reduced motion preferred

### Rendering — Typographic

- [ ] **TYPO-01**: Typographic style uses input text as the visual medium (only for text and URL inputs)
- [ ] **TYPO-02**: Composition law: 3 most prominent words fully readable (no rotation >15 degrees, minimum 16px font)
- [ ] **TYPO-03**: Composition law: maximum 30% of words rotated beyond 10 degrees
- [ ] **TYPO-04**: Composition law: words overlap only if opacity below 0.4; full-opacity words never overlap

### Palette & Color

- [x] **COLOR-01**: Palettes generated in perceptual color space (OKLCH) with perceptual adjustments
- [x] **COLOR-02**: Palette coherence function rejects near-duplicate colors (deltaE < 10 in LAB space), shifting hue by minimum viable amount
- [x] **COLOR-03**: Sufficient contrast ensured against dark backgrounds in dark mode and white in light mode
- [x] **COLOR-04**: Saturation and contrast parameters modulate palette but never to unreadable output

### UI — Input

- [x] **UI-01**: Large, prominent input zone with tab selector for input type (Text, URL, Data)
- [x] **UI-02**: Text tab: textarea with placeholder "Paste anything. A name, a paragraph, a poem, a recipe..."
- [x] **UI-03**: URL tab: single input field with "Analyze" button *(tab rendered, disabled until Phase 6)*
- [x] **UI-04**: Data tab: file drop zone accepting .csv and .json, plus textarea for pasting raw data *(tab rendered, disabled until Phase 6)*
- [x] **UI-05**: Prominent "Generate" button with satisfying click feedback
- [x] **UI-06**: Private mode toggle with lock icon

### UI — Canvas & Styles

- [x] **UI-07**: Large rendering canvas (minimum 800x800 on desktop, full-width on mobile)
- [x] **UI-08**: Style selector: row of real thumbnail previews (200x200) rendered from same parameters
- [x] **UI-09**: Canvas builds progressively (elements appear over 0.5-1 second, not instant)
- [x] **UI-10**: Progressive building respects prefers-reduced-motion (renders complete immediately when preferred)

### UI — Translation Panel

- [x] **UI-11**: Collapsible panel (expanded on desktop, collapsed on mobile)
- [x] **UI-12**: Each parameter displayed as labeled bar (0-1) with numeric value
- [x] **UI-13**: Parameters grouped by source with top contributing signals and weights shown
- [x] **UI-14**: Brief plain-English explanation per parameter
- [x] **UI-15**: Engine version displayed at bottom of panel

### UI — Quick Start & Progress

- [x] **UI-16**: Quick-start buttons below input: "Try: your name / a haiku / a recipe / a random Wikipedia paragraph"
- [x] **UI-17**: "Surprise me" button generates random interesting phrase client-side
- [x] **UI-18**: Staged progress bar tied to real pipeline stages (Parsing, Analyzing, Normalizing, Rendering)

### Export

- [ ] **EXPORT-01**: User can download artwork as high-resolution PNG (4096x4096, re-rendered server-side)
- [ ] **EXPORT-02**: User can download artwork as SVG for Geometric and Typographic styles
- [ ] **EXPORT-03**: Frame toggle adds/removes subtle border matte (8-16px margin) for exports
- [ ] **EXPORT-04**: Frame on by default for exports, off for in-app display
- [ ] **EXPORT-05**: Server-side export rendering completes in under 3 seconds at 4096x4096

### Sharing

- [x] **SHARE-01**: User can generate share link with random UUID; link stores only parameter vector, version info, and style
- [x] **SHARE-02**: Share link recipient sees artwork, parameter panel, and metadata but NOT original input text
- [x] **SHARE-03**: Original input only shown to creator if they have the generation in their session

### Gallery

- [x] **GAL-01**: "Save to Gallery" is explicit opt-in with preview of what will be public (thumbnail, input preview first 50 chars, title, style)
- [x] **GAL-02**: User can edit or remove input preview before saving
- [x] **GAL-03**: Gallery page shows thumbnails with style name, date, optional title
- [x] **GAL-04**: Input preview hidden by default in gallery cards ("click to reveal")
- [x] **GAL-05**: User can filter gallery by style and sort by recent or popular (upvote count)
- [x] **GAL-06**: User can click gallery card to view full size with translation panel
- [x] **GAL-07**: Report button on every gallery item
- [x] **GAL-08**: User can delete their own gallery entries

### Compare Mode

- [x] **COMP-01**: User can enter two inputs and see their art side by side in same style
- [x] **COMP-02**: Parameter vectors displayed in parallel with visual diff highlighting
- [x] **COMP-03**: Auto-generated difference summary: "These differ most in rhythm (+0.43) and warmth (-0.31)"
- [x] **COMP-04**: Style selector changes both artworks simultaneously

### Privacy & Security

- [x] **PRIV-01**: Generating art does not publish anything; it is local and ephemeral
- [x] **PRIV-02**: Raw input text never logged server-side beyond duration of analysis request
- [x] **PRIV-03**: Gallery entries store parameters, metadata, version info, thumbnail, optional title — NOT raw input
- [x] **PRIV-04**: Local-only mode for text: analysis runs client-side, no server requests except initial page load, lock icon indicator
- [ ] **SEC-01**: SSRF protection: block private IP ranges, internal hostnames, restrict to http/https, resolve DNS before connecting
- [ ] **SEC-02**: URL fetch limits: 10-second timeout, 5MB max response, max 3 redirects, strip cookies/auth headers
- [ ] **SEC-03**: Rate limiting: max 10 URL analyses per IP per hour with remaining quota shown in UI
- [x] **SEC-04**: Gallery rate limiting: max 10 saves per IP per day
- [x] **SEC-05**: Profanity/abuse filter on gallery titles and visible input previews
- [x] **SEC-06**: Gallery items flagged for review after 3 reports; admin route to review and remove

### Accessibility

- [ ] **A11Y-01**: Auto-generated alt text from parameters set as aria-label on canvas and included in PNG metadata
- [ ] **A11Y-02**: Full keyboard navigation for all interactive elements (tabs, style selector, panels, buttons, gallery cards)
- [ ] **A11Y-03**: prefers-reduced-motion respected: no particle animation, no progressive building, no hover transitions
- [ ] **A11Y-04**: Parameter bars use labels and numeric values, not color alone; style thumbnails include text labels

### Design System

- [ ] **DS-01**: Dark mode default with light mode toggle; respect system preference on first visit, persist user choice
- [ ] **DS-02**: Minimal chrome: artwork is the hero element
- [ ] **DS-03**: Monospace font for parameter panel and technical elements; clean sans-serif for UI text
- [ ] **DS-04**: Responsive: on mobile, input stacks above canvas; translation panel becomes bottom sheet; style selector becomes horizontal scroll

### Infrastructure

- [x] **INFRA-01**: PostgreSQL database via Drizzle ORM for gallery, cached analyses, version tracking
- [x] **INFRA-02**: Analysis cache keyed by inputHash + versions with 7-day TTL for anonymous, permanent for gallery
- [x] **INFRA-03**: Render cache keyed by full version + style + resolution with 24h TTL for thumbnails, 7 days for full renders
- [x] **INFRA-04**: URL snapshot cache keyed by canonicalizedUrl + timestamp, permanent until re-fetch

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Stretch Goals

- **STRETCH-01**: Song title input type via lyrics/music metadata API
- **STRETCH-02**: Abstract Landscape rendering style (horizontal layers suggesting landscape)
- **STRETCH-03**: Animated renders with subtle drift in particle/organic styles (respects reduced motion)
- **STRETCH-04**: Public API endpoint for external embedding
- **STRETCH-05**: "Artwork of the Day" featured on gallery
- **STRETCH-06**: Version toggle on saved pieces ("View in v1 / v2")
- **STRETCH-07**: Admin dashboard for moderation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / OAuth login | Auth complexity, GDPR obligations — share links serve the use case without accounts |
| Real-time collaboration / multiplayer | WebSocket infrastructure, conflict resolution — massive complexity for solo portfolio project |
| AI-powered style transfer | ML model serving costs, makes system non-deterministic, undermines transparent-algorithm value proposition |
| User-uploaded custom rendering styles | Sandboxing user code, XSS risk, turns app into a platform |
| Animated / video exports | Video encoding cost, frame timing determinism challenges |
| NFT minting / blockchain | Wallet complexity, not aligned with portfolio goals, alienates users |
| Infinite canvas / zoom | Requires tile-based rendering, fundamentally different architecture |
| Social features (comments, likes, follows) | Full social platform scope explosion — gallery + external sharing covers v1 |
| Undo / version history | Input IS the version; change input, get new art |
| Image input (photo upload) | Computer vision pipeline doubles engineering surface area |
| Mobile native app | Web-first; mobile browser is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| CORE-07 | Phase 1 | Pending |
| CANON-01 | Phase 1 | Pending |
| CANON-02 | Phase 1 | Pending |
| CANON-03 | Phase 1 | Pending |
| CANON-04 | Phase 1 | Pending |
| CANON-05 | Phase 1 | Pending |
| DS-01 | Phase 1 | Pending |
| DS-02 | Phase 1 | Pending |
| DS-03 | Phase 1 | Pending |
| DS-04 | Phase 1 | Pending |
| PARAM-01 | Phase 2 | Complete |
| PARAM-02 | Phase 2 | Complete |
| PARAM-03 | Phase 2 | Partial (text done; URL/data deferred to Phase 6) |
| PARAM-04 | Phase 2 | Complete |
| PARAM-05 | Phase 2 | Complete |
| COLOR-01 | Phase 2 | Complete |
| COLOR-02 | Phase 2 | Complete |
| COLOR-03 | Phase 2 | Complete |
| COLOR-04 | Phase 2 | Complete |
| TEXT-01 | Phase 3 | Pending |
| TEXT-02 | Phase 3 | Pending |
| TEXT-03 | Phase 3 | Pending |
| TEXT-04 | Phase 3 | Pending |
| TEXT-05 | Phase 3 | Pending |
| TEXT-06 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-16 | Phase 3 | Pending |
| UI-17 | Phase 3 | Pending |
| UI-18 | Phase 3 | Pending |
| GEOM-01 | Phase 4 | Complete |
| GEOM-02 | Phase 4 | Complete |
| GEOM-03 | Phase 4 | Complete |
| GEOM-04 | Phase 4 | Complete |
| GEOM-05 | Phase 4 | Complete |
| UI-07 | Phase 4 | Complete |
| UI-08 | Phase 4 | Complete |
| UI-09 | Phase 4 | Complete |
| UI-10 | Phase 4 | Complete |
| UI-11 | Phase 4 | Complete |
| UI-12 | Phase 4 | Complete |
| UI-13 | Phase 4 | Complete |
| UI-14 | Phase 4 | Complete |
| UI-15 | Phase 4 | Complete |
| ORGN-01 | Phase 5 | Pending |
| ORGN-02 | Phase 5 | Pending |
| ORGN-03 | Phase 5 | Pending |
| ORGN-04 | Phase 5 | Pending |
| PTCL-01 | Phase 5 | Pending |
| PTCL-02 | Phase 5 | Pending |
| PTCL-03 | Phase 5 | Pending |
| PTCL-04 | Phase 5 | Pending |
| PTCL-05 | Phase 5 | Pending |
| TYPO-01 | Phase 5 | Pending |
| TYPO-02 | Phase 5 | Pending |
| TYPO-03 | Phase 5 | Pending |
| TYPO-04 | Phase 5 | Pending |
| URL-01 | Phase 6 | Pending |
| URL-02 | Phase 6 | Pending |
| URL-03 | Phase 6 | Pending |
| URL-04 | Phase 6 | Pending |
| URL-05 | Phase 6 | Pending |
| URL-06 | Phase 6 | Pending |
| DATA-01 | Phase 6 | Pending |
| DATA-02 | Phase 6 | Pending |
| DATA-03 | Phase 6 | Pending |
| DATA-04 | Phase 6 | Pending |
| DATA-05 | Phase 6 | Pending |
| SEC-01 | Phase 6 | Pending |
| SEC-02 | Phase 6 | Pending |
| SEC-03 | Phase 6 | Pending |
| INFRA-01 | Phase 7 | Complete |
| INFRA-02 | Phase 7 | Complete |
| INFRA-03 | Phase 7 | Complete |
| INFRA-04 | Phase 7 | Complete |
| SHARE-01 | Phase 7 | Complete |
| SHARE-02 | Phase 7 | Complete |
| SHARE-03 | Phase 7 | Complete |
| PRIV-01 | Phase 7 | Complete |
| PRIV-02 | Phase 7 | Complete |
| PRIV-03 | Phase 7 | Complete |
| PRIV-04 | Phase 7 | Complete |
| SEC-04 | Phase 7 | Complete |
| SEC-05 | Phase 7 | Complete |
| SEC-06 | Phase 7 | Complete |
| GAL-01 | Phase 8 | Complete |
| GAL-02 | Phase 8 | Complete |
| GAL-03 | Phase 8 | Complete |
| GAL-04 | Phase 8 | Complete |
| GAL-05 | Phase 8 | Complete |
| GAL-06 | Phase 8 | Complete |
| GAL-07 | Phase 8 | Complete |
| GAL-08 | Phase 8 | Complete |
| COMP-01 | Phase 8 | Complete |
| COMP-02 | Phase 8 | Complete |
| COMP-03 | Phase 8 | Complete |
| COMP-04 | Phase 8 | Complete |
| EXPORT-01 | Phase 9 | Pending |
| EXPORT-02 | Phase 9 | Pending |
| EXPORT-03 | Phase 9 | Pending |
| EXPORT-04 | Phase 9 | Pending |
| EXPORT-05 | Phase 9 | Pending |
| A11Y-01 | Phase 9 | Pending |
| A11Y-02 | Phase 9 | Pending |
| A11Y-03 | Phase 9 | Pending |
| A11Y-04 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 116 total
- Mapped to phases: 116
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
