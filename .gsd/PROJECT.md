# Project

## What This Is

Synesthesia Machine is a deterministic generative art product that transforms text, URLs, and structured data into algorithmic artwork with transparent translation logic. M001 delivered the full core product: multi-input analysis, four rendering styles, sharing, gallery, compare mode, export controls, and accessibility metadata. The next phase is not invention from scratch — it is product elevation: making the visual system richer, the experience more artsy and premium, the synesthesia mapping more expressive, and the whole application ready for public launch.

## Core Value

Deterministic synesthetic art that feels emotionally rich, visually unforgettable, and polished enough to be used, shared, and publicly launched as a real branded product.

## Current State

M001 and M002 are complete. The product already has:
- deterministic canonicalization, analysis, normalization, synesthetic mapping, curated palette-family selection, palette realization, and scene-graph rendering
- text, URL, and data inputs flowing through the shared generation/results pipeline
- geometric, organic, particle, and typographic renderers, with organic and typographic now consuming shared mapping-driven expressiveness posture
- a live `ResultsView` proof diagnostics seam exposing palette family, harmony, mapping posture, active style, supported styles, and renderer expressiveness
- share links, gallery, moderation, compare mode, export controls, and alt text
- passing art-system contract coverage plus browser-level acceptance evidence for the upgraded live results experience
- restored local no-DB build health through runtime-guarded DB-backed share/gallery/admin boundaries

Current gaps are now centered on product polish, coherence, and launch hardening rather than the core art engine:
- the site shell and primary surfaces are functional but not yet premium or distinct enough for the editorial gallery-luxe brand direction
- URL analysis in local no-DB mode still surfaces a real blocked runtime dependency on DB-backed snapshot storage, even though the failure path is explicit and inspectable
- shipping surfaces like broader observability, deploy guidance, continuity strategy, and cross-surface coherence still need hardening

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
  - S01 complete: the real homepage now delivers a branded editorial landing → generation → results journey with privacy-safe proof diagnostics and branded export/share/save action surfaces verified in-browser.
- [ ] M004: Product Coherence and Continuity — Strengthen onboarding, primary user loops, saved state, account/identity decisions, analytics, and continuity across sessions and surfaces.
- [ ] M005: Public Launch Readiness — Harden build/deploy reliability, fix operational gaps, improve observability, document production setup, and make the product ready for public portfolio launch.
