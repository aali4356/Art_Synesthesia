# S03: Cohesive gallery, compare, share, and export product family

**Goal:** Finish M003’s primary coherence contract by making the results action family and downstream gallery/compare/share/export-adjacent routes read as one collector/editorial product in code, tests, and real browser use.
**Demo:** From the real homepage results surface, a user can move through save/share/export-adjacent actions plus `/gallery`, `/gallery/[id]`, `/share/[id]`, and `/compare` and experience one branded family with aligned action language, upgraded gallery browse cards, truthful publication/privacy messaging, and keyboard-usable controls or unavailable-state diagnostics.

## Must-Haves

- Results action language and downstream collector routes visibly connect, so share/save/export outcomes feel like part of one product family rather than isolated widgets and pages.
- Gallery browse cards adopt the same editorial collector grammar as the newer shells/viewers without breaking reveal, report, upvote, delete, or detail-link behavior.
- Compare, share, and export-adjacent surfaces use aligned copy/action framing while preserving their distinct contracts: compare stays interactive, share stays parameter-only, gallery detail may reveal only optional contributor-approved hints, and export copy stays honest about current backend limits.
- Slice proof covers assembled route-family behavior through tests, build verification, and real browser verification including explicit keyboard/accessibility-aware checks and truthful DB-unavailable inspection.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts`
- `npm run build`
- Browser verification at `http://localhost:3000` covering homepage results actions plus `/gallery`, `/compare`, and one DB-backed detail/share route with explicit assertions for branded continuity, keyboard-usable controls, visible privacy/export truth messaging, and branded unavailable-state diagnostics when local DB dependencies are absent

## Observability / Diagnostics

- Runtime signals: visible share/export/save state copy, gallery card reveal/report/upvote/delete states, compare style selector state, and branded unavailable-state messaging on DB-backed routes
- Inspection surfaces: `src/__tests__/app/product-family-coherence.test.tsx`, `src/__tests__/gallery/gallery-card.test.tsx`, `src/__tests__/components/ExportControls.test.tsx`, `src/__tests__/share/viewer.test.ts`, localhost browser routes, and browser network logs for DB-backed failure paths
- Failure visibility: route-level unavailable copy, action-level alert/error text, disabled/busy button states, and browser-visible control labels for keyboard navigation
- Redaction constraints: preserve parameter-only share payloads, optional gallery hint reveal only, and no raw input leakage in UI or proof artifacts

## Integration Closure

- Upstream surfaces consumed: `src/components/results/ResultsView.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, `src/components/gallery/GallerySaveModal.tsx`, `src/app/gallery/page.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryCard.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx`, `src/app/compare/CompareMode.tsx`, and shared editorial tokens in `src/app/globals.css`
- New wiring introduced in this slice: explicit action-family continuity between results actions and downstream collector routes, upgraded gallery card consumption of the editorial design system, and a final assembled product-family proof contract
- What remains before the milestone is truly usable end-to-end: nothing inside M003 beyond executing this plan and re-verifying the assembled browser experience truthfully against any local DB limits

## Tasks

- [x] **T01: Wire action-family continuity across results, browse, compare, and detail surfaces** `est:1h 15m`
  - Why: R004 is still open at the seam between polished action widgets and downstream routes; this task closes the family-language gap before final proof.
  - Files: `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, `src/components/gallery/GallerySaveModal.tsx`, `src/app/compare/CompareMode.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx`, `src/app/globals.css`
  - Do: Align the copy posture, section framing, and action labels of export/share/save with the collector/editorial language already used by route shells; add explicit continuity cues that connect results actions to public proof, gallery save, and compare workflows; keep export messaging honest about 4096-only and limited-format behavior; preserve share’s parameter-only privacy contract and gallery detail’s optional hint boundary; keep controls keyboard-usable and semantically labeled instead of introducing decorative-only affordances.
  - Verify: `npm test -- src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/app/product-family-coherence.test.tsx`
  - Done when: results actions and downstream route intros/viewer action areas use one coherent product language, and the targeted tests prove continuity without weakening privacy/export truth contracts.
- [x] **T02: Rebuild gallery cards as editorial collector objects without breaking browse behavior** `est:1h`
  - Why: Research identifies `GalleryCard.tsx` as the biggest remaining coherence outlier; until the browse grid catches up, `/gallery` still feels split from the rest of the family.
  - Files: `src/components/gallery/GalleryCard.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/app/globals.css`, `src/__tests__/gallery/gallery-card.test.tsx`, `src/__tests__/app/product-family-coherence.test.tsx`
  - Do: Refactor the card structure and classes to use the editorial collector grammar already established elsewhere, strengthen hierarchy around title/style/date/hint/action rows, and ensure reveal, upvote, report, delete, and detail-link behavior still work with accessible labels and visible states; add or extend tests to assert both behavior and branded contract cues rather than only legacy rendering behavior.
  - Verify: `npm test -- src/__tests__/gallery/gallery-card.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
  - Done when: gallery browse cards visually and semantically match the route family while existing browse interactions remain covered by passing tests.
- [x] **T03: Add final assembled proof and close the slice in browser truth** `est:1h 15m`
  - Why: S03 is the milestone’s final assembly slice, so completion must be proven through executable route-family tests, build health, and a real browser walkthrough rather than local component polish alone.
  - Files: `src/__tests__/app/product-family-coherence.test.tsx`, `.gsd/milestones/M003/slices/S03/S03-PLAN.md`, `.gsd/DECISIONS.md`, `.gsd/STATE.md`
  - Do: Add a route-family proof test that asserts results action language and downstream route surfaces belong to one product family, then run the named slice test suite and production build; in the browser, exercise homepage generation to results plus gallery/compare/share or truthful unavailable states, explicitly checking keyboard-usable controls, visible privacy/export copy, and branded diagnostics; record any structural plan decision needed to keep acceptance anchored to family assembly instead of isolated page polish.
  - Verify: `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
  - Done when: the new assembled proof contract passes, build succeeds, browser verification confirms the family coherence claim end-to-end, and slice state/decisions are updated to reflect the executable acceptance boundary.

## Files Likely Touched

- `src/components/results/ExportControls.tsx`
- `src/components/results/ShareButton.tsx`
- `src/components/gallery/GallerySaveModal.tsx`
- `src/components/gallery/GalleryCard.tsx`
- `src/app/gallery/[id]/GalleryViewer.tsx`
- `src/app/share/[id]/ShareViewer.tsx`
- `src/app/compare/CompareMode.tsx`
- `src/app/globals.css`
- `src/__tests__/app/product-family-coherence.test.tsx`
- `src/__tests__/gallery/gallery-card.test.tsx`
- `.gsd/DECISIONS.md`
- `.gsd/STATE.md`
