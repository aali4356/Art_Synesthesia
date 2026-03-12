# M003: Signature Product Experience

**Vision:** Turn Synesthesia Machine from a technically impressive art generator into a distinct editorial gallery-luxe product whose landing, generation, results, gallery, compare, share, and export experiences feel unmistakably branded, premium, and coherent in real browser use.

## Success Criteria

- A first-time visitor can land on the homepage and understand what Synesthesia Machine is, why it is special, and how to begin within the branded landing/generation surface.
- The landing, generation, and results flow feels like one continuous premium experience in the real app rather than a marketing shell followed by a utilitarian tool surface.
- Gallery, compare, share, and export surfaces visibly share the same product language — typography, composition, copy posture, action styling, and viewer framing — instead of reading like disconnected pages.
- Key redesigned surfaces remain keyboard-usable and preserve existing privacy and diagnostics boundaries while becoming more visually ambitious.
- The assembled redesign can be demonstrated end-to-end in a browser through the real entrypoint and major product routes without breaking existing generation, viewer, share, gallery, and compare flows.

## Key Risks / Unknowns

- Landing and results may diverge visually or structurally — if the editorial direction only works on a hero section and not the real generation/results seam, the milestone fails its core promise.
- Existing route shells and undefined shared utility classes may fragment the redesign — if compare/gallery/share keep separate visual grammars or brittle styling, later polish will not compound.
- Premium art direction may reduce clarity or accessibility — if stronger materials, typography, and motion obscure controls or regress keyboard use, the redesign will hurt the product.

## Proof Strategy

- Landing/results continuity risk → retire in S01 by shipping the real homepage, generation entry, and results relationship through the existing `src/app/page.tsx` flow with upgraded brand narrative and premium hierarchy visible in-browser.
- Cross-surface coherence risk → retire in S02 by shipping shared branded shell/action/viewer language that is actually consumed by results, gallery, compare, share, and export-adjacent surfaces instead of remaining a token-only layer.
- Usability-through-ambition risk → retire in S03 by shipping the redesigned gallery/compare/share/export family and proving the assembled routes work together in the browser with explicit accessibility-aware verification.

## Verification Classes

- Contract verification: targeted Vitest coverage for any shared layout/action/viewer primitives touched by the redesign plus existing route/component suites that protect results diagnostics, compare, gallery, and share behavior.
- Integration verification: real browser exercise of landing → generate → results plus gallery, compare, share, and export-adjacent interactions through the running app.
- Operational verification: local dev/build verification that redesigned shared shells and route surfaces still render under the existing app/runtime boundaries, including truthful handling of DB-backed routes when local DB dependencies are absent.
- UAT / human verification: visual judgment that the product reads as editorial gallery-luxe and coherent rather than generic SaaS or disconnected page-level polish.

## Milestone Definition of Done

This milestone is complete only when all are true:

- the roadmap slices have shipped substantive redesigns across the landing/generate/results and gallery/compare/share/export families, not just token or copy tweaks
- the shared brand layer, shell language, and surface primitives are actually wired into the real app routes and interactions
- the real `http://localhost:3000` entrypoint and supporting product routes are exercised in a browser as one branded experience
- the success criteria are re-checked against live browser behavior, not only tests, screenshots, or static markup
- final integrated acceptance covers the assembled cross-surface experience, including truthful diagnostics for any runtime dependency limits that remain outside this milestone

## Requirement Coverage

- Covers: R003, R004, R009
- Partially covers: R005, R010
- Leaves for later: R007, R008
- Orphan risks: none — every M003-relevant active requirement has a credible slice path or is explicitly left to later milestones by existing requirement ownership

## Coverage Summary

| Requirement | Status in M003 plan | Primary owner | Supporting slices | Notes |
|---|---|---|---|---|
| R003 — editorial gallery-luxe distinct visual design | mapped | S01 | S02, S03 | Starts at the most visible and risky landing/results seam, then propagates across the product |
| R004 — coherent branded product surfaces | mapped | S03 | S01, S02 | Final ownership sits on assembled cross-route coherence, not isolated page polish |
| R005 — credible public portfolio launch | partially covered | S03 | S01, S02 | M003 raises product presentation quality and browser-demo credibility; operational launch hardening remains M005 |
| R009 — premium launch-facing brand narrative and copy system | mapped | S01 | S03 | Owned first where visitor framing lives: homepage, onboarding posture, and primary empty/generation states |
| R010 — accessibility through redesign | partially covered | S03 | S01, S02 | M003 must preserve and recheck accessibility on redesigned surfaces, while full breadth remains owned by M004/M005 |

## Slices

- [ ] **S01: Editorial landing, generation, and results journey** `risk:high` `depends:[]`
  > After this: a visitor can use the real homepage flow to understand the product, generate artwork, and land in a premium branded results experience that already feels continuous rather than split between marketing and tool UI.
- [ ] **S02: Shared brand system across shell, actions, and viewer surfaces** `risk:medium` `depends:[S01]`
  > After this: the redesigned visual language is no longer homepage-only — shared chrome, action treatments, viewer framing, copy posture, and route-level surface patterns visibly unify results and the reusable product seams downstream pages depend on.
- [ ] **S03: Cohesive gallery, compare, share, and export product family** `risk:medium` `depends:[S01,S02]`
  > After this: gallery, compare, share, and export-adjacent flows can be demoed in the browser as one coherent collector/editorial product family, with final integration proof that the milestone works end-to-end through real routes.

## Boundary Map

### S01 → S02

Produces:
- a proven editorial direction implemented in the real `src/app/page.tsx` landing/generation/results flow
- upgraded launch-facing copy hierarchy and brand narrative patterns that downstream surfaces can reuse
- stable premium layout/material decisions for `Shell`, `Header`, `InputZone`, `ResultsView`, and the main homepage framing
- truth-tested constraints for how far visual ambition can go without obscuring core generation and diagnostics interactions

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- shared branded shell/chrome language for route-level surfaces built on existing layout boundaries instead of duplicated full-screen wrappers
- normalized shared action/surface/viewer styling that replaces or absorbs brittle undefined utility-class expectations
- reusable product-surface primitives and copy/material patterns that gallery, compare, share, and export-adjacent routes can adopt without rewriting business logic
- a stable cross-surface visual grammar for collector/editorial pages, detail viewers, and action clusters

Consumes:
- S01’s proven landing/results direction, hierarchy, and copy posture as the source of truth for downstream coherence

### S01 → S03

Produces:
- the canonical branded visitor-to-results story that final integration must preserve across gallery/share/compare routes
- real homepage and results proof surfaces that establish the acceptance bar for cross-route coherence

Consumes:
- nothing directly beyond S01 being the first shipped expression of the milestone direction
