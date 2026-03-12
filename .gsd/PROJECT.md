# Project

## What This Is

Synesthesia Machine is a deterministic generative art product that transforms text, URLs, and structured data into algorithmic artwork with transparent translation logic. M001 delivered the full core product: multi-input analysis, four rendering styles, sharing, gallery, compare mode, export controls, and accessibility metadata. The next phase is not invention from scratch — it is product elevation: making the visual system richer, the experience more artsy and premium, the synesthesia mapping more expressive, and the whole application ready for public launch.

## Core Value

Deterministic synesthetic art that feels emotionally rich, visually unforgettable, and polished enough to be used, shared, and publicly launched as a real branded product.

## Current State

M001 is complete and M002 is now complete. The product already has:
- deterministic canonicalization, analysis, normalization, synesthetic mapping, palette selection, and rendering pipeline
- text, URL, and data inputs
- geometric, organic, particle, and typographic renderers
- shared synesthetic mapping that drives inspectable organic and typographic expressiveness posture in runtime scene graphs
- a live `ResultsView` proof diagnostics seam exposing palette family, harmony, mapping posture, active style, supported styles, and renderer expressiveness
- share links, gallery, moderation, compare mode, export controls, and alt text
- strong automated proof plus browser-level acceptance evidence for the upgraded art system

Current gaps are now centered on product polish and launch hardening, not M002 art-system wiring:
- the site shell and core flows are functional but not yet premium or brand-defining enough for the editorial gallery-luxe goal
- URL analysis in local no-DB mode still surfaces a real blocked runtime dependency on DB-backed snapshot storage, even though build health is restored and the failure is now explicit
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
- [x] M002: Chromatic Synesthesia Overhaul — Expand palette families, deepen synesthetic mapping and renderer expressiveness, and make the artwork itself feel premium, varied, and emotionally intentional.
- [ ] M003: Signature Product Experience — Redesign the full site into an editorial gallery-luxe product with a stronger brand identity, premium landing/results/gallery surfaces, and memorable UX.
- [ ] M004: Product Coherence and Continuity — Strengthen onboarding, primary user loops, saved state, account/identity decisions, analytics, and continuity across sessions and surfaces.
- [ ] M005: Public Launch Readiness — Harden build/deploy reliability, fix operational gaps, improve observability, document production setup, and make the product ready for public portfolio launch.
