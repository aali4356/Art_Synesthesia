# S04: Geometric Renderer Canvas Ui

**Goal:** Build the pure-function geometric composition engine that transforms a ParameterVector + PaletteResult into a deterministic SceneGraph of drawing instructions, with all composition laws enforced.
**Demo:** Build the pure-function geometric composition engine that transforms a ParameterVector + PaletteResult into a deterministic SceneGraph of drawing instructions, with all composition laws enforced.

## Must-Haves


## Tasks

- [x] **T01: 04-geometric-renderer-canvas-ui 01** `est:5min`
  - Build the pure-function geometric composition engine that transforms a ParameterVector + PaletteResult into a deterministic SceneGraph of drawing instructions, with all composition laws enforced.

Purpose: This is the computational core of the first rendering style. Every visual output flows through this engine. Pure functions (no Canvas API side effects) enable exhaustive TDD testing of composition laws.

Output: Render type definitions, recursive subdivision, shape assignment, scene graph builder, Canvas 2D draw functions, and comprehensive tests verifying all 5 GEOM requirements plus determinism.
- [x] **T02: 04-geometric-renderer-canvas-ui 02** `est:4min`
  - Create the React canvas component with progressive build animation, style selector with thumbnail previews, and integrate into the results layout replacing the placeholder canvas.

Purpose: This connects the pure-function geometric engine (Plan 01) to the user-visible canvas, delivering the core visual experience of the MVP. Users see their text transformed into geometric artwork with a satisfying progressive build animation.

Output: GeometricCanvas component with HiDPI support and animation, StyleSelector with active/locked states, updated ResultsView layout.
- [x] **T03: 04-geometric-renderer-canvas-ui 03** `est:1min`
  - Bump the renderer version to reflect the new geometric renderer, verify the translation panel displays correctly alongside the real canvas, and perform end-to-end human verification of the complete Phase 4 MVP.

Purpose: UI-11 through UI-15 (translation panel requirements) were already implemented in Phase 3. This plan confirms they work correctly in the context of the real rendered canvas, bumps the renderer version, and provides the human verification checkpoint for the complete end-to-end flow.

Output: Updated rendererVersion, verified translation panel alongside canvas, human sign-off on Phase 4 MVP.
- [x] **T04: 04-geometric-renderer-canvas-ui 04** `est:3min`
  - Close 2 verification gaps from Phase 4 verification report (04-VERIFICATION.md):

1. **UI-08 Thumbnail Size:** StyleSelector renders 80x80 thumbnails; REQUIREMENTS.md specifies 200x200. Change thumbSize from 80 to 200, update container dimensions and canvas inline style to match.

2. **UI-11 Mobile Panel Collapse:** ParameterPanel always renders all 15 bars regardless of viewport. Add mobile-specific collapsed behavior: default to collapsed on mobile (<md), expanded on desktop (>=md), with a separate expand/collapse toggle for the whole panel body.

Purpose: Satisfy UI-08 (200x200 thumbnail spec) and UI-11 (collapsed on mobile) which are the only 2 remaining gaps blocking Phase 4 goal achievement (currently 13/15).
Output: Fixed StyleSelector + ParameterPanel components, updated/new tests.

## Files Likely Touched

- `src/lib/render/types.ts`
- `src/lib/render/geometric/subdivide.ts`
- `src/lib/render/geometric/shapes.ts`
- `src/lib/render/geometric/scene.ts`
- `src/lib/render/geometric/draw.ts`
- `src/lib/render/geometric/index.ts`
- `src/__tests__/render/subdivide.test.ts`
- `src/__tests__/render/scene.test.ts`
- `src/__tests__/render/determinism.test.ts`
- `src/__tests__/render/performance.test.ts`
- `src/components/results/GeometricCanvas.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/components/results/ResultsView.tsx`
- `src/hooks/useTextAnalysis.ts`
- `src/__tests__/components/GeometricCanvas.test.tsx`
- `src/__tests__/components/StyleSelector.test.tsx`
- `src/lib/engine/version.ts`
- `src/__tests__/engine/version.test.ts`
- `src/components/results/ParameterPanel.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/components/results/ParameterPanel.tsx`
- `src/__tests__/components/StyleSelector.test.tsx`
- `src/__tests__/components/ParameterPanel.test.tsx`
