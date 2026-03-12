# M004: Product Coherence and Continuity — Context

**Gathered:** 2026-03-11
**Status:** Ready for future planning

## Project Description

M004 turns Synesthesia Machine from a visually premium experience into a more coherent repeat-use product. It focuses on onboarding clarity, continuity across sessions, intentional account/identity strategy, analytics, and operational visibility so the product behaves like something users can return to rather than only visit once.

## Why This Milestone

The user wants a full product, not only a better-looking demo. That means primary user loops, session continuity, real usage visibility, and a clear decision about user identity or persistence need to exist before public launch confidence is truly high.

## User-Visible Outcome

### When this milestone is complete, the user can:

- understand how to use the product quickly through stronger onboarding and empty-state guidance
- return to the product with continuity of saved work, identity, or intentional session persistence
- interact with a product whose major surfaces and states feel complete rather than one-off

### Entry point / environment

- Entry point: browser product flows
- Environment: local dev plus production-like verification
- Live dependencies involved: database-backed persistence, potential auth or lightweight identity layer, analytics/telemetry services if adopted

## Completion Class

- Contract complete means: continuity, onboarding, and observability capabilities are implemented with explicit tests/artifacts and clear product decisions
- Integration complete means: persistence/identity/onboarding logic works across real product surfaces such as results, gallery, share, and return visits
- Operational complete means: analytics or diagnostic signals exist and are inspectable in production-like usage

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a first-time user can understand the primary loop without prior explanation
- a returning-user scenario works with the chosen continuity/account strategy
- product owners can inspect real-world usage or failure signals beyond raw local testing

## Risks and Unknowns

- account scope can easily balloon if not intentionally constrained
- analytics/observability choices may create privacy or complexity tradeoffs
- continuity features may require revisiting earlier persistence models or UI assumptions

## Existing Codebase / Prior Art

- gallery/share persistence and creator token patterns from M001
- results, compare, and export surfaces that already represent major user loops
- DB schema and route structure that can host continuity features

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R004 — coherent product surfaces
- R007 — analytics and observability
- R008 — continuity/account strategy
- R009 — onboarding and value communication
- R010 — accessibility breadth

## Scope

### In Scope

- onboarding and empty-state guidance
- continuity/account strategy
- repeat-user product behavior
- analytics and/or observability integration
- accessibility completion for redesigned surfaces

### Out of Scope / Non-Goals

- full commercial SaaS monetization stack
- native app expansion
- deep enterprise/admin backoffice work beyond launch needs

## Technical Constraints

- continuity choices should preserve privacy posture where possible
- analytics and diagnostics should avoid careless sensitive-data collection
- identity strategy must fit a public portfolio-launch target rather than over-engineered SaaS complexity

## Integration Points

- DB-backed gallery/share/persistence layers
- global navigation and surface hierarchy from M003
- external analytics/telemetry tooling if adopted

## Open Questions

- Is lightweight auth enough, or is explicit anonymous persistence with optional identity a better fit? — to be resolved during milestone planning
- What analytics/observability stack best fits a portfolio-grade deployment without overcomplication? — to be researched then confirmed
