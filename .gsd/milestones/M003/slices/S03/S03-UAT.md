# S03: Cohesive gallery, compare, share, and export product family — UAT

**Milestone:** M003
**Written:** 2026-03-13

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S03 is the final assembly slice — completion requires both automated proof (tests/build) and live browser judgment of product family coherence across multiple routes and interaction contracts.

## Preconditions

- Dependencies are installed.
- The app is runnable locally.
- `npm test -- src/__tests__/app/product-family-coherence.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/components/ExportControls.test.tsx src/__tests__/share/viewer.test.ts` passes.
- `npm run build` passes.
- A local app instance is available at `http://localhost:3000`.

## Smoke Test

Open `http://localhost:3000` and confirm the homepage renders with branded editorial shell, then navigate to `/gallery` and confirm cards use the collector editorial style.

## Test Cases

### 1. Results action surfaces connect to downstream routes

1. Generate a result from the homepage.
2. Inspect the action desk: export, share, and save controls.
3. Confirm export states 4096-only and limited-format truth.
4. Confirm share frames destination as parameter-only public proof viewer.
5. Confirm gallery save previews what becomes public and excludes raw source.
6. **Expected:** Action surfaces read as entry points into the same product family as downstream routes.

### 2. Gallery browse cards match the collector/editorial system

1. Open `http://localhost:3000/gallery`.
2. Confirm cards use editorial collector styling with clear title/style/date hierarchy.
3. Test reveal: click hint reveal on a card with optional hints.
4. Test upvote: click upvote and confirm it disables after use.
5. Test detail link: click a card to navigate to `/gallery/[id]`.
6. **Expected:** Gallery browse looks like part of the same product family, with all interactions preserved.

### 3. Compare mode uses family-aligned framing

1. Open `http://localhost:3000/compare`.
2. Confirm branded atelier framing and family-aligned intro copy.
3. Test keyboard navigation between panes.
4. Test style selector controls.
5. **Expected:** Compare feels like the same branded product with all interaction semantics intact.

### 4. Detail/share viewers show family continuity or truthful unavailable states

1. Navigate to `/gallery/[valid-id]` or `/share/[valid-id]`.
2. If data available: confirm branded viewer scaffold with family-aligned copy.
3. If no DB: confirm branded unavailable-state messaging.
4. Confirm share viewer never exposes raw input text.
5. **Expected:** Detail routes belong to the same visual family as browse and results.

### 5. Keyboard and accessibility checks

1. Tab through gallery browse cards and confirm focusable action controls.
2. Tab through compare controls and confirm keyboard navigation works.
3. Tab through results action desk controls.
4. **Expected:** All redesigned surfaces remain keyboard-usable with visible focus indicators.

## Edge Cases

### DB-backed routes without a running database

1. Visit `/gallery/any-id` and `/share/any-id` without a database.
2. Confirm branded unavailable-state messaging is explicit and inspectable.
3. **Expected:** No blank screens or generic errors.

## Failure Signals

- Results action desk copy is disconnected from downstream route language.
- Gallery browse cards use ad hoc styling that doesn't match compare/share/detail surfaces.
- Keyboard navigation is broken on compare or gallery browse.
- Raw input text appears in share viewer.
- Export controls hide backend limitations instead of stating them truthfully.
- Unavailable states show blank screens or generic centered text.

## Requirements Proved By This UAT

- R003 — Editorial gallery-luxe visual design now spans the full product family.
- R004 — Cross-surface coherence proven across results actions, gallery, compare, share, and export.
- R005 — Product is credible for a polished public demo across all major routes.
- R009 — Brand narrative extends from homepage through all downstream surfaces.
- R010 — Redesigned surfaces preserve keyboard usability, privacy, and diagnostics.

## Not Proven By This UAT

- Full accessibility audit breadth beyond keyboard usability checks.
- Operational launch hardening (M005 scope).
- End-to-end gallery save → browse → detail flow with live data (requires running DB).

## Notes for Tester

The most important qualitative judgment is whether moving between homepage results, `/gallery`, `/compare`, and detail routes feels like navigating one branded product rather than jumping between unrelated pages. Each route should feel connected through shared copy posture, visual tokens, and action language.
