---
estimated_steps: 5
estimated_files: 6
---

# T03: Unify gallery and share detail viewers with branded viewer scaffolds

**Slice:** S02 — Shared brand system across shell, actions, and viewer surfaces
**Milestone:** M003

## Description

Establish a shared collector/editorial viewer grammar for gallery and share detail pages. This task should unify canvas framing, metadata posture, parameter panels, and unavailable-state treatment while preserving route-specific semantics: gallery keeps its upvote and optional input-hint affordances, and share keeps its privacy-safe parameter-only contract.

## Steps

1. Introduce or standardize shared branded viewer-layout utilities in `src/app/globals.css` for detail headers, canvas frames, metadata rails, parameter panels, and unavailable/not-found states.
2. Refactor `src/app/share/[id]/ShareViewer.tsx` to use the branded viewer scaffold while preserving the existing privacy contract and engine/version metadata.
3. Refactor `src/app/gallery/[id]/GalleryViewer.tsx` onto the same viewer scaffold, keeping gallery-specific affordances such as input hint reveal and upvote behavior separate from the shared frame.
4. Update `src/app/share/[id]/page.tsx` and `src/app/gallery/[id]/page.tsx` so unavailable and not-found states render through the same branded system with explicit messages instead of generic centered text.
5. Run the targeted viewer/privacy tests and fix any regressions until the shared-surface proof and existing share/gallery guards pass together.

## Must-Haves

- [ ] Gallery and share detail pages visibly read as one branded viewer family with shared framing, metadata posture, and explicit unavailable-state treatment.
- [ ] Share viewer props and route wiring remain privacy-safe and do not introduce any raw-input exposure while gallery-specific actions continue to work within the shared frame.

## Verification

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/share/viewer.test.ts src/__tests__/gallery/gallery-card.test.tsx`
- Viewer assertions pass while `src/__tests__/share/viewer.test.ts` still proves the share privacy contract and gallery-card behavior remains intact.

## Observability Impact

- Signals added/changed: Detail-view metadata, parameter display, and unavailable-state headings become stable branded inspection seams across both viewer routes.
- How a future agent inspects this: Run the targeted tests and inspect `/share/[id]` or `/gallery/[id]` in the browser to localize whether an issue is in shared framing, privacy wiring, or DB availability.
- Failure state exposed: DB-unavailable and not-found states remain visible with route-specific explicit copy instead of hidden blank states.

## Inputs

- `src/app/share/[id]/ShareViewer.tsx` — authoritative privacy-bound viewer seam that must remain parameter-only.
- `src/app/gallery/[id]/GalleryViewer.tsx` — gallery-specific viewer logic that should inherit shared framing without losing upvote/input-hint affordances.

## Expected Output

- `src/app/share/[id]/ShareViewer.tsx` and `src/app/gallery/[id]/GalleryViewer.tsx` — detail viewers sharing one branded collector/editorial scaffold.
- `src/app/share/[id]/page.tsx` and `src/app/gallery/[id]/page.tsx` — branded explicit unavailable/not-found states that preserve truthful DB diagnostics.
