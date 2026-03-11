# Requirements

## Active

### CORE-01 — System produces identical parameter vectors for identical canonicalized inputs across runs

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

System produces identical parameter vectors for identical canonicalized inputs across runs

### CORE-02 — All rendering randomness uses seeded PRNG (seedrandom/Alea), never Math.random()

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All rendering randomness uses seeded PRNG (seedrandom/Alea), never Math.random()

### CORE-03 — PRNG seed derives from SHA-256(canonicalized_input + styleName + engineVersion)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

PRNG seed derives from SHA-256(canonicalized_input + styleName + engineVersion)

### CORE-04 — Engine versioning tracks analyzerVersion, normalizerVersion, rendererVersion, engineVersion independently

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Engine versioning tracks analyzerVersion, normalizerVersion, rendererVersion, engineVersion independently

### CORE-05 — Cache keys include inputHash + analyzerVersion + normalizerVersion for analysis results

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Cache keys include inputHash + analyzerVersion + normalizerVersion for analysis results

### CORE-06 — Render cache keys include inputHash + all versions + styleName + resolution

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Render cache keys include inputHash + all versions + styleName + resolution

### CORE-07 — ESLint rule bans Math.random() in all rendering and analysis code paths

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

ESLint rule bans Math.random() in all rendering and analysis code paths

### CANON-01 — Text input normalized via Unicode NFC, newline normalization (\\r\\n and \\r to \\n), trailing whitespace trimmed per line

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text input normalized via Unicode NFC, newline normalization (\\r\\n and \\r to \\n), trailing whitespace trimmed per line

### CANON-02 — JSON input parsed and re-serialized with stable alphabetical key ordering, normalized number formatting

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

JSON input parsed and re-serialized with stable alphabetical key ordering, normalized number formatting

### CANON-03 — CSV input parsed with explicit rules (comma delimiter, double-quote escaping, UTF-8), cell whitespace trimmed, empty cells normalized to null

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

CSV input parsed with explicit rules (comma delimiter, double-quote escaping, UTF-8), cell whitespace trimmed, empty cells normalized to null

### CANON-04 — URL input normalized: lowercase scheme/host, remove default ports, sort query params alphabetically, remove trailing slashes and fragments

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL input normalized: lowercase scheme/host, remove default ports, sort query params alphabetically, remove trailing slashes and fragments

### CANON-05 — Canonicalization changes displayed in translation panel when applied

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Canonicalization changes displayed in translation panel when applied

### URL-01 — User can enter a URL and receive generated artwork based on page content

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can enter a URL and receive generated artwork based on page content

### URL-02 — URL analyzer extracts page title, main text content, dominant colors from CSS/styles, link density, content-to-HTML ratio

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL analyzer extracts page title, main text content, dominant colors from CSS/styles, link density, content-to-HTML ratio

### URL-03 — URL snapshot mode (default) stores parameters and content fingerprint; subsequent requests return stored result

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL snapshot mode (default) stores parameters and content fingerprint; subsequent requests return stored result

### URL-04 — URL live mode (opt-in) always fetches fresh content with warning that art may change

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL live mode (opt-in) always fetches fresh content with warning that art may change

### URL-05 — User can explicitly re-fetch a snapshot to create a new one

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can explicitly re-fetch a snapshot to create a new one

### URL-06 — URL analysis completes in under 5 seconds including fetch

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL analysis completes in under 5 seconds including fetch

### DATA-01 — User can upload CSV or JSON files or paste raw data to receive generated artwork

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can upload CSV or JSON files or paste raw data to receive generated artwork

### DATA-02 — Data analyzer computes column/key count, row count, numeric column distributions (mean, variance, skew, kurtosis)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Data analyzer computes column/key count, row count, numeric column distributions (mean, variance, skew, kurtosis)

### DATA-03 — Data analyzer computes null/missing ratio, correlation strength between numeric columns, categorical cardinality

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Data analyzer computes null/missing ratio, correlation strength between numeric columns, categorical cardinality

### DATA-04 — Data analyzer identifies data type mix (numeric vs string vs date proportions)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Data analyzer identifies data type mix (numeric vs string vs date proportions)

### DATA-05 — Data analysis completes in under 2 seconds for CSVs up to 10,000 rows

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Data analysis completes in under 2 seconds for CSVs up to 10,000 rows

### ORGN-01 — Organic style renders flowing curves, blob shapes, and gradient fields using Perlin/simplex noise

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Organic style renders flowing curves, blob shapes, and gradient fields using Perlin/simplex noise

### ORGN-02 — Composition law: minimum 2 octaves of noise, maximum 6

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: minimum 2 octaves of noise, maximum 6

### ORGN-03 — Composition law: maximum 5 overlapping transparent layers; beyond that, reduce opacity

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: maximum 5 overlapping transparent layers; beyond that, reduce opacity

### ORGN-04 — Composition law: flow fields must have a dominant direction set by directionality parameter

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: flow fields must have a dominant direction set by directionality parameter

### PTCL-01 — Particle style renders thousands of small elements arranged by force-directed or physics-based rules

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Particle style renders thousands of small elements arranged by force-directed or physics-based rules

### PTCL-02 — Composition law: max 2,000 particles on mobile (viewport width detection), max 10,000 on desktop

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: max 2,000 particles on mobile (viewport width detection), max 10,000 on desktop

### PTCL-03 — Composition law: particles form at least 2 visible clusters or flows; uniform random scatter prohibited

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: particles form at least 2 visible clusters or flows; uniform random scatter prohibited

### PTCL-04 — Composition law: at least 15% canvas area is empty/negative space unless density > 0.85

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: at least 15% canvas area is empty/negative space unless density > 0.85

### PTCL-05 — Subtle idle animation (slow drift) respects prefers-reduced-motion; renders static when reduced motion preferred

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Subtle idle animation (slow drift) respects prefers-reduced-motion; renders static when reduced motion preferred

### TYPO-01 — Typographic style uses input text as the visual medium (only for text and URL inputs)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Typographic style uses input text as the visual medium (only for text and URL inputs)

### TYPO-02 — Composition law: 3 most prominent words fully readable (no rotation >15 degrees, minimum 16px font)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: 3 most prominent words fully readable (no rotation >15 degrees, minimum 16px font)

### TYPO-03 — Composition law: maximum 30% of words rotated beyond 10 degrees

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: maximum 30% of words rotated beyond 10 degrees

### TYPO-04 — Composition law: words overlap only if opacity below 0.4; full-opacity words never overlap

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: words overlap only if opacity below 0.4; full-opacity words never overlap

### EXPORT-01 — User can download artwork as high-resolution PNG (4096x4096, re-rendered server-side)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can download artwork as high-resolution PNG (4096x4096, re-rendered server-side)

### EXPORT-02 — User can download artwork as SVG for Geometric and Typographic styles

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can download artwork as SVG for Geometric and Typographic styles

### EXPORT-03 — Frame toggle adds/removes subtle border matte (8-16px margin) for exports

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Frame toggle adds/removes subtle border matte (8-16px margin) for exports

### EXPORT-04 — Frame on by default for exports, off for in-app display

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Frame on by default for exports, off for in-app display

### EXPORT-05 — Server-side export rendering completes in under 3 seconds at 4096x4096

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Server-side export rendering completes in under 3 seconds at 4096x4096

### SEC-01 — SSRF protection: block private IP ranges, internal hostnames, restrict to http/https, resolve DNS before connecting

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SSRF protection: block private IP ranges, internal hostnames, restrict to http/https, resolve DNS before connecting

### SEC-02 — URL fetch limits: 10-second timeout, 5MB max response, max 3 redirects, strip cookies/auth headers

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL fetch limits: 10-second timeout, 5MB max response, max 3 redirects, strip cookies/auth headers

### SEC-03 — Rate limiting: max 10 URL analyses per IP per hour with remaining quota shown in UI

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Rate limiting: max 10 URL analyses per IP per hour with remaining quota shown in UI

### A11Y-01 — Auto-generated alt text from parameters set as aria-label on canvas and included in PNG metadata

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Auto-generated alt text from parameters set as aria-label on canvas and included in PNG metadata

### A11Y-02 — Full keyboard navigation for all interactive elements (tabs, style selector, panels, buttons, gallery cards)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Full keyboard navigation for all interactive elements (tabs, style selector, panels, buttons, gallery cards)

### A11Y-03 — prefers-reduced-motion respected: no particle animation, no progressive building, no hover transitions

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

prefers-reduced-motion respected: no particle animation, no progressive building, no hover transitions

### A11Y-04 — Parameter bars use labels and numeric values, not color alone; style thumbnails include text labels

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Parameter bars use labels and numeric values, not color alone; style thumbnails include text labels

### DS-01 — Dark mode default with light mode toggle; respect system preference on first visit, persist user choice

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dark mode default with light mode toggle; respect system preference on first visit, persist user choice

### DS-02 — Minimal chrome: artwork is the hero element

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Minimal chrome: artwork is the hero element

### DS-03 — Monospace font for parameter panel and technical elements; clean sans-serif for UI text

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Monospace font for parameter panel and technical elements; clean sans-serif for UI text

### DS-04 — Responsive: on mobile, input stacks above canvas; translation panel becomes bottom sheet; style selector becomes horizontal scroll

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Responsive: on mobile, input stacks above canvas; translation panel becomes bottom sheet; style selector becomes horizontal scroll

## Validated

### TEXT-01 — User can enter any text (single word to multiple paragraphs) and receive generated artwork

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can enter any text (single word to multiple paragraphs) and receive generated artwork

### TEXT-02 — Text analyzer extracts character frequency distribution, word count, average word length, sentence count, average sentence length

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text analyzer extracts character frequency distribution, word count, average word length, sentence count, average sentence length

### TEXT-03 — Text analyzer computes vocabulary richness (unique words / total words)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text analyzer computes vocabulary richness (unique words / total words)

### TEXT-04 — Text analyzer computes sentiment polarity and magnitude via lexicon-based method (AFINN-165 or equivalent)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text analyzer computes sentiment polarity and magnitude via lexicon-based method (AFINN-165 or equivalent)

### TEXT-05 — Text analyzer computes punctuation density, syllable pattern variance, character entropy (Shannon), uppercase ratio

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text analyzer computes punctuation density, syllable pattern variance, character entropy (Shannon), uppercase ratio

### TEXT-06 — Analysis completes in under 500ms for inputs up to 10,000 characters

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Analysis completes in under 500ms for inputs up to 10,000 characters

### PARAM-01 — All input types produce a normalized parameter vector of ~15 fixed dimensions (complexity, warmth, symmetry, rhythm, energy, density, scaleVariation, curvature, saturation, contrast, layering, directionality, paletteSize, texture, regularity)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All input types produce a normalized parameter vector of ~15 fixed dimensions (complexity, warmth, symmetry, rhythm, energy, density, scaleVariation, curvature, saturation, contrast, layering, directionality, paletteSize, texture, regularity)

### PARAM-02 — All parameter values normalized to 0-1 range using quantile-based scaling against calibration dataset

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All parameter values normalized to 0-1 range using quantile-based scaling against calibration dataset

### PARAM-03 — Calibration harness includes 30+ text, 15+ URL, and 15+ data reference inputs *(Text corpus complete: 44 entries. URL/data corpus deferred to Phase 6 when those analyzers are built.)*

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Calibration harness includes 30+ text, 15+ URL, and 15+ data reference inputs *(Text corpus complete: 44 entries. URL/data corpus deferred to Phase 6 when those analyzers are built.)*

### PARAM-04 — Parameter provenance tracks contributing signals with weights and plain-English explanations per parameter

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Parameter provenance tracks contributing signals with weights and plain-English explanations per parameter

### PARAM-05 — Calibration distributions stored as part of normalizer version; updating calibration bumps version

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Calibration distributions stored as part of normalizer version; updating calibration bumps version

### GEOM-01 — Geometric style renders grid-based compositions using rectangles, circles, triangles, and lines

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Geometric style renders grid-based compositions using rectangles, circles, triangles, and lines

### GEOM-02 — Composition law: minimum element size never thinner than 4px; at high density, reduce grid count rather than element size

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: minimum element size never thinner than 4px; at high density, reduce grid count rather than element size

### GEOM-03 — Composition law: minimum 2% padding between composition edge and frame

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: minimum 2% padding between composition edge and frame

### GEOM-04 — Composition law: all strokes use at most 2 different weights (primary and secondary)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Composition law: all strokes use at most 2 different weights (primary and secondary)

### GEOM-05 — Canvas rendering completes in under 1 second at 800x800

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Canvas rendering completes in under 1 second at 800x800

### COLOR-01 — Palettes generated in perceptual color space (OKLCH) with perceptual adjustments

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Palettes generated in perceptual color space (OKLCH) with perceptual adjustments

### COLOR-02 — Palette coherence function rejects near-duplicate colors (deltaE < 10 in LAB space), shifting hue by minimum viable amount

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Palette coherence function rejects near-duplicate colors (deltaE < 10 in LAB space), shifting hue by minimum viable amount

### COLOR-03 — Sufficient contrast ensured against dark backgrounds in dark mode and white in light mode

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Sufficient contrast ensured against dark backgrounds in dark mode and white in light mode

### COLOR-04 — Saturation and contrast parameters modulate palette but never to unreadable output

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Saturation and contrast parameters modulate palette but never to unreadable output

### UI-01 — Large, prominent input zone with tab selector for input type (Text, URL, Data)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Large, prominent input zone with tab selector for input type (Text, URL, Data)

### UI-02 — Text tab: textarea with placeholder "Paste anything. A name, a paragraph, a poem, a recipe..."

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Text tab: textarea with placeholder "Paste anything. A name, a paragraph, a poem, a recipe..."

### UI-03 — URL tab: single input field with "Analyze" button *(tab rendered, disabled until Phase 6)*

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL tab: single input field with "Analyze" button *(tab rendered, disabled until Phase 6)*

### UI-04 — Data tab: file drop zone accepting .csv and .json, plus textarea for pasting raw data *(tab rendered, disabled until Phase 6)*

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Data tab: file drop zone accepting .csv and .json, plus textarea for pasting raw data *(tab rendered, disabled until Phase 6)*

### UI-05 — Prominent "Generate" button with satisfying click feedback

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Prominent "Generate" button with satisfying click feedback

### UI-06 — Private mode toggle with lock icon

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Private mode toggle with lock icon

### UI-07 — Large rendering canvas (minimum 800x800 on desktop, full-width on mobile)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Large rendering canvas (minimum 800x800 on desktop, full-width on mobile)

### UI-08 — Style selector: row of real thumbnail previews (200x200) rendered from same parameters

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Style selector: row of real thumbnail previews (200x200) rendered from same parameters

### UI-09 — Canvas builds progressively (elements appear over 0.5-1 second, not instant)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Canvas builds progressively (elements appear over 0.5-1 second, not instant)

### UI-10 — Progressive building respects prefers-reduced-motion (renders complete immediately when preferred)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Progressive building respects prefers-reduced-motion (renders complete immediately when preferred)

### UI-11 — Collapsible panel (expanded on desktop, collapsed on mobile)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Collapsible panel (expanded on desktop, collapsed on mobile)

### UI-12 — Each parameter displayed as labeled bar (0-1) with numeric value

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Each parameter displayed as labeled bar (0-1) with numeric value

### UI-13 — Parameters grouped by source with top contributing signals and weights shown

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Parameters grouped by source with top contributing signals and weights shown

### UI-14 — Brief plain-English explanation per parameter

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Brief plain-English explanation per parameter

### UI-15 — Engine version displayed at bottom of panel

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Engine version displayed at bottom of panel

### UI-16 — Quick-start buttons below input: "Try: your name / a haiku / a recipe / a random Wikipedia paragraph"

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Quick-start buttons below input: "Try: your name / a haiku / a recipe / a random Wikipedia paragraph"

### UI-17 — "Surprise me" button generates random interesting phrase client-side

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

"Surprise me" button generates random interesting phrase client-side

### UI-18 — Staged progress bar tied to real pipeline stages (Parsing, Analyzing, Normalizing, Rendering)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Staged progress bar tied to real pipeline stages (Parsing, Analyzing, Normalizing, Rendering)

### SHARE-01 — User can generate share link with random UUID; link stores only parameter vector, version info, and style

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can generate share link with random UUID; link stores only parameter vector, version info, and style

### SHARE-02 — Share link recipient sees artwork, parameter panel, and metadata but NOT original input text

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Share link recipient sees artwork, parameter panel, and metadata but NOT original input text

### SHARE-03 — Original input only shown to creator if they have the generation in their session

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Original input only shown to creator if they have the generation in their session

### GAL-01 — "Save to Gallery" is explicit opt-in with preview of what will be public (thumbnail, input preview first 50 chars, title, style)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

"Save to Gallery" is explicit opt-in with preview of what will be public (thumbnail, input preview first 50 chars, title, style)

### GAL-02 — User can edit or remove input preview before saving

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can edit or remove input preview before saving

### GAL-03 — Gallery page shows thumbnails with style name, date, optional title

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Gallery page shows thumbnails with style name, date, optional title

### GAL-04 — Input preview hidden by default in gallery cards ("click to reveal")

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Input preview hidden by default in gallery cards ("click to reveal")

### GAL-05 — User can filter gallery by style and sort by recent or popular (upvote count)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can filter gallery by style and sort by recent or popular (upvote count)

### GAL-06 — User can click gallery card to view full size with translation panel

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can click gallery card to view full size with translation panel

### GAL-07 — Report button on every gallery item

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Report button on every gallery item

### GAL-08 — User can delete their own gallery entries

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can delete their own gallery entries

### COMP-01 — User can enter two inputs and see their art side by side in same style

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

User can enter two inputs and see their art side by side in same style

### COMP-02 — Parameter vectors displayed in parallel with visual diff highlighting

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Parameter vectors displayed in parallel with visual diff highlighting

### COMP-03 — Auto-generated difference summary: "These differ most in rhythm (+0.43) and warmth (-0.31)"

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Auto-generated difference summary: "These differ most in rhythm (+0.43) and warmth (-0.31)"

### COMP-04 — Style selector changes both artworks simultaneously

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Style selector changes both artworks simultaneously

### PRIV-01 — Generating art does not publish anything; it is local and ephemeral

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Generating art does not publish anything; it is local and ephemeral

### PRIV-02 — Raw input text never logged server-side beyond duration of analysis request

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Raw input text never logged server-side beyond duration of analysis request

### PRIV-03 — Gallery entries store parameters, metadata, version info, thumbnail, optional title — NOT raw input

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Gallery entries store parameters, metadata, version info, thumbnail, optional title — NOT raw input

### PRIV-04 — Local-only mode for text: analysis runs client-side, no server requests except initial page load, lock icon indicator

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Local-only mode for text: analysis runs client-side, no server requests except initial page load, lock icon indicator

### SEC-04 — Gallery rate limiting: max 10 saves per IP per day

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Gallery rate limiting: max 10 saves per IP per day

### SEC-05 — Profanity/abuse filter on gallery titles and visible input previews

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Profanity/abuse filter on gallery titles and visible input previews

### SEC-06 — Gallery items flagged for review after 3 reports; admin route to review and remove

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Gallery items flagged for review after 3 reports; admin route to review and remove

### INFRA-01 — PostgreSQL database via Drizzle ORM for gallery, cached analyses, version tracking

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

PostgreSQL database via Drizzle ORM for gallery, cached analyses, version tracking

### INFRA-02 — Analysis cache keyed by inputHash + versions with 7-day TTL for anonymous, permanent for gallery

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Analysis cache keyed by inputHash + versions with 7-day TTL for anonymous, permanent for gallery

### INFRA-03 — Render cache keyed by full version + style + resolution with 24h TTL for thumbnails, 7 days for full renders

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Render cache keyed by full version + style + resolution with 24h TTL for thumbnails, 7 days for full renders

### INFRA-04 — URL snapshot cache keyed by canonicalizedUrl + timestamp, permanent until re-fetch

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

URL snapshot cache keyed by canonicalizedUrl + timestamp, permanent until re-fetch

## Deferred

## Out of Scope
