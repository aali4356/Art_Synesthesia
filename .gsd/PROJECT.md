# Project

## What This Is

Synesthesia Machine is a deterministic generative art product that transforms text, URLs, and structured data into algorithmic artwork with transparent translation logic. M001 delivered the full core product: multi-input analysis, four rendering styles, sharing, gallery, compare mode, export controls, and accessibility metadata. The next phase is not invention from scratch — it is product elevation: making the visual system richer, the experience more artsy and premium, the synesthesia mapping more expressive, and the whole application ready for public launch.

## Core Value

Deterministic synesthetic art that feels emotionally rich, visually unforgettable, and polished enough to be used, shared, and publicly launched as a real branded product.

## Current State

M001 is complete. The product already has:
- deterministic canonicalization, analysis, normalization, and rendering pipeline
- text, URL, and data inputs
- geometric, organic, particle, and typographic renderers
- shared synesthetic mapping that now drives inspectable organic and typographic expressiveness posture in runtime scene graphs
- share links, gallery, moderation, compare mode, export controls, and alt text
- strong automated proof via targeted renderer, hook, and product-surface tests

Current gaps are quality and launchability, not basic capability:
- organic and typographic renderers now visibly consume shared synesthetic expressiveness in deterministic scene graphs, but browser-level visual proof of the upgraded art direction is still pending
- the site shell and core flows are functional but not yet premium or brand-defining
- build portability still has an eager DB bootstrap issue without `DATABASE_URL`
- shipping surfaces like observability, deploy guidance, and account/continuity strategy need hardening

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
- [ ] M002: Chromatic Synesthesia Overhaul — Expand palette families, deepen synesthetic mapping and renderer expressiveness, and make the artwork itself feel premium, varied, and emotionally intentional.
- [ ] M003: Signature Product Experience — Redesign the full site into an editorial gallery-luxe product with a stronger brand identity, premium landing/results/gallery surfaces, and memorable UX.
- [ ] M004: Product Coherence and Continuity — Strengthen onboarding, primary user loops, saved state, account/identity decisions, analytics, and continuity across sessions and surfaces.
- [ ] M005: Public Launch Readiness — Harden build/deploy reliability, fix operational gaps, improve observability, document production setup, and make the product ready for public portfolio launch.
