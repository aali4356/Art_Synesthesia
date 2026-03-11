---
id: S05
parent: M001
milestone: M001
provides:
  - OrganicSceneGraph type with curves, gradientStops, layers, octaves, dominantDirection
  - createFbm fBm noise function (octaves clamped [2,6] per ORGN-02)
  - computeOctaves mapping complexity [0,1] to octaves [2,6]
  - traceFlowCurve following fBm noise field step-by-step
  - computeDominantDirection mapping directionality [0,1] to angle [0,2PI]
  - buildOrganicSceneGraph pure builder function (ORGN-01 through ORGN-04)
  - Test scaffolds for organic-scene, organic-determinism, OrganicCanvas
  - [object Object]
  - [object Object]
  - src/lib/render/organic/index.ts barrel export
  - OrganicCanvas React component with HiDPI scaling and rAF progressive animation
  - Full test suites: organic-scene.test.ts (8 tests), organic-determinism.test.ts (3 tests), OrganicCanvas.test.tsx (7 tests)
  - Particle, ParticleConnection, ParticleCluster, ParticleSceneGraph types in src/lib/render/types.ts
  - buildClusters function (src/lib/render/particle/cluster.ts)
  - buildParticles and buildConnections functions (src/lib/render/particle/placement.ts)
  - buildParticleSceneGraph top-level builder (src/lib/render/particle/scene.ts)
  - Test scaffolds with .todo stubs for PTCL-01 through PTCL-04
  - TypographicWord and TypographicSceneGraph types in src/lib/render/types.ts
  - extractWeightedWords — semantic word scoring with stop words, length bonus, capitalization bonus
  - placeWords — AABB collision detection, rotation budget enforcement, injectable measureFn
  - buildTypographicSceneGraph — top-level scene builder wiring words + layout
  - Test scaffold stubs for typographic-scene, typographic-determinism, TypographicCanvas
requires: []
affects: []
key_files: []
key_decisions:
  - "Separate PRNG instances (seed+'-noise' vs seed+'-scene') prevent state corruption between noise and scene randomness"
  - "Octave range [2,6] maps to complexity [0,1] via computeOctaves: round(2 + complexity*4)"
  - "Layer cap at 5 with opacity scaling: opacityScale = min(MAX_LAYERS, rawLayers) / rawLayers"
  - "Flow spread = 1.0 - directionality*0.8 so high directionality = tight curves, low = chaotic"
  - "drawBackground applies solid fill first, then optional linear gradient wash (only when gradientStops.length >= 2)"
  - "drawFlowCurve uses quadratic bezier midpoint interpolation when i+2 < points.length, falls back to lineTo for last segment"
  - "Color interpolation: first half of segments uses startColor, second half uses endColor (simple midpoint split)"
  - "OrganicCanvas HiDPI: canvas.width = scene.width * dpr; ctx.scale(dpr, dpr) — same as GeometricCanvas"
  - "Test uses vi.spyOn(window, 'requestAnimationFrame') to assert animated=false never calls rAF"
  - "Empty curves (animated=true, curveCount=0): fills background + fires onRenderComplete without rAF"
  - "Separate PRNGs per subsystem: clusterPrng, placePrng, connectionPrng — prevents any ordering change from invalidating determinism"
  - "negativeSpaceRatio = 0.05 when density > 0.85, else 0.15 — satisfies PTCL-04 without blocking high-density usage"
  - "Cluster radii computed from area budget (maxCoveredArea / count) rather than fixed pixel values — scales correctly at any canvas size"
  - "buildClusters force-places remaining clusters after retry exhaustion to always return exactly clusterCount clusters"
  - "measureFn defaults to approximateMeasure (width = text.length * fontSize * 0.55) for SSR/test safety — avoids Canvas API dependency in pure scene builder"
  - "Web-safe fonts only: Georgia, serif for prominent words; system-ui, sans-serif for smaller words — avoids font loading race condition"
  - "Rotation clamped to [-15, 15] for prominent words (index < 3), not by isProminent flag — consistent with build order"
  - "Reduced-opacity words (collision fallback) get opacity 0.1..0.35 — always below 0.4 threshold (TYPO-04)"
  - "ParameterVector imported from '@/types/engine' (canonical) not '@/lib/pipeline/types'"
patterns_established:
  - "Organic renderer follows same scene-graph pattern as geometric: pure buildFn -> data-only graph -> draw.ts"
  - "PRNG suffix pattern: seed+'-noise' for noise, seed+'-scene' for layout random values"
  - "Composition law constants (MAX_LAYERS=5, TRACE_STEPS=200, STEP_SIZE=3) as module-level consts"
  - "All organic renderer modules follow: pure data builder (scene.ts) -> draw module (draw.ts) -> React component"
  - "draw.ts imports only from '../types'; never imports React or component-level concerns"
  - "Component tests use proxy canvas mock + vi.spyOn on window.requestAnimationFrame/cancelAnimationFrame"
  - "Area-budget cluster sizing: maxRadius = sqrt((canvasArea * (1-negativeSpaceRatio) / count) / PI)"
  - "Cosmic starfield hierarchy: 5% large stars with glowRadius, 95% small crisp stars"
  - "Orbit parameters (orbitRadius, orbitAngle, orbitSpeed) baked into Particle at build time for idle animation"
  - "Injectable measureFn pattern: production passes real OffscreenCanvas.measureText; tests pass approximateMeasure"
  - "Rotation budget: track rotatedCount/totalWords running counters, enforce before assigning rotation"
  - "Spiral search + fallback opacity: 40-step spiral search for non-overlapping positions; fallback to reduced opacity < 0.4 if exhausted"
observability_surfaces: []
drill_down_paths: []
duration: 8min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# S05: Additional Renderers

**# Phase 5 Plan 01: Organic Renderer Wave 0 + Data Layer Summary**

## What Happened

# Phase 5 Plan 01: Organic Renderer Wave 0 + Data Layer Summary

**simplex-noise fBm flow field data layer with OrganicSceneGraph type, tracing engine, and test scaffolds**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-04T13:22:00Z
- **Completed:** 2026-03-04T13:25:40Z
- **Tasks:** 4 + prerequisites
- **Files modified:** 9

## Accomplishments

- Installed simplex-noise@4.0.3 and created 3 test scaffold files (16 todos, all skip cleanly)
- Added OrganicSceneGraph, BaseSceneGraph, FlowCurve, GradientStop, CurvePoint types to types.ts
- Built fBm noise module (createFbm, computeOctaves) with ORGN-02 octave clamping
- Built flow field module (computeDominantDirection, computeFlowAngle, traceFlowCurve, computeCurveStartPoints) with ORGN-04 direction bias
- Built complete buildOrganicSceneGraph pure function enforcing ORGN-01 through ORGN-04

## Task Commits

Each task was committed atomically:

1. **Prerequisites: simplex-noise + test scaffolds** - `36e3aa4` (feat)
2. **T1: Organic types in types.ts** - `658b090` (feat)
3. **T2: noise.ts fBm utility** - `32b93b3` (feat)
4. **T3: flowfield.ts curve tracing** - `9d4dbfa` (feat)
5. **T4: scene.ts buildOrganicSceneGraph** - `1ae8a7d` (feat)

## Files Created/Modified

- `src/lib/render/types.ts` - Added BaseSceneGraph, CurvePoint, FlowCurve, GradientStop, OrganicSceneGraph
- `src/lib/render/organic/noise.ts` - createFbm (fBm wrapper), computeOctaves
- `src/lib/render/organic/flowfield.ts` - computeDominantDirection, computeFlowAngle, traceFlowCurve, computeCurveStartPoints
- `src/lib/render/organic/scene.ts` - buildOrganicSceneGraph (ORGN-01 through ORGN-04)
- `src/__tests__/render/organic-scene.test.ts` - 7 .todo stubs for ORGN requirements
- `src/__tests__/render/organic-determinism.test.ts` - 3 .todo stubs for determinism
- `src/__tests__/components/OrganicCanvas.test.tsx` - 6 .todo stubs for component
- `package.json` - Added simplex-noise@^4.0.3
- `package-lock.json` - Updated

## Decisions Made

- Separate PRNG instances (seed+'-noise' vs seed+'-scene') to prevent state corruption -- same pitfall warned about in the plan
- The types.ts file already had Particle/Typographic types added (from other plan executions); inserted organic types before them in the file
- Flow spread formula: `1.0 - directionality * 0.8` so high directionality = tight focused curves, low = chaotic scatter

## Deviations from Plan

None - plan executed exactly as written. The only discovery was that types.ts had already been extended with Particle and Typographic types, so organic types were inserted before those instead of at the end of the file. This is consistent with logical ordering (BaseSceneGraph → organic → particle → typographic).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Organic data layer complete; all 4 ORGN requirements scaffolded
- Ready for Plan 05-02: draw.ts and OrganicCanvas React component
- Test todos in organic-scene.test.ts will be filled in during Plan 05-02 as the drawing layer ships

---
*Phase: 05-additional-renderers*
*Completed: 2026-03-04*

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

# Plan 05-03: Particle Renderer Data Layer Summary

**Pure data-layer particle scene graph: four modules shipping Particle/ParticleSceneGraph types, cluster placement, particle distribution with cosmic hierarchy, and constellation connections — all deterministic via separate seeded PRNGs**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-04T13:20Z
- **Completed:** 2026-03-04T13:28Z
- **Tasks:** 4 (plus prerequisites)
- **Files modified:** 6

## Accomplishments

- Appended Particle, ParticleConnection, ParticleCluster, and ParticleSceneGraph types to src/lib/render/types.ts without touching existing geometric types
- Implemented buildClusters with area-budget math enforcing minimum 2 clusters and 15% negative space (PTCL-03, PTCL-04)
- Implemented buildParticles with cosmic starfield hierarchy (5% large stars with glow, 95% small crisp stars) and orbit parameters for idle animation
- Implemented buildConnections creating constellation-like lines between nearby large stars within same cluster
- Implemented buildParticleSceneGraph as pure deterministic top-level builder using ParameterVector from canonical @/types/engine path

## Task Commits

1. **Types + scaffolds** - `dfca6a2` (feat)
2. **cluster.ts** - `f7ce432` (feat)
3. **placement.ts** - `b9a0a94` (feat)
4. **scene.ts** - `cbf2288` (feat)

## Files Created/Modified

- `src/lib/render/types.ts` - Appended particle type interfaces (Particle, ParticleConnection, ParticleCluster, ParticleSceneGraph)
- `src/lib/render/particle/cluster.ts` - buildClusters with area-budget enforcement and separation retry loop
- `src/lib/render/particle/placement.ts` - buildParticles and buildConnections pure functions
- `src/lib/render/particle/scene.ts` - buildParticleSceneGraph top-level builder
- `src/__tests__/render/particle-scene.test.ts` - 7 .todo stubs for PTCL requirements
- `src/__tests__/render/particle-determinism.test.ts` - 3 .todo stubs for determinism

## Decisions Made

- Three separate PRNGs (clusterPrng, placePrng, connectionPrng) created from the same seed with distinct suffixes — guarantees determinism regardless of how many times each subsystem calls prng()
- negativeSpaceRatio relaxes to 0.05 only when density > 0.85 — satisfies PTCL-04 at normal density values without rejecting extreme high-density requests
- Cluster radii computed from area budget per-cluster rather than fixed pixel radius — scales correctly at any canvasSize value
- ParameterVector imported from '@/types/engine' (canonical path confirmed via grep before writing scene.ts)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 05-04 (particle draw module) can now import ParticleSceneGraph from src/lib/render/types.ts and buildParticleSceneGraph from src/lib/render/particle/scene.ts
- Test scaffolds have .todo stubs ready to be activated once drawParticleScene exists and canvas mock is set up
- The orbit parameters (orbitRadius, orbitAngle, orbitSpeed) in each Particle are ready for Plan 05-04's requestAnimationFrame idle animation

---
*Phase: 05-additional-renderers*
*Completed: 2026-03-04*

# Summary: Plan 05-04

## What Was Built

This plan completed the particle renderer by adding the Canvas API drawing layer, idle animation loop, React component, and all tests on top of the data layer from Plan 05-03.

## Tasks Completed

### T1 — `src/lib/render/particle/draw.ts`
- `drawParticleSceneComplete()`: static render of full scene (background, connections, particles)
- `drawParticleSceneAnimated()`: animated render at a given elapsed-seconds offset (orbital drift)
- `getGlowSprite()`: pre-renders radial gradient glow sprites to offscreen canvas, cached by `radius-color` key to avoid per-particle `createRadialGradient()` at 10,000-particle scale
- Particles sorted smallest-first so larger particles render on top

### T2 — `src/lib/render/particle/animate.ts` + `index.ts`
- `startIdleAnimation()`: launches rAF loop driving orbital drift, returns a cancel function for `useEffect` cleanup
- `index.ts` barrel re-exports `buildParticleSceneGraph`, `drawParticleSceneComplete`, `drawParticleSceneAnimated`, `startIdleAnimation`

### T3 — `src/components/results/ParticleCanvas.tsx`
- React component following the exact GeometricCanvas pattern
- HiDPI scaling via `window.devicePixelRatio`
- `prefers-reduced-motion` check guards animation start (PTCL-05)
- When `animated=true` and motion is allowed: starts idle loop, returns `stopAnimation()` in useEffect cleanup — no rAF leak on unmount
- When `animated=false` OR reduced-motion: draws once statically, no rAF

### T4 — Three test files
- `particle-scene.test.ts` (8 tests): covers PTCL-01 through PTCL-04 — structure, particle cap at 2k/10k, min 2 clusters, 15% negative space enforcement with density tolerance
- `particle-determinism.test.ts` (2 tests): same-seed identical output, different seeds produce different positions
- `ParticleCanvas.test.tsx` (7 tests): aria-label, HiDPI dimensions, no rAF when `animated=false`, no rAF when `prefers-reduced-motion` is set (PTCL-05), rAF called when animated+no-reduced-motion, cancel on unmount, `onRenderComplete` callback

## Verification

- TypeScript: `npx tsc --noEmit` — clean, no errors
- Particle tests: 17/17 pass
- Full suite: 319/319 pass, no regressions

## Deviations

None. The plan test stubs in `particle-scene.test.ts` and `particle-determinism.test.ts` were placeholder `it.todo` files from Plan 05-03 — replaced with actual implementations as designed.

## Must-Haves Checklist

- [x] buildParticleSceneGraph returns ParticleSceneGraph with particles, connections, clusters (PTCL-01)
- [x] Particle count capped at 2,000 (mobile) and 10,000 (desktop) (PTCL-02)
- [x] Scene always has >= 2 clusters (PTCL-03)
- [x] Cluster radii enforce 15% minimum negative space when density <= 0.85 (PTCL-04)
- [x] ParticleCanvas idle animation absent when prefers-reduced-motion is set (PTCL-05)
- [x] Identical seed + params always produces identical ParticleSceneGraph
- [x] ParticleCanvas HiDPI scaling + rAF cleanup on unmount
- [x] Full test suite passes with no regressions

# Plan 05-05: Typographic Renderer — Data Layer Summary

**Typographic scene graph data layer with semantic word scoring, AABB collision detection, and injectable measureFn for Canvas API isolation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T13:22:00Z
- **Completed:** 2026-03-04T13:30:00Z
- **Tasks:** 4 (+ prerequisites)
- **Files modified:** 7

## Accomplishments
- Created full typographic data layer: words.ts, layout.ts, scene.ts
- Appended TypographicWord and TypographicSceneGraph types to render/types.ts (after existing ParticleSceneGraph types from Plans 05-01/05-03)
- Created 3 test scaffold files with .todo stubs for TYPO-01 through TYPO-04 (all skip cleanly with exit 0)
- Zero TypeScript errors across full project after all changes

## Task Commits

Each task was committed atomically:

1. **Prerequisites: test scaffold stubs** - `8dbb2d0` (test)
2. **Task 1: TypographicWord + TypographicSceneGraph types** - `e7fbc46` (feat)
3. **Task 2: extractWeightedWords** - `13513b2` (feat)
4. **Task 3: placeWords layout engine** - `3345c90` (feat)
5. **Task 4: buildTypographicSceneGraph scene builder** - `0cb8683` (feat)

## Files Created/Modified
- `src/lib/render/types.ts` - Appended TypographicWord and TypographicSceneGraph interfaces
- `src/lib/render/typographic/words.ts` - Semantic word scoring: stop words, length, uniqueness, capitalization bonuses; normalized weights [0,1]
- `src/lib/render/typographic/layout.ts` - placeWords with AABB collision detection, spiral search, rotation budget (TYPO-02/03/04), injectable MeasureFn
- `src/lib/render/typographic/scene.ts` - buildTypographicSceneGraph wiring words + layout, dark/light backgrounds
- `src/__tests__/render/typographic-scene.test.ts` - 8 .todo stubs for TYPO-01 through TYPO-04
- `src/__tests__/render/typographic-determinism.test.ts` - 3 .todo stubs for determinism
- `src/__tests__/components/TypographicCanvas.test.tsx` - 6 .todo stubs for canvas component

## Decisions Made
- injectable measureFn defaults to approximateMeasure (character-width approximation) — keeps scene builder free of Canvas API, testable without jsdom mock
- Web-safe fonts only: Georgia, serif for prominent words; system-ui, sans-serif for background words — avoids RESEARCH.md Pitfall 6 (font loading race)
- Reduced-opacity fallback for words that fail spiral collision search: 0.1..0.35 (always < 0.4), satisfying TYPO-04 constraint
- ParticleSceneGraph types were already in types.ts from Plans 05-01/05-03 — appended typographic types after them without modification

## Deviations from Plan

None — plan executed exactly as written. The types.ts file had ParticleSceneGraph already present (added by 05-01/05-03 plans), which the plan correctly anticipated ("read current state and append only what is not already present").

## Issues Encountered
- None. TypeScript clean on first compile, test scaffold ran with exit 0 on first run.

## Next Phase Readiness
- Plan 05-06 can now implement the typographic canvas renderer (drawTypographicScene) and fill in the .todo test stubs
- All 4 TYPO requirements are structurally enforced in the data layer; Plan 05-06 will verify them with real test implementations
- Plan 05-07 can reference TypographicSceneGraph.style === 'typographic' for style selector disabling logic

---
*Phase: 05-additional-renderers*
*Completed: 2026-03-04*

# Summary: Plan 05-06

## What Was Built

- `src/lib/render/typographic/draw.ts` — Canvas API drawing layer for the typographic renderer. `drawTypographicSceneComplete` renders background words (non-prominent) before foreground words (prominent) for correct layering.
- `src/lib/render/typographic/index.ts` — Barrel re-export for the entire typographic module.
- `src/components/results/TypographicCanvas.tsx` — React component following the GeometricCanvas pattern: HiDPI scaling via `devicePixelRatio`, instant draw when `animated=false` or `prefers-reduced-motion`, 600ms progressive fade-in when `animated=true`, `cancelAnimationFrame` cleanup on unmount.
- `src/__tests__/render/typographic-scene.test.ts` — Real test implementations replacing stubs. Covers TYPO-01 (required word fields), TYPO-02 (prominent constraints), TYPO-03 (rotation cap), TYPO-04 (no-overlap, opacity threshold), background color for dark/light themes, short-text handling.
- `src/__tests__/render/typographic-determinism.test.ts` — Determinism tests: same inputs produce identical scenes, different seeds produce different scenes, different texts produce different words.
- `src/__tests__/components/TypographicCanvas.test.tsx` — Component tests: aria-label, HiDPI dimensions, rAF not called when not animated, rAF not called on prefers-reduced-motion, rAF called when animated, cancelAnimationFrame on unmount, onRenderComplete fires.

## Deviation: Layout Rotation Budget Bug Fix

**File:** `src/lib/render/typographic/layout.ts`

**Issue:** The rotation budget comparison used floating-point arithmetic (`targetCount * 0.3`). When `targetCount = 14`, budget = `4.2`. As words were placed, `rotationBudgetLeft = 4.2 - 4 = 0.2 > 0` still allowed a 5th word to be rotated before clamping. This produced 5/14 = 35.7% rotated words, violating TYPO-03's 30% cap.

**Fix:** Changed to `Math.floor(targetCount * 0.3)` so the integer cap is strictly enforced. This is a hard requirement (TYPO-03 is a must-have), so the fix was made inline per the execution protocol.

## Must-Haves Checklist

- [x] buildTypographicSceneGraph returns TypographicSceneGraph with words array; each word has all required fields (TYPO-01)
- [x] Top 3 isProminent words have rotation in [-15, 15] and fontSize >= 16 (TYPO-02)
- [x] At most 30% of all words have |rotation| > 10 degrees (TYPO-03)
- [x] No two full-opacity words have overlapping bounding boxes; reduced-opacity words have opacity < 0.4 (TYPO-04)
- [x] Only web-safe fonts used (Georgia, serif and system-ui, sans-serif)
- [x] approximateMeasure injected in tests; works without canvas context
- [x] Same seed + params + text produces identical TypographicSceneGraph
- [x] TypographicCanvas uses HiDPI scaling + cleanup
- [x] Full test suite passes with no regressions (319 tests passing)

## Commits

1. `feat(05-06-T1): add typographic draw module and barrel index`
2. `feat(05-06-T2): add TypographicCanvas component with HiDPI and fade-in animation`
3. `feat(05-06-T3): fill typographic scene and determinism tests; fix rotation budget`
4. `feat(05-06-T4): fill TypographicCanvas component tests`

# Plan 05-07 Summary

## What Was Done

Wired together all four renderers (geometric, organic, particle, typographic) into the application through StyleSelector and ResultsView.

### Task 05-07-T1: Version Bump
- Bumped `rendererVersion` from `'0.2.0'` to `'0.3.0'` in `src/lib/engine/version.ts`

### Task 05-07-T2: Union Types
- Added `style: 'geometric'` discriminant field to `SceneGraph` interface in `src/lib/render/types.ts`
- Updated `buildSceneGraph` in `src/lib/render/geometric/scene.ts` to set `style: 'geometric'` on returned object
- Added `AnySceneGraph` union type and `StyleName` type alias to `src/lib/render/types.ts`
- Updated `src/__tests__/components/GeometricCanvas.test.tsx` mock to include `style: 'geometric'`

### Task 05-07-T3: StyleSelector Upgrade
- Replaced old single-scene + locked-style props with new `scenes: Record<StyleName, AnySceneGraph | null>` API
- `StyleThumbnail` now dispatches on `scene.style` to call the correct draw function
- Typographic style shows `data-disabled="true"` and `title="Text or URL input required"` when `inputType="data"`
- Mobile horizontal scroll via `overflow-x: auto` on the container
- `onStyleChange` callback added

### Task 05-07-T4: ResultsView + Tests
- `ResultsView` now builds all 4 scene graphs on each result/theme change using `Promise.all` for seed derivation
- `activeStyle: StyleName` state drives which canvas component renders
- `handleStyleChange` calls `setActiveStyle(style)`, `setShouldAnimate(true)`, and increments `animationKey` to force re-mount and trigger full progressive animation
- `maxParticles` derived from `window.innerWidth` at build time (2000 for <768px, 10000 otherwise)
- Typographic scene set to `null` when `inputType === 'data'`
- `StyleSelector.test.tsx` fully rewritten for new `scenes`-record interface with 16 tests
- `version.test.ts` updated to reflect 0.3.0 bump

## Deviations

1. **SceneGraph style discriminant**: The plan's `StyleThumbnail` switched on `scene.style`, but the original `SceneGraph` (geometric) had no `style` field. Added `style: 'geometric'` to `SceneGraph` and updated `buildSceneGraph` to include it. This made the discriminated union work cleanly without wrapper types. Updated one GeometricCanvas test mock and one version test.

2. **version.test.ts update**: The version test had a hardcoded `'0.2.0'` assertion. Updated to `'0.3.0'` to match the bump.

## Verification Results

- rendererVersion: '0.3.0' confirmed
- TypeScript: 0 errors
- StyleSelector tests: 16/16 passing
- Full test suite: 327/327 passing (up from 319)
- Lint: no new errors (pre-existing culori useMode warnings unchanged)

## Commits

1. `feat(version): bump rendererVersion to 0.3.0 for multi-style integration`
2. `feat(render): add AnySceneGraph and StyleName union types, add style discriminant to SceneGraph`
3. `feat(StyleSelector): upgrade to multi-style live thumbnails with onClick and typographic disable`
4. `feat(ResultsView): build all 4 scene graphs, add multi-style switching with animation`
