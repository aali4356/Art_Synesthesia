# M002: Chromatic Synesthesia Overhaul — Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

## Project Description

M002 is the first post-foundation milestone for Synesthesia Machine. The current product works, but the user experience of the artwork itself is not yet premium enough: palette outputs feel repetitive, the synesthesia layer does not feel emotionally expressive enough, and the visual language needs a stronger artistic point of view. This milestone focuses on the artwork engine first — expanding deterministic color families, improving palette sophistication, deepening renderer expressiveness, and making outputs feel more intentionally synesthetic and beautiful.

## Why This Milestone

The user’s strongest complaint is that the current art often falls into the same bland-feeling purple/orange/green zone. That makes the product feel less magical than its architecture deserves. Before redesigning the whole site or hardening launch infrastructure, the product needs better visual output; otherwise later polish will still showcase underwhelming art. This milestone solves the core artistic quality problem first.

## User-Visible Outcome

### When this milestone is complete, the user can:

- generate visibly richer, more varied, more emotionally distinct artwork from the same deterministic engine
- switch across styles and see that each style feels more premium and expressive rather than mechanically using the same narrow palette logic
- experience artwork whose color behavior and composition feel more intentionally "synesthetic" and art-directed

### Entry point / environment

- Entry point: `npm run dev` -> `http://localhost:3000`
- Environment: local dev browser
- Live dependencies involved: none required for the core visual generation loop; DB-backed surfaces exist in repo but are not the primary proof target for this milestone

## Completion Class

- Contract complete means: palette families, mapping logic, renderer interpretation, and supporting UI affordances are implemented with real tests and substantive outputs
- Integration complete means: the improved palette/synesthesia system is actually wired through the existing generate/results/style-selector flows for text, URL, and data outputs
- Operational complete means: the refined art system works in local dev and remains deterministic under existing test/build verification expectations

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the same input still deterministically produces the same output, but outputs now span wider curated palette families with materially reduced visual repetition
- the upgraded palette/mapping system is visible in the real results experience across multiple styles, not just isolated unit tests
- at least one real end-to-end browser flow demonstrates that the redesigned artwork quality is meaningfully higher than the M001 baseline

## Risks and Unknowns

- Palette expansion may accidentally reduce perceptual coherence or break contrast guarantees — visual quality must improve without producing muddy or inaccessible results
- Stronger synesthesia mapping may drift into arbitrary styling if the parameter-to-aesthetic relationships are not principled
- Renderer upgrades may create inconsistency between styles if each style evolves independently without a shared artistic system
- Existing tests prove correctness but not taste; this milestone needs stronger visual verification than M001 needed

## Existing Codebase / Prior Art

- `src/lib/color/palette.ts` — current deterministic palette generator; primary target for richer family logic
- `src/lib/color/harmony.ts` / `contrast.ts` / `dedup.ts` — existing color primitives that should be extended, not replaced casually
- `src/components/results/ResultsView.tsx` — current integration surface for scenes, style selector, parameter panel, share/export/gallery affordances
- `src/components/results/StyleSelector.tsx` — real thumbnail strip that should reflect improved art direction
- `src/app/page.tsx` — core generate flow entrypoint
- `src/app/globals.css` — current design token system; later milestones will redesign broader UI, but M002 may need selective token support for artwork framing

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — richer, more varied, non-repetitive palette families
- R002 — stronger emotionally expressive synesthesia mapping
- R003 — later visual redesign depends on better artwork quality first
- R005 — launch readiness depends on art quality being worthy of public release

## Scope

### In Scope

- deterministic palette-system overhaul
- broader curated palette families and stronger mood coverage
- renderer expressiveness upgrades that make styles feel more premium and intentional
- integration of the upgraded art system into the real generation/results surfaces
- visual verification strategy for artistic quality improvements

### Out of Scope / Non-Goals

- full-site branded redesign across all product surfaces (belongs primarily to M003)
- account/auth/continuity features (belongs primarily to M004)
- deploy/build hardening and production runbooks (belongs primarily to M005)
- reducing ambition to a small cosmetic tweak pass

## Technical Constraints

- Determinism must remain intact across palette and renderer upgrades
- Existing contrast/accessibility guarantees should not regress
- Existing scene-graph architecture and style dispatch should remain the core integration pattern
- New color logic should build on existing modules where possible rather than bypassing them with opaque one-off heuristics
- Verification must include more than unit tests because taste/visual quality is a core milestone risk

## Integration Points

- `generatePalette()` and color submodules — central integration point for chromatic behavior
- all scene builders in `src/lib/render/*/scene.ts` — style-level expression upgrades
- `ResultsView`, `StyleSelector`, and related result-surface components — where visual improvements become user-visible
- current test suite and build pipeline — required to prove no regressions to determinism and wiring

## Open Questions

- How many palette families are enough to materially break the current repetition perception while still feeling curated? — likely multiple named families or deterministic clusters rather than a single hue sweep
- Should renderer expressiveness be achieved mostly through palette logic or through style-specific composition behaviors too? — likely both, but palette-first
- What visual proof mechanism is strong enough for this milestone? — likely a mix of targeted browser verification, screenshots, and deterministic fixture comparisons
