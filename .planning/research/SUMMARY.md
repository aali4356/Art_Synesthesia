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
