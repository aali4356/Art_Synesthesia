# Synesthesia Machine: Development Specification

## 1. Project Overview

A full-stack web application that converts any input (text, URLs, data files) into unique algorithmic artwork. The same input always produces the same visual output, given the same engine version, like a hash function that generates art instead of hex strings. The translation rules are transparent and displayed alongside the artwork so users understand exactly how their input became a visual piece.

This project serves as Project 5 in Ahmad Ali's personal portfolio. It is the public-facing personality piece that demonstrates frontend craft, data analysis, interactive design, and full-stack architecture. It should be the kind of thing people try with their own name, bookmark, and send to friends.

### What Makes This Different From "Random Art Generators"

- Deterministic: same input always produces same output, given the same engine version. Your name has a visual identity.
- Transparent: the translation rules are visible. Users see exactly why their art looks the way it does, including which input signals contributed most to each parameter.
- Multi-modal input: text, URLs, CSV/JSON data all produce art through different analysis pipelines that converge on a shared visual parameter space.
- Multiple rendering styles: the same parameter vector can be rendered in different visual grammars, giving users creative control.
- Versioned: engine and mapping versions are tracked so artwork remains reproducible even as the system evolves.

---

## 2. Architecture Overview

```
Input Layer          Canonicalization    Analysis Layer         Parameter Space       Rendering Layer        Output
-----------          ----------------    --------------         ---------------       ---------------        ------
Plain text    -->    NFC + normalize --> NLP Pipeline     -->                    -->  Geometric Style   -->  Canvas/SVG
URL           -->    Snapshot/Live   --> Scrape + NLP     -->   Normalized       -->  Organic Style     -->  PNG Export
CSV/JSON      -->    Stable parse    --> Statistical      -->   Parameter        -->  Particle Style    -->  Share Link
                                                                Vector (0-1)     -->  Typographic Style -->  Gallery
                                                                ~20 dimensions
                                                                + engineVersion
                                                                + mappingVersion
```

### Core Concept: The Parameter Vector

Every input, regardless of type, gets reduced to a normalized parameter vector of approximately 20 floating-point values between 0 and 1. This is the "DNA" of the artwork. The analysis layer extracts meaning from the input. The parameter space is the universal intermediate representation. The rendering layer interprets the parameters visually.

**Fixed parameter schema** (no dynamic keys for core params):

```typescript
interface ParameterVector {
  // Core parameters: fixed set, strictly typed
  complexity: number;
  warmth: number;
  symmetry: number;
  rhythm: number;
  energy: number;
  density: number;
  scaleVariation: number;
  curvature: number;
  saturation: number;
  contrast: number;
  layering: number;
  directionality: number;
  paletteSize: number;
  texture: number;
  regularity: number;

  // Extension slot for experimental parameters
  extensions?: Record<string, number>;
}
```

Keeping core parameters as a fixed set (not `[key: string]`) ensures reliable panel rendering, stable caching, and predictable versioning.

### Parameter Definitions

| Parameter | 0 end | 1 end | Primary signals |
|-----------|-------|-------|-----------------|
| complexity | minimal | dense | word count, column count, sentence structure |
| warmth | cool blues | warm reds/oranges | sentiment polarity, major/minor key |
| symmetry | asymmetric | perfectly symmetric | character distribution evenness, data skew |
| rhythm | static | highly repetitive | syllable patterns, sentence length variance |
| energy | calm | chaotic | punctuation density, data variance, sentiment magnitude |
| density | sparse | packed | word count per area, row count, link density |
| scaleVariation | uniform | wide range of sizes | vocabulary richness, cardinality spread |
| curvature | angular/geometric | organic/curved | correlation strength, sentence flow |
| saturation | muted | vivid | uppercase ratio, exclamation marks, data range |
| contrast | low | high | sentiment extremes, data bimodality |
| layering | flat | deep/overlapping | nested structure, paragraph depth, link density |
| directionality | no flow | strong directional movement | reading direction patterns, trend slopes |
| paletteSize | monochrome | many colors | unique words / total words, column count |
| texture | smooth | granular | punctuation density, null/missing ratio |
| regularity | random placement | grid-like | character entropy, data regularity |

---

## 3. Determinism Guarantees

Determinism is a core product promise. It requires explicit engineering at every layer.

### 3.1 Input Canonicalization

Before hashing or analysis, every input goes through a canonicalization step specific to its type.

**Text:**
- Unicode normalization: NFC (Canonical Decomposition followed by Canonical Composition)
- Newline normalization: `\r\n` and `\r` converted to `\n`
- Trim trailing whitespace per line
- Minimal whitespace normalization: do NOT collapse internal whitespace (preserve intentional formatting). Show canonicalization changes in the translation panel if any were applied.

**JSON:**
- Parse and re-serialize with stable key ordering (alphabetical, recursive)
- Normalize number formatting (no trailing zeros, consistent decimal representation)
- Strip comments if present (JSONC input)

**CSV:**
- Define parsing rules explicitly: comma delimiter by default, double-quote escaping, UTF-8 encoding
- Trim cell whitespace
- Normalize empty cells to null representation
- Sort columns alphabetically for hash stability (but preserve original order for analysis display)

**URL:**
- Normalize URL: lowercase scheme and host, remove default ports, sort query parameters alphabetically, remove trailing slashes, remove fragment identifiers

### 3.2 Seeded Randomness

All rendering randomness must use a deterministic PRNG seeded from the input hash.

- Seed: `SHA-256(canonicalized_input + styleName + engineVersion)`
- PRNG: Use a well-known algorithm like xoshiro256** or Mulberry32
- Never call `Math.random()` in any rendering code path
- The seed changes per style so the same input looks intentionally different across styles, not accidentally different

### 3.3 Engine Versioning

```typescript
interface VersionInfo {
  engineVersion: string;    // e.g., "1.0.0" - overall system version
  analyzerVersion: string;  // e.g., "1.2.0" - analysis pipeline version
  normalizerVersion: string; // e.g., "1.1.0" - parameter normalization version
  rendererVersion: string;  // e.g., "1.0.0" - per-style renderer version
}
```

**Rules:**
- Bump `analyzerVersion` when you change how raw features are extracted
- Bump `normalizerVersion` when you change scaling functions or reference ranges
- Bump `rendererVersion` when you change how parameters map to visuals
- Bump `engineVersion` for any of the above (semver: major = breaking visual change, minor = new features, patch = bug fixes)

**Cache keys must include:** `inputHash + analyzerVersion + normalizerVersion`

**Render cache keys must include:** `inputHash + analyzerVersion + normalizerVersion + rendererVersion + styleName`

**UI consideration:** When versions change, offer a "v1 / v2" toggle on saved gallery pieces so users can see their old artwork as it originally appeared. Store the version info alongside every saved piece.

### 3.4 URL Input Determinism

A URL's content changes over time. "Same URL" does not mean "same art." Handle this explicitly.

**Snapshot mode (default):**
- First fetch creates a frozen artwork: parameters, metadata, and content fingerprint are stored
- Subsequent requests for the same URL return the stored result
- UI displays: "Snapshot taken [date]. Content may have changed since then."
- User can explicitly click "Re-fetch" to create a new snapshot

**Live mode (opt-in):**
- Always fetches fresh content
- UI warns: "This artwork may change if the page content changes."
- No caching of parameters for live-mode URLs

### 3.5 Cross-Browser Determinism

Canvas rendering can produce subtle differences across browsers due to floating-point math and font rendering.

**Mitigations:**
- For final PNG exports: render server-side using node-canvas or sharp with identical settings. Do not scale up the client bitmap.
- For SVG exports: fully deterministic by nature since it is a text format
- For client-side display: accept minor anti-aliasing differences as cosmetic. The parameters and composition will be identical; sub-pixel rendering may vary.
- Avoid font-dependent rendering in the canvas. Use geometric primitives, paths, and pre-rasterized glyphs where possible.

---

## 4. Input Types and Analysis Pipelines

### 4.1 Plain Text

The primary input mode. Accepts any text from a single word to multiple paragraphs.

**Analysis extracts:**
- Character frequency distribution (maps to palette via frequency-weighted color assignment)
- Word count and average word length (maps to complexity and scale)
- Sentence count and average sentence length (maps to rhythm)
- Vocabulary richness: unique words / total words (maps to paletteSize)
- Sentiment polarity and magnitude using lexicon-based method (AFINN or VADER) (maps to warmth and energy)
- Punctuation density: punctuation characters / total characters (maps to texture and energy)
- Syllable patterns: variance in syllable count per word (maps to rhythm and curvature)
- Character entropy: Shannon entropy of character distribution (maps to regularity)
- Uppercase ratio: uppercase / total alphabetic characters (maps to contrast and saturation)

**Parameter provenance:** For each output parameter, track and store the contributing signals with their weights. Example: "Warmth = 70% sentiment polarity, 30% punctuation intensity." Display this in the translation panel.

Libraries: Lightweight approach. Lexicon-based sentiment (AFINN-165 word list). Character and word statistics are pure computation, no heavy library needed.

### 4.2 URL

Fetches the target page, extracts the main text content, then runs the text analysis pipeline. Additionally extracts:
- Page title (used as the artwork title)
- Dominant colors from CSS and inline styles (maps to base palette influence)
- Link density: links / total text length (maps to layering)
- Content-to-HTML ratio: text content length / total HTML length (maps to density, signal-to-noise)

**SSRF Protection (mandatory):**
- Block private IP ranges: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`
- Block internal hostnames: `localhost`, `*.local`, `*.internal`
- Restrict protocols to `http` and `https` only
- Resolve DNS before connecting and verify the resolved IP is not in a blocked range (prevents DNS rebinding)
- Enforce strict limits: 10-second timeout, 5MB max response size, max 3 redirects
- Strip cookies and auth headers from outbound requests
- Do not render fetched HTML in the client. Extract text server-side only.
- Image color sampling (if implemented): server-side only, enforce 10MB image size limit, validate content-type before processing

**Rate limiting:** Max 10 URL analyses per IP per hour. Show remaining quota in the UI.

Libraries: Cheerio for HTML parsing. A readability-style extractor for main content isolation.

### 4.3 CSV/JSON Data

Statistical analysis of the dataset:
- Number of columns/keys (maps to paletteSize)
- Row count (maps to density)
- Numeric column distributions: mean, variance, skew, kurtosis (maps to symmetry, energy, contrast)
- Null/missing data ratio (maps to texture, visual gaps)
- Correlation strength between numeric columns (maps to curvature, connectedness)
- Categorical column cardinality (maps to complexity)
- Data type mix: proportion of numeric vs string vs date columns (maps to warmth spectrum)

Libraries: For Python backend: pandas. For all-Node approach: simple-statistics.

### 4.4 Song Title (Stretch Goal, Phase 6)

Look up the song via a lyrics API or music metadata API:
- Lyrics text runs through the text pipeline
- Tempo/BPM if available (maps to rhythm and energy)
- Genre (shifts base palette)
- Release year (maps to a historical color tendency)
- Key/mode: major = warmer, minor = cooler (maps to warmth)

This input type is the most API-dependent. Defer to Phase 6.

---

## 5. Normalization Strategy

### 5.1 Calibration Harness

Build a calibration dataset before tuning normalization functions. This is not optional.

**Reference inputs:**
- 30+ text samples: single words, names, haikus, paragraphs, essays, code snippets, emoji-heavy text, all-caps rants, academic abstracts, recipes, song lyrics (by description, not reproduction)
- 15+ URLs: Wikipedia articles, personal blogs, product pages, news articles, documentation pages
- 15+ data files: clean numeric CSVs, sparse data with many nulls, highly correlated datasets, categorical-heavy files, single-column files, wide files with 50+ columns

Run all reference inputs through the pipeline and visualize the resulting parameter distributions. Tune scaling functions until parameters distribute meaningfully across the 0-1 range for the reference set.

### 5.2 Scaling Method

**Use quantile-based scaling, not min/max.**

Min/max normalization breaks when a single outlier (a massive CSV, a 10,000-word essay) compresses everything else into a narrow band. Quantile mapping produces more expressive distributions.

Process:
1. Compute raw feature values for the calibration set
2. For each feature, compute percentile ranks
3. Define the mapping function as: `normalized = percentileRank(rawValue, calibrationDistribution)`
4. For values outside the calibration range, clip to 0 or 1

Store calibration distributions as part of the normalizer version. When you update calibration data, bump the normalizer version.

### 5.3 Parameter Provenance

For every parameter in the output vector, store:
```typescript
interface ParameterProvenance {
  parameter: string;
  value: number;
  contributors: Array<{
    signal: string;       // e.g., "sentiment_polarity"
    rawValue: number;     // pre-normalization
    weight: number;       // 0-1, contribution to final value
    explanation: string;  // e.g., "Your text has a slightly cool emotional tone"
  }>;
}
```

Display in the translation panel as: "Warmth (0.41): 70% from sentiment polarity (-0.12 raw), 30% from punctuation intensity (0.03 raw). Your text has a slightly cool emotional tone with minimal exclamatory punctuation."

---

## 6. Rendering Styles

Each style interprets the same parameter vector differently. Users can switch between styles for the same input without re-analyzing. All rendering uses a seeded PRNG (Section 3.2), never `Math.random()`.

### 6.1 Global Rendering Rules

These apply to all styles and exist to prevent ugly output:

**Palette generation:**
- Generate palettes in perceptual color space (OKLCH or HSL with perceptual adjustments)
- Clamp extreme values to prevent muddy or harsh combinations
- Palette coherence function: reject near-duplicate colors (deltaE < 10 in LAB space). If duplicates arise, shift hue by minimum viable amount.
- In dark mode, ensure sufficient contrast against dark backgrounds. In light mode, ensure sufficient contrast against white.
- The `saturation` and `contrast` parameters modulate palette generation, but never to the point of unreadable output.

**Composition rules (per-style, see below):**
- Every style must define 2-3 "composition laws" that prevent degenerate outputs
- These are hard constraints, not suggestions. Parameters can push toward extremes but composition laws cap them.

**Frame option:**
- All styles include an optional subtle border/matte (8-16px margin, slightly lighter/darker than background)
- Default: on for exports, off for in-app display
- A clean frame makes generative pieces instantly feel "finished"

### 6.2 Geometric

Grid-based compositions using rectangles, circles, triangles, and lines. Mondrian meets data visualization.

Parameters control: grid density, shape ratios, color block sizes, rotation angles, border weights.

**Composition laws:**
1. Minimum element size: never thinner than 4px at any density level. At high density, reduce grid count rather than element size.
2. Margin enforcement: always maintain a minimum 2% padding between the composition edge and the frame.
3. Stroke weight unity: all strokes within a piece use at most 2 different weights (a primary and a secondary). Prevents visual noise.

### 6.3 Organic

Flowing curves, blob shapes, gradient fields. Generative watercolors or topographic maps.

Parameters control: curve complexity (Perlin noise octaves), flow direction, color blending opacity, layering depth, noise frequency.

**Composition laws:**
1. Noise floor: minimum 2 octaves of Perlin noise, maximum 6. Prevents both "too smooth" and "TV static" outputs.
2. Layer readability: maximum 5 overlapping transparent layers. Beyond that, reduce opacity rather than adding layers.
3. Flow coherence: flow fields must have a dominant direction (set by `directionality` parameter). Pure randomness is never allowed.

### 6.4 Particle

Thousands of small elements arranged by force-directed or physics-based rules.

Parameters control: particle count, clustering behavior, color distribution, movement trails, attraction/repulsion forces.

**Composition laws:**
1. Mobile cap: max 2,000 particles on mobile (detect via viewport width), max 10,000 on desktop. Performance is non-negotiable.
2. Clustering with intention: particles must form at least 2 visible clusters or flows. Uniform random scatter is prohibited. Use the `regularity` and `directionality` parameters to enforce structure.
3. Background breathing room: at least 15% of the canvas area should be empty/negative space unless `density` exceeds 0.85.

**Animation:** Subtle idle animation (slow drift, gentle pulsing) is allowed but must respect `prefers-reduced-motion`. When reduced motion is preferred, render as static.

### 6.5 Typographic

The input text itself becomes the visual medium. Only available for text and URL inputs.

Parameters control: word sizing (by importance/frequency), rotation range, color mapping, layout flow, opacity variation.

**Composition laws:**
1. Legibility anchor: the 3 most prominent words must be fully readable (no rotation beyond 15 degrees, minimum 16px font size). Smaller words can be more experimental.
2. Rotation budget: maximum 30% of words can be rotated beyond 10 degrees. Prevents the "word salad tornado" look.
3. Overlap control: words may overlap only if their opacity is below 0.4. Full-opacity words never overlap.

### 6.6 Abstract Landscape (Stretch Goal, Phase 6)

Horizontal layers suggesting a landscape. Parameters map to horizon position, sky/ground color gradients, element density per layer, and atmospheric depth.

---

## 7. Privacy and Security

### 7.1 Privacy Model: Private by Default

- Generating art does NOT publish anything. It is a local, ephemeral action.
- "Save to Gallery" is an explicit opt-in step with a clear preview showing exactly what will be public: thumbnail, input preview (first 50 characters), title, style.
- Users can edit or remove the input preview before saving.
- Users can delete their gallery entries at any time.

### 7.2 Share Links

Share links do NOT require storing the raw input.

**Storage model:**
- Server stores: parameter vector, analysis metadata (without raw input), engine version, style, timestamp, and a random share ID (UUID v4)
- The share link is: `https://[domain]/art/[shareId]`
- The recipient sees the artwork, the parameter panel, and the metadata, but NOT the original input text
- The original input is only shown to the creator if they are logged in or have the generation in their session

**Why:** Users will paste sensitive text. Storing it server-side behind a guessable hash is a liability. Storing only the parameters and metadata protects privacy while preserving the artwork.

### 7.3 Local-Only Mode

A toggle in the UI: "Private generation (nothing stored server-side)"

When enabled:
- Text analysis runs client-side using a lightweight JS implementation of the analysis pipeline (feasible for text; not practical for URL scraping)
- No server requests except for initial page load
- No caching, no gallery eligibility, no share links
- Canvas rendering is fully client-side (already the default)
- Visual indicator: a small lock icon near the input area

For URL and data inputs, local-only mode is not available (server-side processing required). Show a clear explanation: "URL and data analysis require server processing. Your input is processed but not stored."

### 7.4 Data Handling

- Raw input text is never logged server-side beyond the duration of the analysis request
- Analysis results (parameter vectors) are cached by hash for performance. Cache entries do not contain raw input.
- Gallery entries store: parameters, metadata, version info, thumbnail, optional title. NOT raw input.
- Database backups follow the same principle: no raw input text in any persistent storage

---

## 8. Frontend Specification

### 8.1 Main Interface

**Input Area:**
- Large, prominent input zone at the top or center
- Tab selector for input type: Text, URL, Data
- Text: textarea with placeholder "Paste anything. A name, a paragraph, a poem, a recipe..."
- URL: single input field with "Analyze" button
- Data: file drop zone accepting .csv and .json, plus a textarea for pasting raw data
- "Generate" button (prominent, satisfying click feedback)
- "Private mode" toggle with lock icon

**Quick-start buttons (high-impact UX):**
- Row of instant-try buttons below the input: "Try: your name / a haiku / a recipe / a random Wikipedia paragraph"
- "Surprise me" button: generates a random interesting phrase client-side (seeded from current timestamp) so users are never stuck staring at an empty input

**Progress animation:**
- Not a spinner. A staged progress bar tied to real pipeline stages:
  - "Parsing input..." (canonicalization)
  - "Analyzing..." (feature extraction)
  - "Normalizing..." (parameter mapping)
  - "Rendering..." (canvas drawing)
- Each stage shows a brief duration. The whole sequence should take 1-3 seconds for text.

**Canvas Area:**
- Large rendering canvas (minimum 800x800 on desktop, full-width on mobile)
- Style selector: row of real thumbnail previews rendered from the same parameters (not generic icons). Generate these as small canvases (200x200) when parameters are ready.
- Canvas builds progressively when rendering (shapes/elements appear over 0.5-1 second, not instant)

**Translation Panel:**
- Collapsible panel (expanded by default on desktop, collapsed on mobile)
- Each parameter displayed as a labeled bar (0 to 1) with numeric value
- Grouped by source: "From your text: complexity 0.73, warmth 0.41, rhythm 0.88..."
- Each parameter shows top contributing signals with weights: "Warmth (0.41): 70% sentiment polarity, 30% punctuation intensity"
- Brief plain-English explanation: "Your text has a slightly cool emotional tone with minimal exclamatory punctuation."
- Engine version displayed at the bottom of the panel (small, non-intrusive)

**Actions:**
- Download as PNG (high resolution: re-render at 4096x4096 server-side, not upscaled bitmap)
- Download as SVG (for Geometric and Typographic styles where vector output is natural)
- Share link (generates permalink with random ID, stores only parameters)
- "Save to Gallery" (explicit opt-in with preview of what will be public)
- Frame toggle: add/remove border matte for exports

### 8.2 Gallery Page

- Public gallery of community-generated pieces
- Each card shows: thumbnail, style name, date, optional title
- Input preview hidden by default ("click to reveal") to keep the gallery visually focused and reduce spam/abuse surface
- Filter by style, sort by recent or popular (simple upvote count)
- Click to view full size with the translation panel and parameter breakdown
- Report button on every gallery item

### 8.3 Compare Mode

- Side-by-side view: enter two inputs and see their art next to each other
- Parameter vectors displayed in parallel with visual diff highlighting
- Auto-generated difference summary: "These differ most in rhythm (+0.43) and warmth (-0.31)."
- Same style applied to both for fair visual comparison. Style selector changes both simultaneously.

### 8.4 Design System

- Dark mode default (dark backgrounds make generated colors pop)
- Light mode toggle available
- Respect system preference on first visit, persist user choice
- Minimal chrome: the artwork is the hero
- Monospace font for parameter panel and technical elements (e.g., JetBrains Mono, Fira Code)
- Clean sans-serif for UI text (e.g., Inter)
- Responsive: on mobile, input area stacks above canvas. Translation panel becomes a bottom sheet. Style selector becomes a horizontal scroll.

---

## 9. Backend Specification

### 9.1 API Endpoints

```
POST /api/analyze
  Body: { type: "text" | "url" | "data", content: string, mode: "snapshot" | "live" }
  Returns: {
    parameters: ParameterVector,
    provenance: ParameterProvenance[],
    metadata: AnalysisMetadata,
    hash: string,
    version: VersionInfo
  }

GET /api/artwork/:shareId
  Returns: {
    parameters: ParameterVector,
    provenance: ParameterProvenance[],
    metadata: AnalysisMetadata (without raw input),
    version: VersionInfo,
    style: string,
    createdAt: string
  }

POST /api/gallery
  Body: { shareId: string, title?: string, style: string }
  Returns: { id: string, url: string }

GET /api/gallery
  Query: ?style=geometric&sort=recent&page=1&limit=20
  Returns: { items: GalleryItem[], total: number, page: number }

POST /api/gallery/:id/report
  Body: { reason: string }
  Returns: { success: boolean }

GET /api/compare
  Query: ?id1=abc&id2=def
  Returns: {
    artwork1: {...},
    artwork2: {...},
    diff: Array<{ parameter: string, delta: number, direction: string }>
  }

POST /api/render-export
  Body: { parameters: ParameterVector, style: string, version: VersionInfo, format: "png" | "svg", resolution: number }
  Returns: Binary image data
```

### 9.2 Analysis Engine

Modular architecture. Each input type has its own analyzer. A shared normalizer maps raw features to the parameter vector.

```
Analyzer (per input type)
  --> Raw Features (variable length, type-specific)
    --> Normalizer (shared, versioned, quantile-based)
      --> Parameter Vector (fixed schema, 0-1 range)
      --> Provenance records (per-parameter signal breakdown)
```

### 9.3 Caching Strategy

**Cache layers:**
1. Analysis cache: keyed by `inputHash + analyzerVersion + normalizerVersion`. Stores parameter vector and provenance. TTL: permanent for gallery items, 7 days for anonymous generations.
2. Render cache: keyed by `inputHash + analyzerVersion + normalizerVersion + rendererVersion + styleName + resolution`. Stores rendered image binary. TTL: 24 hours for thumbnails, 7 days for full renders.
3. URL snapshot cache: keyed by `canonicalizedUrl + snapshotTimestamp`. Stores extracted text content and analysis results. TTL: permanent until user re-fetches.

### 9.4 Gallery Moderation

Minimum viable protections for launch:
- Rate limits: max 10 gallery saves per IP per day
- CAPTCHA or friction (e.g., "type the word 'save'") after 5 saves in a session
- Report button on every gallery item (stores report with reason, flags item for review after 3 reports)
- Profanity/abuse filter on titles and visible input previews (basic word list filter, not ML)
- Input previews hidden by default in gallery cards
- Admin route (password-protected) to review reported items and remove them

---

## 10. Accessibility

### 10.1 Auto-Generated Art Descriptions

The translation panel doubles as the accessible description layer. For every generated artwork, auto-generate an alt text string from the parameters:

```
"A [density_adj], [warmth_adj], [layering_adj] [style] composition with
[directionality_adj] movement and [energy_adj] energy."
```

Example: "A dense, warm, deeply layered geometric composition with strong directional movement and high energy."

This alt text is:
- Set as the `aria-label` on the canvas element
- Included in PNG export EXIF/metadata
- Used as the default title suggestion when saving to gallery

### 10.2 Keyboard Navigation

Full keyboard support for:
- Input type tabs (arrow keys)
- Style selector (arrow keys)
- Translation panel expand/collapse (Enter/Space)
- Download, share, save buttons (Tab + Enter)
- Gallery cards (Tab navigation, Enter to open)
- Compare mode inputs (Tab between fields)

### 10.3 Reduced Motion

Respect `prefers-reduced-motion`:
- Disable particle animation (render as static)
- Disable progressive canvas building (render complete immediately)
- Disable hover transitions on gallery cards
- Keep essential state transitions (tab changes, panel open/close) but remove decorative animation

### 10.4 Color Independence

- Parameter bars use labels and numeric values, not color alone
- Style selector thumbnails include text labels
- Gallery filters are text-based, not color-coded
- Generated art descriptions provide non-visual understanding

---

## 11. Technical Stack

### Recommended (Hybrid)

- **Framework:** Next.js (App Router) with TypeScript
- **Rendering:** HTML Canvas API for raster styles, SVG for vector styles. WebGL (via raw API or Three.js) for particle style if performance requires it.
- **PRNG:** xoshiro256** or Mulberry32 implementation, seeded per Section 3.2
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion for UI transitions, custom `requestAnimationFrame` loops for canvas. All canvas animation respects `prefers-reduced-motion`.
- **Backend analysis:** Python microservice (FastAPI) for NLP and statistical analysis, called from Next.js API routes. Python is where the analysis libraries are strongest.
- **Database:** PostgreSQL (via Drizzle ORM) for gallery, cached analyses, version tracking
- **Server-side rendering (exports):** node-canvas or sharp for deterministic high-res PNG exports
- **Deployment:** Vercel for Next.js, Railway or Fly.io for Python microservice
- **Email (if contact form on landing):** Resend or SendGrid

### Alternative (All-Node)

If avoiding a second service:
- **Analysis:** natural (NLP) or compromise for text analysis. simple-statistics for data analysis.
- **Tradeoff:** Less powerful NLP, but simpler deployment. Acceptable if text analysis stays lexicon-based.

---

## 12. Data Models

### AnalysisMetadata

```typescript
interface AnalysisMetadata {
  inputType: "text" | "url" | "data";
  inputPreview: string;          // first 100 chars or summary (for creator only)
  inputHash: string;             // SHA-256 of canonicalized input
  analysisTimestamp: string;     // ISO 8601
  version: VersionInfo;
  canonicalizationChanges?: string[];  // e.g., ["Normalized 3 \\r\\n to \\n"]
}
```

### GalleryItem

```typescript
interface GalleryItem {
  id: string;                // UUID v4
  shareId: string;           // random share ID for permalink
  title: string | null;      // user-provided, filtered for profanity
  style: string;
  inputType: string;
  inputPreview: string | null;  // only shown on reveal
  thumbnailUrl: string;
  createdAt: string;
  likes: number;
  reportCount: number;       // hidden from public, used for moderation
  version: VersionInfo;
}
```

---

## 13. Testing Strategy

### Unit Tests
- Each analyzer (text, URL, data) with known inputs and expected parameter ranges
- Canonicalization functions with edge cases (mixed line endings, Unicode edge cases, empty input)
- Normalization functions against calibration dataset
- PRNG determinism: verify identical seeds produce identical sequences across runs

### Determinism Tests
- Same input must produce identical parameter vectors across runs (automated)
- Same parameters + style + version must produce identical canvas output (visual snapshot comparison)
- Run determinism suite on every PR

### Visual Regression Tests
- Snapshot a set of 10+ reference inputs across all styles
- Compare rendered output against stored reference images (pixel-diff with tolerance for anti-aliasing)
- Flag any diff above threshold for manual review

### Performance Tests
- Text analysis: under 500ms for inputs up to 10,000 characters
- URL analysis: under 5 seconds including fetch
- Data analysis: under 2 seconds for CSVs up to 10,000 rows
- Canvas rendering: under 1 second for all styles at 800x800
- Server-side export rendering: under 3 seconds at 4096x4096

### Security Tests
- SSRF: verify all private IP ranges are blocked for URL input
- Verify DNS rebinding protection works
- Verify rate limits enforce correctly
- Verify no raw input appears in server logs or database after analysis completes

### Cross-Browser Tests
- Canvas output visual comparison across Chrome, Firefox, Safari
- Accept minor anti-aliasing differences; flag composition differences

---

## 14. Development Phases

### Phase 1: Core Engine
- Project scaffolding (Next.js + Tailwind + TypeScript)
- Parameter vector type definitions and version schema
- Input canonicalization (text only)
- Seeded PRNG implementation
- Text analysis pipeline with parameter provenance tracking
- Calibration harness with 30+ text reference inputs
- Quantile-based normalization
- One rendering style (Geometric) with composition laws
- Basic UI: input textarea, generate button, canvas output, parameter panel
- Determinism test suite

### Phase 2: Visual Expansion
- Organic rendering style with composition laws
- Particle rendering style with composition laws and mobile particle cap
- Typographic rendering style with legibility constraints
- Style selector with real mini-preview thumbnails
- Palette generation in perceptual color space with coherence function
- Frame option for exports
- Progressive canvas building animation (respects reduced motion)
- Visual regression test suite

### Phase 3: Multi-Input
- URL analysis pipeline: scraper + SSRF protection + text pipeline
- URL snapshot/live mode toggle
- Data analysis pipeline: CSV/JSON parsing + statistical analysis
- Input type tabs with file drop zone
- Expand calibration harness with URL and data reference inputs
- Retune normalization across all input types

### Phase 4: Privacy and Social
- Database setup (PostgreSQL + Drizzle)
- Private-by-default generation
- Share links with random IDs (parameters only, no raw input)
- Gallery: save (opt-in), browse, filter, sort, report
- Input preview reveal toggle on gallery cards
- Compare mode with parameter diff and summary sentence
- Local-only mode for text input (client-side analysis)
- Rate limiting and abuse prevention
- Basic profanity filter on titles

### Phase 5: Polish
- Dark/light mode toggle with system preference detection
- Quick-start buttons ("Try: your name / a haiku / etc.")
- "Surprise me" random phrase generator
- Staged progress animation (Parsing, Analyzing, Normalizing, Rendering)
- Auto-generated alt text from parameters
- Full keyboard navigation
- Reduced motion support
- Server-side high-res PNG export (node-canvas)
- SVG export for vector styles
- SEO: meta tags, og:image from rendered artwork
- Performance audit against targets
- Security audit (SSRF, rate limits, data handling)
- Cross-browser testing

### Phase 6: Stretch Goals
- Song title input type (lyrics API)
- Abstract Landscape rendering style
- Animated renders (subtle drift in particle/organic, respects reduced motion)
- Public API endpoint for external embedding
- "Artwork of the Day" featured on gallery
- Version toggle on saved pieces ("View in v1 / v2")
- Admin dashboard for moderation

---

## 15. Portfolio Integration

When featured on Ahmad's personal website, the project page should include:

- Live embed or prominent link to the running app
- Architecture diagram showing the full pipeline (input, canonicalization, analysis, normalization, parameters, rendering, output)
- "How It Works" section explaining the parameter vector concept and the determinism guarantee
- 3-4 curated example outputs with their parameter breakdowns (not raw inputs)
- The translation panel concept explained as a design decision
- Technical stack summary
- Link to the GitHub repository

**The project demonstrates:** full-stack architecture, NLP and statistical analysis, generative graphics, deterministic system design, privacy-conscious engineering, interactive frontend, API design, accessibility, and the ability to ship a complete public product.
