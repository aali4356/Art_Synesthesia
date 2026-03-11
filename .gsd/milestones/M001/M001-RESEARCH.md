# Project Research Summary

**Project:** Synesthesia Machine
**Domain:** Deterministic generative art web application (multi-modal input-to-artwork pipeline)
**Researched:** 2026-03-02
**Confidence:** HIGH (stack, features, architecture), MEDIUM-HIGH (pitfalls, NLP layer)

## Executive Summary

Synesthesia Machine is a deterministic generative art platform with a unique three-part value proposition: any input (text, URL, or structured data) produces beautiful artwork through a transparent, reproducible algorithm. No competitor combines all three properties simultaneously — Zazow has determinism but no transparency, Art Blocks has transparency but blockchain-only seeds, AI generators have neither. The recommended approach is a Next.js 16 monolith on Vercel (no Python microservice for v1) with a strict pipeline architecture that separates canonicalization, analysis, normalization, and rendering into independently versioned, composable stages. The parameter vector — a fixed 15-dimension 0-to-1 representation of any input — is the core architectural insight that makes the translation panel, style switching, compare mode, and deterministic sharing all possible from a single intermediate representation.

The hardest engineering challenge is also the primary differentiator: genuine determinism. Cross-browser canvas rendering differs at the pixel level by design (canvas fingerprinting is real), PRNG seeding has silent failure modes, and engine versioning must be built into the data model from day one or saved art will silently change after any deployment. The recommended mitigation is to define determinism at the parameter level (not the pixel level) and use server-side rendering with a pinned environment for all canonical outputs (exports, gallery thumbnails, OG preview images). The text analysis layer (NLP, statistical features) is the only area of meaningful uncertainty — JavaScript NLP libraries are adequate for this project's needs but not deep-learning-grade. The pipeline architecture makes swapping to a Python microservice additive, not structural.

The MVP is narrower than it might seem: text input, one rendering style (Geometric), the full parameter vector with translation panel, share links, and PNG export. This is enough to validate the core value proposition. Everything else — additional styles, URL/data input, gallery, compare mode — is post-validation scope that the architecture already supports. Building calibration infrastructure and the adversarial test suite before writing analysis code is non-negotiable; retrofitting either is expensive and breaks reproducibility guarantees.

## Key Findings

### Recommended Stack

The stack is unified around Next.js 16 on Vercel with no separate deployment targets for v1. TypeScript 5.9 with Zod 4 enforces the parameter vector contract across client and server. Tailwind CSS 4 with shadcn/ui provides the component layer. The rendering stack uses native Canvas 2D API and SVG in the browser, with node-canvas 3.2 (Cairo-backed) for server-side exports. Color generation uses culori 4.0 for perceptual OKLCH operations. The seeded PRNG is seedrandom (Alea algorithm) — battle-tested with state serialization, 4M+ weekly npm downloads, and preferred over raw xoshiro256** (requires BigInt) or Mulberry32 (no maintained npm package). The NLP stack is entirely Node.js: wink-nlp for the core pipeline, compromise for supplementary POS analysis, syllable for rhythm features, and simple-statistics for data input. This enables the local-only mode where text analysis runs entirely in the browser with zero server requests. Upstash Redis handles rate limiting (serverless-compatible). PostgreSQL 16 with Drizzle ORM 0.45 (stable, not v1-beta) handles persistence.

**Core technologies:**
- Next.js 16 + React 19: full-stack framework — Vercel-optimized, App Router with Server Components for gallery/sharing, API routes for analysis
- TypeScript 5.9 + Zod 4: type safety — enforces parameter vector schema and pipeline contracts end-to-end; 57% smaller Zod bundle than v3
- Tailwind CSS 4 + shadcn/ui: UI — Lightning CSS engine, native OKLCH support, zero-config, accessible component primitives
- culori 4.0: OKLCH color operations — full CSS Color Level 4 support with perceptual clamping; better than chroma.js for this use case
- seedrandom (Alea): seeded PRNG — battle-tested state serialization, avoids BigInt overhead of xoshiro256**
- wink-nlp 2.3 + compromise 14: NLP pipeline — 650K tokens/sec, runs in browser (enables local-only mode), adequate for lexicon-based analysis
- simple-statistics 7.8: statistical analysis — covers all needs for CSV/JSON input normalization; zero dependencies
- Drizzle ORM 0.45 + PostgreSQL 16: persistence — SQL-like API, JSONB for parameter storage, no ORM abstraction overhead
- node-canvas 3.2: server-side rendering — Cairo-backed, required for deterministic 4096x4096 exports
- Upstash Redis + @upstash/ratelimit: rate limiting — serverless-compatible, sliding window, 10/IP/hour for URLs

**Critical version warnings:**
- Do NOT use Drizzle ORM v1-beta (API unstable) — use 0.45.x stable
- Do NOT use TypeScript 6.0 beta (bridge to Go-based TS 7.0) — use 5.9.x
- node-canvas requires Cairo as a system dependency — verify on Vercel early in development

### Expected Features

The feature research identifies a three-tier structure with clear MVP boundaries. The core product loop (text input → parameter vector → rendering → translation panel → share link) validates the entire value proposition. Multiple styles, additional input types, and social features are post-validation scope.

**Must have (table stakes — users expect these):**
- Text input with real-time canvas rendering — the core loop; must feel instant (<500ms parse + render)
- Multiple rendering styles (4 for v1) — enough variety; Geometric first as most reliable
- PNG export (standard resolution) — one-click, prominent button
- Dark mode UI with responsive layout — standard for 2026 creative tools; dark backgrounds make generated colors pop
- Share link / permalink — viral mechanism; parameters-only (never raw input); OG meta tags for social preview
- Gallery / explore page — opt-in saves only; browse by style; private-by-default

**Should have (competitive differentiators):**
- Determinism guarantee — the core product promise; no competitor offers this for rich artwork (only identicons)
- Translation panel — transparent per-parameter provenance; no competitor explains *why* art looks the way it does
- Multi-modal input (URL, CSV/JSON) — data-as-art is only possible via programming today; making it one-click is the gap
- Compare mode — side-by-side parameter diff; no generative art tool offers this; highly shareable
- Style selector with live mini-previews — see your input in all 4 styles simultaneously as thumbnails
- SVG export for vector styles — free infinite-scale export; Zazow charges for high-res; most tools cap at screen resolution
- High-res PNG export (4096x4096) — server-side re-render; free vs. paid at Zazow
- Local-only mode for text — privacy feature; "your text never leaves your browser" is a strong trust signal
- Quick-start buttons + "Surprise me" — eliminates blank-canvas paralysis; teaches input diversity

**Defer (v2+):**
- Animated / video exports — determinism challenges with frame timing; not aligned with "static art" thesis
- Song / audio input — API-dependent; text input of lyrics is a workaround
- User accounts / auth — massive scope; share links serve the use case without GDPR obligations
- Social features (comments, likes, follows) — scope explosion; gallery + external sharing links covers v1
- User-uploaded custom renderers — sandboxing complexity; turns the app into a platform

### Architecture Approach

The architecture is a typed sequential pipeline (`canonicalize → analyze → normalize → render`) where each stage is a pure function with explicit input/output types and an independent version number. The `ParameterVector` — a fixed 15-dimension TypeScript interface with 0-1 floats — is the boundary contract between the analysis side and the rendering side. These two subsystems share only this type definition and can be developed, tested, and versioned completely independently. All rendering code accepts a `CanvasRenderingContext2D` parameter and never touches the DOM, enabling isomorphic execution: browser canvas, node-canvas for exports, and test environments all work identically. The project structure separates `lib/pipeline/` (pure, no framework imports, runs anywhere), `lib/render/` (framework-agnostic, accepts context), `server/` (server-only: DB, cache, SSRF, rate limiting), and `components/` (UI only, no business logic).

**Major components:**
1. Canonicalizer — pure function per input type; produces stable deterministic form; SHA-256 input hash; must handle Unicode NFC, JSON key ordering, URL normalization
2. Analyzer — strategy pattern per input type (text: NLP features, URL: scrape + NLP, data: statistics); raw features output; versioned independently
3. Normalizer — quantile-based mapping to 0-1 parameter vector; calibration data is external (not hardcoded); versioned with calibration corpus
4. Provenance Generator — per-parameter signal tracking with weights and plain-English explanations; computed alongside normalization
5. Rendering Engine — strategy pattern (GeometricRenderer, OrganicRenderer, ParticleRenderer, TypographicRenderer); all implement common `Renderer` interface; seeded PRNG passed as dependency (never global)
6. Export Service — server-side node-canvas; identical rendering code as client (isomorphic); 4096x4096 PNG and SVG
7. Gallery/Social — PostgreSQL + Drizzle; stores parameters only (never raw input); opaque UUID share links

### Critical Pitfalls

1. **Cross-browser canvas non-determinism** — Accept that client rendering will differ cosmetically across browsers; this is unavoidable and documented in canvas fingerprinting literature. Define determinism at the parameter level, not the pixel level. Use server-side rendering with a pinned Skia environment for all canonical outputs (exports, thumbnails, OG images). Establish this architecture in Phase 1, not as a retrofit.

2. **PRNG seeding that silently breaks determinism** — Ban `Math.random()` with an ESLint lint rule from day one across the entire `lib/render/` directory. All randomness flows through the seeded PRNG instance passed explicitly as a function argument. Use seedrandom's Alea (avoids 64-bit BigInt precision loss of xoshiro256**). Write snapshot tests: pin 5+ seed/parameter combinations per style and assert PRNG call count and output hash remain identical after refactors.

3. **Normalization calibration producing clustered/boring art** — Design the calibration corpus deliberately with extreme inputs (single character, 10KB essay, emoji-only, code snippets, non-Latin scripts). After calibration, verify parameter distribution histograms show spread across the full 0-1 range per dimension. If any dimension has >50% of values in a 0.2-wide band, the calibration is biased. Version the calibration dataset alongside the normalizer version.

4. **NLP analysis failing on short/unusual inputs** — Short text (<20 chars), emoji strings, non-English text, and code snippets all degrade NLP accuracy severely. Use NLP features as contributing signals, never dominant parameters. Implement input-length-aware weighting that attenuates NLP contribution for short inputs. Weight character-level statistics (entropy, frequency distribution) more heavily because they are robust across input types and lengths.

5. **Engine versioning that breaks saved art** — Store the full version tuple (analyzerVersion + normalizerVersion + rendererVersion) alongside every saved parameter set and share link from day one. Use a registry pattern for renderers (`renderers['geometric-v1']`, `renderers['geometric-v2']`). Add CI tests that generate art for pinned seeds and fail if output hashes change without a version increment. Version at the style level, not the engine level.

6. **SSRF vulnerability in URL input** — Resolve hostname to IP before making the request, then validate the resolved IP against private ranges (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x, ::1, fc00::/7). Pin the resolved IP for the actual request to prevent DNS rebinding between validation and fetch. Disable automatic redirect following. Block `file:`, `gopher:`, `ftp:`, `data:` schemes. This is a security-critical blocker, not a "nice to have" — do not ship URL input without it.

## Implications for Roadmap

Based on research, the architecture has clear dependency chains that should dictate phase structure. The ParameterVector schema and PRNG infrastructure must exist before any rendering code. Calibration infrastructure must exist before normalization code. SSRF protection must exist before URL analysis code. These are hard prerequisites, not optional setup tasks.

### Phase 1: Foundation and Core Infrastructure

**Rationale:** The ParameterVector type definition is the contract that both sides of the system depend on. The PRNG, canonicalization, and version schema must be established before any rendering or analysis code is written. Retrofitting determinism is not feasible — these are load-bearing architectural decisions. Engine versioning schema must be part of the data model from day one to avoid breaking saved art later.

**Delivers:** Project scaffold with Next.js 16, TypeScript, Tailwind CSS 4; ParameterVector type definition; seeded PRNG (seedrandom/Alea) with ESLint `Math.random()` ban; SHA-256 input hashing; version schema (analyzerVersion, normalizerVersion, rendererVersion, engineVersion); text canonicalizer with Unicode NFC, whitespace normalization; OKLCH palette generation (culori); shared composition rules base.

**Addresses:** Text input (table stake), dark mode + responsive layout (table stake), OKLCH color palette (table stake).

**Avoids:** PRNG seeding errors (ESLint ban + snapshot test infrastructure), engine versioning breaks (version schema defined upfront), canonicalization gaps (test suite with 50+ edge cases), cross-browser non-determinism (server-side rendering architecture decision made now).

**Research flag:** Standard patterns — well-documented Next.js + Tailwind setup, no deeper research needed.

---

### Phase 2: Geometric Renderer + Text Analysis Pipeline (End-to-End MVP Loop)

**Rationale:** Architecture research recommends building one complete end-to-end path before adding styles or input types. Geometric is the correct first style: grid-based, no noise functions, no physics, most reliable to implement, and supports both Canvas and SVG. The calibration harness and normalization tuning must happen before other input types are added. The translation panel is the core differentiator — it must be built alongside the first renderer, not added later.

**Delivers:** Geometric renderer (Canvas + SVG); text analyzer (wink-nlp, compromise, syllable, wink-sentiment); quantile-based normalizer with calibration harness (30+ diverse reference texts); provenance generator; translation panel with plain-English explanations; loading / progress animation (Parsing → Analyzing → Normalizing → Rendering); quick-start buttons + "Surprise me"; PNG export (standard 800x800); share links (opaque UUID, parameters only); dark mode UI.

**Addresses:** Text input + real-time rendering (P1), Geometric style (P1), parameter vector + translation panel (P1, core differentiator), PNG export (P1), share links (P1), quick-start buttons (P1), progress animation (P1).

**Avoids:** NLP accuracy on edge inputs (adversarial test suite built before analysis code), calibration bias (histogram visualization built before tuning), PRNG seeding errors (snapshot tests added when Geometric renderer is built).

**Research flag:** Needs research — calibration tuning methodology, OKLCH gamut clamping in Canvas 2D context (OKLCH must be converted to sRGB for `fillStyle`), wink-nlp API integration for browser local-mode. Consider `/gsd:research-phase` for the NLP calibration approach.

---

### Phase 3: Additional Rendering Styles

**Rationale:** All additional renderers share the base infrastructure (palette, PRNG, composition rules) built in Phase 2. They are independent of each other and can be built in any order. Feature research notes each style needs its own composition laws, performance tuning, and visual quality bar — adding one at a time is safer than building all three in parallel.

**Delivers:** Organic renderer (simplex-noise 4.0, noise field caching); Particle renderer (mobile particle cap via `navigator.hardwareConcurrency`, 1000 mobile / 5000 desktop); Typographic renderer (bundled WOFF2 fonts registered in both client and node-canvas contexts); style selector with mini-preview thumbnails (4x 200x200 renders from same parameter vector); local-only mode UI indicator.

**Addresses:** Remaining rendering styles (P2), style selector with mini-previews (P2), local-only mode indicator (P2).

**Avoids:** Particle performance trap on mobile (particle cap), Perlin noise recalculation per frame (pre-compute noise grid into Float32Array), font rendering inconsistency (bundled WOFF2, no system fonts), tight coupling to browser canvas (renderers accept context, never create it).

**Research flag:** Needs research — Particle style with mobile caps and WebGL2 fallback consideration, Typographic style font loading strategy for node-canvas. Standard patterns for Organic (simplex-noise is well-documented).

---

### Phase 4: URL and Data Input Analysis

**Rationale:** URL and data analyzers are completely independent of each other but both depend on the normalization system being stable (Phase 2). SSRF protection is a hard security prerequisite for URL input — not optional, not "add later." The calibration harness must be expanded to 60+ inputs (15+ URL, 15+ data) before normalization is retuned across all input types. Data analysis (CSV/JSON) requires schema inference and statistical distribution analysis using simple-statistics.

**Delivers:** URL canonicalizer + SSRF protection (IP blocklist, DNS pre-resolution, redirect re-validation, 5s/10s timeouts, 5MB limit); URL scraper (cheerio, readability-style content extraction, robots.txt respect); URL analyzer (text sub-pipeline + URL-specific features: link density, content ratio, page metadata); Data canonicalizer (JSON RFC 8785 key ordering, CSV delimiter/quoting normalization); Data analyzer (simple-statistics: distributions, correlations, cardinality, numeric vs. categorical features); Upstash rate limiting (10 URL analyses/IP/hour); expanded calibration corpus with all three input types; normalization retuning.

**Addresses:** URL input analysis (P2), CSV/JSON data input analysis (P2).

**Avoids:** SSRF vulnerability (full SSRF protection suite with integration tests before URL input goes live), synchronous URL fetching blocking the pipeline (streaming progress updates), calibration bias across input types (per-type calibration with separate distributions).

**Research flag:** Needs research — SSRF protection implementation specifics for Vercel serverless environment, cheerio content extraction approach, CSV schema inference heuristics. High-risk phase, recommend `/gsd:research-phase` for SSRF validation approach.

---

### Phase 5: Gallery, Sharing, and Compare Mode

**Rationale:** Gallery and compare mode both require the database schema and share link infrastructure, which should be built once the core pipeline is stable. The schema design must enforce privacy constraints (parameters only, never raw input) and version-locked rendering from the start. Compare mode depends on share link addressing. Gallery requires enough saved content to be useful.

**Delivers:** PostgreSQL 16 + Drizzle ORM 0.45 schema (gallery_items, analysis_cache, url_snapshots, share_links tables; composite indexes on shareId+engineVersion, galleryId+rendererVersion); gallery browse/filter (cursor-based pagination from the start, not offset-based); opt-in gallery save (10 saves/IP/day rate limit); report/moderation (Unicode-aware profanity filter on titles, not on input); compare mode (side-by-side rendering, parameter vector diff, auto-generated plain-English diff summary); OG meta tags with server-rendered preview images.

**Addresses:** Gallery / explore page (table stake), share links (already built in Phase 2; Phase 5 adds persistence and OG previews), compare mode (P2, high-value differentiator).

**Avoids:** Storing raw input server-side (schema enforces parameters-only storage), share links with parameter values in URL (opaque UUIDs map to stored parameter sets), gallery queries without pagination (cursor-based from start), gallery abuse/spam (rate limiting + profanity filter), CSRF on gallery save endpoints (Next.js server actions provide CSRF by default).

**Research flag:** Standard patterns — Drizzle ORM with PostgreSQL is well-documented. Schema design is straightforward given the data model constraints.

---

### Phase 6: High-Resolution Export, SVG Export, and Polish

**Rationale:** Server-side export is mostly independent of other features but depends on the rendering engine being stable. High-res export (4096x4096) requires node-canvas on the server, which must be verified working on Vercel early (Cairo system dependency). SVG export only applies to Geometric and Typographic styles. Polish items (accessibility, reduced motion, keyboard navigation, frame option) can be done in parallel.

**Delivers:** High-res PNG export (4096x4096, server-side node-canvas, render cache keyed by params hash + style + version + resolution, <3s target); SVG export (Geometric + Typographic renderers); frame option for exports (configurable matte overlay); full keyboard navigation and ARIA attributes; reduced motion support via `useReducedMotion()` hook in Framer Motion; alt text generation for gallery items; cross-browser visual regression testing (Playwright).

**Addresses:** High-res PNG export (P2), SVG export (P2), frame option (P3), accessibility.

**Avoids:** 4096x4096 canvas on client side (always server-side for hi-res), OOM under concurrent export load (load test: 10 concurrent exports, memory monitoring), export looks different than on-screen preview (server-rendered confirmation dialog before download).

**Research flag:** Needs research — node-canvas Cairo dependency on Vercel serverless (may need Railway fallback for export route), concurrent export performance limits. Verify node-canvas works in Vercel environment before committing to architecture.

---

### Phase Ordering Rationale

- **Determinism infrastructure is non-negotiable in Phase 1.** PRNG, canonicalization, version schema, and the ESLint Math.random() ban must exist before any rendering code. There is no retrofitting these.
- **End-to-end first, breadth second.** Phase 2 builds one complete path (text → Geometric → translation panel → share link) before adding styles or input types. This validates the core value proposition early and uncovers calibration issues while the codebase is small.
- **Calibration before normalization code.** The calibration harness must exist and produce histograms before any normalization tuning. Writing normalization code without calibration data produces clustering.
- **SSRF protection before URL input ships.** This is a security blocker, not an optimization. URL analysis cannot go to production without it.
- **Database schema after pipeline is stable.** Building the schema in Phase 5 (not earlier) avoids migration churn while the parameter vector schema is still being tuned in Phases 2-4.
- **Export infrastructure last.** node-canvas export is a polish/enablement feature — it doesn't block the core value proposition and has an uncertain Vercel deployment story that should be investigated early but implemented late.

### Research Flags

Phases needing `/gsd:research-phase` during planning:

- **Phase 2 (NLP calibration):** wink-nlp calibration methodology, input-length-aware weighting approach, adversarial test suite design. NLP calibration is the highest-uncertainty area in the entire project.
- **Phase 4 (SSRF + URL analysis):** SSRF protection implementation on Vercel serverless (DNS pre-resolution approach, pinned IP HTTP client), cheerio content extraction reliability, robots.txt handling. Security-critical, high implementation complexity.
- **Phase 6 (Export infrastructure):** node-canvas Cairo dependency on Vercel (may need Railway for export-only routes), concurrent export load testing methodology.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** Next.js 16 + Tailwind CSS 4 setup is well-documented. TypeScript + Zod patterns are standard. No research needed.
- **Phase 3 (Additional renderers):** simplex-noise, Framer Motion, Canvas 2D API are all well-documented. Organic style is the most complex but the library has good documentation.
- **Phase 5 (Gallery/DB):** Drizzle ORM + PostgreSQL patterns are established. Cursor-based pagination is standard. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework (Next.js 16, TypeScript 5.9, Tailwind 4, Drizzle 0.45) verified against official sources. seedrandom over xoshiro256** decision is well-reasoned. One uncertainty: node-canvas on Vercel (Cairo system dep) — verify during Phase 1. |
| Features | HIGH | Competitor analysis (Zazow, Art Blocks, fxhash, p5.js, NightCafe) is thorough. Feature boundaries are clear. Anti-features are well-argued. MVP definition is focused and defensible. |
| Architecture | HIGH | Pipeline pattern, strategy pattern, and isomorphic rendering are established patterns with clear rationale. One MEDIUM area: the all-Node vs Python microservice decision — justified for portfolio project but NLP quality must be validated during calibration. |
| Pitfalls | MEDIUM-HIGH | Canvas non-determinism, SSRF, and PRNG pitfalls are well-documented with authoritative sources. Calibration bias documentation draws from bioinformatics literature (solid). NLP accuracy degradation is empirically observed but solutions are heuristic. |

**Overall confidence:** HIGH

### Gaps to Address

- **NLP calibration quality:** JavaScript NLP libraries (wink-nlp, compromise) are adequate for the project's stated needs but the exact calibration corpus composition — what 30+ texts to include — is underdefined. This will require iteration in Phase 2 and is the most likely source of "the art all looks the same" feedback.
- **node-canvas on Vercel:** node-canvas requires Cairo as a system dependency. Vercel's serverless function environment supports native modules but this should be verified with a hello-world test in Phase 1, not assumed. If it fails, Railway is the fallback for the export-only API route.
- **skia-canvas vs node-canvas:** Pitfalls research recommends skia-canvas (Skia-backed, matches Chromium) over node-canvas (Cairo-backed) for cross-browser visual parity. Stack research recommends node-canvas. The stack research recommendation prevails for simplicity, but this trade-off should be revisited if server/client visual mismatch becomes a user complaint.
- **Vercel function timeout for exports:** 4096x4096 renders target <3 seconds. Vercel Hobby plan has a 10s function timeout, Pro plan has 60s. This is fine for single renders, but concurrent load testing is needed before shipping high-res export.
- **Calibration harness for URL and data types:** Phase 4 requires 15+ URL and 15+ data reference inputs. Curating diverse, deterministic URLs (URLs that will not change content over time) for calibration is a practical challenge that needs planning before Phase 4 begins.

## Sources

### Primary (HIGH confidence)
- [Next.js Blog](https://nextjs.org/blog) — Next.js 16 release details, React 19 compatibility
- [Drizzle ORM Releases](https://github.com/drizzle-team/drizzle-orm/releases) — v0.45.x stable vs v1-beta status
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — v4 features and performance
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/) — TS 5.9 stable, 6.0 beta timeline
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — SSRF mitigation patterns
- [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) — JSON key ordering standard
- [UAX #15 Unicode Normalization Forms](https://unicode.org/reports/tr15/) — NFC normalization standard
- [Quantile Normalization pitfalls — Nature Scientific Reports](https://www.nature.com/articles/s41598-020-72664-6) — Calibration bias research
- [Canvas Fingerprinting — BrowserLeaks](https://browserleaks.com/canvas) — Cross-browser canvas variance mechanism
- [PRNG shootout — Vigna/Blackman](https://prng.di.unimi.it/) — xoshiro256** reference and limitations

### Secondary (MEDIUM confidence)
- [winkJS Docs](https://winkjs.org/) — NLP pipeline performance benchmarks (MEDIUM: vendor docs)
- [Zazow](https://www.zazow.com/) — Direct competitor feature analysis
- [fxhash](https://www.fxhash.xyz/) — fx(params) feature analysis
- [seedrandom GitHub](https://github.com/davidbau/seedrandom) — Alea PRNG documentation and use
- [Bypassing SSRF Protection — Node.js Security](https://www.nodejs-security.com/blog/bypassing-ssrf-protection-nossrf) — Real SSRF bypass techniques
- [Cheerio vs Puppeteer Comparison](https://proxyway.com/guides/cheerio-vs-puppeteer-for-web-scraping) — Scraping approach rationale
- [Canvas Area Exceeds Maximum Limit — PQINA](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit) — Browser canvas size limits

### Tertiary (reference)
- [Variable.io — Generative and Data Art](https://variable.io/generative-and-data-art/) — Data-driven art philosophy
- [Git-Hash-Art](https://github.com/gfargo/git-hash-art) — Closest existing concept to Synesthesia Machine
- [GENUARY 2026](https://genuary.art/) — Current generative art community trends

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*

# Architecture Research

**Domain:** Deterministic generative art web application (multi-stage input-analysis-rendering pipeline)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                          SYNESTHESIA MACHINE ARCHITECTURE
 ============================================================================

 CLIENT (Next.js App Router)
 +---------------------------------------------------------------------------+
 |                                                                           |
 |  +-----------+    +-----------------+    +---------------------------+    |
 |  | Input     |    | Client-Side     |    | Rendering Engine          |    |
 |  | Layer     |--->| Analysis        |--->| (Canvas 2D / SVG / WebGL)|    |
 |  | (Forms,   |    | (text-only,     |    |                           |    |
 |  |  DnD,     |    |  local mode)    |    | Strategy: Geometric       |    |
 |  |  Tabs)    |    +-----------------+    |          Organic          |    |
 |  +-----------+            |              |          Particle         |    |
 |       |                   |              |          Typographic      |    |
 |       | (URL/Data)        | (text)       +---------------------------+    |
 |       v                   v                          ^                    |
 |  +-----------------------------+                     |                    |
 |  | Server Request              |    +----------------+                    |
 |  | (Route Handler / Server     |    | Parameter Vector                   |
 |  |  Action)                    |    | (fixed 15-dim schema)              |
 |  +-----------------------------+    +----------------+                    |
 |       |                                    ^                              |
 +-------|------------------------------------|--------------+---------------+
         |                                    |              |
         v                                    |              v
 SERVER (Next.js Route Handlers + Python Microservice)       |
 +-----------------------------------------------+    +-----+---------+
 |                                                |    | Export        |
 |  +--------------+    +------------------+      |    | Service       |
 |  | Canonicalizer|--->| Analyzer         |      |    | (node-canvas  |
 |  | (per-type)   |    | (per-type)       |      |    |  / sharp)     |
 |  +--------------+    +------------------+      |    | 4096x4096     |
 |       |                    |                   |    +---------------+
 |       v                    v                   |
 |  +--------------+    +------------------+      |
 |  | Input Hash   |    | Raw Features     |      |
 |  | (SHA-256)    |    | (type-specific)  |      |
 |  +--------------+    +------------------+      |
 |                            |                   |
 |                            v                   |
 |                  +------------------+          |
 |                  | Normalizer       |          |
 |                  | (quantile-based, |          |
 |                  |  versioned)      |          |
 |                  +------------------+          |
 |                            |                   |
 |                            v                   |
 |                  +------------------+          |
 |                  | Provenance       |          |
 |                  | Generator        |          |
 |                  +------------------+          |
 |                            |                   |
 +----------------------------+-------------------+
                              |
                              v
 DATA LAYER (PostgreSQL + Drizzle ORM)
 +-----------------------------------------------+
 |  +----------+  +----------+  +----------+     |
 |  | Gallery  |  | Analysis |  | URL      |     |
 |  | Items    |  | Cache    |  | Snapshots|     |
 |  +----------+  +----------+  +----------+     |
 +-----------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Input Layer** | Collect and validate user input (text, URL, CSV/JSON). Provide type tabs, drag-and-drop, quick-start buttons. | React components in Next.js App Router. Client Components for interactive forms. |
| **Canonicalizer** | Normalize input into a deterministic form per type (NFC text, sorted JSON keys, normalized URLs). Produces stable hash. | Pure functions, one per input type. Runs server-side for URL/data, client-side for text in local mode. |
| **Analyzer** | Extract raw features from canonicalized input. Text: NLP signals. URL: scrape + NLP. Data: statistics. | Strategy pattern -- one analyzer per input type. Python microservice (FastAPI) for NLP/stats, or Node.js with natural/simple-statistics. |
| **Normalizer** | Map raw features to 0-1 parameter vector using quantile-based scaling against calibration distributions. | Shared module, versioned independently. Stores calibration data. Pure function: `(rawFeatures, calibration) => ParameterVector`. |
| **Provenance Generator** | Track per-parameter signal contributions with weights and plain-English explanations. | Computed alongside normalization. Output: `ParameterProvenance[]` array. |
| **Parameter Vector** | Fixed 15-dimension intermediate representation (0-1 floats). The "DNA" of the artwork. | TypeScript interface with named fields (not dynamic keys). Serializable to JSON. |
| **Rendering Engine** | Interpret parameter vector visually. Multiple styles share the interface but produce different output. | Strategy pattern. Each renderer implements a common `Renderer` interface. Seeded PRNG (Mulberry32) for all randomness. |
| **Export Service** | Server-side high-resolution re-rendering (4096x4096 PNG, SVG for vector styles). | node-canvas or @napi-rs/canvas on the server. Reuses identical rendering code as client. |
| **Gallery/Social** | Persist shared artworks, browse, compare, moderate. | PostgreSQL + Drizzle ORM. Route Handlers for CRUD. Parameters-only storage (no raw input). |
| **Cache Layer** | Avoid recomputing analyses and renders. Three-tier: analysis, render, URL snapshot. | Keyed by inputHash + version components. Database-backed for durability, in-memory for hot path. |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── (main)/                   # Main app route group
│   │   ├── page.tsx              # Home / generator page
│   │   ├── layout.tsx            # Main layout with dark mode
│   │   └── loading.tsx           # Suspense boundary
│   ├── art/
│   │   └── [shareId]/
│   │       └── page.tsx          # Shared artwork view
│   ├── gallery/
│   │   └── page.tsx              # Public gallery browse
│   ├── compare/
│   │   └── page.tsx              # Side-by-side comparison
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # POST /api/analyze
│   │   ├── artwork/
│   │   │   └── [shareId]/
│   │   │       └── route.ts      # GET /api/artwork/:shareId
│   │   ├── gallery/
│   │   │   └── route.ts          # GET/POST /api/gallery
│   │   ├── export/
│   │   │   └── route.ts          # POST /api/render-export
│   │   └── compare/
│   │       └── route.ts          # GET /api/compare
│   └── layout.tsx                # Root layout
│
├── lib/                          # Shared business logic (engine-agnostic)
│   ├── pipeline/                 # The core pipeline
│   │   ├── canonicalize/
│   │   │   ├── index.ts          # Dispatcher: input type -> canonicalizer
│   │   │   ├── text.ts           # NFC, whitespace, newline normalization
│   │   │   ├── url.ts            # URL normalization
│   │   │   ├── json.ts           # Stable key ordering, number formatting
│   │   │   └── csv.ts            # Delimiter, quoting, column sorting
│   │   ├── analyze/
│   │   │   ├── index.ts          # Dispatcher: input type -> analyzer
│   │   │   ├── text.ts           # NLP: sentiment, entropy, syllables, etc.
│   │   │   ├── url.ts            # Scrape + text analysis + page metadata
│   │   │   ├── data.ts           # Statistical analysis for CSV/JSON
│   │   │   └── types.ts          # RawFeatures interfaces per type
│   │   ├── normalize/
│   │   │   ├── index.ts          # Quantile-based normalizer
│   │   │   ├── calibration.ts    # Reference distributions
│   │   │   └── provenance.ts     # Signal tracking + explanations
│   │   └── types.ts              # ParameterVector, VersionInfo, etc.
│   │
│   ├── render/                   # Rendering engine
│   │   ├── index.ts              # Renderer dispatcher / factory
│   │   ├── base.ts               # Abstract base: palette, PRNG, composition
│   │   ├── geometric.ts          # Geometric style renderer
│   │   ├── organic.ts            # Organic style renderer
│   │   ├── particle.ts           # Particle style renderer
│   │   ├── typographic.ts        # Typographic style renderer
│   │   ├── palette.ts            # OKLCH palette generation + coherence
│   │   ├── prng.ts               # Seeded Mulberry32 / xoshiro256**
│   │   └── composition.ts        # Shared composition rules (margins, caps)
│   │
│   ├── hash.ts                   # SHA-256 hashing utilities
│   ├── version.ts                # Engine/analyzer/normalizer/renderer versions
│   └── constants.ts              # Parameter names, limits, defaults
│
├── server/                       # Server-only code
│   ├── db/
│   │   ├── index.ts              # Drizzle client initialization
│   │   ├── schema.ts             # Drizzle schema (gallery, cache, snapshots)
│   │   └── migrations/           # SQL migrations
│   ├── export/
│   │   └── renderer.ts           # Server-side canvas (node-canvas) rendering
│   ├── cache/
│   │   └── index.ts              # Analysis/render/snapshot cache logic
│   ├── security/
│   │   ├── ssrf.ts               # IP blocking, DNS rebinding prevention
│   │   └── rate-limit.ts         # Per-IP rate limiting
│   └── scraper/
│       └── index.ts              # URL fetching + content extraction (Cheerio)
│
├── components/                   # React UI components
│   ├── input/
│   │   ├── InputArea.tsx         # Main input container with tabs
│   │   ├── TextInput.tsx         # Textarea for text input
│   │   ├── UrlInput.tsx          # URL input field
│   │   ├── DataInput.tsx         # File drop zone + paste area
│   │   └── QuickStart.tsx        # Try buttons + Surprise Me
│   ├── canvas/
│   │   ├── ArtCanvas.tsx         # Main canvas wrapper + progressive render
│   │   ├── StyleSelector.tsx     # Thumbnail-based style picker
│   │   └── FrameToggle.tsx       # Export frame option
│   ├── panel/
│   │   ├── TranslationPanel.tsx  # Parameter bars + provenance display
│   │   └── ParameterBar.tsx      # Single parameter visualization
│   ├── gallery/
│   │   ├── GalleryGrid.tsx       # Gallery card grid
│   │   ├── GalleryCard.tsx       # Single gallery item
│   │   └── GalleryFilters.tsx    # Style filter + sort controls
│   ├── compare/
│   │   ├── CompareView.tsx       # Side-by-side layout
│   │   └── ParameterDiff.tsx     # Parameter diff visualization
│   ├── actions/
│   │   ├── ShareButton.tsx       # Generate share link
│   │   ├── DownloadButton.tsx    # PNG/SVG export trigger
│   │   └── SaveToGallery.tsx     # Opt-in gallery save
│   ├── progress/
│   │   └── PipelineProgress.tsx  # Staged progress animation
│   └── layout/
│       ├── Header.tsx
│       ├── ThemeToggle.tsx       # Dark/light mode
│       └── Footer.tsx
│
├── hooks/                        # Custom React hooks
│   ├── usePipeline.ts            # Orchestrates analyze -> normalize -> render
│   ├── useCanvas.ts              # Canvas ref management + rendering loop
│   ├── useReducedMotion.ts       # prefers-reduced-motion detection
│   └── useLocalMode.ts           # Client-side analysis toggle
│
└── styles/                       # Global styles
    └── globals.css               # Tailwind base + custom properties
```

### Structure Rationale

- **`lib/pipeline/`:** The core deterministic pipeline (canonicalize -> analyze -> normalize) is isolated from React, Next.js, and the server. This is the most critical code. It must be pure, testable, and sharable between client (local mode) and server. No framework imports here.
- **`lib/render/`:** Rendering engines are also framework-agnostic. They operate on a `CanvasRenderingContext2D` (or SVG builder) and a `ParameterVector`. This allows the same code to run in browser canvas, node-canvas for exports, and test environments.
- **`server/`:** Server-only concerns -- database, caching, SSRF protection, URL scraping, rate limiting. Never imported by client bundles. Next.js tree-shaking handles this when files are only imported in Route Handlers.
- **`components/`:** UI only. No business logic. Components receive parameters and call hooks. Organized by feature area, not by component type.
- **`hooks/`:** Orchestration layer between UI and business logic. `usePipeline` is the primary hook that wires the entire generation flow together.
- **`app/api/`:** Thin Route Handlers that validate input, call `lib/` functions, manage caching via `server/`, and return responses. No business logic in route files.

## Architectural Patterns

### Pattern 1: Pipeline Pattern (Sequential Stage Processing)

**What:** The core generation flow is a typed pipeline where each stage transforms data and passes it forward. Each stage is a pure function with explicit input/output types. Stages compose left-to-right: `canonicalize -> analyze -> normalize -> render`.

**When to use:** The entire input-to-artwork flow. Every generation request passes through this pipeline.

**Trade-offs:** Very testable (each stage is independently testable). Easy to version (each stage has its own version). Slightly more boilerplate than a monolithic function, but the determinism guarantees demand this separation.

**Example:**
```typescript
// lib/pipeline/types.ts
interface PipelineInput {
  type: "text" | "url" | "data";
  content: string;
  mode?: "snapshot" | "live";
}

interface PipelineResult {
  parameters: ParameterVector;
  provenance: ParameterProvenance[];
  metadata: AnalysisMetadata;
  hash: string;
  version: VersionInfo;
}

// lib/pipeline/index.ts
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  // Stage 1: Canonicalize
  const canonical = canonicalize(input.type, input.content);
  const hash = await sha256(canonical);

  // Stage 2: Analyze (type-specific)
  const rawFeatures = await analyze(input.type, canonical);

  // Stage 3: Normalize (shared across all types)
  const { parameters, provenance } = normalize(rawFeatures, CALIBRATION_DATA);

  // Stage 4: Version stamp
  const version = getCurrentVersionInfo();

  return { parameters, provenance, metadata: { inputType: input.type, inputHash: hash, ... }, hash, version };
}
```

### Pattern 2: Strategy Pattern (Pluggable Renderers)

**What:** Each rendering style (Geometric, Organic, Particle, Typographic) implements a common `Renderer` interface. The system selects the active renderer at runtime based on user choice. All renderers receive the same `ParameterVector` and produce output on the same canvas context.

**When to use:** All rendering operations. Style switching. Thumbnail generation. Server-side export.

**Trade-offs:** Adding new styles requires only implementing the interface, not modifying existing code (Open/Closed Principle). The interface contract enforces determinism requirements (seeded PRNG, composition laws). Each renderer can be developed and tested in isolation.

**Example:**
```typescript
// lib/render/base.ts
interface Renderer {
  readonly name: string;
  readonly supportsVector: boolean; // true = can export SVG

  render(
    ctx: CanvasRenderingContext2D,
    params: ParameterVector,
    seed: string,
    options: RenderOptions
  ): void;

  renderSVG?(
    params: ParameterVector,
    seed: string,
    options: RenderOptions
  ): string; // SVG markup
}

interface RenderOptions {
  width: number;
  height: number;
  animate: boolean;       // false for exports, prefers-reduced-motion
  frame: boolean;         // border matte
  onProgress?: (stage: string, pct: number) => void;
}

// lib/render/index.ts
const renderers: Record<string, Renderer> = {
  geometric: new GeometricRenderer(),
  organic: new OrganicRenderer(),
  particle: new ParticleRenderer(),
  typographic: new TypographicRenderer(),
};

export function getRenderer(style: string): Renderer {
  const renderer = renderers[style];
  if (!renderer) throw new Error(`Unknown style: ${style}`);
  return renderer;
}
```

### Pattern 3: Seeded PRNG Isolation (Determinism Boundary)

**What:** All randomness in rendering is provided by a seeded PRNG instance scoped to each render call. The PRNG is created from `SHA-256(canonicalized_input + styleName + engineVersion)` and passed through as a dependency -- never accessed as a global. This ensures identical inputs produce identical outputs.

**When to use:** Every rendering code path. Palette generation. Shape placement. Noise generation. Anything that needs "random" values.

**Trade-offs:** Requires discipline -- every function that needs randomness must receive the PRNG instance as a parameter. No fallback to `Math.random()`. Worth it because determinism is a core product promise.

**Example:**
```typescript
// lib/render/prng.ts
export function createPRNG(seed: string): () => number {
  // Mulberry32: fast, good distribution, 32-bit state
  let h = cyrb53Hash(seed);
  return function(): number {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage in renderer -- PRNG passed explicitly, never global
class GeometricRenderer implements Renderer {
  render(ctx: CanvasRenderingContext2D, params: ParameterVector, seed: string, options: RenderOptions) {
    const random = createPRNG(seed);
    const palette = generatePalette(params, random);  // random passed in
    const grid = computeGrid(params, random);          // random passed in
    drawShapes(ctx, grid, palette, random);             // random passed in
  }
}
```

### Pattern 4: Client/Server Isomorphic Pipeline (Local Mode)

**What:** The text analysis pipeline is designed to run in both environments. For "local-only mode," the entire `canonicalize -> analyze -> normalize` chain runs in the browser with zero server requests. For URL and data inputs, it runs server-side. The pipeline code in `lib/pipeline/` has no Node.js or browser-specific dependencies.

**When to use:** Text input in local/private mode (client-side). All input types on server (Route Handlers).

**Trade-offs:** Forces the text analyzer to use only browser-compatible libraries (AFINN lexicon as a static JSON, pure-JS syllable counting, etc.). Limits NLP sophistication for text -- but the spec explicitly says lexicon-based sentiment is sufficient. URL and data analyzers are server-only and can use heavier libraries.

### Pattern 5: Version-Keyed Caching

**What:** Every cached result is keyed by a composite of input hash + relevant version numbers. When any pipeline stage version bumps, affected cache entries naturally become misses. No manual cache invalidation needed.

**When to use:** Analysis cache, render cache, URL snapshot cache.

**Trade-offs:** Cache key complexity (4-5 components) means more cache misses after version bumps. This is intentional -- stale cached results would break the determinism guarantee.

**Example:**
```typescript
// Cache key construction
function analysisCacheKey(inputHash: string, version: VersionInfo): string {
  return `analysis:${inputHash}:${version.analyzerVersion}:${version.normalizerVersion}`;
}

function renderCacheKey(inputHash: string, style: string, version: VersionInfo, resolution: number): string {
  return `render:${inputHash}:${style}:${version.analyzerVersion}:${version.normalizerVersion}:${version.rendererVersion}:${resolution}`;
}
```

## Data Flow

### Primary Generation Flow (Text Input, Server Mode)

```
User types text in <TextInput>
    |
    v
usePipeline hook: validates input, shows PipelineProgress
    |
    v
POST /api/analyze  { type: "text", content: "Hello world" }
    |
    v
Route Handler:
    ├── 1. canonicalize("text", content)        --> "hello world" (NFC, trimmed)
    ├── 2. sha256(canonical)                     --> "abc123..."
    ├── 3. Check analysis cache (hash + versions)--> HIT? return cached result
    ├── 4. analyze("text", canonical)            --> RawFeatures { sentimentScore: 0.2, entropy: 3.8, ... }
    ├── 5. normalize(rawFeatures, calibration)   --> ParameterVector { complexity: 0.3, warmth: 0.6, ... }
    ├── 6. generateProvenance(rawFeatures, params)--> ParameterProvenance[]
    ├── 7. Store in analysis cache
    └── 8. Return PipelineResult
    |
    v
Client receives PipelineResult
    |
    v
useCanvas hook:
    ├── 1. getRenderer(selectedStyle)            --> GeometricRenderer
    ├── 2. computeSeed(hash, style, version)     --> "seed-string"
    ├── 3. renderer.render(ctx, params, seed, opts)
    │       ├── createPRNG(seed)
    │       ├── generatePalette(params, random)
    │       ├── computeComposition(params, random)
    │       └── drawToCanvas(ctx, composition)
    └── 4. Update canvas element with result
    |
    v
TranslationPanel: displays params + provenance
StyleSelector: renders 200x200 thumbnails for other styles
```

### Local-Only Mode Flow (Text Input, No Server)

```
User enables "Private Mode" toggle
    |
    v
User types text -> usePipeline hook (client-side path)
    |
    v
Client-side pipeline (same lib/pipeline/ code):
    ├── canonicalize("text", content)
    ├── sha256(canonical)             (Web Crypto API)
    ├── analyze("text", canonical)    (AFINN lexicon, pure JS stats)
    ├── normalize(rawFeatures, calibration)
    └── generateProvenance(rawFeatures, params)
    |
    v
useCanvas hook: renders identically to server mode
    (No /api/analyze call was made)
```

### URL Input Flow (Server-Only)

```
User enters URL -> POST /api/analyze { type: "url", content: "https://example.com", mode: "snapshot" }
    |
    v
Route Handler:
    ├── 1. canonicalize("url", url)              --> normalized URL
    ├── 2. Check URL snapshot cache              --> HIT? return stored snapshot
    ├── 3. SSRF validation (resolve DNS, check IP)--> BLOCK if private range
    ├── 4. Fetch URL (10s timeout, 5MB limit)
    ├── 5. Extract content (Cheerio + readability)
    ├── 6. analyze("url", { text, title, linkDensity, colorHints, ... })
    │       ├── Run text sub-pipeline on extracted text
    │       └── Merge URL-specific features (linkDensity, contentRatio)
    ├── 7. normalize(rawFeatures, calibration)
    ├── 8. Store URL snapshot + analysis cache
    └── 9. Return PipelineResult
```

### Export Flow (High-Resolution Server Rendering)

```
User clicks "Download PNG"
    |
    v
POST /api/render-export { parameters, style, version, format: "png", resolution: 4096 }
    |
    v
Route Handler:
    ├── 1. Check render cache (params hash + style + version + resolution)
    ├── 2. Create server-side canvas (node-canvas, 4096x4096)
    ├── 3. getRenderer(style).render(serverCtx, params, seed, { width: 4096, ... })
    │       (Same rendering code as client -- isomorphic)
    ├── 4. canvas.toBuffer("image/png")
    ├── 5. Store in render cache
    └── 6. Return binary PNG (Content-Type: image/png)
```

### Key Data Flows

1. **Analysis flow:** Input -> Canonicalize -> Hash -> Analyze -> Normalize -> ParameterVector + Provenance. This is the heart of the system. Each stage is independently versioned. Runs server-side (all types) or client-side (text only in local mode).

2. **Render flow:** ParameterVector + Style + Seed -> Renderer -> Canvas. Stateless and deterministic. Same code runs in browser and on server (node-canvas). The renderer never touches the network or database.

3. **Share flow:** User clicks Share -> Server generates UUID, stores parameters + metadata (no raw input) -> Returns permalink. Recipient loads `/art/[shareId]` -> Fetches stored parameters -> Renders client-side.

4. **Cache flow:** Every analysis and render result is keyed by hash + version components. Version bumps auto-invalidate. No manual purge needed.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single Vercel deployment + single PostgreSQL instance. Python microservice on Railway. Analysis cache in database. No render cache needed (fast enough). |
| 1k-100k users | Add Redis for analysis cache (faster than DB queries). Pre-render gallery thumbnails. Add CDN for exported images. Consider moving render-export to a dedicated worker (Vercel Functions have 10s timeout on Hobby, 60s on Pro). |
| 100k+ users | Render-export becomes the bottleneck. Move to a queue-based system (Bull/BullMQ + Redis) with dedicated rendering workers. Consider storing exported PNGs in S3/R2 with CDN. Rate limiting becomes critical. May need to horizontally scale Python microservice. |

### Scaling Priorities

1. **First bottleneck: Server-side PNG export.** Rendering 4096x4096 canvases is CPU-intensive (2-3 seconds each). At modest traffic, this will saturate a single serverless function. Mitigation: aggressive render cache, consider background job queue early.

2. **Second bottleneck: URL analysis.** Each URL fetch takes 1-5 seconds plus CPU for content extraction and NLP. Rate limiting (10/IP/hour) helps, but at scale the Python microservice needs horizontal scaling. Mitigation: URL snapshot cache means each URL is fetched at most once.

3. **Third bottleneck: Gallery queries.** Browsing/filtering thousands of gallery items with thumbnails. Mitigation: paginate early, lazy-load thumbnails, add database indexes on (style, createdAt, likes).

## Anti-Patterns

### Anti-Pattern 1: Math.random() Leaks

**What people do:** Use `Math.random()` somewhere in the rendering pipeline, maybe in a utility function or imported library.
**Why it's wrong:** Destroys determinism. Same input produces different output on each render. Users notice when their "personal art" changes on reload.
**Do this instead:** Lint rule banning `Math.random()` in `lib/render/` directory. All randomness flows through the seeded PRNG instance passed as a function argument. Review third-party libraries for hidden `Math.random()` calls.

### Anti-Pattern 2: Coupled Pipeline Stages

**What people do:** Analysis function directly calls the normalizer, or the renderer directly calls the analyzer. Stages reach into each other.
**Why it's wrong:** Prevents independent versioning, independent testing, and the client-side local mode (which needs analysis without server-side normalization context).
**Do this instead:** Each stage is a pure function with typed input/output. The orchestrator (`runPipeline` or `usePipeline` hook) wires stages together. Stages never import each other.

### Anti-Pattern 3: Storing Raw Input Server-Side

**What people do:** Log the raw input for debugging, store it in the gallery entry, include it in the share link.
**Why it's wrong:** Users will paste sensitive text (passwords, personal notes, private messages). Storing raw input is a privacy liability and violates the core design principle.
**Do this instead:** Store only: parameter vector, provenance (which contains feature names and weights, not raw text), inputHash, inputPreview (first 50 chars, only for creator's session). Raw input exists only in the request lifetime.

### Anti-Pattern 4: Monolithic Renderer

**What people do:** Single giant `render()` function with a `switch(style)` that inlines all rendering logic. 3,000-line file.
**Why it's wrong:** Impossible to test individual styles. Adding a new style requires modifying existing code. Composition laws cannot be enforced per-style.
**Do this instead:** Strategy pattern. Each renderer is its own module implementing the `Renderer` interface. A factory function returns the correct renderer by name. Each renderer owns its composition laws.

### Anti-Pattern 5: Tight Coupling to Browser Canvas

**What people do:** Renderer code directly accesses `document.getElementById("canvas")` or browser-specific APIs.
**Why it's wrong:** Breaks server-side rendering for exports. Breaks testing. Forces separate export code path that will diverge from client rendering.
**Do this instead:** Renderers accept a `CanvasRenderingContext2D` parameter. They never create or access DOM elements. The calling code (React component or Node.js export handler) provides the context. This is the key to isomorphic rendering.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Python Microservice (FastAPI)** | Next.js Route Handlers call via HTTP (internal network). POST `/analyze/text`, POST `/analyze/data`. | Deploy on Railway/Fly.io. Internal network if possible (no public endpoint). Health check endpoint for monitoring. JSON request/response. Timeout: 10s for text, 30s for data. |
| **PostgreSQL** | Drizzle ORM from Next.js server-side code. | Connection pooling via pgBouncer or Neon's built-in pooler. Vercel Postgres or Neon for managed hosting. Migrations via `drizzle-kit push`. |
| **Vercel** | Next.js deployment. Route Handlers as serverless functions. Static pages for gallery SSR. | Be aware of function timeout limits (10s Hobby, 60s Pro). Export rendering may need background function. Edge functions for caching headers. |
| **CDN (Vercel Edge)** | Static assets + cached export images. | Gallery thumbnails and exported PNGs should be served from CDN after first generation. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **UI <-> Pipeline** | `usePipeline` hook orchestrates. Calls Route Handlers via fetch, or runs client-side pipeline directly (local mode). Returns typed `PipelineResult`. | Hook manages loading states, error handling, and progress callbacks. |
| **Route Handler <-> Pipeline** | Direct function import. Route Handler calls `runPipeline()` from `lib/pipeline/`. | No HTTP overhead for internal calls. Route Handler adds caching, rate limiting, auth checks around the pure pipeline. |
| **Route Handler <-> Python Microservice** | HTTP POST with JSON body. Next.js Route Handler acts as proxy/orchestrator. | Client never calls Python directly. Next.js is the single API surface. Python is an implementation detail. |
| **Pipeline <-> Renderer** | `ParameterVector` is the contract. Pipeline produces it, renderer consumes it. They share only the `types.ts` file. | This boundary is the core architectural insight. These two systems can be developed and tested completely independently as long as the parameter schema is stable. |
| **Renderer <-> Canvas** | Renderer receives `CanvasRenderingContext2D`. Never creates its own canvas. | Enables isomorphic rendering: browser canvas, node-canvas, test canvas, thumbnail canvas all work identically. |

## Build Order Implications

The architecture has clear dependency chains that dictate build order:

### Phase 1 Critical Path (Must build first)

```
ParameterVector type definition
    |
    +--> Seeded PRNG (Mulberry32)
    |       |
    |       +--> Palette generation (OKLCH)
    |       |       |
    |       |       +--> Geometric Renderer (first style)
    |       |
    |       +--> Composition rules (shared base)
    |
    +--> Text Canonicalizer
    |       |
    |       +--> Text Analyzer (NLP features)
    |               |
    |               +--> Normalizer (quantile-based)
    |                       |
    |                       +--> Provenance Generator
    |
    +--> Calibration Harness (30+ text reference inputs)
```

**Why this order:** The ParameterVector schema is the interface contract that both sides of the system depend on -- define it first. The PRNG and canonicalizer are low-level utilities needed by everything above. The calibration harness must exist before normalization tuning. Build one renderer (Geometric is simplest) to prove the full pipeline end-to-end before adding styles.

### Phase 2 Dependencies (After pipeline works end-to-end)

```
Geometric Renderer (already built)
    |
    +--> Organic Renderer (reuses palette + PRNG + composition base)
    +--> Particle Renderer (reuses palette + PRNG, adds mobile cap)
    +--> Typographic Renderer (reuses palette + PRNG, text-specific)
    |
    +--> Style Selector with mini-preview thumbnails
    +--> Progressive canvas animation
```

**Why this order:** All additional renderers share the base infrastructure (palette, PRNG, composition rules) built in Phase 1. They are independent of each other and could theoretically be built in parallel.

### Phase 3 Dependencies (After core rendering is stable)

```
URL Canonicalizer + SSRF Protection
    |
    +--> URL Scraper (Cheerio + readability)
    |       |
    |       +--> URL Analyzer (text sub-pipeline + URL-specific features)
    |
Data Canonicalizer (JSON/CSV)
    |
    +--> Data Analyzer (statistics)
    |
Both --> Expand calibration harness to 60+ inputs
         |
         +--> Retune normalization across all input types
```

**Why this order:** URL and data analyzers are completely independent of each other but both depend on the normalization system being stable. SSRF protection is a prerequisite for the URL scraper (not optional, not "add later"). The calibration harness expansion and normalization retuning must happen after all input types exist.

### Phase 4 Dependencies (After all input types work)

```
PostgreSQL + Drizzle Schema
    |
    +--> Analysis Cache (depends on schema)
    +--> Gallery CRUD (depends on schema)
    +--> Share Links (depends on schema)
    +--> Compare Mode (depends on share links)
    |
Client-side Text Analysis (depends on pipeline being stable)
    |
    +--> Local-Only Mode toggle
```

**Why this order:** Database is the foundation for all persistence features. Gallery, sharing, and compare mode all depend on stored data. Local-only mode requires the pipeline to be stable and proven correct before porting to client-side execution.

### Phase 5 Dependencies (Polish, mostly independent)

```
Server-side Export Rendering (node-canvas)
    |
    +--> PNG export at 4096x4096
    +--> SVG export (Geometric, Typographic)
    |
Dark/light mode, keyboard nav, reduced motion, progress animation
    (Independent of each other, can be built in any order)
```

## Decision: Hybrid Stack vs All-Node

**Recommendation: Start All-Node, add Python only if analysis quality is insufficient.**

Rationale: The spec explicitly states lexicon-based sentiment (AFINN-165) is sufficient for text. The `sentiment` npm package and pure-JS statistics are adequate for the V1 feature set. Starting with a single deployment (Vercel) eliminates inter-service communication complexity, deployment coordination, and the "cold start" problem of two services. If the NLP needs outgrow the Node.js ecosystem (e.g., adding VADER, spaCy, or ML-based analysis), the pipeline's stage separation makes it straightforward to swap in a Python microservice later -- the analyzer interface stays the same, only the implementation changes.

**Confidence: MEDIUM.** This contradicts the spec's default recommendation of Python, but is grounded in the principle of minimizing deployment complexity for a portfolio project. The architecture supports either approach without structural changes.

## Sources

- [The Pipeline Pattern: Streamlining Data Processing](https://dev.to/wallacefreitas/the-pipeline-pattern-streamlining-data-processing-in-software-architecture-44hn) -- Pipeline stage composition patterns in TypeScript
- [Generative Art with Node.js and Canvas](https://mattdesl.svbtle.com/generative-art-with-nodejs-and-canvas) -- Dual-entry-point architecture (browser + Node.js) with seeded PRNG for deterministic rendering
- [Strategy Pattern in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example) -- Strategy pattern for pluggable renderers
- [Mulberry32 PRNG](https://github.com/cprosche/mulberry32) -- Fast 32-bit seeded PRNG for JavaScript
- [TC39 Seeded Random Proposal](https://github.com/tc39/proposal-seeded-random) -- Standards track for native seeded PRNG (ChaCha12)
- [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) -- Perceptual color space rationale
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) -- Route Handler vs Server Action architecture
- [Next.js Server Actions](https://nextjs.org/docs/app) -- Data mutation patterns for App Router
- [Skia Canvas](https://github.com/samizdatco/skia-canvas) -- Server-side canvas alternative to node-canvas
- [Canvas Anti-Aliasing (WHATWG)](https://github.com/whatwg/html/issues/3181) -- Cross-browser canvas determinism limitations
- [FastAPI Microservices Patterns](https://talent500.com/blog/fastapi-microservices-python-api-design-patterns-2025/) -- Python microservice communication patterns
- [Next.js + Drizzle ORM](https://vercel.com/templates/next.js/postgres-drizzle) -- Database integration template
- [Data Pipeline Architecture Patterns](https://dagster.io/guides/data-pipeline-architecture-5-design-patterns-with-examples) -- General pipeline architecture principles

---
*Architecture research for: Synesthesia Machine (deterministic generative art web application)*
*Researched: 2026-03-02*

# Stack Research

**Domain:** Deterministic generative art web application with multi-modal input analysis
**Researched:** 2026-03-02
**Confidence:** HIGH (core stack), MEDIUM (NLP/analysis layer)

## Key Decision: All-Node vs Python Microservice

**Recommendation: All-Node (no Python microservice)**

Rationale:
- This project needs character frequency, entropy, syllable counts, sentiment polarity, and basic POS tagging -- NOT deep NLP (no embeddings, no transformers, no complex NER). The JavaScript ecosystem covers these needs adequately.
- wink-nlp achieves ~84.5% F-score on sentiment (comparable to TextBlob's ~80% accuracy), processes 650K tokens/sec, and runs in browser AND server -- enabling the "local-only mode" requirement without duplicating logic.
- A Python microservice adds deployment complexity (separate Railway/Fly.io service), doubles the CI/CD surface, introduces cross-service latency, and complicates the "text analysis <500ms" requirement.
- The statistical analysis (distributions, correlations, cardinality) is well-served by simple-statistics, which covers all the needed functions.
- Keeping everything in one runtime means shared types, shared validation (Zod), simpler testing, and one deployment target.

**When to reconsider:** If future input types need heavy ML (song analysis, image recognition), add a Python microservice then. The parameter vector architecture makes this easy -- swap the analyzer, keep the renderer.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (latest stable) | Full-stack React framework | Vercel-optimized deployment, App Router with Server Components for gallery/sharing, API routes for analysis endpoints. Cache Components and stable Turbopack provide fast builds. Next.js 16 is the current recommended version for new projects. **Confidence: HIGH** |
| React | 19.2.x | UI library | Stable Server Components for gallery browsing, React Compiler for automatic memoization (critical for canvas-heavy rerenders). Pairs with Next.js 16. **Confidence: HIGH** |
| TypeScript | 5.9.x | Type safety | Current stable version. Do not jump to 6.0 beta yet -- wait for GA. TypeScript ensures parameter vector types, input schemas, and renderer contracts are enforced at compile time. **Confidence: HIGH** |
| Tailwind CSS | 4.x | Utility-first styling | v4 uses Lightning CSS engine (5x faster full builds), CSS-native cascade layers, zero-config setup. First-class OKLCH support via `color-mix()`. Dark mode via `@media (prefers-color-scheme)`. **Confidence: HIGH** |
| Node.js | 22.x LTS | Server runtime | Required by Next.js 16, node-canvas 3.x. Active LTS through April 2027. **Confidence: HIGH** |

### Database & ORM

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL | 16.x | Primary database | Gallery storage, cached analysis results, parameter snapshots, share links. JSONB for flexible parameter storage, identity columns (modern standard over serial). **Confidence: HIGH** |
| Drizzle ORM | 0.45.x (stable) | TypeScript ORM | Type-safe SQL queries, schema-as-code, excellent PostgreSQL support. Use stable 0.45.x, NOT v1-beta. drizzle-kit for migrations. SQL-like API means no ORM abstraction tax. **Confidence: HIGH** |
| drizzle-kit | 0.30.x | Migration tooling | Schema generation, migration management. Note: as of 0.30.0, PostgreSQL dialect no longer includes IF NOT EXISTS -- stricter DDL is a feature, not a bug. **Confidence: HIGH** |

### Rendering & Generative Art

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Canvas API (native) | -- | Raster rendering (Organic, Particle styles) | Native browser API, no dependencies. Use OffscreenCanvas for worker-thread rendering where supported. **Confidence: HIGH** |
| SVG (native) | -- | Vector rendering (Geometric, Typographic styles) | Native browser API, produces exportable vector files. Compose via JSX in React components. **Confidence: HIGH** |
| node-canvas | 3.2.x | Server-side canvas rendering | Cairo-backed Canvas implementation for Node.js. Required for high-res PNG export (4096x4096) and deterministic server-side renders. Needs Cairo system dependency. **Confidence: HIGH** |
| simplex-noise | 4.0.x | Noise functions for Organic style | Fast, tree-shakeable, dependency-free. Supports 2D/3D/4D noise. Accepts external seed -- integrate with seeded PRNG. **Confidence: HIGH** |
| culori | 4.0.x | OKLCH color space operations | Full CSS Color Level 4 support including OKLCH. Perceptual color interpolation, chroma clamping, color difference formulas. Better OKLCH support than chroma.js. ~208 dependents in npm ecosystem. **Confidence: HIGH** |

### Seeded PRNG (Determinism Layer)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| seedrandom | 3.0.x | Seeded PRNG with Alea algorithm | Well-maintained, 4M+ weekly downloads. Includes Alea PRNG (fast, 32-bit state, good statistical properties). Export/import state for reproducibility. Use instead of custom Mulberry32 or xoshiro256** implementations. **Confidence: HIGH** |

**Decision: seedrandom with Alea over raw xoshiro256** or Mulberry32**

- The PROJECT.md mentions xoshiro256** or Mulberry32, but seedrandom wraps Alea with a battle-tested API, state serialization, and broad ecosystem adoption.
- xoshiro256** requires BigInt (unnecessary overhead for art generation), and the npm package `prng-xoshiro` hasn't been updated in 4 years.
- Mulberry32 is a good algorithm but only exists as GitHub gists -- no maintained npm package.
- seedrandom's Alea passes all standard statistical tests and has been the generative art community standard for years (used by canvas-sketch-util internally).
- If Alea proves insufficient for a specific use case, seedrandom supports pluggable algorithms.

### NLP & Text Analysis (All-Node)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| wink-nlp | 2.3.x | Core NLP pipeline | Tokenization, POS tagging, sentiment, NER, negation handling. 650K tokens/sec on M1. ~10KB minified. Zero external dependencies. Runs in browser (enables local-only mode) AND Node.js. **Confidence: MEDIUM** |
| wink-eng-lite-web-model | 1.x | Language model for wink-nlp | English language model. Lightweight enough for browser loading. **Confidence: MEDIUM** |
| wink-sentiment | 6.x | Dedicated sentiment analysis | AFINN + Emoji Sentiment Ranking based. Can be used standalone for simpler sentiment needs, or alongside wink-nlp for enhanced analysis. **Confidence: MEDIUM** |
| syllable | 5.0.x | Syllable counting | Algorithmic syllable counter for English. ESM-only. Needed for rhythm/pattern dimension of parameter vector. **Confidence: HIGH** |
| compromise | 14.x | Supplementary text analysis | Lightweight POS tagger, entity extraction. 1MB/sec processing. Use for noun/verb ratio calculation and text structure analysis that wink-nlp may not cover. English-only (acceptable for v1). **Confidence: MEDIUM** |

**Why MEDIUM confidence on NLP:** JavaScript NLP libraries are adequate for this project's needs (frequency, sentiment, POS ratios, entropy), but they lack the depth of Python's spaCy/NLTK ecosystem. If analysis quality proves insufficient during calibration, the parameter vector architecture allows swapping to a Python microservice later without touching the renderer.

### Statistical Analysis

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| simple-statistics | 7.8.x | Statistical functions | Mean, median, standard deviation, quantiles, correlation, distributions. Zero dependencies. 316+ npm dependents. Covers all statistical analysis needed for CSV/JSON input normalization. **Confidence: HIGH** |

### Web Scraping & URL Analysis

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| cheerio | 1.0.x | HTML parsing | Fast, jQuery-like HTML parser. Does NOT execute JavaScript (security advantage). Parse scraped HTML to extract text content, meta tags, headings. **Confidence: HIGH** |

**SSRF Protection (custom implementation required):**
- Validate URLs before fetching: block private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, ::1, fd00::/8)
- Resolve DNS before connecting to prevent DNS rebinding attacks
- Use native `fetch` with `AbortSignal.timeout()` for request timeouts
- No existing npm package provides complete SSRF protection -- build a validation layer using `node:dns` and `node:net` (isIP)

### UI Components & Design

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest (CLI 3.x) | UI component primitives | Copy-paste components (not a dependency). Radix UI primitives for accessibility. Tailwind CSS v4 compatible. Keyboard navigation, focus management, ARIA attributes built in. **Confidence: HIGH** |
| Radix UI | unified `radix-ui` package | Accessible UI primitives | Underpins shadcn/ui. As of Feb 2026, uses unified package instead of individual @radix-ui/react-* packages. **Confidence: HIGH** |
| Lucide React | latest | Icon library | Default icon set for shadcn/ui. Tree-shakeable, consistent style. **Confidence: HIGH** |
| Framer Motion | 12.x | Animations | Progressive canvas building animation, stage transitions, panel slides. Respects `prefers-reduced-motion` via `useReducedMotion()` hook. **Confidence: HIGH** |

### Validation & Type Safety

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | 4.x | Runtime schema validation | 57% smaller core bundle in v4. Validates parameter vectors, input schemas, API responses. Shared between client and server. **Confidence: HIGH** |
| next-safe-action | 8.x | Type-safe Server Actions | Wraps Next.js Server Actions with Zod validation, middleware, error handling. Standard Schema compatible. **Confidence: MEDIUM** |

### Rate Limiting & Security

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @upstash/ratelimit | 2.0.x | Serverless rate limiting | Works with Upstash Redis (serverless, edge-compatible). Sliding window algorithm. Integrates with Vercel Marketplace. Handles the "10/IP/hour for URLs, 10 saves/IP/day for gallery" requirements. **Confidence: HIGH** |
| @upstash/redis | latest | Redis client for Upstash | REST-based Redis client that works in edge runtimes and serverless functions. Required by @upstash/ratelimit. **Confidence: HIGH** |

### Image Export

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sharp | 0.33.x | Image processing | High-performance image processing. Used by Next.js internally for image optimization. Use for post-processing exported PNG renders (compression, format conversion). **Confidence: HIGH** |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Dev server & builds | Default in Next.js 16. Stable for dev and build. No config needed. |
| ESLint 9.x + @eslint/js | Linting | Flat config format. next lint deprecated in Next.js 16 -- use ESLint directly. |
| Prettier | Code formatting | Standard formatting. Configure with Tailwind CSS plugin for class ordering. |
| Vitest | Unit/integration testing | Fast, Vite-based. Better than Jest for ESM-native projects. |
| Playwright | E2E testing | Cross-browser testing. Critical for verifying canvas determinism across browsers. |
| Drizzle Studio | Database GUI | Built into drizzle-kit. Visual database browser during development. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix / SvelteKit | Next.js has superior Vercel integration, larger ecosystem, React Server Components for gallery. Remix is solid but smaller ecosystem. SvelteKit would mean no React ecosystem. |
| Styling | Tailwind CSS 4 | CSS Modules / Emotion | Tailwind's utility-first approach is faster for rapid iteration. v4's zero-config and OKLCH support are advantages. CSS-in-JS (Emotion) has RSC compatibility issues. |
| ORM | Drizzle | Prisma | Drizzle produces SQL-like queries (more predictable for caching), smaller bundle, better edge runtime support. Prisma's query engine is heavier and has had Vercel cold-start issues. |
| Color | culori | chroma.js | culori has native OKLCH support with perceptual clamping. chroma.js added OKLCH support later and its API is less ergonomic for color space operations. |
| PRNG | seedrandom (Alea) | Custom xoshiro256** | seedrandom is battle-tested with state serialization. xoshiro256** requires BigInt, and the npm package is unmaintained. |
| NLP | wink-nlp + compromise | Python spaCy via microservice | Avoids deployment complexity. Adequate for the analysis depth needed. Can migrate to Python later if calibration reveals quality gaps. |
| Components | shadcn/ui | MUI / Chakra UI | shadcn/ui gives you source code ownership (critical for custom art-focused UI), Tailwind-native, accessible by default. MUI/Chakra add runtime CSS overhead. |
| Rate limiting | Upstash | In-memory (Map) | In-memory rate limiting doesn't survive serverless cold starts. Upstash persists state in Redis with edge support. |
| Animation | Framer Motion | GSAP | Framer Motion integrates natively with React's lifecycle and respects reduced motion. GSAP is more powerful but React integration is manual. |
| Testing | Vitest | Jest | Vitest is ESM-native, faster, and shares config with Vite/Turbopack ecosystem. Jest requires additional ESM configuration. |
| Noise | simplex-noise | open-simplex-noise | simplex-noise 4.x is faster (20-30% improvement), tree-shakeable, actively maintained. open-simplex-noise has fewer downloads and older API. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Math.random() | Not seedable. Breaks determinism promise. | seedrandom with Alea algorithm |
| Prisma | Heavy query engine, poor edge support, cold-start issues on Vercel | Drizzle ORM |
| CSS-in-JS (styled-components, Emotion) | RSC compatibility issues, runtime overhead, bundle bloat | Tailwind CSS 4 |
| Three.js (for 2D art) | Massive overkill. 150KB+ bundle for what Canvas 2D and SVG handle natively. | Canvas API + SVG |
| Puppeteer (for URL scraping) | Launches full Chromium browser. Massive memory/CPU overhead. Security nightmare for SSRF. | cheerio + native fetch |
| open-simplex-noise | Older API, slower, less maintained | simplex-noise 4.x |
| natural (npm) | Last meaningful update was years ago. Large bundle, poor tree-shaking. | wink-nlp (modern, smaller, faster) |
| node-nlp | Designed for chatbot intent classification, not text analysis | wink-nlp + compromise |
| Drizzle ORM v1-beta | Not production-ready. API may change between beta releases. | Drizzle ORM 0.45.x (stable) |
| TypeScript 6.0 beta | Bridge release to TS 7.0 (Go-based). Wait for stable. | TypeScript 5.9.x |

## Stack Patterns by Variant

**If the calibration harness reveals JavaScript NLP quality is insufficient:**
- Add a Python FastAPI microservice on Railway
- Use spaCy + TextBlob for sentiment/POS analysis
- Keep the same parameter vector contract -- only the analyzer changes
- This is an additive change, not a rewrite

**If WebGL is needed for Particle style performance on mobile:**
- Use raw WebGL2 with custom shaders (not Three.js)
- Keep the particle count capped (PROJECT.md mentions mobile particle cap)
- WebGL context creation is expensive -- pool and reuse

**If server-side export at 4096x4096 is too slow (<3s requirement):**
- node-canvas with Cairo is the baseline
- If insufficient, consider OffscreenCanvas in a Node.js worker_thread
- sharp for post-processing compression after render

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.x | React 19.2.x | React 19 required. React Compiler stable in Next.js 16. |
| Next.js 16.x | TypeScript 5.9.x | Full support. Do not use TS 6.0 beta. |
| Tailwind CSS 4.x | Next.js 16.x | Built-in support via @tailwindcss/postcss or Vite plugin. |
| Drizzle ORM 0.45.x | PostgreSQL 16.x | Full support via node-postgres driver. |
| shadcn/ui (CLI 3.x) | Tailwind CSS 4.x | Compatible since Feb 2025 update. |
| shadcn/ui (Feb 2026+) | radix-ui (unified) | Uses unified package, not individual @radix-ui/react-* |
| node-canvas 3.2.x | Node.js 22.x | Requires Node.js >= 18.12.0. Cairo system dependency. |
| Zod 4.x | next-safe-action 8.x | next-safe-action supports Standard Schema (includes Zod 4). |
| wink-nlp 2.x | Node.js 22.x / Browser | Works in both environments. ESM supported. |

## Installation

```bash
# Core framework
npx create-next-app@latest art-synesthesia --typescript --tailwind --eslint --app --src-dir

# Database & ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Rendering & generative art
npm install simplex-noise culori seedrandom
npm install -D @types/seedrandom

# NLP & text analysis
npm install wink-nlp wink-eng-lite-web-model wink-sentiment syllable compromise

# Statistical analysis
npm install simple-statistics

# Web scraping
npm install cheerio

# UI components (after project init)
npx shadcn@latest init
# Then add specific components:
npx shadcn@latest add button card dialog sheet tabs slider

# Animation
npm install framer-motion

# Validation
npm install zod next-safe-action

# Rate limiting
npm install @upstash/ratelimit @upstash/redis

# Image processing (server-side)
npm install sharp

# Server-side canvas (for exports)
npm install canvas

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @types/node
```

## Deployment Architecture

```
Vercel (Next.js 16)
  |-- Frontend (React 19 + Tailwind 4)
  |-- API Routes (text analysis, URL analysis, data analysis)
  |-- Server Actions (gallery save, share link creation)
  |-- Server-side canvas rendering (node-canvas for exports)
  |
Upstash Redis (serverless)
  |-- Rate limiting state
  |-- Analysis result caching (short TTL)
  |
PostgreSQL (Vercel Postgres or Neon)
  |-- Gallery entries
  |-- Share link parameters
  |-- Cached analysis results
  |-- Engine version tracking
```

**Single deployment target on Vercel** -- no separate microservice needed. This simplifies CI/CD, reduces latency, and keeps the codebase unified.

**Note on node-canvas on Vercel:** Vercel's serverless functions support native Node.js modules. node-canvas with Cairo should work, but verify during early development. If it doesn't, use Railway for export-only API routes.

## Sources

- [Next.js Blog](https://nextjs.org/blog) -- Next.js 16 release details, verified Feb 2026 (HIGH confidence)
- [Next.js endoflife.date](https://endoflife.date/nextjs) -- Version lifecycle and LTS policy (HIGH confidence)
- [Drizzle ORM Releases](https://github.com/drizzle-team/drizzle-orm/releases) -- Version 0.45.x, v1 beta status (HIGH confidence)
- [Drizzle ORM Docs](https://orm.drizzle.team/) -- PostgreSQL support, migration tooling (HIGH confidence)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 features and performance (HIGH confidence)
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/) -- TS 5.9, 6.0 beta timeline (HIGH confidence)
- [React 19.2 Blog](https://react.dev/blog/2025/10/01/react-19-2) -- Server Components stability (HIGH confidence)
- [winkJS](https://winkjs.org/) -- NLP pipeline performance benchmarks (MEDIUM confidence)
- [simplex-noise GitHub](https://github.com/jwagner/simplex-noise.js) -- v4 API and performance (HIGH confidence)
- [culori Docs](https://culorijs.org/) -- OKLCH support, color space operations (HIGH confidence)
- [seedrandom GitHub](https://github.com/davidbau/seedrandom) -- Alea PRNG documentation (HIGH confidence)
- [simple-statistics Docs](https://simple-statistics.github.io/) -- Statistical functions (HIGH confidence)
- [Upstash Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -- Rate limiting API (HIGH confidence)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) -- Tailwind v4 support, CLI 3.0 (HIGH confidence)
- [node-canvas GitHub](https://github.com/Automattic/node-canvas) -- v3.2.x, Cairo dependency (HIGH confidence)
- [Cheerio vs Puppeteer Comparison](https://proxyway.com/guides/cheerio-vs-puppeteer-for-web-scraping) -- Scraping approach (MEDIUM confidence)
- [Deployment Platform Comparison](https://www.jasonsy.dev/blog/comparing-deployment-platforms-2025) -- Vercel + Railway pattern (MEDIUM confidence)

---
*Stack research for: Deterministic generative art web application (Synesthesia Machine)*
*Researched: 2026-03-02*

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

# Pitfalls Research

**Domain:** Deterministic generative art web application (Synesthesia Machine)
**Researched:** 2026-03-02
**Confidence:** MEDIUM-HIGH (verified across multiple sources; some claims rely on well-established domain knowledge)

## Critical Pitfalls

### Pitfall 1: Cross-Browser Canvas Non-Determinism

**What goes wrong:**
The same rendering code produces visually identical but byte-different canvas output across browsers, operating systems, and GPU hardware. Anti-aliasing algorithms, subpixel rendering, color management profiles, and floating-point precision differences in GPU drivers all contribute pixel-level variance. This is the exact mechanism behind canvas fingerprinting -- browsers are *designed* to differ at this level. A user creates art on Chrome/macOS, shares a link, and a friend on Firefox/Windows sees subtly different output. The determinism promise ("same input = same art always") breaks silently.

**Why it happens:**
The Canvas 2D spec does not mandate bit-exact rendering. Browsers delegate to platform graphics libraries (Skia in Chromium, Core Graphics in Safari, etc.) which apply different anti-aliasing, text rasterization, and image interpolation algorithms. GPU drivers introduce further variance in floating-point operations. `toDataURL()` also uses different PNG compression implementations across browsers, and alpha channel handling differs -- pixels with non-opaque alpha produce cross-browser inconsistencies during encode/decode.

**How to avoid:**
1. Accept that client-side rendering will have cosmetic cross-browser differences -- this is unavoidable and explicitly acknowledged in PROJECT.md.
2. Define determinism at the *parameter level*, not the pixel level. Same parameters = same visual intent, rendered by whatever browser the viewer uses.
3. For canonical/sharable output (exports, gallery thumbnails, social previews), always use server-side rendering with a pinned environment (skia-canvas on Node.js, or headless Chromium with a locked version). This eliminates browser/OS/GPU variance entirely.
4. Avoid using `globalCompositeOperation` modes that compound floating-point differences across layers.
5. Keep alpha channels fully opaque in intermediate rendering steps to avoid encode/decode inconsistencies.

**Warning signs:**
- Visual diff tests between browsers show pixel differences exceeding anti-aliasing tolerance
- Users report "my art looks different on my phone"
- `canvas.toDataURL()` produces different hashes for the same input on different machines
- Gallery thumbnails don't match what users see locally

**Phase to address:**
Phase 1 (Foundation) -- Establish server-side rendering for canonical output from the start. Do not defer this to "export" phase. The rendering architecture must assume client rendering is approximate and server rendering is authoritative.

---

### Pitfall 2: PRNG Seeding That Silently Breaks Determinism

**What goes wrong:**
The PRNG produces different sequences for the "same" seed because: (a) the string-to-seed hash function loses information or collides, (b) the PRNG is called a different number of times due to conditional logic in rendering, (c) `Math.random()` leaks into a code path, or (d) JavaScript's number precision silently truncates 64-bit seed values. xoshiro256** requires BigInt seeds in JavaScript because the Number type cannot represent 64-bit integers without precision loss. Mulberry32 avoids this but has only a 32-bit state space, making birthday collisions likely at scale.

**Why it happens:**
JavaScript's `Number` is IEEE 754 double-precision (53 bits of mantissa), which cannot losslessly represent 64-bit integers. Developers write `xoshiro256(seed)` where `seed` is a regular Number, silently truncating bits. Separately, rendering code that uses `if/else` branches consuming random values in some branches but not others creates "PRNG drift" -- the sequence diverges based on rendering path, not seed alone. Finally, any use of `Math.random()` (even in a third-party library) introduces true non-determinism.

**How to avoid:**
1. Use Mulberry32 (32-bit, no BigInt needed, full 2^32 period) for rendering unless you genuinely need more state. It is simpler and avoids the 64-bit precision trap entirely in JavaScript.
2. Use a well-tested hash function (xmur3 or cyrb128) to convert string seeds to numeric seeds deterministically.
3. Ban `Math.random()` from the entire rendering pipeline with a lint rule (`no-restricted-globals` or a custom ESLint rule that flags `Math.random`).
4. Structure rendering so the PRNG is consumed in a fixed, deterministic order regardless of conditional branches -- consume random values even when unused to maintain sequence alignment.
5. Write snapshot tests: for each rendering style, pin 5+ seed/parameter combinations and assert the PRNG call count and output hash remain identical.

**Warning signs:**
- Art changes visually when you refactor rendering logic without changing parameters
- Hash comparisons fail intermittently
- `Math.random` appears in `node_modules` of rendering dependencies
- Two "identical" inputs produce different art when style parameter triggers different branches

**Phase to address:**
Phase 1 (Foundation) -- PRNG infrastructure and `Math.random()` ban must be established before any rendering code is written. Snapshot tests should be added in the rendering phase.

---

### Pitfall 3: Normalization Calibration That Produces Boring or Clustered Art

**What goes wrong:**
The quantile-based normalization maps raw analysis values (sentiment, entropy, word count, etc.) to the 0-1 parameter range. If the calibration dataset is biased (e.g., mostly English prose, mostly short texts), then real-world inputs cluster into narrow parameter bands. Result: 80% of inputs produce art that looks nearly identical. Alternatively, if calibration uses too few reference inputs, the quantile breakpoints are unstable and shift dramatically when you add a few more reference inputs -- destroying reproducibility of previously generated art.

**Why it happens:**
Quantile normalization is sensitive to the reference distribution. If calibration texts are all similar in length/sentiment/entropy, the quantile function becomes nearly flat across the range of real user inputs. This is the "class-effect proportion" problem from bioinformatics applied to art: when calibration data doesn't represent the diversity of real inputs, normalization compresses the output distribution rather than spreading it. The PROJECT.md requires 30+ text, 15+ URL, and 15+ data reference inputs -- but the *composition* of those inputs matters more than the count.

**How to avoid:**
1. Design the calibration corpus deliberately: include extreme inputs (single character, 10,000-word essay, pure numbers, emoji-only, multiple languages, code snippets, poetry, legal text).
2. After initial calibration, visualize the parameter distribution across the calibration set as a histogram per dimension. If any dimension has >50% of values in a 0.2-wide band, the calibration is biased.
3. Version the calibration dataset alongside the normalizer version. When the calibration set changes, the normalizerVersion must increment.
4. Implement a "parameter diversity score" that measures how spread the ~15 parameters are for a given input -- warn internally during development if inputs consistently score low diversity.
5. Split calibration by input type (text, URL, data) rather than normalizing across types. Each type has fundamentally different distributions.

**Warning signs:**
- Users say "all the art looks the same"
- Parameter histograms across test inputs show tight clustering
- Adding a single reference input to calibration dramatically changes existing parameter mappings
- One input type (e.g., short text) always maps to the same narrow parameter range

**Phase to address:**
Phase 2 (Analysis Pipeline) -- Calibration design must happen before any normalization code. Build the calibration harness and visualization tooling first, then tune. Revisit after user testing in a later phase.

---

### Pitfall 4: NLP Analysis Producing Meaningless Parameters from Short/Unusual Inputs

**What goes wrong:**
Sentiment analysis, syllable counting, and entropy calculation all degrade severely on short text (< 20 characters), non-English text, emoji-heavy input, URLs-as-text, and code snippets. Sentiment models trained on product reviews return "neutral" for everything that isn't a movie review. Syllable counters fail on proper nouns and non-dictionary words. The result: the parameter vector for "Hello" and "Ahmad" and "XYZ123" all map to nearly identical values, producing nearly identical art for very different inputs.

**Why it happens:**
NLP tools are trained on specific corpora (product reviews, news articles, social media) and their accuracy drops precipitously outside that domain. Short text lacks sufficient context for sentiment algorithms. Lexicon-based approaches fail on polysemous words, sarcasm, and domain-specific vocabulary. Most JavaScript NLP libraries (natural, compromise, sentiment) are lightweight by design and sacrifice accuracy for size/speed. The project analyzes arbitrary user input, not curated text -- the worst case for NLP accuracy.

**How to avoid:**
1. Use NLP features (sentiment, readability scores) as *contributing signals*, never as dominant parameters. Weight character-level statistics (entropy, frequency distribution, character class ratios) more heavily because they are robust to input type and length.
2. Implement input-length-aware weighting: for inputs under 20 characters, reduce NLP-derived parameter weights to near zero and increase weight on character-level features (bigram entropy, unicode block distribution, character frequency deviation from English).
3. Design a "feature confidence" score per analysis dimension that attenuates the parameter contribution when the analyzer has low confidence (e.g., sentiment confidence < 0.3 means sentiment contributes minimally to the parameter vector).
4. Test the analysis pipeline against an adversarial input set: single characters, emoji strings, code blocks, non-Latin scripts, repeated words, URLs pasted as text.
5. The parameter provenance display ("why does my art look this way?") naturally surfaces weak signals -- if sentiment says "neutral 0.51" for a haiku, the user sees the explanation is meaningless, which is worse than the art looking wrong.

**Warning signs:**
- Sentiment returns 0.5 (neutral) for >60% of test inputs
- Short names all produce visually similar art
- Non-English text always maps to the same parameter range
- Parameter provenance panel shows one dimension dominating all others

**Phase to address:**
Phase 2 (Analysis Pipeline) -- Build the adversarial test suite before implementing analysis. Test-driven: define expected parameter diversity for edge-case inputs, then build analyzers to meet that bar.

---

### Pitfall 5: Engine Versioning That Breaks Saved Art

**What goes wrong:**
A user generates art, shares a link, and bookmarks it. Later, you update the rendering algorithm, normalization calibration, or analysis pipeline. The shared link now produces different art because the engine changed. Saved gallery entries that stored only parameters (not pixels) now render differently. Users lose trust in the "deterministic" promise.

**Why it happens:**
The project has four versioned components (engineVersion, analyzerVersion, normalizerVersion, rendererVersion) but implementing version-locked replay is hard. Developers either: (a) forget to bump a version when changing behavior, (b) don't keep old code paths for backward compatibility, or (c) version at too coarse a granularity (e.g., bumping "engine v2" when only the organic renderer changed, invalidating all styles).

**How to avoid:**
1. Store the full version tuple (analyzer + normalizer + renderer + engine) alongside every saved parameter set and every share link.
2. Keep old rendering code paths frozen and importable by version. Use a registry pattern: `renderers['geometric-v1']`, `renderers['geometric-v2']`.
3. When rendering a saved piece, always use the stored version's renderer, not the current one.
4. Automate version bump detection: a CI test generates art for 10 pinned seeds using the current version tuple, and fails if output hashes change without a version increment.
5. Version at the style level, not the engine level. If only the organic renderer changes, only `organic-renderer` version increments. Geometric art is unaffected.

**Warning signs:**
- Gallery art "shifts" after a deployment
- Share links produce different art than when created
- CI rendering tests break unexpectedly
- No automated test catches rendering behavior changes

**Phase to address:**
Phase 1 (Foundation) -- Version schema and the registry pattern must be designed upfront. Rendering snapshot tests must be established when each style is implemented. The version-locked replay strategy must be part of the data model from day one.

---

### Pitfall 6: Input Canonicalization That Misses Edge Cases

**What goes wrong:**
Two inputs that a user considers "the same" produce different art because canonicalization missed an edge case. Examples: (a) Unicode text with combining characters vs. precomposed characters (cafe vs. cafe with combining accent), (b) JSON with different key orders or whitespace, (c) CSV with trailing newlines vs. without, (d) URLs with/without trailing slashes, with/without www, with/without scheme, percent-encoded vs. decoded characters. Each missed case breaks the determinism promise for that user.

**Why it happens:**
Unicode NFC normalization handles the canonical equivalence case, but there are many other normalization dimensions: whitespace normalization (tabs vs. spaces, trailing whitespace, BOM characters), case sensitivity decisions, JSON key ordering (RFC 8785 JCS defines one standard, but few libraries implement it), CSV quoting variations, and URL normalization (scheme, trailing slash, query parameter ordering, fragment removal). Developers implement the obvious cases and miss the long tail.

**How to avoid:**
1. For text: Apply Unicode NFC normalization, trim leading/trailing whitespace, collapse internal whitespace runs to single spaces, strip BOM. Document that canonicalization is case-sensitive (intentional -- "Hello" and "hello" should produce different art).
2. For JSON: Use RFC 8785 (JSON Canonicalization Scheme) or a simplified version that recursively sorts keys and normalizes number representation. Strip whitespace.
3. For CSV: Normalize line endings to `\n`, trim trailing empty rows, standardize quoting. Use a deterministic CSV parser, not regex.
4. For URLs: Normalize scheme to https, remove default ports, remove fragments, sort query parameters, decode unnecessary percent-encoding, remove trailing slashes. Use the WHATWG URL parser (built into Node.js and browsers).
5. Write a canonicalization test suite with 50+ edge cases per input type. If an edge case isn't tested, assume it's broken.

**Warning signs:**
- Users report "I typed the same thing and got different art"
- Copy-pasting text from different sources (Word, web, terminal) produces different art
- JSON/CSV inputs with different formatting produce different art
- URL with and without `www.` produces different art

**Phase to address:**
Phase 1 (Foundation) -- Canonicalization is part of the determinism contract. Define and test it before building analysis pipelines that consume canonicalized input.

---

### Pitfall 7: SSRF Vulnerability in URL Input

**What goes wrong:**
The URL input feature fetches arbitrary user-supplied URLs server-side. An attacker submits URLs targeting internal services (cloud metadata endpoints like `169.254.169.254`, internal APIs, localhost services), exfiltrating sensitive data or triggering internal actions. DNS rebinding attacks bypass hostname validation: the attacker's domain resolves to a public IP during validation, then to an internal IP when the actual fetch occurs.

**Why it happens:**
URL validation that only checks the hostname string (blocklist of "localhost", "127.0.0.1") is trivially bypassed with IP encoding tricks (decimal IP `2130706433` = `127.0.0.1`), IPv6 notation (`::1`), DNS rebinding, or redirect chains. Many Node.js HTTP clients follow redirects by default, allowing an attacker to redirect from a "safe" URL to an internal target.

**How to avoid:**
1. Resolve the hostname to an IP address *before* making the request, then validate the resolved IP against a blocklist of private ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7).
2. Pin the resolved IP for the actual request (pass the resolved IP to the HTTP client, not the hostname) to prevent DNS rebinding between validation and request.
3. Disable automatic redirect following, or re-validate each redirect target against the same blocklist.
4. Restrict allowed protocols to `https:` only (block `file:`, `gopher:`, `ftp:`, `data:` schemes).
5. Set strict timeouts (5s connect, 10s total) and response size limits (5MB) to prevent slowloris and resource exhaustion.
6. Consider using the `agent-fetch` library or a similar sandboxed HTTP client specifically designed for SSRF protection.

**Warning signs:**
- No integration test that attempts to fetch `http://169.254.169.254/latest/meta-data/` and expects a block
- URL fetching follows redirects without re-validation
- Validation uses string matching instead of IP range checking
- No timeout on URL fetching

**Phase to address:**
Phase 2 (Analysis Pipeline) -- SSRF protection must be implemented and tested before the URL analysis feature goes live. It is a security-critical blocker, not a "nice to have."

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `Math.random()` in a rendering utility "just for testing" | Faster prototyping | Breaks determinism guarantee, hard to find later | Never -- use seeded PRNG from day one |
| Hardcoding calibration values instead of loading from the calibration harness | Faster initial development | Normalization breaks when calibration corpus changes; impossible to re-calibrate without code changes | Never -- calibration data should be externalized from the start |
| Server-side rendering with a different canvas library than the browser uses | Faster server setup | Pixel differences between client preview and exported image | Acceptable in MVP if documented; use skia-canvas on server to match Chromium's Skia backend |
| Storing raw input in the database "temporarily" for debugging | Easier debugging of analysis issues | Privacy violation, data breach risk, violates core product promise | Never -- log parameter vectors and analysis intermediates, never raw input |
| Skipping version bumps during rapid iteration | Fewer version numbers to manage | Saved art silently changes, share links break, user trust eroded | Only during pre-launch development with no persisted data |
| Using `node-canvas` (Cairo-based) for server rendering | Widely used, more documentation | Different rendering engine than browsers (Cairo vs. Skia), causing client/server visual mismatch | Use skia-canvas instead for Chromium parity |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| URL fetching (web scraping) | Not respecting `robots.txt`, not handling GDPR implications of scraping personal data from pages | Respect `robots.txt`, strip personally identifiable information from scraped content before analysis, set a descriptive User-Agent, handle HTTP errors gracefully |
| Font loading for Typographic style | Assuming system fonts are available on the server and across browsers | Bundle specific web fonts (WOFF2), register them explicitly in both browser canvas and server-side skia-canvas. Never rely on system fonts for deterministic rendering |
| OKLCH color space in canvas | Using OKLCH values directly in canvas context (which only accepts sRGB) | Convert OKLCH to sRGB for canvas `fillStyle`/`strokeStyle`. Use OKLCH for palette *generation* math, then convert. Gamut-map out-of-range colors gracefully -- clamp chroma, not lightness |
| PostgreSQL + Drizzle ORM | Not indexing the version columns, making version-locked queries slow | Add composite indexes on (shareId, engineVersion) and (galleryId, rendererVersion) from the initial migration |
| Cloud metadata endpoints | Deploying on AWS/GCP/Azure without blocking metadata endpoint access from the application | Block `169.254.169.254` and equivalent cloud metadata IPs at both the application level (SSRF protection) and network level (firewall rules) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 4096x4096 canvas render on client side | Browser tab crashes, "canvas area exceeds maximum limit" errors, mobile devices freeze | Always render high-res exports server-side. Client renders at display resolution only (800x800 or device pixel ratio). A 4096x4096 RGBA canvas requires ~67MB of memory. | Immediately on most mobile devices; on desktop browsers at ~8192x8192 |
| Particle system with too many particles on mobile | Frame drops, battery drain, janky animation | Cap particle count based on device capability detection. Use `navigator.hardwareConcurrency` and canvas size to set limits. Target 1000 particles mobile, 5000 desktop | >500 particles on low-end mobile (2GB RAM devices) |
| Perlin noise recalculation per frame without caching | Animation stutters, high CPU usage, rendering exceeds 1s budget | Pre-compute noise grid at generation time, cache in a typed array (Float32Array). Only animate particle positions, not the noise field | Immediately visible with octave-based noise (4+ octaves at 800x800 = millions of noise evaluations) |
| Synchronous URL fetching blocking the analysis pipeline | UI shows "Analyzing..." for 10+ seconds with no progress feedback | Use streaming analysis: fetch with a timeout, show progress as each analysis step completes. Implement a 5-second hard timeout with partial results fallback | URLs with slow responses, large pages (>2MB HTML), redirect chains |
| Gallery queries without pagination | Page load time increases linearly with gallery size | Implement cursor-based pagination from the start (not offset-based, which degrades at high page numbers). Limit gallery API to 20 items per request | >500 gallery entries |
| Calibration harness loading all 60+ reference inputs on every analysis | Analysis startup takes seconds, burns memory | Load calibration quantile breakpoints (pre-computed), not raw reference inputs. Compute breakpoints offline during calibration, serialize as a small JSON lookup table | Immediately -- 60 full NLP analyses at startup would add 30+ seconds |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing raw input server-side "just for the gallery title" | Data breach exposes sensitive user text (passwords, personal notes, financial data users pasted to "see what art it makes") | Store only: parameter vector, style choice, user-provided title (optional, separate from input), version tuple. Never store or log raw input. |
| Share links containing parameter values in URL query strings | Parameter values in URLs get logged in server access logs, browser history, analytics tools, referrer headers | Use opaque share IDs (random UUIDs) that map to stored parameter sets. Share URL = `app.com/art/abc123`, not `app.com/art?params=...` |
| Gallery input preview reconstructed from parameters | Even without storing raw input, if parameter-to-input is invertible, privacy is compromised | Ensure the analysis pipeline is a one-way function (lossy). Parameters should not be invertible to reconstruct original input. Document this property. |
| Profanity filter only on English text | Non-English profanity, Unicode homoglyph attacks (e.g., Cyrillic 'a' replacing Latin 'a'), and zero-width characters bypass the filter | Use a Unicode-aware profanity filter. Normalize Unicode homoglyphs before filtering. Apply to user-provided gallery titles only (not to the input itself, which is never stored). |
| No CSRF protection on gallery save/report endpoints | Attackers trick authenticated users into saving/reporting content via cross-site requests | Use SameSite cookies and CSRF tokens on all state-mutating endpoints. Next.js server actions provide CSRF protection by default -- use them. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a loading spinner during the entire analysis+render pipeline | Users don't know if the app is working or broken, abandon after 3 seconds | Staged progress animation: "Parsing..." -> "Analyzing..." -> "Normalizing..." -> "Rendering..." with a progress bar. Each stage updates independently. |
| Translation panel that uses technical jargon | Users see "entropy: 0.73, bigram frequency deviation: 0.41" and learn nothing | Plain-English explanations: "Your text has moderate randomness -- mixing common and unusual letter patterns" with the technical values available on hover/expand |
| Art that looks too similar across different inputs | Users try their name, their friend's name, and both look alike -- they leave | Ensure the rendering pipeline amplifies small parameter differences visually. Use a diverse default color palette. Test with common first names -- they should produce noticeably different art |
| No "undo" or "go back" after style selection | User picks a style, doesn't like it, has to re-enter input | Preserve the parameter vector across style changes. Style selection should re-render instantly without re-analysis. |
| Export produces different art than the on-screen preview | User carefully adjusted style, exported, and the PNG looks different | Show a brief "rendering for export..." message and display the server-rendered result in a confirmation dialog before download. Explain that the export is the "definitive" version. |
| Compare mode with no visual highlighting of differences | Users open compare mode but can't tell what's different between two artworks | Auto-highlight the parameter bars that differ most. Generate a plain-English summary: "These pieces differ most in rhythm and color warmth." |

## "Looks Done But Isn't" Checklist

- [ ] **Determinism:** Art "looks deterministic" in casual testing but hasn't been verified across browsers, OS versions, and device types -- run automated cross-platform snapshot tests (BrowserStack or similar)
- [ ] **Canonicalization:** Text input works for ASCII but hasn't been tested with Unicode combining characters, RTL text, emoji sequences, or zero-width characters
- [ ] **Calibration:** Normalization "works" on the 60 reference inputs but hasn't been tested against adversarial inputs (empty string, 100KB text, single emoji, binary-looking strings)
- [ ] **SSRF Protection:** URL input blocks `localhost` and `127.0.0.1` but hasn't been tested against decimal IPs, IPv6, DNS rebinding, redirect chains, or `file://` scheme
- [ ] **Rate Limiting:** Limits work per-IP but haven't been tested against X-Forwarded-For spoofing, distributed attacks, or cookie rotation
- [ ] **Privacy:** Raw input isn't in the database but may be in server access logs, error logs, analytics events, or browser localStorage
- [ ] **Accessibility:** Alt text generation works but hasn't been tested with screen readers, keyboard navigation hasn't been tested with the translation panel, reduced-motion preference hasn't been tested with all animation states
- [ ] **High-res Export:** 4096x4096 export works on the developer's machine but hasn't been tested under concurrent load (multiple users exporting simultaneously) or with complex particle-style art
- [ ] **Gallery Moderation:** Profanity filter works for English but hasn't been tested with Unicode homoglyph attacks, leetspeak, or non-Latin scripts
- [ ] **Version Locking:** Saved art renders correctly today but there is no automated test that previous versions still render identically after code changes

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Canvas non-determinism discovered after launch | MEDIUM | Server-side re-render all gallery thumbnails with pinned environment. Add disclaimer about cross-browser cosmetic differences. Treat server render as canonical. |
| PRNG drift discovered after gallery has saved art | HIGH | Requires keeping the broken PRNG path as "v1" and fixing forward in "v2". All existing saved art must be tagged with v1 to preserve rendering. Cannot silently fix. |
| Calibration bias producing boring art | LOW | Re-run calibration with expanded reference corpus. Bump normalizerVersion. Existing saved art continues to use old calibration via version locking. |
| NLP accuracy issues on short text | LOW | Adjust parameter weights to reduce NLP contribution for short inputs. No version bump needed if weight adjustment is treated as a normalization change (bump normalizerVersion). |
| SSRF vulnerability exploited | HIGH | Immediate: block all URL input temporarily. Fix: implement proper IP validation and DNS pinning. Audit logs for exploitation scope. Incident response per deployment platform. |
| Raw input found in logs | MEDIUM | Purge affected log storage immediately. Audit all logging paths. Add log sanitization middleware that strips request bodies from log output. Notify affected users if personal data was exposed. |
| Version not bumped after rendering change | HIGH | Identify all gallery entries and share links created between the unversioned change and discovery. These are "orphaned" -- their art changed silently. Must choose: re-tag them with a new version (art changes acknowledged), or revert the rendering change and re-deploy. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cross-browser canvas non-determinism | Phase 1: Foundation | Server-side rendering produces identical output across deployments; client rendering tested in 3+ browsers with tolerance-based visual diff |
| PRNG seeding errors | Phase 1: Foundation | Snapshot tests for 10+ seed/parameter combinations; ESLint rule blocking `Math.random()` in rendering paths |
| Normalization calibration bias | Phase 2: Analysis Pipeline | Parameter distribution histograms show spread across full 0-1 range for diverse calibration inputs; no dimension has >50% clustering in 0.2 band |
| NLP accuracy on edge inputs | Phase 2: Analysis Pipeline | Adversarial test suite of 30+ unusual inputs produces diverse parameter vectors; short-text weighting attenuates NLP signals |
| Engine versioning breaks | Phase 1: Foundation (schema) + each rendering phase | CI test generates art for pinned seeds and fails if output changes without version bump |
| Input canonicalization gaps | Phase 1: Foundation | Test suite of 50+ edge cases per input type; Unicode NFC, JSON key ordering, URL normalization all verified |
| SSRF in URL input | Phase 2: Analysis Pipeline | Integration tests attempt to fetch private IPs, metadata endpoints, redirect chains; all blocked |
| Parameter injection in share links | Phase 3: Gallery/Sharing | Share IDs are opaque UUIDs; parameter values never appear in URLs; server validates parameter bounds on render |
| Privacy leaks in logs | Phase 1: Foundation | Log sanitization middleware active from first deployment; audit confirms no raw input in any log stream |
| High-res export memory issues | Phase 3: Gallery/Sharing (Export) | Load test: 10 concurrent 4096x4096 exports complete without OOM; server-side memory monitoring alerts configured |
| Gallery abuse/spam | Phase 3: Gallery/Sharing | Rate limiting tested against header spoofing; CAPTCHA on gallery save after threshold; pagination tested at 10K entries |
| Font rendering inconsistency (Typographic style) | Phase with Typographic renderer | Bundled WOFF2 fonts registered in both client and server canvas; visual diff test for text rendering |

## Sources

- [Canvas Fingerprinting - BrowserLeaks](https://browserleaks.com/canvas) -- HIGH confidence, demonstrates cross-browser pixel variance
- [Floating-Point Determinism - Random ASCII](https://randomascii.wordpress.com/2013/07/16/floating-point-determinism/) -- HIGH confidence, authoritative reference on FP determinism challenges
- [Floating Point Determinism - Gaffer on Games](https://gafferongames.com/post/floating_point_determinism/) -- HIGH confidence, widely cited in game development
- [Canvas Fingerprinting - Fingerprint.com](https://fingerprint.com/blog/canvas-fingerprinting/) -- MEDIUM confidence, explains rendering variance mechanisms
- [PRNG shootout - Vigna/Blackman](https://prng.di.unimi.it/) -- HIGH confidence, official xoshiro reference from the algorithm's creators
- [Implausible Output from xoshiro256** - PCG](https://www.pcg-random.org/posts/implausible-output-from-xoshiro256.html) -- MEDIUM confidence, critical analysis of xoshiro state-space issues
- [Mulberry32 PRNG - GitHub Gist](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) -- MEDIUM confidence, community-maintained reference implementation
- [JavaScript PRNGs - bryc/code](https://github.com/bryc/code/blob/master/jshash/PRNGs.md) -- MEDIUM confidence, comprehensive JS PRNG comparison
- [Quantile Normalization pitfalls - Nature Scientific Reports](https://www.nature.com/articles/s41598-020-72664-6) -- HIGH confidence, peer-reviewed paper on QN issues
- [Feature-specific QN - BMC Bioinformatics](https://bmcbioinformatics.biomedcentral.com/articles/10.1186/s12859-024-05759-w) -- HIGH confidence, peer-reviewed, details class-effect bias
- [Four Sentiment Analysis Accuracy Traps - Toptal](https://www.toptal.com/developers/deep-learning/4-sentiment-analysis-accuracy-traps) -- MEDIUM confidence, practical analysis of NLP pitfalls
- [Sentiment Analysis Challenges - AIM Research](https://research.aimultiple.com/sentiment-analysis-challenges/) -- MEDIUM confidence, survey of common NLP issues
- [SSRF Prevention in Node.js - OWASP](https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs) -- HIGH confidence, authoritative security reference
- [Bypassing SSRF Protection in nossrf - Node.js Security](https://www.nodejs-security.com/blog/bypassing-ssrf-protection-nossrf) -- HIGH confidence, demonstrates real bypass techniques
- [SSRF Prevention Cheat Sheet - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) -- HIGH confidence, authoritative security reference
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) -- HIGH confidence, IETF standard
- [UAX #15: Unicode Normalization Forms](https://unicode.org/reports/tr15/) -- HIGH confidence, Unicode Consortium standard
- [OKLCH in CSS - Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) -- MEDIUM confidence, well-researched technical blog
- [Canvas text rendering cross-browser - Ben Nadel](https://www.bennadel.com/blog/4320-rendering-text-to-canvas-with-adjusted-x-y-offsets-for-better-cross-browser-consistency.htm) -- MEDIUM confidence, practical experience with workarounds
- [Canvas Area Exceeds Maximum Limit - PQINA](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit) -- MEDIUM confidence, documents browser canvas size limits
- [skia-canvas - GitHub](https://github.com/samizdatco/skia-canvas) -- HIGH confidence, primary source for the library
- [Rate Limit Bypass Techniques - HackTricks](https://book.hacktricks.xyz/pentesting-web/rate-limit-bypass) -- MEDIUM confidence, comprehensive bypass reference

---
*Pitfalls research for: Deterministic generative art web application (Synesthesia Machine)*
*Researched: 2026-03-02*