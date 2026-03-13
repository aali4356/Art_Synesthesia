---
estimated_steps: 4
estimated_files: 5
---

# T04: Close the slice with build and browser proof across branded surfaces

**Slice:** S02 — Shared brand system across shell, actions, and viewer surfaces
**Milestone:** M003

## Description

Finish S02 with real verification, not just code changes. This task closes any last-mile regressions exposed by tests, runs the slice verification set, and browser-proves that gallery browse, compare, and detail/viewer routes now read as one branded product while keeping truthful unavailable-state diagnostics visible when local DB dependencies are absent.

## Steps

1. Resolve any remaining implementation gaps exposed by `src/__tests__/app/shared-brand-surfaces.test.tsx`, existing compare/gallery/share tests, or `npm run build`.
2. Run the full slice verification command and confirm all targeted tests plus the production build pass together.
3. Start or reuse the local app, exercise `/gallery`, `/compare`, and representative `/share/[id]` + `/gallery/[id]` routes in the browser, and explicitly verify branded continuity plus honest unavailable-state messaging where DB-backed data is absent.
4. Record the slice outcome in `S02-SUMMARY.md`, update any linked planning/state artifacts required by closeout, and leave browser-visible diagnostics noted for the next slice.

## Must-Haves

- [ ] The real browser routes show shared shell/action/viewer language across browse, compare, and detail surfaces rather than isolated page treatments.
- [ ] DB-backed unavailable states remain explicit and inspectable in-browser and are not softened into ambiguous empty shells.

## Verification

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/share/viewer.test.ts && npm run build`
- Browser verification on localhost confirms shared branded continuity across `/gallery` and `/compare`, plus representative `/share/[id]` and `/gallery/[id]` success or truthful unavailable-state behavior.

## Observability Impact

- Signals added/changed: Browser-visible route diagnostics and unavailable-state copy are confirmed as the primary live inspection seams for downstream S03 work.
- How a future agent inspects this: Re-run the targeted test/build command and exercise the verified routes on localhost.
- Failure state exposed: Any remaining DB-backed route limitation is explicitly visible in browser UI and can be correlated to the route where it occurs.

## Inputs

- `src/__tests__/app/shared-brand-surfaces.test.tsx` — authoritative integration proof for this slice’s shared-surface contract.
- `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md` — prior live-proof baseline that S02 must extend without regressing the branded homepage/results continuity already established.

## Expected Output

- `.gsd/milestones/M003/slices/S02/S02-SUMMARY.md` — truthful slice completion record with verification and remaining limits.
- Verified gallery/compare/share/detail routes on localhost that demonstrate the shared branded shell/action/viewer language in real runtime behavior.
