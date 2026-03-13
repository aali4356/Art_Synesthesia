# S02: Shared brand system across shell, actions, and viewer surfaces

**Goal:** Propagate the S01 editorial gallery-luxe system into the reusable downstream seams — route shells, browse controls, compare mode, and gallery/share viewers — so the product no longer falls back to disconnected page-local wrappers or undefined utility classes once the visitor leaves the homepage/results flow.
**Demo:** In the real app, gallery browse, compare, and gallery/share detail pages all render inside the same branded shell language with consistent route intros, action treatments, viewer framing, and honest unavailable states, while preserving existing privacy and compare interaction contracts.

## Must-Haves

- Gallery, compare, and DB-backed detail routes consume the shared editorial shell/system instead of standalone `min-h-screen` wrappers.
- Compare mode replaces undefined utility classes with the shared branded action/control grammar while preserving the tested two-pane compare semantics.
- Gallery browse and detail/share viewer surfaces share one collector/editorial framing language for route intros, viewer metadata, actions, and parameter-display posture without weakening privacy boundaries.
- Gallery/share unavailable and not-found states remain explicit, branded, and inspectable rather than generic centered fallback text.
- The slice adds executable proof for cross-surface shell/action/viewer coherence and at least one diagnostic/failure-path state.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/share/viewer.test.ts`
- `npm run build`
- Browser verification on `http://localhost:3000`: exercise `/gallery`, `/compare`, and representative `/share/[id]` + `/gallery/[id]` states (or truthful unavailable states when local DB is absent), then assert shared branded shell/viewer/action language plus explicit unavailable messaging.
- Diagnostic check: verify the browser-visible unavailable states for DB-backed routes remain explicit and inspectable rather than collapsing into silent blank screens.

## Observability / Diagnostics

- Runtime signals: existing browser-visible route copy and results/viewer metadata remain the primary inspection seam; unavailable states must expose stable, explicit titles/messages for missing DB-backed data.
- Inspection surfaces: targeted Vitest coverage in `src/__tests__/app/shared-brand-surfaces.test.tsx`, existing compare/gallery/share tests, and browser-visible route UI at `/gallery`, `/compare`, `/share/[id]`, and `/gallery/[id]`.
- Failure visibility: route-level unavailable/not-found headings, compare control states, and viewer metadata/action surfaces stay visible so a future agent can localize whether a failure is shell wiring, viewer composition, or DB unavailability.
- Redaction constraints: no raw input may be introduced into share/gallery viewer props or route states; diagnostics remain privacy-safe and must not expose secrets or source text.

## Integration Closure

- Upstream surfaces consumed: `src/components/layout/Shell.tsx`, `src/components/layout/Header.tsx`, `src/app/globals.css`, `src/components/results/ResultsView.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, `src/components/gallery/GallerySaveModal.tsx`
- New wiring introduced in this slice: gallery browse, compare, gallery detail, and share detail routes adopt the shared editorial shell plus reusable route-intro/viewer/unavailable-state primitives; compare and gallery controls are normalized onto the same action/control styling language already used by results surfaces.
- What remains before the milestone is truly usable end-to-end: S03 still must finish the cohesive gallery/compare/share/export family at full final-assembly level, including broader cross-route browser proof and any remaining route-specific polish such as export-adjacent continuity and final accessibility rechecks.

## Tasks

- [x] **T01: Add failing proof for shared branded route surfaces** `est:45m`
  - Why: S02 needs an executable contract before implementation so shared shell/action/viewer coherence is enforced by tests instead of taste alone.
  - Files: `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/compare/compare-mode.test.tsx`, `src/app/gallery/page.tsx`
  - Do: Add a new route-surface integration test covering gallery browse, compare, and branded unavailable-state composition; tighten compare assertions where the redesign must preserve control semantics while replacing undefined classes; make the new expectations fail against the current disconnected shells.
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx`
  - Done when: The new shared-surface proof exists, captures branded shell/action/viewer expectations plus an unavailable-state signal, and the targeted command fails because the current UI has not been normalized yet.
- [x] **T02: Normalize gallery browse and compare into the shared shell/action system** `est:1h 20m`
  - Why: The browse and compare entry surfaces are the clearest cross-route seams where shell fragmentation and undefined classes currently break coherence.
  - Files: `src/app/gallery/page.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryFilters.tsx`, `src/app/compare/CompareMode.tsx`, `src/app/globals.css`
  - Do: Move gallery browse and compare under the editorial shell/route-intro language, add any shared route-intro/filter/control utilities needed in `globals.css`, and replace compare’s undefined button/background classes with the existing editorial action grammar while preserving its two-pane flow and keyboard-usable controls.
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx`
  - Done when: Gallery browse and compare visibly use the shared branded shell/action language, compare tests still pass, and the route-surface proof advances past the browse/compare assertions.
- [x] **T03: Unify gallery and share detail viewers with branded viewer scaffolds** `est:1h 20m`
  - Why: Gallery/share detail pages currently duplicate plain viewer wrappers; S02 must establish one collector/editorial viewer grammar without merging their privacy/data semantics.
  - Files: `src/app/gallery/[id]/GalleryViewer.tsx`, `src/app/share/[id]/ShareViewer.tsx`, `src/app/gallery/[id]/page.tsx`, `src/app/share/[id]/page.tsx`, `src/app/globals.css`, `src/__tests__/share/viewer.test.ts`
  - Do: Introduce shared branded viewer framing for canvas, metadata, parameter panels, and unavailable states; migrate gallery and share detail pages onto it; keep gallery-only affordances like upvote/input hint separate; preserve the share privacy contract and explicit DB-unavailable/not-found messaging.
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx`
  - Done when: Gallery and share detail surfaces read as one branded viewer family, privacy tests stay green, and the unavailable/not-found states are explicit inside the same system.
- [x] **T04: Close the slice with build and browser proof across branded surfaces** `est:55m`
  - Why: S02 is not complete until the real app proves the shared shell/action/viewer language works outside fixtures and that truthful failure states remain inspectable.
  - Files: `src/app/gallery/page.tsx`, `src/app/compare/page.tsx`, `src/app/gallery/[id]/page.tsx`, `src/app/share/[id]/page.tsx`, `.gsd/milestones/M003/slices/S02/S02-SUMMARY.md`
  - Do: Finish any last-mile wiring exposed by tests, run the slice verification commands, and browser-check the real routes to confirm shared branded composition plus honest unavailable-state messaging when local DB-backed detail routes are absent.
  - Verify: `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
  - Done when: All targeted tests and build pass, browser assertions confirm branded continuity across browse/compare/viewer surfaces, and the remaining DB limitation is still explicit instead of hidden.

## Files Likely Touched

- `src/__tests__/app/shared-brand-surfaces.test.tsx`
- `src/app/gallery/page.tsx`
- `src/components/gallery/GalleryGrid.tsx`
- `src/components/gallery/GalleryFilters.tsx`
- `src/app/compare/CompareMode.tsx`
- `src/app/gallery/[id]/GalleryViewer.tsx`
- `src/app/share/[id]/ShareViewer.tsx`
- `src/app/gallery/[id]/page.tsx`
- `src/app/share/[id]/page.tsx`
- `src/app/globals.css`
- `.gsd/milestones/M003/slices/S02/S02-SUMMARY.md`
