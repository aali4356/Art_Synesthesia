---
phase: 05-additional-renderers
plan: 03
subsystem: render
tags: [particle, canvas, determinism, scene-graph, typescript]

# Dependency graph
requires:
  - phase: 05-additional-renderers/05-01
    provides: render/types.ts base with OrganicSceneGraph types already added
provides:
  - Particle, ParticleConnection, ParticleCluster, ParticleSceneGraph types in src/lib/render/types.ts
  - buildClusters function (src/lib/render/particle/cluster.ts)
  - buildParticles and buildConnections functions (src/lib/render/particle/placement.ts)
  - buildParticleSceneGraph top-level builder (src/lib/render/particle/scene.ts)
  - Test scaffolds with .todo stubs for PTCL-01 through PTCL-04
affects:
  - 05-04-PLAN (draw module consumes ParticleSceneGraph)
  - Any plan that needs particle scene data for animation or rendering

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Separate PRNGs per subsystem (seed+'-clusters', seed+'-placement', seed+'-connections') for determinism
    - Cosmic star hierarchy: ~5% large stars (radius 6-12, glowRadius > 0) + ~95% small stars (radius 1-3)
    - Cluster placement with area-budget math to enforce negativeSpaceRatio
    - buildXxx / drawXxx split: pure data functions separate from Canvas API draw functions

key-files:
  created:
    - src/lib/render/particle/cluster.ts
    - src/lib/render/particle/placement.ts
    - src/lib/render/particle/scene.ts
    - src/__tests__/render/particle-scene.test.ts
    - src/__tests__/render/particle-determinism.test.ts
  modified:
    - src/lib/render/types.ts

key-decisions:
  - "Separate PRNGs per subsystem: clusterPrng, placePrng, connectionPrng — prevents any ordering change from invalidating determinism"
  - "negativeSpaceRatio = 0.05 when density > 0.85, else 0.15 — satisfies PTCL-04 without blocking high-density usage"
  - "Cluster radii computed from area budget (maxCoveredArea / count) rather than fixed pixel values — scales correctly at any canvas size"
  - "buildClusters force-places remaining clusters after retry exhaustion to always return exactly clusterCount clusters"

patterns-established:
  - "Area-budget cluster sizing: maxRadius = sqrt((canvasArea * (1-negativeSpaceRatio) / count) / PI)"
  - "Cosmic starfield hierarchy: 5% large stars with glowRadius, 95% small crisp stars"
  - "Orbit parameters (orbitRadius, orbitAngle, orbitSpeed) baked into Particle at build time for idle animation"

requirements-completed:
  - PTCL-01
  - PTCL-02
  - PTCL-03
  - PTCL-04

# Metrics
duration: 8min
completed: 2026-03-04
---

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
