# M003/S01 — Research

**Date:** 2026-03-11

## Summary

S01 owns the highest-risk seam in M003 because it has to prove two active requirements in the real entry flow, not in a marketing mock: **R003** (editorial gallery-luxe, distinct visual design) and **R009** (clear premium launch-facing brand/value communication). It also establishes the first real expression of **R004** support by determining whether the homepage, generation entry, and results surface can read as one continuous branded experience instead of a split between a hero section and a utilitarian tool. The implementation boundary is already clear in code: `src/app/page.tsx` owns the landing/results toggle, `InputZone` owns the main generation seam, and `ResultsView` owns the downstream proof/diagnostics/action stack.

The current experience does not yet meet the slice bar. The homepage is structurally sparse: a muted square placeholder, a one-line tagline, and the existing input tabs. The shell/header are extremely light, metadata is generic, and several downstream controls still depend on utility names that are not defined in `globals.css` (`btn-primary`, `bg-secondary`, `text-destructive`, `border-border`, `text-muted-foreground`, `bg-background`, `text-foreground`, `focus:ring-accent`, `bg-accent`, `text-accent-foreground`). That mismatch is not just cosmetic debt; it is a direct execution risk for S01 because the slice needs stronger action styling and premium materials while keeping the existing results diagnostics, privacy posture, and interaction contracts visible.

Primary recommendation: execute S01 as a **single branded route redesign around the existing `src/app/page.tsx` seam**, not as a hero-only pass. Keep the landing, input zone, progress state, back action, and results view in the same route, but introduce a stronger editorial identity through layout composition, typography hierarchy, copy posture, and a normalized shared surface/button token layer in `globals.css`. Use `ResultsView.live-proof.test.tsx` as a non-negotiable constraint: diagnostics must stay visible, derived, and privacy-safe even after the redesign.

## Recommendation

Take a **landing/results continuity-first** approach.

1. Redesign `src/app/page.tsx` so the first-time state already contains the same visual language that the results state uses: premium framing, stronger copy hierarchy, art-object composition, and curated secondary guidance.
2. Keep `InputZone` as the core generation seam, but reframe it as a branded editorial control surface rather than a raw utility form. This means redesigning hierarchy and materials around the existing tabbed input behavior instead of replacing it.
3. Restructure `ResultsView` visually, but do not split or bypass its existing logic. It is already the canonical surface for style switching, proof diagnostics, export/share/save actions, and generation context.
4. Normalize missing shared utility classes early in `src/app/globals.css` or replace them with explicit valid styling primitives before broad redesign work. Otherwise S01 will compound styling drift and later slices will inherit brittle undefined class behavior.
5. Upgrade root metadata and shell/header posture so the premium narrative starts before the user interacts, not only after generation.

This approach best satisfies R003 and R009 while de-risking later M003 work. If S01 proves one strong editorial language across landing and results, S02 can propagate that system across shells/actions/viewers instead of inventing coherence later.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Root layout, metadata, and font loading | Next.js App Router layout in `src/app/layout.tsx` with `next/font/google` | Correct place to upgrade launch-facing metadata and typography loading without inventing custom head/font plumbing. |
| Theme state and hydration-safe dark mode | `next-themes` provider in `src/app/layout.tsx` | Already aligned with App Router usage; preserve `suppressHydrationWarning` and provider placement rather than custom theme scripts. |
| Landing/results route continuity | Existing state switch in `src/app/page.tsx` | S01’s core proof depends on one real visitor journey; this route already owns it. |
| Generation input behavior across text/URL/data | `InputZone` + `TextInput` + `UrlInput` + `DataInput` | Keeps real affordances and edge cases intact while redesigning presentation. |
| Results orchestration and observability | `ResultsView` plus `ResultsView.live-proof.test.tsx` | Already encodes privacy-safe diagnostics, style switching, and action boundaries that S01 must preserve. |
| Theme-driven surface styling | Existing CSS variable layer in `src/app/globals.css` | Best place to establish real surface/action tokens for editorial materials across both light and dark modes. |

## Existing Code and Patterns

- `src/app/page.tsx` — Owns both first-visit landing and post-generation results states. This is the exact seam S01 must redesign instead of fragmenting into separate routes or disconnected marketing wrappers.
- `src/components/layout/Shell.tsx` — Provides the shared route chrome and max-width framing. Good base for a richer editorial shell, but currently too neutral to carry the milestone’s identity by itself.
- `src/components/layout/Header.tsx` — Minimal top bar with only a wordmark and theme toggle. Strong candidate for branded navigation posture, narrative framing, and cross-surface continuity.
- `src/app/layout.tsx` — Root metadata and font boundary. Currently still says only `Turn anything into art`; S01 should likely raise title/description quality here because R009 includes launch-facing framing.
- `src/app/globals.css` — Current token layer is too thin for the slice and contains a direct mismatch with real component usage. Must either define the missing semantic utilities or replace those usages during execution.
- `src/components/input/InputZone.tsx` — Stable behavior seam for the three generation modes. Preserve tabs and state behavior, but redesign the surrounding composition and microcopy.
- `src/components/input/TextInput.tsx` — Already supports keyboard submission (`Cmd/Ctrl+Enter`) and auto-resize. Any visual redesign should preserve this interaction and keep the input legible as a primary expressive surface.
- `src/components/input/UrlInput.tsx` — Has mode selection, quota messaging, and explicit error handling. S01 should keep those truthful operational signals visible even if it changes the visual treatment.
- `src/components/input/DataInput.tsx` — Already includes drag/drop, browse, paste, and file validation behaviors. A premium redesign cannot flatten these affordances into a decorative but ambiguous drop zone.
- `src/components/results/ResultsView.tsx` — Central product surface for S01. Contains scene generation, active-style switching, privacy-safe proof diagnostics, parameter panel, export/share/save actions, and generation-progress states. Visual changes here must preserve its observability contract.
- `src/components/results/StyleSelector.tsx` — Existing thumbnail rail is a real product differentiator, but it currently reads more like a utilitarian carousel than a curated gallery-selector. Good candidate for editorial reframing.
- `src/components/results/ExportControls.tsx` — Functional export flow, but depends on undefined semantic classes (`border-border`, `bg-secondary`, `text-muted-foreground`, `text-destructive`). This is an immediate styling-system risk for S01.
- `src/components/results/ShareButton.tsx` — Preserves privacy by only sending vector/version/style. Keep that boundary intact while redesigning CTA posture and success/error states.
- `src/components/gallery/GallerySaveModal.tsx` — Though not the primary owner of S01, it is invoked from `ResultsView` and already exposes public-preview/privacy language. It also relies on undefined styling classes, so results-surface polish may expose it as a visible mismatch if not addressed.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — Hard proof seam requiring visible palette family, mapping posture, renderer expressiveness, active-style state, and “derived diagnostics only — raw input hidden” copy. This test should shape implementation choices, not be treated as incidental test baggage.

## Constraints

- S01 must satisfy **R003** and **R009** in the existing homepage flow, not by adding disconnected promotional UI that disappears when a result exists.
- S01 supports **R004**, so landing and results must share one visual grammar; a polished hero plus unchanged utilitarian results surface is a slice failure.
- `ResultsView` must keep privacy-safe diagnostics visible and must not expose raw input. The live-proof test explicitly checks this.
- Existing input affordances across text/URL/data must remain legible and keyboard-usable; visual ambition cannot hide stateful behaviors like URL mode selection, quota messaging, or drag/drop/paste pathways.
- The app already supports dark/light themes via `next-themes`; the editorial system needs to work in both modes unless D004 changes later.
- Root font loading currently uses Geist via `next/font/google`. If S01 wants stronger editorial typography, it should still route through `next/font` and root layout rather than ad hoc CSS imports.
- Several semantic utility classes used by landing/results-adjacent components are currently undefined. Execution needs to resolve that mismatch before or during the redesign.

## Common Pitfalls

- **Building a marketing shell that disconnects from the product** — Redesign the actual `page.tsx` state transition, not just the no-result state.
- **Polishing layout while leaving semantic utility drift unresolved** — Fix or replace undefined shared classes early so later visual work compounds cleanly.
- **Hiding diagnostics to make the UI feel more premium** — The premium result must still expose proof diagnostics and privacy posture clearly; elegance comes from framing, not deletion.
- **Over-unifying the three input modes** — Text, URL, and data have materially different affordances; S01 should unify the surface language, not erase their behavioral distinctions.
- **Relying on color alone for “premium feel”** — The stronger opportunity is composition, typography, copy hierarchy, and framing. The current app is structurally plain more than chromatically weak.
- **Improving hero copy without improving metadata and shell language** — R009 includes launch-facing framing; root metadata and header posture are part of the slice’s quality bar.

## Open Risks

- The current thin global token layer may make S01 feel locally polished but systemically brittle unless shared button/surface/text semantics are normalized.
- `ResultsView` is already dense with behaviors; a large visual restructuring could accidentally obscure or regress export/share/save and diagnostics flows if not done incrementally.
- A stronger editorial typography direction may require changing the default font pairing, which is straightforward technically through `next/font` but will need deliberate restraint to avoid generic “luxury landing page” clichés.
- Because `GallerySaveModal` is entered from the S01 results surface, visible styling inconsistencies there could undermine the continuity proof even though broader gallery/share/compare coherence belongs to later slices.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend UI / premium redesign | `frontend-design` | installed |
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available — 8K installs; install with `npx skills add wshobson/agents@nextjs-app-router-patterns` if deeper route/layout guidance is needed |
| Tailwind CSS layouts | `josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts` | available — 2.2K installs; install with `npx skills add josiahsiegel/claude-plugin-marketplace@tailwindcss-advanced-layouts` if advanced composition patterns are needed |
| Tailwind CSS patterns | `giuseppe-trisciuoglio/developer-kit@tailwind-css-patterns` | available — 1.8K installs; install with `npx skills add giuseppe-trisciuoglio/developer-kit@tailwind-css-patterns` if a broader utility-pattern reference becomes useful |
| next-themes | none found / installed skill not needed | existing library docs are sufficient for S01 |

## Sources

- Existing landing/results route ownership and current minimal landing composition (source: local codebase: `src/app/page.tsx`)
- Existing global token layer and currently defined utilities (source: local codebase: `src/app/globals.css`)
- Existing shell/header framing and route chrome limitations (source: local codebase: `src/components/layout/Shell.tsx`, `src/components/layout/Header.tsx`)
- Existing generation input seams and per-mode affordances (source: local codebase: `src/components/input/InputZone.tsx`, `src/components/input/TextInput.tsx`, `src/components/input/UrlInput.tsx`, `src/components/input/DataInput.tsx`)
- Existing results-surface orchestration, proof diagnostics contract, and action stack (source: local codebase: `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`)
- Save-to-gallery modal continuity risk from results surface (source: local codebase: `src/components/gallery/GallerySaveModal.tsx`)
- Live proof contract requiring privacy-safe diagnostics visibility (source: local codebase: `src/__tests__/components/results/ResultsView.live-proof.test.tsx`)
- `next-themes` App Router guidance confirming `ThemeProvider` placement in `app/layout` with `suppressHydrationWarning` and `attribute="class"` support when needed (source: Context7 `/pacocoursey/next-themes` docs)
- Shared undefined semantic class usage across compare/share/gallery/results-adjacent components, confirming styling-system drift risk beyond S01 (source: repo search via `rg` across `src/`)
