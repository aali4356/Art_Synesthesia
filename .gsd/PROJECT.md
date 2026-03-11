# Synesthesia Machine

## What This Is

A full-stack web application that converts any input (text, URLs, CSV/JSON data) into unique, deterministic algorithmic artwork. The same input always produces the same visual output — like a hash function that generates art instead of hex strings. Translation rules are transparent and displayed alongside the artwork so users understand exactly how their input became a visual piece. This is Project 5 in Ahmad Ali's personal portfolio, serving as the public-facing personality piece that demonstrates frontend craft, data analysis, interactive design, and full-stack architecture.

## Core Value

Any input deterministically produces beautiful, unique artwork with fully transparent translation rules — the kind of thing people try with their own name, bookmark, and send to friends.

## Requirements

### Validated

- ✓ Deterministic input-to-art pipeline: same input always produces same visual output given same engine version — Phase 1-4
- ✓ Text input analysis: NLP pipeline extracting character frequency, sentiment, syllable patterns, entropy, etc. — Phase 3
- ✓ Normalized parameter vector (~15 dimensions, 0-1 range) as universal intermediate representation — Phase 2
- ✓ Quantile-based normalization with calibration harness (30+ text, 15+ URL, 15+ data reference inputs) — Phase 2
- ✓ Parameter provenance tracking: per-parameter signal breakdown with weights and plain-English explanations — Phase 2
- ✓ Geometric rendering style with composition laws (grid-based, Mondrian-meets-data-viz) — Phase 4
- ✓ Seeded PRNG (xoshiro256** or Mulberry32), never Math.random() in rendering — Phase 1
- ✓ Engine versioning: engineVersion, analyzerVersion, normalizerVersion, rendererVersion — Phase 1
- ✓ Input canonicalization per type (NFC text, stable JSON key ordering, CSV normalization, URL normalization) — Phase 1
- ✓ Translation panel showing parameter bars, provenance, and plain-English explanations — Phase 4
- ✓ Palette generation in perceptual color space (OKLCH) with coherence function — Phase 2
- ✓ Dark mode default with light mode toggle, respecting system preference — Phase 1
- ✓ Progressive canvas building animation (respects prefers-reduced-motion) — Phase 4
- ✓ Quick-start buttons ("Try: your name / a haiku / a recipe") and "Surprise me" — Phase 3
- ✓ Staged progress animation (Parsing, Analyzing, Normalizing, Rendering) — Phase 3
- ✓ Reduced motion support (prefers-reduced-motion) — Phase 4
- ✓ Responsive design: mobile-first with bottom sheet translation panel — Phase 4

### Active

- [ ] URL input analysis: fetch, scrape, extract text + page metadata, run through text pipeline with SSRF protection
- [ ] CSV/JSON data input analysis: statistical analysis (distributions, correlations, cardinality, null ratios)
- [ ] Organic rendering style with composition laws (Perlin noise, flow fields, gradient blending)
- [ ] Particle rendering style with composition laws (force-directed, mobile particle cap)
- [ ] Typographic rendering style with composition laws (text as visual medium, legibility constraints)
- [ ] Style selector with real mini-preview thumbnails rendered from same parameters
- [ ] Share links with random IDs storing only parameters (no raw input)
- [ ] Gallery: save (opt-in), browse, filter by style, sort, report
- [ ] Compare mode: side-by-side with parameter diff and auto-generated summary
- [ ] Local-only mode for text input (client-side analysis, no server requests)
- [ ] Private-by-default generation model
- [ ] High-res PNG export (server-side re-render at 4096x4096)
- [ ] SVG export for vector styles (Geometric, Typographic)
- [ ] Auto-generated alt text from parameters for accessibility
- [ ] Full keyboard navigation
- [ ] Rate limiting and abuse prevention (URL: 10/IP/hour, gallery: 10 saves/IP/day)
- [ ] Profanity filter on titles and input previews
- [ ] Frame option for exports (subtle border/matte)
- [ ] Database (PostgreSQL + Drizzle ORM) for gallery, cached analyses, version tracking
- [ ] Caching strategy: analysis cache, render cache, URL snapshot cache

### Out of Scope

- Song title input type — API-dependent, defer to stretch goals
- Abstract Landscape rendering style — stretch goal
- Animated renders (particle/organic drift) — stretch goal
- Public API endpoint for external embedding — stretch goal
- "Artwork of the Day" featured gallery — stretch goal
- Version toggle on saved pieces (v1/v2 view) — stretch goal
- Admin dashboard for moderation — basic admin route sufficient for v1
- OAuth/social login — email/password sufficient if auth is needed
- Mobile native app — web-first

## Context

- Portfolio piece (Project 5) for Ahmad Ali — meant to be the kind of thing people try, bookmark, and share
- Core innovation: the parameter vector as universal intermediate representation between analysis and rendering
- Determinism is a product promise, not just a technical detail — requires explicit engineering at every layer
- Privacy-conscious: raw input never stored server-side, share links contain only parameters
- The translation panel (showing exactly why art looks the way it does) is a key differentiator from "random art generators"
- Calibration harness with 60+ reference inputs is required before normalization tuning (not optional)
- Cross-browser canvas determinism has known limitations — accept cosmetic anti-aliasing differences, use server-side rendering for exports

## Constraints

- **Tech Stack**: Next.js (App Router) + TypeScript + Tailwind CSS for frontend, Python microservice (FastAPI) for NLP/statistical analysis (or all-Node with natural/simple-statistics)
- **Rendering**: Canvas API for raster styles, SVG for vector styles, WebGL optional for particle performance
- **Database**: PostgreSQL via Drizzle ORM
- **Deployment**: Vercel for Next.js, Railway or Fly.io for Python microservice
- **Performance**: Text analysis <500ms, URL <5s, data <2s, canvas render <1s at 800x800, export <3s at 4096x4096
- **Security**: SSRF protection mandatory for URL input (block private IPs, DNS rebinding protection)
- **Determinism**: All randomness via seeded PRNG, never Math.random() in rendering paths

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed parameter schema (~15 core params) vs dynamic keys | Reliable panel rendering, stable caching, predictable versioning | Validated — Phase 2 |
| Quantile-based scaling vs min/max normalization | Min/max breaks with outliers, quantile produces more expressive distributions | Validated — Phase 2 |
| Parameters-only share links (no raw input stored) | Privacy protection — users will paste sensitive text | — Pending |
| Dark mode default | Dark backgrounds make generated colors pop, artwork is the hero | Validated — Phase 1 |
| Hybrid stack (Next.js + Python microservice) vs all-Node | Python has stronger NLP/stats libraries, but adds deployment complexity | All-Node chosen — Phase 3 |
| Perceptual color space (OKLCH) for palette generation | Prevents muddy/harsh color combinations, better visual quality | Validated — Phase 2 |
| Alea PRNG algorithm | Fast, good distribution, deterministic, small footprint | Validated — Phase 1 |
| Proxy-based canvas mock for testing | Lightweight alternative to vitest-canvas-mock, no native dependencies | Validated — Phase 4 |
| hidden md:block CSS pattern for responsive collapse | SSR safe, avoids hydration mismatch, Tailwind-native | Established — Phase 4 |

---
*Last updated: 2026-03-04 after Phase 4*
