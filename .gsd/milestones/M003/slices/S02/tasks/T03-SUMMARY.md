---
parent: S02
milestone: M003
status: completed
completed_at: 2026-03-12
files_changed:
  - src/components/viewers/BrandedViewerScaffold.tsx
  - src/app/globals.css
  - src/app/share/[id]/ShareViewer.tsx
  - src/app/gallery/[id]/GalleryViewer.tsx
  - src/app/share/[id]/page.tsx
  - src/app/gallery/[id]/page.tsx
  - .gsd/milestones/M003/slices/S02/S02-PLAN.md
verification:
  - npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx
observability_surfaces:
  - BrandedViewerScaffold.tsx shared by gallery/share detail routes
  - Branded unavailable-state messaging on /gallery/[id] and /share/[id]
  - Privacy contract preserved in ShareViewer (no raw input exposure)
---

# T03 Summary

## What changed

Added a reusable branded viewer scaffold at `src/components/viewers/BrandedViewerScaffold.tsx` and moved both detail routes onto it so gallery and share pages now read as one collector/editorial viewer family instead of two unrelated full-screen wrappers.

Extended `src/app/globals.css` with shared viewer layout primitives for the split canvas/sidebar composition, metadata rows, and unavailable-state diagnostics so the new detail surfaces use the same token language as the rest of S02.

Refactored `src/app/share/[id]/ShareViewer.tsx` to render through the branded scaffold while preserving the share privacy contract: it still accepts only `parameterVector`, `versionInfo`, `styleName`, and `createdAt`, and it still never renders raw input.

Refactored `src/app/gallery/[id]/GalleryViewer.tsx` onto the same scaffold while keeping gallery-only behavior local to the action desk: optional input-hint reveal and upvote controls remain route-specific and continue to avoid raw-input storage semantics.

Replaced the ad hoc unavailable/not-found route markup in `src/app/share/[id]/page.tsx` and `src/app/gallery/[id]/page.tsx` with a shared branded unavailable state that keeps route-specific diagnostic messages explicit and inspectable.

## Why it matters

This closes the main T03 gap from the slice plan: gallery and share detail routes now share one branded viewer grammar for header posture, canvas framing, metadata display, parameter panels, and failure-state treatment, without merging their privacy or interaction semantics.

It also improves future debugging. A later agent can inspect the same stable unavailable-state surface on either route and quickly distinguish between missing IDs, backend unavailability, and viewer-framing regressions.

## Verification

Passed:

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx`

## Must-haves addressed

- Gallery and share detail pages now visibly read as one branded viewer family with shared framing, metadata posture, and explicit unavailable-state treatment.
- Share viewer route wiring remains privacy-safe, and gallery-specific actions continue to work inside the shared viewer frame.

## Diagnostics

Future agents can verify viewer unification by running:
- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx`
- Browser check on `/gallery/[id]` and `/share/[id]` for shared viewer scaffold framing and explicit unavailable-state messaging.
- Inspect `src/components/viewers/BrandedViewerScaffold.tsx` for the single source of viewer composition logic.

## Follow-on for T04

T04 still needs full slice closeout: run the broader verification set, execute a real app/browser pass across `/gallery`, `/compare`, and truthful `/share/[id]` + `/gallery/[id]` states, then write `S02-SUMMARY.md`.
