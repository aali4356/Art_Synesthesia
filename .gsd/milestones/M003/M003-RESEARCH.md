# M003 — Research

**Date:** 2026-03-11

## Summary

M003 should prove the brand system and cross-surface product coherence before it tries to polish every edge. The first thing to prove is not a perfect token palette or isolated hero section, but that one bold editorial direction can survive real app constraints across the landing/generate/results flow and then extend cleanly into gallery, compare, and share without breaking existing deterministic render, export, and DB-backed browse/share behaviors. The codebase already has strong seams for this: `Shell`/`Header` for global chrome, `InputZone` for the primary generation entry, `ResultsView` for the runtime diagnostics and action cluster, and route-level page shells for gallery/compare/share. The recommendation is to sequence M003 around these seams instead of inventing a parallel design system abstraction first.

The current implementation is visually coherent only at a very basic level. It uses a small global token layer, dark/light theming through `next-themes`, and reusable result/gallery components, but most surfaces are still structurally plain, locally styled, and inconsistent in tone. Several pages duplicate full-screen wrappers instead of sharing the main shell, some components rely on utility names that are not defined in `globals.css` (`btn-primary`, `bg-secondary`, `text-destructive`, etc.), and key user-facing surfaces still read like functional tools rather than a premium art product. Primary recommendation: make M003/S01 prove the editorial brand narrative and upgraded landing + results relationship, M003/S02 harden and propagate the visual system into shared surface primitives, and M003/S03 unify gallery/compare/share/export flows with explicit browser and accessibility verification.

## Recommendation

Take a shell-and-surface-first approach, not a tokens-first or page-by-page cosmetic pass.

1. Prove one integrated visitor journey first: landing -> generate -> results.
2. Reuse the existing deterministic pipeline, scene builders, diagnostics seam, and route boundaries as-is.
3. Introduce a stronger brand layer through shared layout primitives, typography hierarchy, copy system, and action styling that can be consumed by gallery/compare/share rather than redesigning each screen independently.
4. Treat undefined/misaligned design utilities and duplicated route wrappers as real slice-shaping risks; clean those up early so later redesign work compounds instead of fragmenting.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| App-wide metadata and head management | Next.js App Router `metadata` / `generateMetadata` | Already in use on route pages; avoids custom `<head>` handling and is the correct path for upgraded launch-facing titles/descriptions/OG prep. |
| Font loading and hosting | `next/font/google` in `src/app/layout.tsx` | Project already uses Geist via Next font optimization; keep font loading within Next.js instead of custom CSS/font CDNs unless the design direction truly requires a change. |
| Theme state and hydration-safe dark mode | `next-themes` via `ThemeProvider` and `resolvedTheme` | Already wired correctly with `suppressHydrationWarning`; reuse this rather than hand-rolling theme persistence or DOM class mutation. |
| Deterministic artwork rendering across surfaces | Existing scene-builder + canvas component architecture (`buildSceneGraph`, `buildOrganicSceneGraph`, etc.) | M003 is a product-experience milestone, not a renderer rewrite. Reuse existing render seams so visual-shell work does not destabilize art correctness. |
| Share/gallery persistence boundaries | Existing route + DB boundary modules (`db-gallery`, share routes, gallery viewers) | These boundaries already encode privacy/runtime behavior; redesign should wrap them, not inline or bypass them. |
| Premium motion-safe theme switching | Existing `prefers-reduced-motion` checks and CSS transitions in `ResultsView`/`globals.css` | Keep motion enhancements progressive and accessibility-aware instead of inventing animation systems that can regress keyboard or reduced-motion behavior. |

## Existing Code and Patterns

- `src/app/layout.tsx` — Root App Router layout with `next/font/google`, `ThemeProvider`, and `suppressHydrationWarning`; keep this as the global brand and metadata entrypoint.
- `src/app/globals.css` — Current global token layer and shared utility classes; minimal but already the obvious place for the editorial visual system. Also reveals a mismatch: some components reference utility names not defined here.
- `src/components/layout/Shell.tsx` — Main reusable shell with `Header` and shared max-width/gutter framing; this should become the canonical wrapper for premium product surfaces.
- `src/components/layout/Header.tsx` — Current top chrome is extremely thin; strongest candidate for branded navigation, narrative framing, and cross-surface identity reuse.
- `src/app/page.tsx` — Current home route contains both landing and generation/results flow switching; the milestone should respect this shared flow because it is the user’s main entry path.
- `src/components/input/InputZone.tsx` — Existing tabbed input boundary for text/URL/data; preserve this functional seam and redesign hierarchy/materials around it.
- `src/components/input/TextInput.tsx` / `UrlInput.tsx` / `DataInput.tsx` — Three materially different input experiences already exist; any premium redesign needs to keep their affordances legible rather than over-unifying them.
- `src/components/results/ResultsView.tsx` — Most important integration surface in M003. It already combines style switching, diagnostics, export, share, and gallery save. Redesign should restructure this surface, not split its business logic apart.
- `src/components/results/StyleSelector.tsx` — Existing thumbnail-strip pattern is powerful and worth reusing, but the current presentation is utilitarian and very wide; likely needs a more curated gallery-selector treatment.
- `src/components/results/ExportControls.tsx` / `ShareButton.tsx` / `GallerySaveModal.tsx` — Current action stack is functional but visually inconsistent and partly dependent on undefined utilities (`bg-secondary`, `btn-primary`, `text-destructive`). Early cleanup here will prevent later styling drift.
- `src/app/gallery/page.tsx` + `src/components/gallery/*` — Gallery route is already separated into server data fetch + client grid/filter/card layer. Good seam for redesigning browse experience without touching DB behavior.
- `src/app/gallery/[id]/GalleryViewer.tsx` and `src/app/share/[id]/ShareViewer.tsx` — These two viewers are structurally similar and should likely share more of the eventual branded detail-page language.
- `src/app/compare/CompareMode.tsx` — Compare mode currently uses a separate full-screen shell and several undefined utility names. It is a coherence risk and should not be left until the end.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — Important proof seam that asserts privacy-safe diagnostics remain visible in the live results surface; redesign must preserve these signals.
- `src/__tests__/compare/compare-mode.test.tsx` and `src/__tests__/gallery/gallery-card.test.tsx` — Existing behavior tests anchor compare/gallery UX contracts that M003 should keep passing while redesigning structure and visuals.

## Constraints

- The primary landing route (`src/app/page.tsx`) currently owns both first-time landing and post-generation results states; redesign must preserve this integrated flow instead of splitting it into disconnected routes without a strong reason.
- `ResultsView` is not just presentation: it owns style-switching, render lifecycle behavior, diagnostics, share/export/save actions, and data-input style constraints. Structural redesign must keep these contracts intact.
- Dark/light theme support already exists and is used across viewers and renderers; any editorial system has to work in both modes unless the product direction explicitly changes Decision D004.
- Share and gallery viewers deliberately do not expose raw input, only stored parameter/vector-derived views. M003 cannot “improve storytelling” by violating this privacy boundary.
- DB-backed gallery/share routes may be unavailable locally; failure states are explicit in page components and should remain well-framed instead of being visually hidden.
- Accessibility must remain intact through redesign; existing code already uses labels, roles, aria state, and reduced-motion checks that should be preserved and expanded rather than replaced with opaque custom interactions.

## Common Pitfalls

- **Designing the landing page as a disconnected marketing artifact** — Avoid a hero-only redesign that does not connect visually and structurally to `InputZone` and `ResultsView`. The first proof should show the same identity surviving interaction.
- **Over-indexing on token/theming work before layout hierarchy** — A richer color palette alone will not create gallery-luxe perception. Prioritize typography, spacing, framing, and composition first.
- **Leaving inconsistent route shells in place** — Gallery, compare, share, and detail pages currently mix separate `min-h-screen` wrappers and duplicated headers. If left untouched, the product will still feel fragmented even with prettier components.
- **Breaking proof/diagnostic surfaces during visual cleanup** — `ResultsView.live-proof.test.tsx` shows that palette family, mapping posture, and renderer expressiveness are intentional observability seams. Redesign should elevate them, not hide or delete them.
- **Assuming all current utility classes are real** — Several components depend on classes like `btn-primary`, `bg-secondary`, `text-accent-foreground`, and `text-destructive` that are not defined in `globals.css`. Audit and normalize shared UI primitives before broad restyling.
- **Making compare/gallery/share follow different visual grammars** — These pages already have similar art-viewer patterns. Treat them as one family of “collector/editorial surfaces,” not unrelated pages.
- **Using motion as a substitute for hierarchy** — The app already checks reduced motion. Keep motion additive and sparse; premium feel should come from composition and materiality first.
- **Accidentally reducing privacy boundaries in pursuit of narrative** — Share/gallery copy can tell the story of the artwork without exposing original raw input, which current viewers intentionally do not store.

## Open Risks

- Undefined/shared-style drift in action components may create surprising regressions once the redesign starts unless shared button/surface primitives are established early.
- Compare mode is structurally divergent and may require mild refactoring, not just CSS changes, to align with the rest of the product.
- Gallery/share/detail surfaces currently rebuild scenes independently with similar but duplicated viewer logic; deeper coherence work may reveal an opportunity for a shared viewer primitive.
- The current font stack uses Geist, but the frontend-design direction explicitly warns against converging on generic-looking typography. M003 may need a stronger editorial display/body pairing, which would require deliberate evaluation rather than incidental font swapping.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend UI / premium redesign | `frontend-design` | installed |
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available — promising if deeper App Router route/layout patterns are needed; install via `npx skills add wshobson/agents@nextjs-app-router-patterns` |
| Tailwind CSS | `josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts` | available — relevant for sophisticated layout work; install via `npx skills add josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts` |
| Tauri v2 | `nodnarbnitram/claude-code-extensions@tauri-v2` | available but not directly relevant to this milestone’s web-product redesign; install via `npx skills add nodnarbnitram/claude-code-extensions@tauri-v2` if desktop shell work becomes in-scope |

## Requirement Research Notes

Active requirements split into two groups for M003 planning:

- **Table stakes already implied by the milestone:** R003 (editorial gallery-luxe design), R004 (cross-surface coherence), and R009 (brand/value communication) are the core of the work and should drive slice ordering.
- **Guardrail requirements that should shape execution but not dominate early slices:** R005 (public launch credibility) matters as a quality bar, while R010 (accessibility breadth) should be treated as a non-negotiable acceptance layer alongside redesign work even though its primary owner is M004/S03.

Candidate requirement additions worth considering, but not auto-binding:

- **Candidate requirement: shared premium empty/error states across DB-backed surfaces.** Current gallery/share pages have explicit failure handling, but M003 may want a clearer contract that unavailable routes still feel branded and intentional.
- **Candidate requirement: brand-consistent metadata/copy surface quality.** The current metadata and route descriptions are functional but minimal; a launch-facing copy/SEO/OG quality expectation could be made explicit if the user cares.
- **Advisory only, not a requirement:** unify viewer primitives across gallery/share/detail. This is a useful implementation strategy, but not a user-visible contract by itself.

Clearly optional / out of scope for this milestone:

- Account continuity and returning-user behavior remain M004 territory (R008).
- Production hardening, deploy reliability, and observability beyond surface-level diagnostics remain M005/M004 territory (R006/R007).
- A neutral SaaS cleanup pass remains explicitly out of scope (R019).

## Sources

- Existing landing/generation/results structure, shell, header, and token layer (source: local codebase: `src/app/page.tsx`, `src/components/layout/Shell.tsx`, `src/components/layout/Header.tsx`, `src/app/globals.css`)
- Existing results-surface contracts, diagnostics seam, style selector, export/share/save actions (source: local codebase: `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`)
- Existing gallery/compare/share viewer and page-shell patterns (source: local codebase: `src/app/gallery/page.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryCard.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx`, `src/app/compare/CompareMode.tsx`)
- Existing behavior-proof tests for privacy-safe results diagnostics, compare mode, and gallery cards (source: local codebase: `src/__tests__/components/results/ResultsView.live-proof.test.tsx`, `src/__tests__/compare/compare-mode.test.tsx`, `src/__tests__/gallery/gallery-card.test.tsx`)
- Next.js App Router guidance for root layout, metadata, and `next/font/google` usage (source: Context7 `/vercel/next.js` docs)
- `next-themes` guidance for App Router `ThemeProvider` and `suppressHydrationWarning` (source: Context7 `/pacocoursey/next-themes` docs)
- Skill discovery for directly relevant core technologies (source: installed skills list and `npx skills find` for Next.js, Tailwind CSS, Tauri)
