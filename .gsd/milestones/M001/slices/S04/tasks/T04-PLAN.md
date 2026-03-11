# T04: 04-geometric-renderer-canvas-ui 04

**Slice:** S04 — **Milestone:** M001

## Description

Close 2 verification gaps from Phase 4 verification report (04-VERIFICATION.md):

1. **UI-08 Thumbnail Size:** StyleSelector renders 80x80 thumbnails; REQUIREMENTS.md specifies 200x200. Change thumbSize from 80 to 200, update container dimensions and canvas inline style to match.

2. **UI-11 Mobile Panel Collapse:** ParameterPanel always renders all 15 bars regardless of viewport. Add mobile-specific collapsed behavior: default to collapsed on mobile (<md), expanded on desktop (>=md), with a separate expand/collapse toggle for the whole panel body.

Purpose: Satisfy UI-08 (200x200 thumbnail spec) and UI-11 (collapsed on mobile) which are the only 2 remaining gaps blocking Phase 4 goal achievement (currently 13/15).
Output: Fixed StyleSelector + ParameterPanel components, updated/new tests.

## Must-Haves

- [ ] "Style selector thumbnail for active (Geometric) style renders at 200x200 CSS pixels"
- [ ] "ParameterPanel is collapsed by default on mobile (<md breakpoint), showing only header and expand toggle"
- [ ] "ParameterPanel is expanded by default on desktop (>=md breakpoint), showing all 15 parameter bars"
- [ ] "Mobile panel expand/collapse toggle is separate from the 'Show details' provenance toggle"
- [ ] "All 258+ existing tests continue to pass"

## Files

- `src/components/results/StyleSelector.tsx`
- `src/components/results/ParameterPanel.tsx`
- `src/__tests__/components/StyleSelector.test.tsx`
- `src/__tests__/components/ParameterPanel.test.tsx`
