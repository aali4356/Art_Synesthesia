# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R004 — Landing, generate, results, gallery, compare, share, and export flows must feel like parts of one consistent product with clear hierarchy, copy, transitions, and identity.
- Class: primary-user-loop
- Status: active
- Description: Landing, generate, results, gallery, compare, share, and export flows must feel like parts of one consistent product with clear hierarchy, copy, transitions, and identity.
- Why it matters: A premium product experience depends on coherence across surfaces, not just isolated pretty components.
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: M004/S01, M004/S02
- Validation: mapped
- Notes: Includes tone, navigation, visual continuity, and interaction design.

### R005 — The application must be polished, stable, and presentation-ready enough for a public launch as a flagship portfolio piece.
- Class: launchability
- Status: active
- Description: The application must be polished, stable, and presentation-ready enough for a public launch as a flagship portfolio piece.
- Why it matters: The user explicitly wants to ship it or get it ready for shipping, not leave it as an internal prototype.
- Source: user
- Primary owning slice: M005/S03
- Supporting slices: M003/S03, M004/S03, M005/S01, M005/S02
- Validation: mapped
- Notes: This is public-portfolio launch quality, not yet full SaaS-scale maturity.

### R006 — Local build, production build, and deployment setup must no longer fail because of eager DB bootstrap or fragile environment assumptions.
- Class: operability
- Status: active
- Description: Local build, production build, and deployment setup must no longer fail because of eager DB bootstrap or fragile environment assumptions.
- Why it matters: Shipping is blocked if the app cannot build cleanly and predictably.
- Source: user
- Primary owning slice: M005/S01
- Supporting slices: M005/S02
- Validation: mapped
- Notes: Current known failure is eager Neon initialization during `next build` without `DATABASE_URL`.

## Validated

### R001 — The artwork engine must produce substantially broader and more intentional color families so outputs no longer collapse into the same few purple/orange/green-feeling combinations.
- Class: differentiator
- Status: validated
- Description: The artwork engine must produce substantially broader and more intentional color families so outputs no longer collapse into the same few purple/orange/green-feeling combinations.
- Why it matters: The current narrow palette range undermines perceived quality and makes the product feel repetitive even when the underlying pipeline is deterministic.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02, M003/S02
- Validation: validated
- Notes: S04 added real browser proof for text and data flows via the live `ResultsView` diagnostics seam, showing palette-family identity in actual results. URL flow still depends on DB-backed snapshot storage in local no-DB mode, but the blocked state is now explicit and inspectable rather than hidden.

### R002 — The system should map inputs into palettes, compositions, and style behavior that feel more intentionally synesthetic rather than merely technically parameterized.
- Class: differentiator
- Status: validated
- Description: The system should map inputs into palettes, compositions, and style behavior that feel more intentionally synesthetic rather than merely technically parameterized.
- Why it matters: This is the heart of the product identity; stronger mapping quality makes the product memorable instead of just clever.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S03, M003/S03
- Validation: validated
- Notes: Palette-level proof is established for deterministic full-vector synesthetic mapping, stable diagnostics, and text/URL/data flow propagation. S03 extends that proof by showing organic and typographic scene builders consume `PaletteResult.mapping` through a shared expressiveness seam, exposing inspectable renderer posture in scene graphs and existing runtime flows. Live browser art-quality acceptance still belongs to S04.

### R003 — The web experience should look super artsy, sleek, and intentionally designed, with premium typography, spacing, composition, and materials.
- Class: differentiator
- Status: validated
- Description: The web experience should look super artsy, sleek, and intentionally designed, with premium typography, spacing, composition, and materials.
- Why it matters: The product must feel like a serious art object and premium digital experience, not a functional prototype.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S02, M003/S03
- Validation: validated
- Notes: S01 shipped and browser-verified the real homepage landing→generation→results journey in an editorial gallery-luxe system, proving the direction works in the actual app rather than only in static mockup-like surfaces.

### R007 — The product should expose enough diagnostics, analytics, and error visibility to understand failures and real-world usage after launch.
- Class: failure-visibility
- Status: validated
- Description: The product should expose enough diagnostics, analytics, and error visibility to understand failures and real-world usage after launch.
- Why it matters: Public launch without visibility creates blind spots that slow iteration and incident response.
- Source: user
- Primary owning slice: M004/S03
- Supporting slices: M005/S02
- Validation: Validated by M004/S03: privacy-filtered PostHog/Sentry seams capture safe product-loop and public-route/server failure events, with passing privacy-filtering, product-loop-events, public-route-failures, and shared-brand-surfaces suites plus live browser proof of truthful unavailable-state diagnostics without raw source leakage.
- Notes: Core analytics/error visibility is now inspectable through shared redaction-owned observability helpers and categorized no-DB proof-mode handling.

### R008 — The product needs an intentional continuity layer for returning users, whether through lightweight accounts, identity, or another explicit persistence strategy.
- Class: continuity
- Status: validated
- Description: The product needs an intentional continuity layer for returning users, whether through lightweight accounts, identity, or another explicit persistence strategy.
- Why it matters: A full product should not treat every session as entirely disposable if users are expected to return, curate, or build a relationship with the product.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: M004/S02, M005/S03
- Validation: Validated by M004/S01: recent browser-local work can be saved from results, rediscovered from the homepage/header continuity seam, and reopened in the same browser without persisting raw source text, full URLs, or dataset bodies. Proven by passing recent-work, anonymous-continuity, and product-family-coherence suites plus live browser save/return/resume verification.
- Notes: Anonymous-first continuity is explicitly scoped to same-browser edition-family recall, not exact session replay or public persistence.

### R009 — The homepage, onboarding, empty states, and key copy surfaces should communicate what Synesthesia Machine is, why it is special, and why someone should try/share it.
- Class: primary-user-loop
- Status: validated
- Description: The homepage, onboarding, empty states, and key copy surfaces should communicate what Synesthesia Machine is, why it is special, and why someone should try/share it.
- Why it matters: A premium art product needs narrative and framing, not just controls.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S03, M004/S01
- Validation: validated
- Notes: S01 added and browser-verified branded landing copy, private-first framing, curated prompt context, and continuity messaging that explain the product and how to begin on the real entry route.

### R010 — Full keyboard navigation and accessible interaction semantics must be completed across redesigned surfaces.
- Class: quality-attribute
- Status: validated
- Description: Full keyboard navigation and accessible interaction semantics must be completed across redesigned surfaces.
- Why it matters: A launch-ready premium product cannot regress usability while improving visual polish.
- Source: inferred
- Primary owning slice: M004/S03
- Supporting slices: M003/S03, M005/S03
- Validation: Validated by M004/S03: shared shell skip-link navigation, keyboard-complete input/style selection, gallery modal focus lifecycle, and reduced-motion behavior passed accessibility/interaction regression suites and live browser proof across home, results, gallery modal, and share unavailable surfaces.
- Notes: Keyboard/focus semantics are now covered across the redesigned M004 continuity/onboarding/results/public seams.

### R011 — The product deterministically converts text, URL, and data inputs into versioned algorithmic artwork.
- Class: core-capability
- Status: validated
- Description: The product deterministically converts text, URL, and data inputs into versioned algorithmic artwork.
- Why it matters: This is the foundation the next milestones build on.
- Source: execution
- Primary owning slice: M001/S01
- Supporting slices: M001/S02, M001/S03, M001/S04, M001/S05, M001/S06
- Validation: validated
- Notes: Proven by M001 completion summary and 530 passing tests.

### R012 — Geometric, organic, particle, and typographic styles are implemented and wired into the app.
- Class: core-capability
- Status: validated
- Description: Geometric, organic, particle, and typographic styles are implemented and wired into the app.
- Why it matters: M002 can focus on expressiveness rather than net-new renderer scaffolding.
- Source: execution
- Primary owning slice: M001/S04
- Supporting slices: M001/S05
- Validation: validated
- Notes: Proven by renderer-specific test suites and multi-style ResultsView integration.

### R013 — The current product already includes major surfaces expected of a real art product.
- Class: primary-user-loop
- Status: validated
- Description: The current product already includes major surfaces expected of a real art product.
- Why it matters: Later milestones can polish and unify these surfaces instead of inventing them from nothing.
- Source: execution
- Primary owning slice: M001/S07
- Supporting slices: M001/S08, M001/S09
- Validation: validated
- Notes: Proven by route/component tests and M001 summary.

### R014 — Raw input is not stored in share/gallery persistence flows, and local-only text generation behavior exists.
- Class: compliance/security
- Status: validated
- Description: Raw input is not stored in share/gallery persistence flows, and local-only text generation behavior exists.
- Why it matters: Future productization should preserve this trust boundary.
- Source: execution
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: validated
- Notes: Proven by privacy tests and schema/route verification.

### R015 — Alt text generation and export response diagnostics are implemented for current render/export flows.
- Class: failure-visibility
- Status: validated
- Description: Alt text generation and export response diagnostics are implemented for current render/export flows.
- Why it matters: Future milestones should build on these observability and accessibility foundations rather than replacing them.
- Source: execution
- Primary owning slice: M001/S09
- Supporting slices: none
- Validation: validated
- Notes: Proven by export and accessibility tests.

## Deferred

### R016 — A deeper account system with subscriptions, billing, and workspace-grade persistence may be useful later.
- Class: continuity
- Status: deferred
- Description: A deeper account system with subscriptions, billing, and workspace-grade persistence may be useful later.
- Why it matters: Could support a more commercial product direction beyond a portfolio launch.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Current direction only requires an intentional continuity strategy, not full monetized SaaS scope.

### R017 — Dedicated mobile apps are not part of the current near-term plan.
- Class: anti-feature
- Status: deferred
- Description: Dedicated mobile apps are not part of the current near-term plan.
- Why it matters: Prevents launch-readiness scope from ballooning into platform expansion.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Web-first remains the strategy.

## Out of Scope

### R018 — The project should not be reduced to a tiny cosmetic pass or only minor palette tweaks.
- Class: anti-feature
- Status: out-of-scope
- Description: The project should not be reduced to a tiny cosmetic pass or only minor palette tweaks.
- Why it matters: The user explicitly wants a fuller product, stronger brand, and shipping readiness, not a minimal cleanup.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Sequencing should phase ambition, not cut it.

### R019 — The redesign should not converge on a generic SaaS or neutral utility look.
- Class: anti-feature
- Status: out-of-scope
- Description: The redesign should not converge on a generic SaaS or neutral utility look.
- Why it matters: The chosen identity is a distinct branded art product with editorial gallery-luxe direction.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Prevents future planning from drifting toward bland polish.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | differentiator | validated | M002/S01 | M002/S02, M003/S02 | validated |
| R002 | differentiator | validated | M002/S02 | M002/S03, M003/S03 | validated |
| R003 | differentiator | validated | M003/S01 | M003/S02, M003/S03 | validated |
| R004 | primary-user-loop | active | M003/S03 | M004/S01, M004/S02 | mapped |
| R005 | launchability | active | M005/S03 | M003/S03, M004/S03, M005/S01, M005/S02 | mapped |
| R006 | operability | active | M005/S01 | M005/S02 | mapped |
| R007 | failure-visibility | validated | M004/S03 | M005/S02 | Validated by M004/S03: privacy-filtered PostHog/Sentry seams capture safe product-loop and public-route/server failure events, with passing privacy-filtering, product-loop-events, public-route-failures, and shared-brand-surfaces suites plus live browser proof of truthful unavailable-state diagnostics without raw source leakage. |
| R008 | continuity | validated | M004/S01 | M004/S02, M005/S03 | Validated by M004/S01: recent browser-local work can be saved from results, rediscovered from the homepage/header continuity seam, and reopened in the same browser without persisting raw source text, full URLs, or dataset bodies. Proven by passing recent-work, anonymous-continuity, and product-family-coherence suites plus live browser save/return/resume verification. |
| R009 | primary-user-loop | validated | M003/S01 | M003/S03, M004/S01 | validated |
| R010 | quality-attribute | validated | M004/S03 | M003/S03, M005/S03 | Validated by M004/S03: shared shell skip-link navigation, keyboard-complete input/style selection, gallery modal focus lifecycle, and reduced-motion behavior passed accessibility/interaction regression suites and live browser proof across home, results, gallery modal, and share unavailable surfaces. |
| R011 | core-capability | validated | M001/S01 | M001/S02, M001/S03, M001/S04, M001/S05, M001/S06 | validated |
| R012 | core-capability | validated | M001/S04 | M001/S05 | validated |
| R013 | primary-user-loop | validated | M001/S07 | M001/S08, M001/S09 | validated |
| R014 | compliance/security | validated | M001/S07 | none | validated |
| R015 | failure-visibility | validated | M001/S09 | none | validated |
| R016 | continuity | deferred | none | none | unmapped |
| R017 | anti-feature | deferred | none | none | unmapped |
| R018 | anti-feature | out-of-scope | none | none | n/a |
| R019 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 3
- Mapped to slices: 3
- Validated: 12 (R001, R002, R003, R007, R008, R009, R010, R011, R012, R013, R014, R015)
- Unmapped active requirements: 0
