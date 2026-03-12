# M005: Public Launch Readiness — Context

**Gathered:** 2026-03-11
**Status:** Ready for future planning

## Project Description

M005 hardens Synesthesia Machine for a confident public launch. It fixes build and deployment fragility, improves operational safety, completes deploy/runbook quality, and ensures the polished product from M002-M004 can actually be shipped and maintained as a public portfolio piece.

## Why This Milestone

The user explicitly wants to ship the product or get it ready for shipping. That requires more than beautiful visuals: build reliability, environment handling, deploy guidance, production observability, and final acceptance checks all need to be strong enough that launch is credible rather than hopeful.

## User-Visible Outcome

### When this milestone is complete, the user can:

- build and deploy the application with clear environment/setup expectations
- trust that the product’s public-facing experience is stable enough for launch
- operate the launched product with enough diagnostics and documentation to support it

### Entry point / environment

- Entry point: local build, deployment pipeline, and public browser runtime
- Environment: local dev, CI/build, production-like deployment
- Live dependencies involved: database, hosting platform, analytics/telemetry stack, any chosen auth provider

## Completion Class

- Contract complete means: build/deploy/runbook and production-hardening artifacts exist with concrete verification
- Integration complete means: the assembled product builds, deploys, and runs with real environment dependencies configured correctly
- Operational complete means: launch-critical diagnostics, env handling, and failure visibility work in production-like conditions

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the app can complete a production build without the current eager DB bootstrap fragility
- a documented deployment path exists and has been exercised against the real app shape
- the final assembled product can be demoed publicly with confidence in its reliability and supportability

## Risks and Unknowns

- fixing build-time DB issues may require architectural changes that touch multiple existing route boundaries
- shipping hardening often exposes cross-surface assumptions that were acceptable in dev but not in production
- later milestone dependencies (identity, analytics) may affect deploy complexity

## Existing Codebase / Prior Art

- current `next build` failure mode around eager Neon initialization without `DATABASE_URL`
- route/module boundaries in `src/db`, `src/lib/cache`, and `src/lib/gallery`
- export, share, gallery, and compare flows that must remain stable after hardening

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R005 — public portfolio launch readiness
- R006 — reliable build/deploy flows
- R007 — sufficient observability
- R010 — accessible and stable final product quality

## Scope

### In Scope

- build reliability fixes
- deploy environment handling and documentation
- production hardening and launch checks
- operational verification for public release

### Out of Scope / Non-Goals

- major net-new creative features unless required by launch blockers
- expanding into full SaaS/commercial infrastructure beyond launch needs

## Technical Constraints

- hardening must preserve the determinism and privacy guarantees established in M001
- build-safe DB integration is a known must-fix
- launch artifacts should match the actual hosting/runtime strategy used by the project

## Integration Points

- Next.js build/runtime pipeline
- database bootstrap and route import behavior
- deployment target/platform configuration
- monitoring/analytics integrations introduced in M004

## Open Questions

- Which hosting target is the canonical launch environment? — likely Vercel or similar, to be confirmed during planning
- How much CI automation is necessary for a credible portfolio launch? — to be scoped during milestone planning
