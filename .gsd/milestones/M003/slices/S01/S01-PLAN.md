# S01: Editorial landing, generation, and results journey

**Goal:** Redesign the real homepage flow so first-time visitors can understand Synesthesia Machine, generate from the existing text/URL/data entry seams, and land in a premium editorial results experience that preserves diagnostics, privacy, and keyboard-usable core actions.
**Demo:** After this: a visitor can use the real homepage flow to understand the product, generate artwork, and land in a premium branded results experience that already feels continuous rather than split between marketing and tool UI.

## Tasks
- [x] **T01: Add failing proof for the editorial homepage journey** — 
  - Files: src/__tests__/app/home-editorial-flow.test.tsx, src/__tests__/components/results/ResultsView.live-proof.test.tsx, src/app/page.tsx
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- [x] **T02: Redesign the landing and generation entry as an editorial branded surface** — 
  - Files: src/app/page.tsx, src/components/input/InputZone.tsx, src/components/layout/Header.tsx, src/components/layout/Shell.tsx, src/app/layout.tsx, src/app/globals.css
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx`
- [x] **T03: Reframe ResultsView and adjacent actions into the same premium system** — 
  - Files: src/components/results/ResultsView.tsx, src/components/results/ExportControls.tsx, src/components/results/ShareButton.tsx, src/components/gallery/GallerySaveModal.tsx, src/app/page.tsx, src/app/globals.css
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- [x] **T04: Prove the real browser journey and operational truthfulness** — 
  - Files: src/app/page.tsx, src/components/results/ResultsView.tsx, .gsd/milestones/M003/slices/S01/S01-SUMMARY.md
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx && npm run build` plus explicit browser assertions against `http://localhost:3000`
