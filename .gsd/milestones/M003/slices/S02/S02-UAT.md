# S02: Shared brand system across shell, actions, and viewer surfaces — UAT

**Milestone:** M003
**Written:** 2026-03-12

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S02 changes cross-route visual coherence and viewer composition, requiring both automated test verification and live browser inspection to confirm branded continuity and truthful failure states across multiple routes.

## Preconditions

- Dependencies are installed.
- The app is runnable locally.
- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx src/__tests__/gallery/gallery-card.test.tsx src/__tests__/share/viewer.test.ts` passes.
- `npm run build` passes.
- A local app instance is available at `http://localhost:3000`.

## Smoke Test

Open `http://localhost:3000/gallery` and confirm the page renders inside the shared editorial shell with branded route intro copy rather than a standalone plain wrapper.

## Test Cases

### 1. Gallery browse uses the shared editorial shell

1. Open `http://localhost:3000/gallery`.
2. Confirm the page shows the branded editorial shell header (`Synesthesia Machine`).
3. Confirm a branded route intro is visible describing the gallery surface.
4. Confirm the filter bar and grid cards use consistent editorial styling.
5. **Expected:** Gallery browse reads as part of the same branded product as the homepage/results flow, not a disconnected page.

### 2. Compare mode renders in branded atelier framing

1. Open `http://localhost:3000/compare`.
2. Confirm the compare surface shows branded intro copy (e.g., `Compare atelier`).
3. Confirm the two-pane viewer stage is present with branded framing.
4. Confirm action controls (swap, keyboard navigation) are styled with the shared action grammar.
5. **Expected:** Compare mode feels like a branded product surface with all existing interaction semantics preserved (two-pane layout, keyboard nav, swap).

### 3. Gallery detail viewer uses branded viewer scaffold

1. Navigate to a gallery detail page (e.g., `http://localhost:3000/gallery/[valid-id]`).
2. If data is available: confirm the viewer renders inside the branded scaffold with canvas framing, metadata display, and action desk.
3. If no DB: confirm an explicit branded unavailable-state message is shown rather than a blank screen.
4. **Expected:** The gallery detail route uses the same viewer scaffold as the share route, with gallery-specific actions (upvote, input hint) remaining local.

### 4. Share detail viewer preserves privacy within branded scaffold

1. Navigate to a share detail page (e.g., `http://localhost:3000/share/[valid-id]`).
2. If data is available: confirm the viewer renders inside the branded scaffold with canvas, metadata, and parameter panels.
3. If no DB: confirm an explicit branded unavailable-state message is shown.
4. Confirm no raw input text is exposed in the viewer.
5. **Expected:** The share detail route reads as part of the same viewer family as gallery detail, with privacy contract preserved.

### 5. Unavailable states are explicit and branded

1. Visit `/gallery/nonexistent-id` and `/share/nonexistent-id`.
2. Confirm both show branded unavailable-state messaging with explicit titles and descriptions.
3. Confirm the unavailable state is not a blank screen or generic browser error.
4. **Expected:** Missing-data states are inspectable and visually consistent with the branded system.

## Edge Cases

### DB-backed routes without a running database

1. Stop any local database.
2. Visit `/gallery/any-id` and `/share/any-id`.
3. Observe the visible unavailable-state messaging.
4. **Expected:** Both routes show branded, explicit unavailable-state copy that identifies the issue rather than collapsing into silent empty shells.

## Failure Signals

- Gallery browse renders a standalone `min-h-screen` wrapper without the editorial shell.
- Compare mode uses undefined or unstyled CSS classes for controls.
- Gallery and share detail pages render in visually disconnected viewer wrappers.
- Unavailable states show blank screens, generic centered text, or browser errors.
- Raw input text appears in the share viewer.
- Compare keyboard navigation or two-pane semantics are broken.

## Requirements Proved By This UAT

- R004 — Gallery, compare, and detail routes now share the same branded product language as homepage/results.
- R005 — Cross-route coherence is credible for a polished demo across browse/compare/detail surfaces.
- R010 — Redesigned surfaces preserve existing interaction contracts and privacy boundaries.

## Not Proven By This UAT

- Full final-assembly integration across all routes with export-adjacent continuity (S03 scope).
- Comprehensive accessibility audit across all redesigned surfaces (S03 scope).
- End-to-end gallery save → gallery browse → gallery detail flow with live data (requires running DB).

## Notes for Tester

Without a running database, DB-backed detail routes will show branded unavailable-state messaging. This is expected behavior. The key qualitative check is whether navigating between `/gallery`, `/compare`, and detail routes feels like moving within one branded product rather than jumping between unrelated pages.
