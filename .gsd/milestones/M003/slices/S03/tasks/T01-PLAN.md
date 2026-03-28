---
estimated_steps: 5
estimated_files: 7
---

# T01: Wire action-family continuity across results, browse, compare, and detail surfaces

**Slice:** S03 — Cohesive gallery, compare, share, and export product family
**Milestone:** M003

## Description

Close the main R004 gap by aligning the results action family with downstream collector routes so save, share, export, gallery detail, share detail, and compare all speak the same branded language without collapsing their distinct privacy and runtime contracts.

## Steps

1. Audit the current copy, headings, and action framing in `ExportControls`, `ShareButton`, `GallerySaveModal`, `GalleryViewer`, `ShareViewer`, and `CompareMode` against the S01/S02 editorial system and identify the minimum shared continuity cues that should appear across them.
2. Update results action components to reinforce the downstream route relationship — public proof link, gallery edition save, and honest export posture — while preserving the existing API payload boundaries and button semantics.
3. Refine compare and detail-route framing so their intros and action areas echo the same collector/editorial language as results rather than reading as isolated route-local prose.
4. Keep export messaging truthful to current backend limits and preserve explicit privacy boundaries on share and gallery detail surfaces.
5. Extend or add route-family assertions in the new assembled proof test plus existing export/share tests so the continuity contract becomes executable.

## Must-Haves

- [ ] Results action surfaces and downstream route intros/viewers use aligned collector/editorial copy and action framing.
- [ ] Share stays parameter-only, gallery hint reveal remains optional, and export copy does not over-promise current backend capabilities.

## Verification

- `npm test -- src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/app/product-family-coherence.test.tsx`
- In localhost browser verification, action surfaces and route viewers read as one family while still exposing truthful privacy/export constraints.

## Observability Impact

- Signals added/changed: clearer visible action-state copy for export/share/save continuity and route-level family messaging
- How a future agent inspects this: results action cards, compare intro, gallery/share viewer text, and the route-family coherence test
- Failure state exposed: mismatched action language, privacy-copy regressions, or export over-promising become visible in tests and browser copy instead of subjective review only

## Inputs

- `src/components/results/ResultsView.tsx` — canonical upstream action family and proof-safe results seam from S01
- `src/app/globals.css` — shared editorial token layer established in S01/S02 and expected to remain the single styling system

## Expected Output

- `src/components/results/ExportControls.tsx` — export action copy and framing aligned to the collector/editorial family while staying honest about constraints
- `src/components/results/ShareButton.tsx` — share action surface that visibly connects to downstream public proof viewing without weakening privacy boundaries
- `src/components/gallery/GallerySaveModal.tsx`, `src/app/compare/CompareMode.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx` — route and modal copy/framing that complete the family language across results and downstream surfaces
- `src/__tests__/app/product-family-coherence.test.tsx` — executable continuity assertions for the action family
