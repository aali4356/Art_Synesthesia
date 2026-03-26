# Project

## What This Is

Synesthesia Machine is a deterministic generative art product that transforms text, URLs, and structured data into algorithmic artwork with transparent translation logic. M001 delivered the full core product: multi-input analysis, four rendering styles, sharing, gallery, compare mode, export controls, and accessibility metadata. The next phase is not invention from scratch — it is product elevation: making the visual system richer, the experience more artsy and premium, the synesthesia mapping more expressive, and the whole application ready for public launch.

## Core Value

Deterministic synesthetic art that feels emotionally rich, visually unforgettable, and polished enough to be used, shared, and publicly launched as a real branded product.

## Current State

M001, M002, M003, and M004/S01 are complete. The product now has:
- deterministic canonicalization, analysis, normalization, synesthetic mapping, curated palette-family selection, palette realization, and scene-graph rendering
- text, URL, and data inputs flowing through a branded landing → generation → results journey on the real homepage
- geometric, organic, particle, and typographic renderers, with live `ResultsView` proof diagnostics exposing palette family, harmony, mapping posture, active style, supported styles, and renderer expressiveness
- a shared editorial gallery-luxe shell/action/viewer system applied across homepage, results, gallery, compare, gallery detail, and share detail routes
- share links, gallery, moderation, compare mode, export controls, alt text, and collector/editorial action surfaces that read as one product family
- passing targeted cross-surface tests, passing production builds, and browser-level acceptance evidence across the real entrypoint and major product routes
- restored local no-DB build health through runtime-guarded DB-backed share/gallery/admin boundaries with truthful unavailable-state messaging
- anonymous-first browser-local continuity for returning users: results can be saved into recent local work, rediscovered from the homepage/header continuity seam, and reopened in the same browser without storing raw source text, full URLs, or dataset bodies
- adaptive onboarding and repeat-use route discovery across Home, Results, Compare, and Gallery, including first-visit versus returning-user copy, a real shared navigation landmark with semantic active-route state, and explicit results next steps that keep browser-local continuity distinct from public routes

Current gaps are now centered on observability breadth and launch hardening rather than foundational product identity:
- privacy-filtered analytics/error-monitoring integration and broader accessibility breadth still need M004/S03 work
- URL analysis in local no-DB mode still surfaces a real blocked runtime dependency on DB-backed snapshot storage, and the user-facing failure copy still needs stronger explanation
- shipping surfaces like deploy guidance and public-launch operational hardening still need M005 work

## Architecture / Key Patterns

- Next.js App Router + TypeScript + Tailwind CSS frontend
- Deterministic core pipeline: canonicalize -> analyze -> normalize -> parameter vector -> synesthetic mapping -> palette -> scene graph -> render
- Renderer architecture is scene-graph based, with pure builders and style-specific canvas components
- Scene graphs carry source ParameterVector for accessibility and export reuse
- DB-backed persistence/caching flows through boundary modules (`db-cache`, `db-gallery`) rather than inline route logic
- Export capability matrix and diagnostics are explicit at the API layer

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration — Ship the complete deterministic v1 product foundation across inputs, renderers, gallery/share/compare, export, and privacy-aware infrastructure.
- [x] M002: Chromatic Synesthesia Overhaul — Expand palette families, deepen synesthetic mapping and renderer expressiveness, and make the artwork itself feel premium, varied, and emotionally intentional.
- [x] M003: Signature Product Experience — Completed the editorial gallery-luxe redesign across the real homepage, results, gallery, compare, share, and export-adjacent surfaces with browser-verified continuity and truthful diagnostics.
- [ ] M004: Product Coherence and Continuity — Strengthen onboarding, primary user loops, saved state, account/identity decisions, analytics, and continuity across sessions and surfaces.
- [ ] M005: Public Launch Readiness — Harden build/deploy reliability, fix operational gaps, improve observability, document production setup, and make the product ready for public portfolio launch.
