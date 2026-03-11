# Synesthesia Machine

## What This Is

A full-stack web application that converts any input (text, URLs, CSV/JSON data) into unique, deterministic algorithmic artwork. The same input always produces the same visual output — like a hash function that generates art instead of hex strings. Translation rules are transparent and displayed alongside the artwork so users understand exactly how their input became a visual piece. This is Project 5 in Ahmad Ali's personal portfolio, serving as the public-facing personality piece that demonstrates frontend craft, data analysis, interactive design, and full-stack architecture.

## Core Value

Any input deterministically produces beautiful, unique artwork with fully transparent translation rules — the kind of thing people try with their own name, bookmark, and send to friends.

## Requirements

### Validated

- ✓ Deterministic input-to-art pipeline: same input always produces same visual output given same engine version — M001
- ✓ Text input analysis: NLP pipeline extracting character frequency, sentiment, syllable patterns, entropy, etc. — M001
- ✓ URL input analysis: fetch, scrape, extract text + page metadata, run through deterministic pipeline with SSRF protection — M001
- ✓ CSV/JSON data input analysis: statistical analysis (distributions, correlations, cardinality, null ratios) — M001
- ✓ Normalized parameter vector (~15 dimensions, 0-1 range) as universal intermediate representation — M001
- ✓ Quantile-based normalization with calibration harness (30+ text, 15+ URL, 15+ data reference inputs) — M001
- ✓ Parameter provenance tracking: per-parameter signal breakdown with weights and plain-English explanations — M001
- ✓ Geometric rendering style with composition laws (grid-based, Mondrian-meets-data-viz) — M001
- ✓ Organic rendering style with composition laws (noise flow fields, gradient blending) — M001
- ✓ Particle rendering style with composition laws (clustered starfield, motion safeguards) — M001
- ✓ Typographic rendering style with composition laws (text as visual medium, legibility constraints) — M001
- ✓ Style selector with real mini-preview thumbnails rendered from same parameters — M001
- ✓ Seeded PRNG, hashing, and independent engine/analyzer/normalizer/renderer versioning — M001
- ✓ Input canonicalization per type (NFC text, stable JSON key ordering, CSV normalization, URL normalization) — M001
- ✓ Translation panel showing parameter bars, provenance, and plain-English explanations — M001
- ✓ Palette generation in perceptual color space (OKLCH) with coherence and contrast protection — M001
- ✓ Dark mode default with light mode toggle, respecting system preference — M001
- ✓ Progressive canvas building animation with reduced-motion support — M001
- ✓ Quick-start buttons and Surprise Me flow — M001
- ✓ Staged progress animation (Parsing, Analyzing, Normalizing, Rendering) — M001
- ✓ Share links storing only parameters/version/style (no raw input) — M001
- ✓ Gallery: explicit opt-in save, browse, filter, sort, report, delete-own-entry — M001
- ✓ Compare mode: side-by-side artworks with parameter diff and summary — M001
- ✓ Local-only mode for text input with lock indicator and no analysis fetches — M001
- ✓ Private-by-default generation model — M001
- ✓ Rate limiting and abuse prevention for URL analysis and gallery saves — M001
- ✓ Profanity filter on gallery titles and previews — M001
- ✓ PostgreSQL + Drizzle infrastructure for gallery, caches, and version-aware persistence — M001
- ✓ Export controls: 4096 PNG path, SVG for vector styles, frame toggle, diagnostics headers — M001
- ✓ Auto-generated deterministic alt text for canvases and export diagnostics — M001
- ✓ Responsive design: mobile-first with collapsible/bottom-sheet-style translation surfaces and horizontal style selector — M001

### Active

- [ ] Full keyboard navigation across every interactive surface (tabs, style selector, gallery cards, compare, export) with browser-level verification
- [ ] Server-side export rendering completes in under 3 seconds at 4096x4096 with real rasterized PNG output
- [ ] Build-safe lazy database bootstrap so `next build` succeeds without `DATABASE_URL` during static analysis/page-data collection

### Recently Completed

- [x] Milestone M001 completed end-to-end with 9/9 slices and 530/530 tests passing
- [x] Cross-slice summary, requirement transition audit, and project state refresh completed
- [x] Build-closeout TypeScript regressions in render-export route and render types fixed during milestone completion

### Out of Scope

- Song title input type — API-dependent, defer to stretch goals
- Abstract Landscape rendering style — stretch goal
- Animated renders as a primary product surface — stretch goal beyond subtle existing motion behavior
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

- **Tech Stack**: Next.js (App Router) + TypeScript + Tailwind CSS, all-Node analysis stack
- **Rendering**: Canvas API for raster styles, SVG for vector styles
- **Database**: PostgreSQL via Drizzle ORM + Neon HTTP driver
- **Deployment**: Vercel-friendly Next.js app, but build-time DB bootstrap still needs hardening
- **Performance**: Text analysis <500ms, URL <5s, data <2s, canvas render <1s at 800x800, export target <3s at 4096x4096
- **Security**: SSRF protection mandatory for URL input (block private IPs, DNS rebinding protection)
- **Determinism**: All randomness via seeded PRNG, never Math.random() in rendering/pipeline paths

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed parameter schema (~15 core params) vs dynamic keys | Reliable panel rendering, stable caching, predictable versioning | Validated — M001 |
| Quantile-based scaling vs min/max normalization | Min/max breaks with outliers, quantile produces more expressive distributions | Validated — M001 |
| Parameters-only share links (no raw input stored) | Privacy protection — users will paste sensitive text | Validated — M001 |
| Dark mode default | Dark backgrounds make generated colors pop, artwork is the hero | Validated — M001 |
| All-Node analysis stack | Lower operational complexity than hybrid Python service | Validated — M001 |
| Perceptual color space (OKLCH) for palette generation | Prevents muddy/harsh color combinations, better visual quality | Validated — M001 |
| Alea PRNG algorithm | Fast, good distribution, deterministic, small footprint | Validated — M001 |
| Proxy-based canvas mock for testing | Lightweight alternative to vitest-canvas-mock, no native dependencies | Validated — M001 |
| Scene graphs carry source parameters | Enables deterministic alt text/export metadata without recomputation | Established — M001 |
| Explicit export capability matrix | Makes unsupported format/style combinations observable and testable | Established — M001 |

## Current State

- **Milestone status:** M001 complete
- **Slices:** 9/9 complete
- **Tasks:** 38/38 complete
- **Strongest acceptance signal:** `npm test` passes with **530/530 tests**
- **Build status:** `next build` now passes milestone-closeout TypeScript checks but still fails without `DATABASE_URL` because DB-backed route imports eagerly initialize Neon during page-data collection
- **Operational caveat:** build portability is the main remaining infrastructure gap; runtime/test behavior for the shipped feature set is otherwise well covered
- **Most important next hardening targets:** build-safe DB bootstrap, true raster PNG export implementation, full keyboard-navigation verification

---
*Last updated: 2026-03-11 after M001 completion*
