# S02: Shared brand system across shell, actions, and viewer surfaces

**Goal:** Propagate the S01 editorial gallery-luxe system into the reusable downstream seams — route shells, browse controls, compare mode, and gallery/share viewers — so the product no longer falls back to disconnected page-local wrappers or undefined utility classes once the visitor leaves the homepage/results flow.
**Demo:** After this: the redesigned visual language is no longer homepage-only — shared chrome, action treatments, viewer framing, copy posture, and route-level surface patterns visibly unify results and the reusable product seams downstream pages depend on.

## Tasks
- [x] **T01: Add failing proof for shared branded route surfaces** — 
  - Files: src/__tests__/app/shared-brand-surfaces.test.tsx, src/__tests__/compare/compare-mode.test.tsx, src/app/gallery/page.tsx
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx`
- [x] **T02: Normalize gallery browse and compare into the shared shell/action system** — 
  - Files: src/app/gallery/page.tsx, src/components/gallery/GalleryGrid.tsx, src/components/gallery/GalleryFilters.tsx, src/app/compare/CompareMode.tsx, src/app/globals.css
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx`
- [x] **T03: Unify gallery and share detail viewers with branded viewer scaffolds** — 
  - Files: src/app/gallery/[id]/GalleryViewer.tsx, src/app/share/[id]/ShareViewer.tsx, src/app/gallery/[id]/page.tsx, src/app/share/[id]/page.tsx, src/app/globals.css, src/__tests__/share/viewer.test.ts
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx`
- [x] **T04: Close the slice with build and browser proof across branded surfaces** — 
  - Files: src/app/gallery/page.tsx, src/app/compare/page.tsx, src/app/gallery/[id]/page.tsx, src/app/share/[id]/page.tsx, .gsd/milestones/M003/slices/S02/S02-SUMMARY.md
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
