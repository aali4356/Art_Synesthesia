---
id: T03
parent: S01
milestone: M003
provides:
  - Editorial results composition and branded action/modal surfaces that preserve the live proof diagnostics privacy contract
key_files:
  - src/components/results/ResultsView.tsx
  - src/components/results/ExportControls.tsx
  - src/components/results/ShareButton.tsx
  - src/components/gallery/GallerySaveModal.tsx
  - src/app/globals.css
  - .gsd/DECISIONS.md
key_decisions:
  - D037 extended the editorial token layer to results-only cards, chips, modal shells, and form fields instead of keeping export/share/save styling on undefined semantic utilities
patterns_established:
  - Keep results diagnostics, action states, and save-modal privacy messaging inside the same editorial panel/card system used on landing so the route reads as one branded flow
observability_surfaces:
  - ResultsView proof diagnostics panel
  - Export/share visible success and error copy
  - Gallery save modal privacy posture and public-preview messaging
  - Browser-visible results/action state after live generation
duration: 1h
verification_result: passed
completed_at: 2026-03-11T19:38:00-04:00
blocker_discovered: false
---

# T03: Reframe ResultsView and adjacent actions into the same premium system

**Shipped an editorial results surface that keeps proof diagnostics privacy-safe while bringing export, share, and gallery-save actions into the same branded system.**

## What Happened

I rewrote `src/components/results/ResultsView.tsx` so the results state no longer reads like a fallback tool screen after the landing experience. The results route now uses the same editorial panel language, continuity chips, action desk framing, and branded canvas presentation as the landing state while preserving the core live seams: style switching, proof diagnostics, parameter inspection, and gallery/share/export affordances.

I normalized the action surfaces in `src/components/results/ExportControls.tsx` and `src/components/results/ShareButton.tsx` by removing undefined semantic utility dependence (`bg-secondary`, `text-muted-foreground`, `text-destructive`, etc.) and moving them onto explicit editorial tokenized classes. I also restyled `src/components/gallery/GallerySaveModal.tsx` into the same premium system with clearer public-preview/privacy language that remains truthful about what is and is not exposed.

To support that, I extended `src/app/globals.css` with reusable results/modal primitives (`editorial-results-grid`, `editorial-action-card`, `editorial-chip`, `editorial-chip-button`, `editorial-link-strip`, `editorial-modal-shell`, `editorial-input`, and related helpers) so downstream slices can reuse the same language instead of adding more one-off classes.

I appended D037 to `.gsd/DECISIONS.md` to record the decision to extend the editorial token layer into results-only surfaces instead of continuing with undefined semantic styling.

## Verification

- Passed targeted slice tests:
  - `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- Passed slice build verification:
  - `npm run build`
- Ran live browser verification against `http://localhost:3000`:
  - generated artwork from landing text input
  - confirmed results continuity copy (`Back to the editorial desk`, `proof diagnostics`, `renderer expressiveness`, `Share`, `Save to Gallery`)
  - confirmed privacy-safe diagnostics copy remained visible
  - opened the save modal and verified branded/privacy messaging (`Preview exactly what will be public before publishing this edition.`, `The full raw source is never included here.`, `Input preview (optional)`, `Privacy posture`)

## Diagnostics

Future agents can inspect this work from the live homepage route:

1. Generate once from `/`.
2. Inspect the `proof diagnostics` panel for active style, proof source, palette family, mapping posture, supported styles, and renderer expressiveness.
3. Inspect the action desk for export/share/save state copy.
4. Open `Save to Gallery` to verify the public-preview/privacy posture and optional input-preview controls.

The primary observability seams remain browser-visible and privacy-safe; no raw source is surfaced in the diagnostics panel.

## Deviations

None.

## Known Issues

- Browser assertion support for `text_hidden` is currently unsupported in the harness, so the live privacy check for hidden raw input was confirmed via the existing passing DOM tests rather than a browser assertion primitive.
- The existing local dev console still shows unrelated HMR noise/history from prior sessions; this task did not change that behavior.

## Files Created/Modified

- `src/components/results/ResultsView.tsx` — restructured the results experience into editorial panels with continuity framing, preserved proof diagnostics, and branded action clustering
- `src/components/results/ExportControls.tsx` — replaced undefined semantic utility usage with editorial export card and chip-button surfaces
- `src/components/results/ShareButton.tsx` — rebuilt the share states as branded editorial cards with explicit privacy-safe copy
- `src/components/gallery/GallerySaveModal.tsx` — restyled the save modal into the premium system and clarified public-preview/privacy messaging
- `src/app/globals.css` — added reusable editorial results/action/modal/form tokens to support the redesigned route-level continuity
- `.gsd/DECISIONS.md` — appended D037 documenting the results-surface token strategy
