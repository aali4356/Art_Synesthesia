# M003/S02 — Research

**Date:** 2026-03-11

## Summary

S02 should not invent a second design system. S01 already established the winning direction: a reusable editorial shell/panel/action token layer in `src/app/globals.css`, a branded `Shell`/`Header`, and a results surface whose diagnostics and public actions remain legible inside that system. The research conclusion is that S02 should harden and propagate those exact primitives into the downstream seams that still look structurally isolated: gallery browse, gallery/share detail viewers, compare mode, and route-level unavailable states. This slice supports **R004** directly by unifying the core product surfaces as one branded product, and it also advances **R005**, **R001**, and **R010** by making the collector/viewer/action experience feel launch-credible, by carrying palette-family expressiveness into downstream viewing surfaces, and by preserving discoverable keyboard-safe controls during the redesign.

The biggest gap is not lack of tokens; it is that major routes still bypass the shared shell language entirely. `GalleryPage`, `GalleryViewer`, `ShareViewer`, and `CompareMode` all render their own full-screen wrappers with basic utility styling. Viewer pages duplicate scene-building/canvas framing patterns but do not share a branded detail-page primitive. `CompareMode` is the sharpest coherence risk: it still uses undefined utility classes like `btn-primary`, `bg-secondary`, `text-accent-foreground`, and `text-secondary-foreground`, so it is visually and technically out of sync with the S01 system. Recommendation: treat S02 as a shell/action/viewer normalization slice that creates reusable branded route and viewer primitives first, then migrate gallery/share/compare onto them without altering DB/privacy/business boundaries.

## Recommendation

Take a **shared route-shell + collector-viewer primitive** approach.

1. Reuse `Shell` and the S01 editorial token layer as the mandatory wrapper for gallery, compare, and detail routes instead of keeping route-local `min-h-screen` shells.
2. Extract or standardize a small set of reusable branded patterns around real seams already visible in the codebase:
   - route intro/header blocks
   - viewer frame + metadata rail
   - action rows / chips / filter controls
   - branded unavailable / empty-state surfaces
3. Refactor gallery/share detail pages toward one viewer language without merging their underlying privacy/data contracts. They can share framing, metadata posture, and parameter-display treatment while still differing on upvote/input-hint/share semantics.
4. Fix CompareMode early. It is currently the only researched surface that still depends on undefined classes and a much plainer grammar than S01, making it the highest implementation and coherence risk in the slice.

This keeps S02 focused on the exact milestone promise: shared branded shell, action, and viewer language that downstream surfaces can consume. It also avoids a wasteful tokens-first rewrite or a page-by-page cosmetic pass that would fragment the system again.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| App-wide branded chrome | `src/components/layout/Shell.tsx` + `src/components/layout/Header.tsx` | S01 already proved these as the canonical premium wrapper; downstream routes should consume them rather than duplicating full-screen wrappers. |
| Shared editorial materials and action styling | `src/app/globals.css` editorial utilities (`editorial-panel`, `editorial-action-card`, `editorial-chip`, `btn-ghost`, `btn-accent`, modal/input utilities) | These tokens already unify landing and results; S02 should extend them to gallery/share/compare instead of inventing route-specific class vocabularies. |
| Theme hydration safety | `next-themes` via App Router `ThemeProvider`, `resolvedTheme`, and mounted `ThemeToggle` pattern | The current theme approach matches library guidance and is already integrated safely; redesign work should consume `resolvedTheme` and shared theme tokens, not custom theme state. |
| Share/gallery privacy boundary | Existing route/data boundary in `src/app/share/[id]/page.tsx`, `src/app/gallery/[id]/page.tsx`, and DB modules | S02 is a presentation/system slice. It should wrap these surfaces, not broaden the payload or expose raw input. |
| Viewer rendering from stored vectors | Existing scene builders + canvas components in `GalleryViewer` and `ShareViewer` | The renderer seam is already correct and deterministic enough for this milestone; S02 should share viewer framing/presentation around it rather than rewriting artwork generation. |
| Results action surfaces | `ExportControls`, `ShareButton`, and `GallerySaveModal` already moved onto editorial action-card primitives in S01 | These are the source-of-truth action treatments for S02. Reuse their posture for compare/gallery/share controls instead of adding new button/card semantics. |

## Existing Code and Patterns

- `src/components/layout/Shell.tsx` — canonical route wrapper with ambient branded background and shared max-width framing; gallery/compare/detail routes should be moved under this instead of standalone `min-h-screen` wrappers.
- `src/components/layout/Header.tsx` — carries product identity and private-first posture; its current copy is homepage/results-friendly and can anchor downstream route coherence without requiring route-local chrome.
- `src/app/globals.css` — authoritative shared editorial tokens from S01. Important primitives already exist for panels, control surfaces, chips, action cards, modal shells, and form inputs.
- `src/components/results/ResultsView.tsx` — the strongest reference implementation for S02. It shows how proof diagnostics, action clusters, parameter panels, and canvas framing can coexist in one branded composition without hiding operational truth.
- `src/components/results/ExportControls.tsx` — current best pattern for branded action modules with explicit state, button grouping, and accessible option toggles.
- `src/components/results/ShareButton.tsx` — current best pattern for privacy-safe public action messaging and branded success/error states.
- `src/components/gallery/GallerySaveModal.tsx` — established modal-shell, form-field, and privacy-posture language that downstream route/detail actions can mirror.
- `src/app/gallery/page.tsx` — gallery browse route still uses its own full-screen wrapper and plain header; prime candidate for Shell adoption and branded route intro/error states.
- `src/components/gallery/GalleryGrid.tsx` — strong existing browse seam; keeps filter controls, grid, and pagination isolated so S02 can redesign browse composition without changing server fetch behavior.
- `src/components/gallery/GalleryFilters.tsx` — functionally correct filter boundary, but visually plain and still using raw form styling; should likely adopt editorial filter/action patterns from S01.
- `src/components/gallery/GalleryCard.tsx` — preserves reveal/report/delete/upvote behavior, but its card/action styling is still mostly pre-S01 utility-grade; a likely target for collector-surface styling updates in S02 or S03.
- `src/app/gallery/[id]/GalleryViewer.tsx` — structurally close to `ShareViewer` but visually separate from the new editorial system; likely should share a branded viewer detail layout while keeping gallery-specific hint/upvote affordances.
- `src/app/share/[id]/ShareViewer.tsx` — the cleanest privacy-bound viewer seam; ideal base for a reusable branded viewer scaffold because it has fewer branching controls.
- `src/app/compare/CompareMode.tsx` — highest-risk divergence. Uses undefined utility classes (`btn-primary`, `bg-secondary`, `text-accent-foreground`, `text-secondary-foreground`) and a standalone layout grammar; needs normalization early.
- `src/app/share/[id]/page.tsx` and `src/app/gallery/[id]/page.tsx` — both already keep DB failures explicit. S02 should reframe these unavailable/not-found states in branded shells rather than flattening them into generic centered text.
- `src/__tests__/compare/compare-mode.test.tsx` — behavioral contract for two-pane compare input and shared style selector. S02 can restyle/refactor structure, but must preserve these tested interaction semantics.
- `src/__tests__/gallery/gallery-card.test.tsx` — keeps gallery card reveal/report/detail-link behavior anchored while visuals evolve.
- `src/__tests__/share/viewer.test.ts` — authoritative privacy contract ensuring share surfaces do not grow raw-input props while redesign work proceeds.

## Constraints

- S02 supports **R004** first: the slice must produce visibly shared shell/action/viewer language across downstream routes, not just more tokens in `globals.css`.
- S02 also supports **R005**, **R001**, and **R010**: the product must feel more launch-credible, downstream viewer surfaces must continue to express the richer artwork system already shipped in M002, and redesigned controls must remain keyboard-usable and semantically inspectable.
- `Shell` currently renders `Header` globally for wrapped routes. Moving routes under `Shell` is the lowest-risk coherence path; creating ad hoc page-level headers would reintroduce fragmentation.
- `GalleryViewer` and `ShareViewer` must preserve the privacy contract: no raw input, no new sensitive props, no storytelling layer that leaks source material.
- DB-backed routes may be unavailable locally. Error and empty states must remain honest and visible, not visually softened into ambiguity.
- `CompareMode` is client-heavy and canvas-driven. Structural redesign must preserve existing testable controls, avoid introducing hydration-sensitive theme logic, and continue using `resolvedTheme` from `next-themes`.
- The theme system already follows `next-themes` App Router guidance: `ThemeProvider` in `app/layout`, `suppressHydrationWarning` on `<html>`, and `resolvedTheme` in client components. S02 should build on this rather than inventing a custom light/dark mechanism.
- The slice should avoid business-logic rewrites in gallery/share/compare APIs or DB modules. The milestone is product-surface coherence, not persistence architecture.

## Common Pitfalls

- **Leaving route wrappers fragmented** — If gallery/share/compare keep their own full-screen containers, the redesign will still read like isolated pages. Move them onto `Shell` or a shared route-surface primitive built from it.
- **Trying to solve coherence with tokens alone** — More CSS variables will not fix structural disunity. Unify composition: headers, metadata blocks, canvas framing, actions, and unavailable states.
- **Over-merging share and gallery detail logic** — They should share viewer framing, not data semantics. Keep gallery-only affordances like upvote and optional input hint separate from the share privacy contract.
- **Ignoring CompareMode until late** — It already contains undefined style utilities and the plainest layout in the researched scope. If not normalized early, it will keep breaking coherence and may also cause styling regressions.
- **Hiding operational truth inside premium language** — Unavailable gallery/share states and compare/result diagnostics must stay explicit. Luxury framing should elevate them, not obscure them.
- **Breaking keyboard/form clarity during control redesign** — Gallery filters, compare inputs, style selectors, and action buttons still need obvious labels, focus states, and button semantics. The current tests cover some of this; keep them as guardrails.
- **Duplicating viewer-frame CSS in both detail viewers** — If gallery and share each get bespoke polished layouts, S03 will inherit another fragmentation problem. S02 should establish one collector/viewer grammar now.

## Open Risks

- Compare mode may require more than styling changes because its current structure assumes utility classes that do not exist in `globals.css`; a small component refactor is likely.
- Gallery browse coherence may pull in `GalleryCard` and `GalleryFilters` work even if the slice initially aims only at route shells, because those subcomponents currently define much of the page’s visible tone.
- Viewer unification may expose an opportunity for a shared detail-view component or metadata panel; the risk is over-abstracting before the stable common shape is clear.
- Branded DB-unavailable states across gallery/share routes may need a shared empty/error surface pattern to avoid duplicating the same centered fallback markup.
- The current header copy is strong for homepage/results but may need slight route-aware nuance for collector/browse surfaces; doing this without fragmenting the header contract will require restraint.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend UI / branded redesign | `frontend-design` | installed |
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available — strongest directly relevant uninstalled match (8K installs). Install with `npx skills add wshobson/agents@nextjs-app-router-patterns` if deeper route/layout guidance is needed. |
| Tailwind CSS / advanced layout work | `josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts` | available from prior milestone research — relevant if S02 needs more complex responsive composition work. Install with `npx skills add josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts`. |
| Drizzle ORM | `bobmatnyc/claude-mpm-skills@drizzle-orm` | available — relevant only at the DB-backed route boundary, not the core of this slice. Install with `npx skills add bobmatnyc/claude-mpm-skills@drizzle-orm` if data-boundary work expands. |
| Vitest | `onmax/nuxt-skills@vitest` | available — useful for expanding contract coverage around new shared viewer/shell primitives. Install with `npx skills add onmax/nuxt-skills@vitest`. |
| next-themes | none found | no directly relevant skill found; use library docs instead. |

## Sources

- Shared shell and branded top chrome already established in S01 (source: local codebase: `src/components/layout/Shell.tsx`, `src/components/layout/Header.tsx`)
- Editorial token layer and reusable surface/action/modal/form primitives (source: local codebase: `src/app/globals.css`)
- Canonical branded results/action system to mirror downstream (source: local codebase: `src/components/results/ResultsView.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, `src/components/gallery/GallerySaveModal.tsx`)
- Gallery browse route and subcomponents still using standalone shells and plain filter/card composition (source: local codebase: `src/app/gallery/page.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryFilters.tsx`, `src/components/gallery/GalleryCard.tsx`)
- Gallery and share detail viewers remain structurally similar but visually duplicated and outside the branded shell system (source: local codebase: `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx`)
- Compare mode still depends on undefined style classes and a disconnected layout grammar (source: local codebase: `src/app/compare/CompareMode.tsx` and `rg` search for `btn-primary|bg-secondary|text-accent-foreground|text-secondary-foreground`)
- Existing behavioral/privacy guardrails for compare, gallery cards, and share viewer contracts (source: local codebase: `src/__tests__/compare/compare-mode.test.tsx`, `src/__tests__/gallery/gallery-card.test.tsx`, `src/__tests__/share/viewer.test.ts`)
- App Router `next-themes` guidance for `ThemeProvider`, `suppressHydrationWarning`, and `resolvedTheme` usage (source: Context7 `/pacocoursey/next-themes` docs)
