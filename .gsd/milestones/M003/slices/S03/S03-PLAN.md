# S03: Cohesive gallery, compare, share, and export product family

**Goal:** Finish M003’s primary coherence contract by making the results action family and downstream gallery/compare/share/export-adjacent routes read as one collector/editorial product in code, tests, and real browser use.
**Demo:** After this: gallery, compare, share, and export-adjacent flows can be demoed in the browser as one coherent collector/editorial product family, with final integration proof that the milestone works end-to-end through real routes.

## Tasks
- [x] **T01: Wire action-family continuity across results, browse, compare, and detail surfaces** — 
  - Files: src/components/results/ExportControls.tsx, src/components/results/ShareButton.tsx, src/components/gallery/GallerySaveModal.tsx, src/app/compare/CompareMode.tsx, src/app/gallery/[id]/GalleryViewer.tsx, src/app/share/[id]/ShareViewer.tsx, src/app/globals.css
  - Verify: `npm test -- src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/app/product-family-coherence.test.tsx`
- [x] **T02: Rebuild gallery cards as editorial collector objects without breaking browse behavior** — 
  - Files: src/components/gallery/GalleryCard.tsx, src/components/gallery/GalleryGrid.tsx, src/app/globals.css, src/__tests__/gallery/gallery-card.test.tsx, src/__tests__/app/product-family-coherence.test.tsx
  - Verify: `npm test -- src/__tests__/gallery/gallery-card.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- [x] **T03: Add final assembled proof and close the slice in browser truth** — 
  - Files: src/__tests__/app/product-family-coherence.test.tsx, .gsd/milestones/M003/slices/S03/S03-PLAN.md, .gsd/DECISIONS.md, .gsd/STATE.md
  - Verify: `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
