# Feature Research

**Domain:** Deterministic generative art web application (input-to-artwork pipeline)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text input field with immediate rendering | Every art generator (Zazow, NightCafe, Canva AI) has an input-to-output flow. Users expect to type and see art. | LOW | Must feel instant (<500ms parse + render). Auto-generate on paste/enter, not just a "submit" button. |
| Real-time canvas preview | Zazow, p5.js editor, and every creative coding tool show output immediately. No generation without visual feedback. | MEDIUM | Canvas API at 800x800 minimum. Must render in <1s. Progressive building animation adds delight but is not the table stake -- the result appearing is. |
| Multiple rendering styles | Zazow offers 6 styles, Art Blocks artists choose styles, fxhash has diverse aesthetic outputs. Users expect variety. | HIGH | Four styles (Geometric, Organic, Particle, Typographic) is the right number for v1 -- enough variety without overwhelming. Each needs distinct visual identity. |
| PNG export / download | Universal across all art generators (Zazow, NightCafe, Canva, p5.js editor). Users expect to save their artwork. | LOW | Standard resolution (800x800) is the table stake. Button must be prominent and one-click. |
| Dark mode UI | Standard for creative tools in 2026. Art generators, code editors, and design tools default dark. Dark backgrounds make generated colors pop. | LOW | Default to dark, respect system preference, provide toggle. Already in PROJECT.md constraints. |
| Responsive / mobile-friendly layout | Users will discover this via shared links on phones. If it looks broken on mobile, they leave. | MEDIUM | Mobile-first with canvas resizing. Translation panel as bottom sheet on mobile (Material Design pattern). Touch-friendly controls. |
| Share link / permalink | Zazow, NightCafe, p5.js editor, and fxhash all let users share their creations via URL. This is how viral art tools spread. | LOW | Parameters-only share links (no raw input) is already in PROJECT.md. Random short IDs. Must work when pasted in iMessage/WhatsApp (OG meta tags with preview image). |
| Loading / progress indication | Users expect feedback during generation. Any delay without indication feels broken. | LOW | Staged progress (Parsing, Analyzing, Normalizing, Rendering) turns a wait into an experience. Skeleton states for initial load. |
| Color palette generation | Every generative art tool produces harmonious colors. Muddy or clashing palettes make the whole product feel amateurish. | MEDIUM | OKLCH perceptual color space is the right call (already in PROJECT.md). Coherence function ensures palettes are always visually appealing regardless of input. |
| Gallery / explore page | Zazow, NightCafe, fxhash, and Art Blocks all have galleries. Users want to browse what others have made. | MEDIUM | Opt-in saves only. Filter by style, sort by recent/popular. Private-by-default model. Needs moderation strategy (profanity filter on titles, report button). |

### Differentiators (Competitive Advantage)

Features that set Synesthesia Machine apart. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Determinism guarantee** (same input = same art) | No mainstream art tool promises this. Identicons do it for avatars but not for rich artwork. AI art generators are explicitly non-deterministic. This is the core product promise. | HIGH | Requires seeded PRNG everywhere, input canonicalization per type, engine versioning. Cross-browser canvas anti-aliasing differences are cosmetic and acceptable, but server-side rendering for exports guarantees pixel-perfect results. This is the hardest engineering challenge and the biggest differentiator. |
| **Translation panel** (transparent algorithm explanation) | No generative art platform explains *why* the art looks the way it does. Art Blocks and fxhash show parameters but not provenance. AI tools are black boxes. This makes the art meaningful, not just pretty. | HIGH | Per-parameter signal breakdown with weights and plain-English explanations ("Your text has high entropy (7.2 bits) which produced complex geometry"). This is what turns a novelty into something people study and share. |
| **Multi-modal input** (text, URL, CSV/JSON) | Most art generators accept only text prompts or manual parameter controls. Accepting URLs and structured data is unique. Data-as-art is a niche typically requiring programming (Processing, d3.js). Making it one-click is the differentiator. | HIGH | Three separate analysis pipelines (NLP, web scraping + text extraction, statistical analysis) all normalizing to the same ~15-dimension parameter vector. URL input needs SSRF protection. CSV/JSON needs schema inference. |
| **Normalized parameter vector** as intermediate representation | Enables style-switching without re-analysis, compare mode, and the entire translation panel. No competitor has this explicit abstraction. fxhash's fx(params) is the closest analogy but parameters are per-project, not universal. | MEDIUM | ~15 dimensions, 0-1 range, quantile-based normalization. The vector IS the artwork identity. Calibration harness with 60+ reference inputs required before tuning (non-negotiable). |
| **Compare mode** (side-by-side with parameter diff) | No generative art tool offers this. Closest analogy is diff tools for code. Lets users understand how different inputs produce different art. Highly shareable ("look how your name vs my name differs"). | MEDIUM | Requires two rendered canvases, parameter vector diff calculation, and auto-generated summary ("Your input has higher entropy but lower sentiment, producing more complex but cooler-toned artwork"). |
| **Style selector with live mini-previews** | Zazow shows style categories but not previews of YOUR art in each style. fxhash's FxLens shows one style at a time. Seeing your input rendered in all 4 styles simultaneously, as thumbnails, is unique. | MEDIUM | Render 4 small canvases (200x200) from same parameter vector. Must be fast enough to not feel laggy. Can render sequentially with loading states. |
| **SVG export for vector styles** | Most generators only export raster (PNG/JPG). SVG export for Geometric and Typographic styles enables infinite scaling, print quality, and use in design tools. | MEDIUM | Only applicable to Geometric and Typographic styles (inherently vector-based). Organic and Particle styles remain raster-only (Canvas API). |
| **High-res export** (4096x4096) | Zazow charges for high-res. Most free tools cap at screen resolution. Free high-res export removes a friction point. | MEDIUM | Server-side re-render ensures determinism regardless of client GPU. <3s target. Consider offering as downloadable vs. in-browser (file size). |
| **Quick-start buttons and "Surprise me"** | Reduces blank-canvas paralysis. "Try: your name / a haiku / a recipe" gives users instant gratification and teaches input diversity. Most art generators start with an empty prompt. | LOW | Curated examples that produce visually striking results. "Surprise me" uses a random seed to generate a random input (not random parameters -- maintains determinism story). |
| **Local-only mode for text** | Privacy feature no competitor offers. Users will paste sensitive text (journal entries, love letters, private thoughts). Knowing it never leaves the browser is powerful. | MEDIUM | Client-side NLP analysis using lightweight libraries (compromise, natural). No server requests for text input. Clear indicator showing "processed locally". |
| **Input provenance / privacy model** | Share links store only parameters, never raw input. Art Blocks and fxhash store transaction hashes, not personal data. But for a tool accepting free-text input, this explicit privacy promise is uniquely reassuring. | LOW | Already designed into architecture. Raw input never stored server-side. Share links contain only the parameter vector + engine version. |
| **Frame option for exports** | Gallery-ready framing (subtle border/matte) makes exports feel finished. Most generators export raw canvas. | LOW | Simple CSS/canvas border with configurable matte color. Low effort, high perceived value for social sharing. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately excluded.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User accounts / OAuth login** | "I want to save my art" | Adds authentication complexity, GDPR obligations, password management, session handling. For a portfolio piece, auth is massive scope with little incremental value over share links. | Share links with parameter storage. Gallery saves keyed by anonymous IP + optional display name. Revisit auth only if gallery moderation becomes unmanageable. |
| **Real-time collaboration / multiplayer** | "Let me create with friends" | WebSocket infrastructure, conflict resolution, shared state management. Enormous complexity for a solo portfolio project. | Compare mode (paste two URLs to compare) serves the social use case without real-time sync. |
| **AI-powered style transfer** | "Apply Van Gogh style to my data" | Requires ML model serving (GPU costs, latency), makes the system non-deterministic or opaquely deterministic, undermines the transparent-algorithm value proposition. Also overshadowed by dedicated AI art tools. | Handcrafted rendering styles with clear algorithmic rules. The transparency IS the feature -- "this is not AI" is a differentiator in 2026. |
| **User-uploaded custom rendering styles** | "Let me write my own renderer" | Sandboxing user code, security vulnerabilities (XSS), testing burden, support burden. Turns the app into a platform. | Four well-crafted built-in styles. Add more styles in future versions as first-party features. |
| **Animated / video exports** | "Make it move!" | Video encoding is computationally expensive, increases server costs, multiplies rendering time, and complicates determinism (frame timing). | Static art with progressive building animation on page. Animated renders (particle drift, organic flow) are explicitly out of scope per PROJECT.md. |
| **Song / audio input** | "Convert my favorite song" | Requires music API integration (Spotify, Apple Music), audio analysis libraries, licensing concerns, and is API-dependent. | Listed as stretch goal in PROJECT.md. Defer entirely. Text input of lyrics works as a workaround. |
| **NFT minting / blockchain integration** | "Let me mint my art" | Blockchain integration adds enormous complexity (wallet connection, gas fees, smart contracts). Not aligned with portfolio piece goals. Alienates users who dislike NFTs. | Export as high-res PNG/SVG. Users who want NFTs can mint elsewhere with the exported file. |
| **Infinite canvas / zoom** | "Let me explore the art at different scales" | Requires tile-based rendering, viewport management, and fundamentally different rendering architecture. Fractal-like features need recursive rendering. | Fixed canvas with high-res export (4096x4096) for zoom-and-crop workflows. |
| **Social features** (comments, likes, follows) | "I want community" | Full social platform: moderation, abuse prevention, notification system, feed algorithm. Scope explosion for a portfolio piece. | Gallery with browse/filter/report. Link sharing to external social platforms (Twitter, Instagram). |
| **Undo / version history** | "I want to go back" | State management complexity, storage for version chains. Generative art from input doesn't have an "undo" -- you change the input, you get different art. | The input IS the version. Change input, get new art. Compare mode shows differences. Bookmark/save previous share links. |
| **Image input** (upload photo to convert) | "Turn my photo into art" | Image analysis is a fundamentally different pipeline (computer vision, feature extraction). Doubles the engineering surface area. Not aligned with text/URL/data thesis. | Defer entirely. If added later, it would be a new input type with its own analyzer, not a retrofit. |

## Feature Dependencies

```
Input Canonicalization
    |
    v
Analysis Pipeline (Text / URL / Data)
    |
    v
Normalized Parameter Vector (~15 dims)
    |
    +----> Translation Panel (parameter provenance display)
    |
    +----> Rendering Engine (Geometric / Organic / Particle / Typographic)
    |           |
    |           +----> Canvas Preview (800x800)
    |           |
    |           +----> PNG Export (client-side for standard, server-side for hi-res)
    |           |
    |           +----> SVG Export (Geometric + Typographic only)
    |           |
    |           +----> Frame Option (post-render overlay)
    |
    +----> Style Selector (mini-preview thumbnails require rendering 4x)
    |
    +----> Compare Mode (requires two parameter vectors + diff logic)
    |
    +----> Share Links (parameter vector + engine version serialization)
              |
              +----> Gallery (stored share links + metadata)
                        |
                        +----> Browse / Filter / Report
```

### Dependency Notes

- **Analysis Pipeline requires Input Canonicalization:** NFC normalization, stable JSON key ordering, URL normalization must exist before analysis produces consistent results.
- **All rendering and display features require the Parameter Vector:** The vector is the universal intermediate representation. Nothing visual can happen without it.
- **Translation Panel requires Parameter Provenance Tracking:** Each parameter must carry metadata about which signals contributed to its value and with what weights.
- **Compare Mode requires Share Links:** You need a way to reference two artworks to compare them. Share link infrastructure provides the addressing scheme.
- **Gallery requires Share Links:** Gallery entries are stored share links with additional metadata (title, style, creation date).
- **SVG Export requires Geometric or Typographic renderer:** Only these styles produce vector output. Organic and Particle styles are inherently raster.
- **High-res PNG Export requires Server-side Rendering:** Client-side canvas may have anti-aliasing differences across browsers. Server-side rendering (Node canvas or headless browser) guarantees deterministic output at 4096x4096.
- **Style Mini-Previews require the Rendering Engine:** Must render the same parameters through all 4 style engines at thumbnail resolution.
- **URL Analysis requires SSRF Protection:** URL input fetches external resources server-side. SSRF protection (block private IPs, DNS rebinding prevention) is a hard prerequisite, not an add-on.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the core value proposition: "any input deterministically produces beautiful, unique artwork with transparent translation rules."

- [ ] **Text input with real-time canvas rendering** -- the core loop. Type text, see art. This alone is demo-worthy.
- [ ] **One rendering style (Geometric)** -- Geometric is the most reliable to implement (grid-based, no noise functions, no physics), produces striking Mondrian-meets-data-viz output, and supports both Canvas and SVG.
- [ ] **Deterministic pipeline** -- Seeded PRNG, input canonicalization, engine versioning from day one. Retrofitting determinism is impossible.
- [ ] **Parameter vector with translation panel** -- The key differentiator. Without this, it is just another art generator. With it, every artwork tells a story.
- [ ] **OKLCH palette generation** -- Bad colors kill the entire visual impression. Perceptual color space from day one.
- [ ] **PNG export (standard resolution)** -- Users must be able to save and share their art.
- [ ] **Share links (parameters only)** -- The viral mechanism. No share links = no organic growth.
- [ ] **Dark mode UI with responsive layout** -- Table stakes for a 2026 web app.
- [ ] **Quick-start buttons** -- Eliminates blank-canvas paralysis. Critical for first-time experience.
- [ ] **Loading / progress animation** -- Turns processing time into delight rather than frustration.

### Add After Validation (v1.x)

Features to add once the core loop is proven and people are actually using it.

- [ ] **Remaining rendering styles (Organic, Particle, Typographic)** -- Add one at a time. Each requires its own composition laws, performance tuning, and visual quality bar.
- [ ] **Style selector with mini-previews** -- Only valuable once there are multiple styles to choose from.
- [ ] **URL input analysis** -- Second input type. Requires SSRF protection, web scraping, and text extraction pipeline.
- [ ] **CSV/JSON data input analysis** -- Third input type. Requires statistical analysis (distributions, correlations, cardinality).
- [ ] **High-res PNG export (4096x4096)** -- Server-side re-rendering. Needs backend infrastructure.
- [ ] **SVG export** -- For Geometric and Typographic styles. Adds vector output path alongside raster.
- [ ] **Gallery with browse/filter** -- Only build once there are enough creations to browse. Requires database (PostgreSQL + Drizzle).
- [ ] **Compare mode** -- High-value differentiator but depends on share link infrastructure and a second input flow.
- [ ] **Local-only mode indicator** -- Explicit privacy messaging for text input (already processed client-side, just need the UI indicator).

### Future Consideration (v2+)

Features to defer until the product has proven its value.

- [ ] **Animated renders** (particle drift, organic flow) -- Stretch goal per PROJECT.md. Complex determinism challenges with frame timing.
- [ ] **Abstract Landscape rendering style** -- Fifth style, stretch goal.
- [ ] **Song title input** -- API-dependent, per PROJECT.md out of scope.
- [ ] **Public API for embedding** -- Only if external demand materializes.
- [ ] **Artwork of the Day** -- Gallery curation feature, requires active community.
- [ ] **Version toggle on saved pieces** -- Engine version migration display.
- [ ] **Frame option for exports** -- Low complexity but low priority. Nice polish feature.
- [ ] **Calibration dashboard** -- Internal tool for tuning normalization with reference inputs.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Text input + canvas rendering | HIGH | MEDIUM | P1 |
| Deterministic pipeline (seeded PRNG, canonicalization) | HIGH | HIGH | P1 |
| Geometric rendering style | HIGH | MEDIUM | P1 |
| Parameter vector + translation panel | HIGH | HIGH | P1 |
| OKLCH palette generation | HIGH | MEDIUM | P1 |
| PNG export (standard) | HIGH | LOW | P1 |
| Share links | HIGH | LOW | P1 |
| Dark mode + responsive layout | MEDIUM | LOW | P1 |
| Quick-start buttons | MEDIUM | LOW | P1 |
| Progress animation | MEDIUM | LOW | P1 |
| Organic rendering style | HIGH | HIGH | P2 |
| Particle rendering style | MEDIUM | HIGH | P2 |
| Typographic rendering style | MEDIUM | HIGH | P2 |
| URL input analysis | MEDIUM | HIGH | P2 |
| CSV/JSON data input analysis | MEDIUM | HIGH | P2 |
| Style selector with mini-previews | MEDIUM | MEDIUM | P2 |
| High-res PNG export (4096x4096) | MEDIUM | MEDIUM | P2 |
| SVG export | MEDIUM | MEDIUM | P2 |
| Gallery (browse, filter, report) | MEDIUM | MEDIUM | P2 |
| Compare mode | MEDIUM | MEDIUM | P2 |
| Local-only mode indicator | LOW | LOW | P2 |
| Frame option | LOW | LOW | P3 |
| Animated renders | LOW | HIGH | P3 |
| Abstract Landscape style | LOW | HIGH | P3 |
| Song title input | LOW | HIGH | P3 |
| Public API | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- validates core value proposition
- P2: Should have, add iteratively after core is proven
- P3: Nice to have, future consideration only

## Competitor Feature Analysis

| Feature | Zazow | Art Blocks / fxhash | p5.js Editor | NightCafe | Identicons | **Synesthesia Machine** |
|---------|-------|---------------------|--------------|-----------|------------|-------------------------|
| Input type | None (manual controls) | Hash seed (blockchain tx) | Code | Text prompt | Text/email hash | Text, URL, CSV/JSON |
| Deterministic output | Yes (same params = same art) | Yes (hash-based) | Yes (if seeded) | No (AI-based) | Yes | **Yes (core promise)** |
| Multiple styles | 6 algorithmic styles | Per-project (artist-defined) | Unlimited (code) | AI models | 1 (geometric grid) | 4 built-in styles |
| Transparency / explanation | None | Parameter display | Full source code | None (black box) | None | **Full translation panel with provenance** |
| Parameter controls | Sliders per style | fx(params) at mint time | Code editing | Prompt engineering | None | Automatic from input |
| Export PNG | Yes (paid hi-res) | Screenshot only | Yes | Yes | Yes | Yes (free, incl. hi-res) |
| Export SVG | No | No | Manual | No | No | **Yes (vector styles)** |
| Gallery / community | Yes (community gallery) | Yes (marketplace) | Yes (user sketches) | Yes (challenges, Discord) | No | Yes (opt-in, private-default) |
| Share links | Limited | Blockchain permalink | Yes (sketch URL) | Yes | No | **Yes (params-only, privacy-preserving)** |
| Mobile support | Basic | Basic | Limited | Yes | N/A | **Mobile-first responsive** |
| Compare / diff | No | No | No | No | No | **Yes (side-by-side + param diff)** |
| Privacy model | Standard | Blockchain (public) | Public sketches | Standard | Hash-based (private) | **Private-by-default, raw input never stored** |
| Accessibility | Unknown | Limited | Partial | Unknown | N/A | **Full (keyboard nav, alt text, reduced motion)** |
| Data input | No | No | Possible via code | No | No | **Yes (CSV/JSON statistical analysis)** |

### Key Competitive Insights

1. **No competitor combines determinism + transparency + multi-modal input.** Each competitor has one or two of these properties, never all three. This is the unique positioning.

2. **The translation panel has no equivalent.** Art Blocks shows a hash, fxhash shows parameters, but nobody explains the mapping from input to visual output in plain English. This is the feature most likely to generate word-of-mouth.

3. **Data-as-art is underserved.** Converting CSV/JSON to artwork currently requires programming (Processing, d3.js, R). Making it one-click is a genuine gap in the market.

4. **Privacy is an untapped differentiator.** In an era of AI art generators that train on user input, explicitly promising "your text never leaves your browser" (for text mode) and "raw input never stored" (for all modes) is a powerful trust signal.

5. **Free high-res export is unusual.** Zazow charges for it. Most AI generators limit resolution or watermark. Offering free 4096x4096 export removes a significant friction point.

## Sources

- [Zazow - Algorithmic Generative Art](https://www.zazow.com/) - Direct competitor analysis, 6 algorithmic styles with community gallery
- [fxhash - Generative Art on Blockchain](https://www.fxhash.xyz/) - fx(params) feature for collector-customizable parameters
- [Art Blocks and the Data of Generative Art](https://www.rightclicksave.com/article/art-blocks-and-the-data-of-generative-art) - Blockchain-based generative art platform analysis
- [p5.js Web Editor](https://editor.p5js.org/) - Creative coding tool with sharing and community features
- [NightCafe AI Art Generator](https://creator.nightcafe.studio/) - AI art platform with community challenges and sharing
- [Variable.io - Generative and Data Art](https://variable.io/generative-and-data-art/) - Data-driven art studio approach and philosophy
- [Generative Art Synthesizer](https://emh.io/gas/) - Real-time parameter shaping with slider controls
- [Awesome Identicons](https://github.com/drhus/awesome-identicons) - Curated list of deterministic hash visualization tools
- [Jdenticon](https://jdenticon.com/) - Open source identicon generator (deterministic geometric avatars)
- [Enter FxParams: Customisable Blockchain Art](https://www.gorillasun.de/blog/enter-fxhash-params/) - Detailed analysis of fxhash parameter customization
- [GENUARY 2026](https://genuary.art/) - Annual generative art community event showing current trends
- [CSS-Tricks: Generative Art with SVG and PNG Export](https://css-tricks.com/lets-make-generative-art-we-can-export-to-svg-and-png/) - Technical approach to dual-format export
- [FlowingData: Data Art](https://flowingdata.com/category/visualization/artistic-visualization/) - Data-driven artistic visualization examples
- [Git-Hash-Art](https://github.com/gfargo/git-hash-art) - Deterministic abstract art from git commit hashes (closest existing concept to Synesthesia Machine)

---
*Feature research for: Deterministic generative art web application (Synesthesia Machine)*
*Researched: 2026-03-02*
