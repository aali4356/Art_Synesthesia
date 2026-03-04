---
phase: 05-additional-renderers
plan: 02
subsystem: render
tags: [organic, canvas, draw, react-component, animation, hidpi]

# Dependency graph
requires:
  - phase: 05-01
    provides: noise.ts, flowfield.ts, scene.ts, OrganicSceneGraph type, test scaffolds
provides:
  - drawOrganicSceneComplete: draws full scene to canvas in one pass
  - drawOrganicScenePartial: draws partial scene for progressive animation
  - src/lib/render/organic/index.ts barrel export
  - OrganicCanvas React component with HiDPI scaling and rAF progressive animation
  - Full test suites: organic-scene.test.ts (8 tests), organic-determinism.test.ts (3 tests), OrganicCanvas.test.tsx (7 tests)
affects:
  - Phase 6: OrganicCanvas ready for use in ResultsView style dispatch

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Proxy-based canvas mock (same as GeometricCanvas tests) for lightweight draw testing
    - Progressive animation: rAF loop with staggerDelay = totalDuration / curveCount (900ms / curveCount)
    - Fade-in alpha per curve: min(1, curveElapsed / fadeInDuration) where fadeInDuration = 80ms
    - aborted flag + cancelAnimationFrame for cleanup on unmount (same abort pattern as GeometricCanvas)
    - Empty curves path: skip rAF entirely, fill background, fire onRenderComplete immediately

key-files:
  created:
    - src/lib/render/organic/draw.ts
    - src/lib/render/organic/index.ts
    - src/components/results/OrganicCanvas.tsx
  modified:
    - src/__tests__/render/organic-scene.test.ts
    - src/__tests__/render/organic-determinism.test.ts
    - src/__tests__/components/OrganicCanvas.test.tsx

key-decisions:
  - "drawBackground applies solid fill first, then optional linear gradient wash (only when gradientStops.length >= 2)"
  - "drawFlowCurve uses quadratic bezier midpoint interpolation when i+2 < points.length, falls back to lineTo for last segment"
  - "Color interpolation: first half of segments uses startColor, second half uses endColor (simple midpoint split)"
  - "OrganicCanvas HiDPI: canvas.width = scene.width * dpr; ctx.scale(dpr, dpr) — same as GeometricCanvas"
  - "Test uses vi.spyOn(window, 'requestAnimationFrame') to assert animated=false never calls rAF"
  - "Empty curves (animated=true, curveCount=0): fills background + fires onRenderComplete without rAF"

patterns-established:
  - "All organic renderer modules follow: pure data builder (scene.ts) -> draw module (draw.ts) -> React component"
  - "draw.ts imports only from '../types'; never imports React or component-level concerns"
  - "Component tests use proxy canvas mock + vi.spyOn on window.requestAnimationFrame/cancelAnimationFrame"

requirements-completed:
  - ORGN-01
  - ORGN-02
  - ORGN-03
  - ORGN-04

# Metrics
duration: ~8min
completed: 2026-03-04
---

# Phase 5 Plan 02: Organic Renderer — Drawing + Component + Tests

**Canvas API drawing layer, React component with HiDPI + rAF animation, and full test suites**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-04T13:28:00Z
- **Completed:** 2026-03-04T13:36:00Z
- **Tasks:** 4
- **Files created:** 3 / modified: 3

## Accomplishments

- Created `draw.ts` with `drawOrganicSceneComplete` and `drawOrganicScenePartial` — both pass type check cleanly
- Created barrel `index.ts` re-exporting all organic renderer symbols including types
- Created `OrganicCanvas.tsx` React component with HiDPI canvas scaling, progressive rAF animation, and cleanup on unmount
- Replaced 16 test `.todo` stubs across 3 test files with 18 real passing tests
- Full test suite: 305 tests pass, no regressions

## Task Commits

1. **T1: draw.ts** — `749f1f7` feat(05-02): add organic canvas drawing module with complete and partial draw functions
2. **T2: index.ts + OrganicCanvas.tsx** — `a1c15ca` feat(05-02): add organic barrel index and OrganicCanvas component with HiDPI and rAF animation
3. **T3: organic-scene + organic-determinism tests** — `d6bf53e` test(05-02): implement organic-scene and organic-determinism test suites (ORGN-01 through ORGN-04)
4. **T4: OrganicCanvas.test.tsx** — `9aeefcb` test(05-02): implement OrganicCanvas component tests with proxy canvas mock and rAF assertions

## Files Created/Modified

- `src/lib/render/organic/draw.ts` — `drawOrganicSceneComplete`, `drawOrganicScenePartial`, private `drawBackground`, `drawFlowCurve`
- `src/lib/render/organic/index.ts` — barrel re-exports all organic symbols
- `src/components/results/OrganicCanvas.tsx` — HiDPI canvas component, animated + non-animated paths, cleanup hook
- `src/__tests__/render/organic-scene.test.ts` — 8 tests covering ORGN-01 through ORGN-04 plus gradient and theme checks
- `src/__tests__/render/organic-determinism.test.ts` — 3 tests: identical inputs, different seeds, 3-run stability
- `src/__tests__/components/OrganicCanvas.test.tsx` — 7 tests: aria-label, HiDPI, rAF assertions, cleanup, onRenderComplete

## Decisions Made

- Color blending uses a simple midpoint split (first-half segments = startColor, second-half = endColor) rather than per-segment lerp — avoids float-to-hex conversion overhead in the drawing loop
- Empty curves path in animated mode: bypasses rAF entirely, fills background only, fires `onRenderComplete` — prevents hanging animations when the scene has no curves
- Test fixture uses two scenes: `minimalScene` (no curves) and `sceneWithCurves` (2 curves, 3 points each) to exercise both animation paths

## Deviations from Plan

None — plan executed exactly as specified.

## Issues Encountered

None.

## Next Phase Readiness

- Organic renderer fully complete: data layer (05-01) + draw layer (05-02)
- ORGN-01 through ORGN-04 all validated by passing tests
- OrganicCanvas ready for integration into ResultsView style dispatch (when Phase 6 wires up additional renderers)
- Plans 05-04 (particle draw) and 05-06 (typographic draw) follow the same pattern established here

---
*Phase: 05-additional-renderers*
*Completed: 2026-03-04*
