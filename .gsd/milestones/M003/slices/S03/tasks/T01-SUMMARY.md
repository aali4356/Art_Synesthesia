---
id: T01
parent: S03
milestone: M003
provides:
  - Results action surfaces and downstream compare/share/gallery viewers now use one collector/editorial continuity contract with explicit privacy/export truth copy.
key_files:
  - src/components/results/ExportControls.tsx
  - src/components/results/ShareButton.tsx
  - src/components/gallery/GallerySaveModal.tsx
  - src/app/compare/CompareMode.tsx
  - src/app/gallery/[id]/GalleryViewer.tsx
  - src/app/share/[id]/ShareViewer.tsx
  - src/__tests__/app/product-family-coherence.test.tsx
key_decisions:
  - Reuse collector/editorial family language across action cards and downstream viewers while preserving route-specific truth boundaries.
patterns_established:
  - Results-to-route continuity is now enforced by copy-level proof tests spanning export/share/save plus compare/gallery/share viewers.
observability_surfaces:
  - Visible action-state copy, route viewer framing, unavailable-state messaging, and src/__tests__/app/product-family-coherence.test.tsx
duration: 1h
verification_result: passed
completed_at: 2026-03-13T10:16:14Z
blocker_discovered: false
---

# T01: Wire action-family continuity across results, browse, compare, and detail surfaces

**Aligned export/share/save results actions with compare, gallery detail, and share detail so the collector/editorial family now reads as one product while preserving privacy and export truth boundaries.**

## What Happened

Updated the results action desk copy so export, share, and gallery save explicitly point into the same collector/viewer family. Export now states the truthful backend constraint (4096-only with style-dependent formats), share now frames the destination as a parameter-only public proof viewer, and gallery save now previews exactly what becomes public while keeping the raw source excluded.

Refined downstream route framing to match that same family language. Compare now introduces itself as a collector-stage route tied to the same results/share/gallery/export family. Gallery detail now calls out results-to-route continuity while keeping the optional contributor-approved hint boundary explicit. Share detail now states the same family relationship while reiterating the parameter-only privacy contract.

Added/extended tests so the continuity contract is executable rather than subjective, especially through `src/__tests__/app/product-family-coherence.test.tsx`, plus the existing export/share tests.

## Verification

Passed targeted task verification:
- `npm test -- src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/app/product-family-coherence.test.tsx`

Passed slice-level checks touched by this task:
- `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts`
- `npm run build`

Browser verification was exercised on localhost during implementation to confirm the action surfaces and downstream viewers read as one family while still showing explicit privacy/export truth messaging.

## Diagnostics

Inspect later via:
- Results action desk copy in `src/components/results/ResultsView.tsx`
- Export/share/save cards in `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, and `src/components/gallery/GallerySaveModal.tsx`
- Route intros/viewers in `src/app/compare/CompareMode.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`, and `src/app/share/[id]/ShareViewer.tsx`
- Executable continuity assertions in `src/__tests__/app/product-family-coherence.test.tsx`

## Deviations

None.

## Known Issues

None within T01 scope.

## Files Created/Modified

- `src/components/results/ExportControls.tsx` — aligned export framing to the collector/editorial family and kept backend limits explicit.
- `src/components/results/ShareButton.tsx` — connected share creation to the parameter-only public proof viewer without weakening privacy boundaries.
- `src/components/gallery/GallerySaveModal.tsx` — clarified the opt-in gallery edition contract and optional hint boundary.
- `src/app/compare/CompareMode.tsx` — brought compare intro and style controls into the same family language as results and viewers.
- `src/app/gallery/[id]/GalleryViewer.tsx` — reinforced results-to-route continuity while preserving optional hint reveal and gallery-local engagement.
- `src/app/share/[id]/ShareViewer.tsx` — reinforced parameter-only viewer continuity and explicit privacy messaging.
- `src/__tests__/app/product-family-coherence.test.tsx` — added executable family-coherence assertions spanning results actions and downstream routes.
