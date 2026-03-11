# T01: 04-geometric-renderer-canvas-ui 01

**Slice:** S04 — **Milestone:** M001

## Description

Build the pure-function geometric composition engine that transforms a ParameterVector + PaletteResult into a deterministic SceneGraph of drawing instructions, with all composition laws enforced.

Purpose: This is the computational core of the first rendering style. Every visual output flows through this engine. Pure functions (no Canvas API side effects) enable exhaustive TDD testing of composition laws.

Output: Render type definitions, recursive subdivision, shape assignment, scene graph builder, Canvas 2D draw functions, and comprehensive tests verifying all 5 GEOM requirements plus determinism.

## Must-Haves

- [ ] "Recursive subdivision produces rectangular cells from an 800x800 region, with depth controlled by complexity parameter"
- [ ] "No cell in any scene has a dimension smaller than 4px, even at maximum complexity and density"
- [ ] "All scene elements have at least 2% padding from the canvas edge on every side"
- [ ] "At most 2 distinct stroke widths appear in any single scene graph"
- [ ] "Scene graph generation + full draw completes in under 1 second at 800x800"
- [ ] "Same input + same parameters + same seed always produces identical scene graphs"

## Files

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
