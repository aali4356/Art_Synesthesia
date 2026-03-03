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
