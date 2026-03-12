# M003: Signature Product Experience — Context

**Gathered:** 2026-03-11
**Status:** Ready for future planning

## Project Description

M003 redesigns Synesthesia Machine into a premium, editorial gallery-luxe digital product. With M002 improving the artwork itself, this milestone makes the surrounding product experience worthy of the art: stronger brand identity, premium landing and results surfaces, better narrative framing, cleaner and more memorable interactions, and a distinct visual system across gallery, compare, share, and export experiences.

## Why This Milestone

The user wants the website to look super artsy, sleek, and nice — not merely functional. Once artwork quality improves, the shell and product surfaces need to elevate too. This milestone turns the product into a branded experience rather than a technically impressive demo.

## User-Visible Outcome

### When this milestone is complete, the user can:

- land on a homepage that clearly communicates the product’s identity and value with strong art direction
- move through generate/results/gallery/compare/share flows that feel visually coherent and premium
- experience the app as a distinct branded art product rather than a collection of useful features

### Entry point / environment

- Entry point: `http://localhost:3000`
- Environment: browser, local dev and production-like build verification
- Live dependencies involved: same app surfaces as M001, with DB-backed gallery/share routes where relevant

## Completion Class

- Contract complete means: real UI redesigns are implemented with substantive layout, typography, and interaction changes across the main product surfaces
- Integration complete means: redesigned surfaces all work with the existing multi-style generation product and do not break share/gallery/compare/export paths
- Operational complete means: the product can be demoed end-to-end in a browser as a branded experience

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a first-time visitor can understand what the product is and why it is special from the landing/onboarding surfaces
- the generate/results/gallery/compare/share flows feel cohesive in the browser, not just as disconnected redesigned pages
- the new design language is reflected consistently in real interactions, not just design tokens or static markup

## Risks and Unknowns

- A premium redesign can become visually busy or self-indulgent without improving clarity
- Strong branding may conflict with product usability if hierarchy and interaction design are weak
- Existing gallery/compare/share flows may require structural refactors to achieve coherence

## Existing Codebase / Prior Art

- `src/app/page.tsx` — current landing/generation entrypoint
- `src/components/layout/*` — shell/header/theme patterns
- `src/components/results/*` — results surface and adjacent controls
- `src/app/gallery/*`, `src/app/compare/*`, `src/app/share/*` — existing product surfaces to redesign coherently
- `src/app/globals.css` — current token layer

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R003 — editorial gallery-luxe distinct visual design
- R004 — coherent branded product surfaces
- R009 — premium launch-facing brand narrative and copy system
- R010 — accessibility must remain intact through redesign

## Scope

### In Scope

- landing page and brand framing redesign
- results surface redesign
- gallery/compare/share/export surface coherence
- premium typography, layout, motion, and visual system
- product copy/brand voice upgrades

### Out of Scope / Non-Goals

- core account/continuity strategy (M004)
- deploy/runbook hardening (M005)
- reducing redesign to superficial theming only

## Technical Constraints

- must preserve existing functional flows while redesigning them
- visual ambition cannot come at the cost of keyboard/accessibility regression
- should reuse established data/render boundaries rather than rewriting business logic unnecessarily

## Integration Points

- layout shell, results surface, style selector, export controls
- gallery, compare, and share page structures
- global tokens and component styling patterns

## Open Questions

- How much of the brand identity should be expressed through copy vs visual materiality? — likely both
- Which surfaces most need structural simplification before visual polish? — likely landing/results first, then gallery/compare
