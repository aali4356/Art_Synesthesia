# GSD State

**Active Milestone:** M003 — Signature Product Experience
**Active Slice:** S02 — Shared brand system across shell, actions, and viewer surfaces
**Active Task:** ready-to-plan
**Phase:** M003/S01 complete; slice-level contract tests and production build pass, localhost browser proof confirms the editorial landing→generate→results journey, and the remaining local URL no-DB limitation is explicitly visible through UI plus network diagnostics

## Recent Decisions
- Design direction: editorial gallery luxe
- Palette strategy: wide curated deterministic palette families
- Palette-family proof uses explicit selection/diversity contract tests before implementation
- Palette generator now splits into deterministic family selection plus family realization while preserving `generatePalette(params, seed)` as the shared seam
- Palette family identity is selected from warmth/energy/contrast buckets plus seeded influence and exposed on `PaletteResult`
- Curated family behavior is encoded in explicit realization-profile coefficients owned by `palette-families.ts`, with shared contrast/dedup helpers accepting caller-level tuning
- S02 added a first-class deterministic synesthetic mapping artifact consumed by `generatePalette()` while preserving the shared `generatePalette(vector, seed)` seam
- S02 exposes additive mapping diagnostics on `PaletteResult` and proves them through text/URL/data hook integration tests
- Hook-level determinism for S02 is defined as canonical-input stability of vector and mapping diagnostics when seed derivation is not canonicalized
- S03 proves runtime integration at the existing hook result and scene-graph boundaries instead of introducing new ResultsView or selector APIs
- S03 exposes applied renderer expressiveness posture directly on organic and typographic scene graphs for live debugging and downstream acceptance work
- S04 exposes concise derived family/mapping/expressiveness diagnostics in the real results surface as the primary live-debug seam without surfacing raw inputs
- Cache helpers and DB-backed share/gallery/admin surfaces that must tolerate local no-DB proof mode now lazy-load DB modules instead of importing `@/db` at module evaluation time
- S04 completion is defined by truthful live proof: text/data browser proof plus passing build health, with the remaining URL dependency explicitly surfaced through browser/network/server diagnostics
- D032: M003 should be executed landing/results first, then shared shell/action/viewer primitives, then final gallery/compare/share/export integration
- D033: M003’s core requirement contract is R003/R004/R009, while R005 and R010 are advanced but not fully closed here
- S01/T01 encodes the redesign gap as a failing homepage integration proof rather than informal design intent, keeping diagnostics/privacy enforced through targeted DOM assertions
- D036: Landing/editorial redesign utilities now live in shared `globals.css` shell/panel/support/action semantics so downstream results work can inherit the same system
- D037: Results-only action cards, chips, modal shells, and form fields extend the same editorial token layer instead of relying on undefined semantic utility classes
- S01 closes only when localhost browser proof covers both a successful text journey and an inspected URL failure surface with network evidence

## Blockers
- URL analysis in local no-DB mode still reaches DB-backed snapshot storage and returns 500 with `DATABASE_URL is not set`
- Browser-visible URL failure copy is currently weak (`Unknown error`) even though the underlying diagnostics are explicit
- Known follow-up: `useDataAnalysis` hashes trimmed raw input for palette seeding, so newline-only equivalent inputs can diverge in full palette output despite matching vectors and mapping diagnostics

## Next Action
Advance to the next planned M003 slice; carry forward that S01 is runtime-proven on localhost for the text path and truthfully exposes the remaining URL no-DB failure through visible UI plus `POST /api/analyze-url` 500 network evidence.
