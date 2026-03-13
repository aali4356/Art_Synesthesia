# M003/S03 — Research

**Date:** 2026-03-13

## Summary

S03 owns the final coherence pass for the collector/editorial product family, not a net-new page build. The key Active requirements in scope are **R004** as the primary owner, with **R005** and **R010** as supporting requirements, and a smaller supporting responsibility for **R009** because share/gallery/export copy still contributes to the branded launch posture. S01 already proved landing→results continuity, and S02 already propagated the shared shell/viewer language into `/gallery`, `/compare`, `/gallery/[id]`, and `/share/[id]`. What remains is the seam those slices intentionally left open: the **assembled family relationship between results actions (share/export/save) and downstream collector routes**, plus explicit accessibility-aware proof that those routes behave like one product in a real browser.

The main surprise is that the export/share/save family is only partially unified today. `ExportControls`, `ShareButton`, and `GallerySaveModal` already use the editorial token layer and look consistent inside `ResultsView`, but their downstream route consequences are uneven: share routes are read-only and privacy-safe, gallery detail adds route-local actions and optional hint reveal, compare is editorialized but isolated from the results action family, and export is still effectively a polished placeholder transport rather than a true branded export journey. A second surprise is that gallery browse cards remain visually and semantically older than the newer route shells: `GalleryCard.tsx` still uses legacy border/background utility language instead of the richer editorial card grammar introduced elsewhere, which makes the browse grid the most obvious coherence weak point in the assembled family.

## Recommendation

Take an **integration-first route-family approach** for S03:

1. **Unify action outcomes, not just page shells.** Treat results actions (`ShareButton`, `ExportControls`, `GallerySaveModal`) and downstream collector routes (`/share/[id]`, `/gallery`, `/gallery/[id]`) as one connected family. The slice should strengthen the visible bridge between “make an edition public/exportable” and “view/browse that edition later.”
2. **Finish browse/detail/action consistency before inventing new abstractions.** The biggest remaining design gap is not missing architecture; it is inconsistent consumption of the architecture already introduced in S01/S02.
3. **Use browser proof as the primary acceptance tool.** Because R004/R005/R010 are about assembled experience quality, the critical proof is real route-to-route behavior through localhost, with explicit checks for keyboard-usable controls, visible diagnostics, and truthful DB-unavailable states.
4. **Keep privacy and operational truth explicit.** Share/gallery routes must continue to expose parameter-only/public-preview semantics and branded unavailable states without sliding into ambiguous marketing copy.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Cross-route branded chrome | `Shell` + editorial token layer in `src/app/globals.css` | Already proven in S01/S02; adding a second shell system would re-fragment the milestone. |
| Detail-page collector layout | `BrandedViewerScaffold.tsx` | Already normalizes viewer stage, metadata sidebar, privacy note, and optional actions for gallery/share. |
| Share privacy boundary | `ShareButton` → `/api/share` → `ShareViewer` | Existing implementation already preserves parameter-only sharing; S03 should refine continuity around it, not alter the contract. |
| Gallery persistence boundary | `GallerySaveModal` + `/api/gallery` + `db-gallery` | Existing save flow already enforces preview-only/public-opt-in semantics and creator token behavior. |
| Export format policy | `getSupportedExportFormats()` and `/api/render-export` | Format availability and 4096-only export constraints already exist; reuse them as the truth source for UI decisions. |
| Unavailable DB-backed route framing | `BrandedUnavailableState` | Already gives branded, inspectable failure surfaces for local no-DB proof mode. |

## Existing Code and Patterns

- `src/components/results/ResultsView.tsx` — canonical action-family source. It already assembles `ShareButton`, `ExportControls`, and `GallerySaveModal` inside the editorial results surface, making it the upstream continuity seam S03 must connect to downstream routes.
- `src/components/results/ExportControls.tsx` — export UI is already branded and keyboard-usable, but it is still a compact action card without a richer “edition/export” narrative or downstream confirmation flow.
- `src/components/results/ShareButton.tsx` — strongest existing continuity model for privacy-safe public publishing; it clearly states vector/version/style-only payload semantics and exposes a copyable link.
- `src/components/gallery/GallerySaveModal.tsx` — strongest public-preview/privacy framing in the codebase. It already explains exactly what becomes public and is likely the copy/tone baseline for other publication surfaces.
- `src/components/viewers/BrandedViewerScaffold.tsx` — established collector/detail template for `/gallery/[id]` and `/share/[id]`. Reuse rather than fork if detail-route coherence work is needed.
- `src/app/gallery/[id]/GalleryViewer.tsx` — gallery detail adds route-specific actions (reveal approved hint, upvote) on top of the shared viewer scaffold. It is the clearest example of “shared family + route-local affordances.”
- `src/app/share/[id]/ShareViewer.tsx` — share detail is intentionally read-only and privacy-safe. S03 must preserve this difference while making it feel like the same product family.
- `src/app/gallery/page.tsx` + `src/components/gallery/GalleryGrid.tsx` + `src/components/gallery/GalleryFilters.tsx` — S02 branded the shell, intro, filters, and pagination framing, but the card-level presentation still lags behind the newer collector/editorial language.
- `src/components/gallery/GalleryCard.tsx` — notable coherence outlier. It still uses legacy utility styling (`border-border`, `bg-background`, `text-muted-foreground`, `text-accent`) instead of the editorial card/action primitives used across results and detail routes.
- `src/app/compare/CompareMode.tsx` — compare now shares shell language and route intro, but it remains a self-contained atelier flow. S03 should verify whether that’s sufficient for family coherence or whether it still needs action-language alignment with results/export/share.
- `src/app/api/render-export/route.ts` — export backend truth source. Important constraint: PNG is a placeholder payload, SVG support is limited to geometric/typographic, and resolution is fixed at 4096. UI/UX should not imply more than this route delivers.
- `src/__tests__/app/shared-brand-surfaces.test.tsx` — authoritative S02 shell/viewer coherence proof; safe starting point for expanding S03’s route-family contract.
- `src/__tests__/components/ExportControls.test.tsx` — authoritative export control contract covering supported formats, default frame behavior, and 4096 export submission.
- `src/__tests__/share/viewer.test.ts` — authoritative privacy proof for share surfaces; S03 must not weaken it while improving continuity.
- `src/__tests__/gallery/gallery-card.test.tsx` — card behavior proof exists, but it currently anchors behavior more than branded coherence, leaving room for stronger S03 contract tests.

## Constraints

- S03 is the **primary owner of R004**, so the work must prove assembled coherence across landing/results-derived actions and downstream routes, not just add more polish to isolated pages.
- `ResultsView` remains the upstream canonical results/action seam; S03 should not split share/export/save logic away from it just to create route-level visual symmetry.
- `ShareViewer` must stay parameter-only. No raw input, prompt, or source payload can be surfaced in pursuit of richer storytelling.
- Gallery detail may reveal only an **optional contributor-approved input hint**; that is a distinct privacy contract from share and must stay explicit.
- DB-backed routes can be unavailable locally; these failure paths must remain branded and inspectable, not replaced with silent redirects or fake content.
- Export is constrained by the existing route: only `4096` resolution is accepted, SVG is style-limited, and PNG currently returns placeholder payload data. Any S03 export language must stay honest about this implementation reality.
- Accessibility can’t be assumed from visual cleanup. S03 specifically supports **R010**, so keyboard-use, button semantics, dialogs, and alert/error visibility must be part of proof, not left implicit.

## Common Pitfalls

- **Mistaking shell consistency for product-family coherence** — S02 already solved the route-shell problem. S03 needs to connect results actions to gallery/share/export outcomes, not just restyle wrappers again.
- **Over-polishing gallery shells while leaving `GalleryCard` behind** — the grid cards are still the most visibly legacy surface and will keep the gallery route feeling split if left unchanged.
- **Treating export like a fully realized media pipeline** — `/api/render-export` still has placeholder PNG behavior and style-limited SVG support. Avoid UX that suggests richer formats or render fidelity than actually exists.
- **Accidentally eroding privacy boundaries to improve narrative** — share routes must remain parameter-only, and gallery hint reveal must remain clearly optional and contributor-approved.
- **Ignoring keyboard and dialog verification** — `GallerySaveModal`, style toggles, export format chips, share copy controls, and compare panes all need explicit keyboard/semantics rechecks in S03.
- **Letting compare remain visually coherent but behaviorally isolated** — compare may be “on brand” already, but if its control language still feels disconnected from results/detail surfaces, R004 remains only partially delivered.

## Open Risks

- `GalleryCard.tsx` may require a structural rewrite, not just class swaps, to feel like part of the collector/editorial system without breaking report/delete/upvote behavior.
- Export continuity may expose a product gap: the branded UI already promises a premium export surface, but the backend still returns placeholder PNG payloads, which may be acceptable for proof but weak for portfolio-grade realism.
- Browser verification could be partially blocked by DB availability, requiring S03 acceptance to distinguish between successful route-family continuity and truthful branded unavailable-state proof.
- There is no slice-specific test yet that proves **results action family → downstream share/gallery route family** as one contract; without that, S03 could ship attractive local changes but still under-deliver R004.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend UI / premium redesign | `frontend-design` | installed |
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available — 8.2K installs; relevant if route/layout composition needs deeper App Router guidance |
| Drizzle ORM | `bobmatnyc/claude-mpm-skills@drizzle-orm` | available — 1.7K installs; relevant if DB-backed gallery/share constraints need deeper query/boundary work |
| Vitest | `onmax/nuxt-skills@vitest` | available — 667 installs; somewhat relevant for stronger slice proof contracts |
| next-themes | none found | no directly relevant skill found |

## Key Findings and Surprises

- **The biggest remaining coherence gap is card-level, not shell-level.** S02 solved the route wrappers and detail scaffolds, but `GalleryCard.tsx` still looks like pre-editorial UI.
- **The save/share/public-preview language is strongest inside the results surface, not on downstream routes.** `GallerySaveModal` and `ShareButton` already explain publication/privacy well; S03 should likely propagate that tone into gallery/share route intros or follow-up states.
- **Export is visually ahead of its backend reality.** The UI feels branded, but the server route still provides placeholder PNG payloads and limited SVG support, which constrains how far S03 can lean on export as a premium product promise.
- **Compare is branded but not yet obviously part of the action family.** It shares shell language, but it does not participate in the same publication/export/share narrative as results, gallery, and share routes.
- **Tests cover behavior and shell continuity, but not final family assembly.** Existing tests prove individual pieces; none yet clearly prove that the product family reads as one route-connected experience.

## Sources

- S03 requirement ownership and support obligations inferred from active requirements R004, R005, R009, R010 (source: preloaded `REQUIREMENTS.md`)
- Final slice intent and proof target for gallery/compare/share/export family (source: preloaded `M003-ROADMAP.md`)
- Existing milestone research about route-fragmentation and collector/editorial family direction (source: preloaded `M003-RESEARCH.md`)
- S01 forward intelligence about reusing editorial token/action language and preserving diagnostics seams (source: preloaded `S01-SUMMARY.md`)
- S02 forward intelligence and established viewer-shell normalization via `BrandedViewerScaffold` (source: preloaded `S02-SUMMARY.md`)
- `src/components/results/ExportControls.tsx` — branded export action card and current UX/interaction model (source: local codebase)
- `src/components/results/ShareButton.tsx` — parameter-only share flow and copy posture (source: local codebase)
- `src/components/gallery/GallerySaveModal.tsx` — strongest public-preview/privacy messaging seam (source: local codebase)
- `src/components/viewers/BrandedViewerScaffold.tsx` — shared collector/detail layout primitive and branded unavailable state (source: local codebase)
- `src/app/gallery/[id]/GalleryViewer.tsx` — gallery detail route-specific action model on top of shared viewer scaffold (source: local codebase)
- `src/app/share/[id]/ShareViewer.tsx` — privacy-safe read-only shared viewer implementation (source: local codebase)
- `src/app/gallery/page.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryFilters.tsx`, `src/components/gallery/GalleryCard.tsx` — gallery browse shell/card split and remaining coherence gap (source: local codebase)
- `src/app/compare/CompareMode.tsx` — branded compare route and remaining isolation risk (source: local codebase)
- `src/app/api/render-export/route.ts` and `src/lib/export/formats.ts` — hard export constraints and current placeholder behavior (source: local codebase)
- `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/components/ExportControls.test.tsx`, `src/__tests__/gallery/gallery-card.test.tsx`, `src/__tests__/share/viewer.test.ts` — current executable proof boundaries and their gaps for final assembled S03 acceptance (source: local codebase)
