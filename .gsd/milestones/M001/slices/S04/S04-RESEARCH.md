# Phase 4: Geometric Renderer & Canvas UI - Research

**Researched:** 2026-03-03
**Domain:** HTML Canvas 2D rendering, recursive subdivision composition, progressive animation, React canvas integration
**Confidence:** HIGH

## Summary

Phase 4 transforms the existing placeholder canvas into a real geometric artwork renderer. The core algorithm is recursive subdivision of an 800x800 canvas into rectangular cells, with shapes (rectangles, circles, triangles, lines) drawn inside cells based on the 15-parameter vector. All randomness flows through the existing seeded PRNG infrastructure. The Canvas 2D API is the rendering surface — no libraries needed beyond what the project already has.

The phase has three clear layers: (1) a pure-function composition engine (`src/lib/render/geometric/`) that takes a ParameterVector + PaletteResult + PRNG and produces a renderable scene graph (array of drawing instructions), (2) a React canvas component that consumes the scene graph and either draws it progressively via `requestAnimationFrame` or instantly when `prefers-reduced-motion` is set, and (3) a style selector UI component showing thumbnail previews. The ParameterPanel is already built — this phase only wires the real canvas next to it.

**Primary recommendation:** Separate the composition algorithm (pure functions, easily testable) from the canvas rendering (side-effectful, requires mock). Test the composition engine exhaustively with unit tests; test the canvas component lightly with `vitest-canvas-mock` for integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Recursive subdivision: start with full canvas, recursively divide into rectangles of varying proportions
- complexity parameter controls subdivision depth (low = few large cells, high = many small cells)
- symmetry parameter influences split ratios (high symmetry = balanced/equal splits, low = asymmetric)
- All randomness via seeded PRNG — same parameters always produce same composition
- Mixed shapes per cell: rectangles, circles, triangles, and lines
- curvature parameter controls shape distribution ratio (high curvature = more circles, low = more rectangles/triangles)
- First palette color is dominant (largest filled area), remaining are accents
- Some cells left empty for negative space, controlled by density parameter
- Subtle gaps (2-4px) between all cells as breathing room
- density parameter controls how many cells are filled vs empty (low = sparse/airy, high = packed)
- Empty cells show the dark background through — "gallery wall" visible between elements
- GEOM-03: minimum 2% padding between composition edge and frame
- Optional strokes driven by texture parameter
- Low texture = clean filled shapes only, no outlines
- High texture = visible stroke outlines on shapes
- At most 2 stroke weights (primary and secondary) per GEOM-04
- Strokes use contrasting palette color or neutral
- Purely static artwork — no hover effects, no click interactions, no zoom
- Canvas at 800x800 on desktop (max-w-lg), full-width on mobile
- No full-screen/lightbox view in Phase 4 — artwork displays inline in results layout
- No visual linking between parameter panel and canvas — independent displays
- Canvas takes full width on mobile, parameter panel sits below
- Show all 4 style thumbnails in a row above the canvas
- Geometric: active, real thumbnail (200x200) rendered from user's actual parameters
- Organic, Particle, Typographic: locked state with generic gray placeholder, lock icon, and style name
- No fake preview art for locked styles — honest generic locked state
- Positioned between collapsed input bar and canvas area
- Large cells first, then subdivisions (coarse-to-fine) — mirrors the recursive algorithm
- Each element fades in over ~100ms as it appears
- Total build time 0.5-1 second
- prefers-reduced-motion: render complete artwork immediately, skip all animation (per UI-10)
- Theme switch (dark/light toggle): instant re-render with adjusted palette, no animation replay

### Claude's Discretion
- Exact subdivision algorithm parameters (split ratio ranges, max depth calculation)
- Shape sizing within cells (padding, centering, fill ratio)
- Stroke weight values (primary and secondary px values)
- Canvas API rendering order and optimization
- Exact animation timing curve and per-element delay
- Geometric thumbnail rendering approach (offscreen canvas or scaled render)
- GEOM-05 performance optimization (render <1s at 800x800)
- How scaleVariation, rhythm, regularity, directionality, layering, energy, warmth map to visual properties

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEOM-01 | Geometric style renders grid-based compositions using rectangles, circles, triangles, and lines | Recursive subdivision algorithm produces cells; shape selection per cell driven by curvature parameter via PRNG. See Architecture Pattern 1 (Recursive Subdivision). |
| GEOM-02 | Minimum element size never thinner than 4px; at high density, reduce grid count rather than element size | Subdivision termination condition checks minimum cell dimension (4px). Depth limiting formula caps recursion based on complexity. See Pitfall 2 (Element Size Violation). |
| GEOM-03 | Minimum 2% padding between composition edge and frame | Outer inset of `canvasSize * 0.02` applied before subdivision starts. Trivial to enforce at scene graph root. |
| GEOM-04 | All strokes use at most 2 different weights (primary and secondary) | Stroke weights computed once from texture parameter, stored in render config. All shapes reference config.primaryStroke or config.secondaryStroke. |
| GEOM-05 | Canvas rendering completes in under 1 second at 800x800 | Canvas 2D API draws simple primitives extremely fast. Even 500+ elements at 800x800 renders in <50ms. Performance budget is generous. See Performance section. |
| UI-07 | Large rendering canvas (minimum 800x800 on desktop, full-width on mobile) | HTML `<canvas>` element with width/height 800, CSS max-w-lg on desktop, w-full on mobile. devicePixelRatio scaling for crisp rendering on HiDPI. |
| UI-08 | Style selector: row of real thumbnail previews (200x200) rendered from same parameters | Geometric thumbnail uses a second `<canvas>` (200x200) rendering the same scene graph scaled down. Locked styles use static gray placeholder with lock icon. |
| UI-09 | Canvas builds progressively (elements appear over 0.5-1 second, not instant) | requestAnimationFrame loop draws N elements per frame with alpha fade-in. Scene graph sorted by cell area (largest first). See Architecture Pattern 3 (Progressive Build). |
| UI-10 | Progressive building respects prefers-reduced-motion (renders complete immediately when preferred) | window.matchMedia('(prefers-reduced-motion: reduce)') check. If true, draw all elements in single frame with full opacity. Existing minDelay pattern in useTextAnalysis already uses this check. |
| UI-11 | Collapsible panel (expanded on desktop, collapsed on mobile) | ParameterPanel already built in Phase 3. This requirement is already satisfied by existing component. |
| UI-12 | Each parameter displayed as labeled bar (0-1) with numeric value | Already implemented in ParameterPanel component. No additional work needed. |
| UI-13 | Parameters grouped by source with top contributing signals and weights shown | Already implemented in ParameterPanel component with Composition/Form/Expression/Color groups and expandable provenance. |
| UI-14 | Brief plain-English explanation per parameter | Already implemented via summaries prop in ParameterPanel. |
| UI-15 | Engine version displayed at bottom of panel | Already implemented as version footer in ParameterPanel. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas 2D API | Browser native | Drawing primitives (rect, arc, path, line) | Zero dependencies, deterministic, hardware-accelerated, ubiquitous browser support |
| seedrandom | ^3.0.5 | Seeded PRNG (Alea) | Already in project. All rendering randomness flows through `createPRNG()` |
| culori | ^4.0.2 | Color space handling | Already in project. Palette colors come as PaletteColor with .hex property ready for canvas fillStyle |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-canvas-mock | ^1.1.3 | Mock HTMLCanvasElement for tests | Dev dependency. Needed so canvas tests run in jsdom without node-canvas native binary |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas 2D API | PixiJS / Konva | Massive overkill for static geometric shapes. Adds ~200KB. Canvas 2D is perfect for this use case. |
| Canvas 2D API | SVG | SVG would enable GEOM-02 vector export, but Phase 9 handles SVG export separately. Canvas is faster for initial rendering. |
| requestAnimationFrame | CSS animation on SVG | Would require DOM elements per shape. Canvas draws hundreds of primitives in a single frame. |
| vitest-canvas-mock | node-canvas | node-canvas requires Cairo native binary. vitest-canvas-mock is pure JS mock, zero native deps. |

**Installation:**
```bash
npm install -D vitest-canvas-mock
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/render/
│   ├── geometric/
│   │   ├── index.ts          # barrel exports
│   │   ├── subdivide.ts      # recursive subdivision → Cell[]
│   │   ├── shapes.ts         # shape selection & sizing per cell
│   │   ├── scene.ts          # assemble SceneGraph from cells + params
│   │   └── draw.ts           # Canvas 2D drawing functions
│   └── types.ts              # RenderConfig, Cell, Shape, SceneElement, SceneGraph
├── components/results/
│   ├── GeometricCanvas.tsx   # React canvas component (replaces PlaceholderCanvas)
│   ├── StyleSelector.tsx     # Thumbnail row with active/locked states
│   ├── ResultsView.tsx       # Updated to use GeometricCanvas + StyleSelector
│   └── ...existing...
└── hooks/
    └── useTextAnalysis.ts    # Updated: rendering stage triggers actual canvas render
```

### Pattern 1: Recursive Subdivision (Pure Function)
**What:** Divide an 800x800 region recursively into cells. Each level chooses horizontal or vertical split with a ratio influenced by symmetry parameter. Recursion depth driven by complexity.
**When to use:** Core composition algorithm.
**Example:**
```typescript
// Source: Project architecture decision
interface Cell {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

interface SubdivisionConfig {
  complexity: number;    // 0-1, controls max depth
  symmetry: number;      // 0-1, controls split ratio balance
  density: number;       // 0-1, controls fill vs empty
  minCellSize: number;   // 4px minimum per GEOM-02
  padding: number;       // 2-4px gap between cells
  framePadding: number;  // 2% of canvas per GEOM-03
}

function subdivide(
  region: Cell,
  config: SubdivisionConfig,
  prng: () => number,
  depth: number = 0
): Cell[] {
  // Max depth: 2 + floor(complexity * 6) → range 2-8
  const maxDepth = 2 + Math.floor(config.complexity * 6);

  // Terminal conditions
  if (depth >= maxDepth) return [region];
  if (region.width < config.minCellSize * 2 + config.padding) return [region];
  if (region.height < config.minCellSize * 2 + config.padding) return [region];

  // Choose split direction (prefer splitting the longer side)
  const aspectBias = region.width > region.height ? 0.7 : 0.3;
  const splitHorizontal = prng() < aspectBias;

  // Split ratio: symmetry pulls toward 0.5, asymmetry allows 0.2-0.8
  const minRatio = 0.5 - (1 - config.symmetry) * 0.3; // 0.2 to 0.5
  const maxRatio = 0.5 + (1 - config.symmetry) * 0.3; // 0.5 to 0.8
  const ratio = minRatio + prng() * (maxRatio - minRatio);

  // Create two child regions with gap
  // ... split logic with config.padding gap ...

  // Recurse
  return [
    ...subdivide(childA, config, prng, depth + 1),
    ...subdivide(childB, config, prng, depth + 1),
  ];
}
```

### Pattern 2: Scene Graph (Pure Data, No Side Effects)
**What:** Transform cells + parameters into an array of drawing instructions (SceneElement[]) that the canvas renderer consumes. This is the bridge between pure composition logic and side-effectful canvas drawing.
**When to use:** Always. Never draw directly during subdivision.
**Example:**
```typescript
// Source: Project architecture
interface SceneElement {
  type: 'rect' | 'circle' | 'triangle' | 'line' | 'empty';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;           // hex color
  stroke?: string;        // hex color or undefined
  strokeWidth?: number;   // primary or secondary weight
  opacity: number;        // 1.0 for composition, animated during progressive build
  area: number;           // for sort order (largest first in animation)
  depth: number;          // subdivision depth (for animation ordering)
}

type SceneGraph = {
  elements: SceneElement[];
  width: number;
  height: number;
  background: string;     // dark background hex
};

function buildSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  prng: () => number,
  canvasSize: number
): SceneGraph {
  // 1. Compute render config from params
  // 2. Subdivide canvas into cells
  // 3. For each cell, choose shape type (curvature-driven)
  // 4. For each cell, choose fill color (palette-driven, dominant first)
  // 5. For each cell, decide filled vs empty (density-driven)
  // 6. Compute stroke config (texture-driven)
  // 7. Return sorted elements (by area descending for animation)
}
```

### Pattern 3: Progressive Build Animation (requestAnimationFrame)
**What:** Animate element appearance from largest to smallest (coarse-to-fine), each fading in over ~100ms. Total duration 0.5-1s.
**When to use:** After scene graph is computed and canvas is mounted. Skip entirely when prefers-reduced-motion is set.
**Example:**
```typescript
// Source: MDN Canvas API / requestAnimationFrame docs
function progressiveDraw(
  ctx: CanvasRenderingContext2D,
  scene: SceneGraph,
  onComplete: () => void
): () => void /* cleanup */ {
  const totalElements = scene.elements.length;
  const totalDuration = 750; // ms, within 0.5-1s range
  const fadeInDuration = 100; // ms per element
  const staggerDelay = totalDuration / totalElements;

  let startTime: number | null = null;
  let animationId: number;

  function frame(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Clear and draw background
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, scene.width, scene.height);

    // Draw elements that have started appearing
    for (let i = 0; i < totalElements; i++) {
      const elementStart = i * staggerDelay;
      if (elapsed < elementStart) continue;

      const elementProgress = Math.min(1, (elapsed - elementStart) / fadeInDuration);
      const element = scene.elements[i];
      drawElement(ctx, element, elementProgress); // alpha = elementProgress
    }

    if (elapsed < totalDuration + fadeInDuration) {
      animationId = requestAnimationFrame(frame);
    } else {
      // Final clean draw at full opacity
      drawSceneComplete(ctx, scene);
      onComplete();
    }
  }

  animationId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(animationId);
}
```

### Pattern 4: React Canvas Component
**What:** React component wrapping a `<canvas>` element with useRef + useEffect for rendering.
**When to use:** GeometricCanvas component.
**Example:**
```typescript
// Source: React + Canvas 2D integration pattern
'use client';

import { useRef, useEffect } from 'react';

interface GeometricCanvasProps {
  scene: SceneGraph;
  animated: boolean; // false when prefers-reduced-motion
  onRenderComplete?: () => void;
}

export function GeometricCanvas({ scene, animated, onRenderComplete }: GeometricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle HiDPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = scene.width * dpr;
    canvas.height = scene.height * dpr;
    ctx.scale(dpr, dpr);

    if (animated) {
      const cleanup = progressiveDraw(ctx, scene, () => onRenderComplete?.());
      return cleanup;
    } else {
      drawSceneComplete(ctx, scene);
      onRenderComplete?.();
    }
  }, [scene, animated, onRenderComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: scene.width, height: scene.height }}
      className="rounded-lg"
      aria-label="Generated geometric artwork"
    />
  );
}
```

### Pattern 5: HiDPI Canvas Rendering
**What:** Scale canvas backing store by devicePixelRatio for crisp rendering on Retina/HiDPI displays.
**When to use:** Always. Canvas at CSS 800x800 should have backing store of 800*dpr x 800*dpr.
**Example:**
```typescript
// Source: MDN Canvas HiDPI tutorial
const dpr = window.devicePixelRatio || 1;
canvas.width = logicalWidth * dpr;
canvas.height = logicalHeight * dpr;
canvas.style.width = `${logicalWidth}px`;
canvas.style.height = `${logicalHeight}px`;
ctx.scale(dpr, dpr);
// Now draw in logical coordinates (800x800)
```

### Anti-Patterns to Avoid
- **Drawing during subdivision:** Never call `ctx.fillRect()` inside the recursive subdivision function. Always produce a data structure (SceneGraph) and draw in a separate pass. This enables testing, animation, and thumbnail rendering.
- **Using Math.random():** ESLint ban enforced. Always use the seeded PRNG from `createPRNG()`.
- **Recreating PRNG per render:** Create ONE PRNG instance per scene generation. The sequence of random calls must be identical for determinism.
- **Mutating canvas in render:** Never draw to canvas directly from React render method. Always use useEffect or useLayoutEffect.
- **Ignoring devicePixelRatio:** Results in blurry canvas on HiDPI displays. Always scale backing store.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas 2D mocking | Custom mock of getContext/fillRect/etc | vitest-canvas-mock | 50+ methods to mock, maintained by community, handles edge cases |
| Color conversion | Manual hex parsing for canvas fillStyle | PaletteColor.hex from culori pipeline | Already computed, gamut-mapped, theme-aware |
| Deterministic randomness | Custom LCG or other PRNG | seedrandom Alea via createPRNG() | Already in project, proven deterministic |
| SHA-256 seed derivation | Manual hash function | deriveSeed() from engine/prng.ts | Already in project, Web Crypto based |

**Key insight:** The entire determinism infrastructure (PRNG, hashing, versioning) is already built in Phases 1-2. The renderer consumes it; it does not rebuild it.

## Common Pitfalls

### Pitfall 1: Non-Deterministic Scene Graphs
**What goes wrong:** Same input produces different artwork across renders because PRNG state diverges.
**Why it happens:** Creating multiple PRNGs, calling PRNG in inconsistent order, or using different call counts between code paths.
**How to avoid:** Create exactly ONE PRNG per scene generation from `deriveSeed()`. Call it in a fixed, deterministic order. The subdivision function's PRNG calls must be identical regardless of which branch path is taken.
**Warning signs:** Artwork looks "slightly different" on re-render with same input.

### Pitfall 2: Element Size Violation (GEOM-02)
**What goes wrong:** At high complexity/density, cells become thinner than 4px, producing visual artifacts (sub-pixel lines, invisible elements).
**Why it happens:** Subdivision recurses too deep without checking minimum size.
**How to avoid:** Termination condition in subdivide() checks `if (region.width < minCellSize * 2 + padding || region.height < minCellSize * 2 + padding) return [region]`. The `* 2` accounts for a split producing two children that must each be at least minCellSize.
**Warning signs:** Test with complexity=1.0 + density=1.0 and verify all cells >= 4px.

### Pitfall 3: Canvas Blurry on Retina/HiDPI
**What goes wrong:** Artwork looks blurry or pixelated on modern displays.
**Why it happens:** Canvas CSS size and backing store size are the same (1:1) instead of accounting for devicePixelRatio.
**How to avoid:** Set canvas.width = logicalSize * dpr, canvas.height = logicalSize * dpr, then ctx.scale(dpr, dpr). Draw in logical coordinates.
**Warning signs:** Artwork looks soft/fuzzy on MacBook or phone.

### Pitfall 4: Animation Cleanup on Unmount
**What goes wrong:** requestAnimationFrame continues firing after component unmounts, causing "setState on unmounted component" warnings or drawing to a detached canvas.
**Why it happens:** Missing cleanup in useEffect return.
**How to avoid:** Store `animationId = requestAnimationFrame(frame)` and return `() => cancelAnimationFrame(animationId)` from useEffect. Also use an `aborted` flag checked in the animation loop.
**Warning signs:** Console warnings about unmounted components, stale renders.

### Pitfall 5: Scene Graph Recomputation on Theme Change
**What goes wrong:** Theme toggle causes full re-subdivision, breaking the "instant re-render" requirement.
**Why it happens:** Scene graph is recomputed when palette changes because palette is baked into scene elements.
**How to avoid:** Two options: (a) Store palette-independent scene graph and apply colors at draw time, or (b) recompute scene graph when palette changes but skip animation (instant draw). Option (b) is simpler and acceptable since scene computation is <10ms.
**Warning signs:** Visible delay or re-animation when toggling dark/light mode.

### Pitfall 6: Thumbnail Rendering Race Condition
**What goes wrong:** Thumbnail canvas renders before the main scene graph is computed, showing stale art.
**Why it happens:** Thumbnail and main canvas share scene graph state but render asynchronously.
**How to avoid:** Compute scene graph once, pass to both main canvas and thumbnail. Thumbnail renders synchronously (no animation) in a 200x200 scaled-down draw.
**Warning signs:** Thumbnail shows previous input's artwork briefly.

## Code Examples

Verified patterns from the existing codebase and standard APIs:

### Drawing Primitives on Canvas 2D
```typescript
// Source: MDN Canvas 2D API
function drawElement(
  ctx: CanvasRenderingContext2D,
  el: SceneElement,
  alpha: number = 1.0
) {
  ctx.globalAlpha = alpha;

  if (el.type === 'empty') return;

  if (el.fill) {
    ctx.fillStyle = el.fill;
  }

  switch (el.type) {
    case 'rect':
      ctx.fillRect(el.x, el.y, el.width, el.height);
      break;

    case 'circle': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const r = Math.min(el.width, el.height) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(el.x + el.width / 2, el.y);
      ctx.lineTo(el.x + el.width, el.y + el.height);
      ctx.lineTo(el.x, el.y + el.height);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'line': {
      ctx.strokeStyle = el.fill;
      ctx.lineWidth = el.strokeWidth ?? 2;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y + el.height / 2);
      ctx.lineTo(el.x + el.width, el.y + el.height / 2);
      ctx.stroke();
      break;
    }
  }

  // Stroke overlay if configured
  if (el.stroke && el.strokeWidth) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth;
    if (el.type === 'rect') {
      ctx.strokeRect(el.x, el.y, el.width, el.height);
    } else if (el.type === 'circle') {
      // re-use path from above
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
}
```

### Using Existing PRNG for Rendering
```typescript
// Source: Existing project pattern (src/lib/engine/prng.ts)
import { createPRNG, deriveSeed } from '@/lib/engine';
import { CURRENT_VERSION } from '@/lib/engine/version';

async function generateScene(
  canonicalInput: string,
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light'
): Promise<SceneGraph> {
  const seed = await deriveSeed(canonicalInput, 'geometric', CURRENT_VERSION.engineVersion);
  const prng = createPRNG(seed);

  // All randomness for this scene flows through this single prng instance
  const cells = subdivide(rootRegion, config, prng);
  const elements = cells.map(cell => assignShape(cell, params, palette, theme, prng));

  return { elements, width: 800, height: 800, background: ... };
}
```

### Checking prefers-reduced-motion
```typescript
// Source: MDN prefers-reduced-motion / existing useTextAnalysis pattern
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true; // SSR: no animation
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

### Thumbnail via Scaled Render
```typescript
// Source: Canvas API scaling pattern
function renderThumbnail(
  scene: SceneGraph,
  thumbnailSize: number = 200
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = thumbnailSize * dpr;
  canvas.height = thumbnailSize * dpr;

  const ctx = canvas.getContext('2d')!;
  const scale = (thumbnailSize / scene.width) * dpr;
  ctx.scale(scale, scale);

  drawSceneComplete(ctx, scene);
  return canvas;
}
```

## Parameter-to-Visual Mapping Recommendations

These are Claude's Discretion items — recommended mappings for parameters to visual properties:

| Parameter | Visual Property | Mapping |
|-----------|----------------|---------|
| complexity | Subdivision depth | maxDepth = 2 + floor(complexity * 6), range 2-8 |
| symmetry | Split ratio balance | minRatio = 0.5 - (1-symmetry)*0.3, centered around 0.5 |
| density | Fill ratio (filled vs empty cells) | Probability of filling a cell = 0.3 + density * 0.65, range 0.3-0.95 |
| curvature | Shape type distribution | P(circle) = curvature * 0.5, P(triangle) = (1-curvature) * 0.3, P(rect) = remainder |
| texture | Stroke presence and weight | primaryStroke = 1 + texture * 2 (1-3px), secondaryStroke = 0.5 + texture * 1 (0.5-1.5px). Stroke visible when texture > 0.3 |
| scaleVariation | Cell size variance | At high scaleVariation, allow more asymmetric splits (widen ratio range). At low, keep cells more uniform. |
| rhythm | Alternating pattern regularity | Controls whether horizontal/vertical splits alternate predictably (high) or randomly (low) |
| regularity | Grid alignment tendency | At high regularity, snap split ratios to clean fractions (1/2, 1/3, 2/3). At low, allow any ratio. |
| directionality | Dominant split direction | Bias horizontal vs vertical split probability. High directionality = strong vertical or horizontal preference. |
| layering | Overlapping elements | At higher layering, some shapes extend slightly beyond cell bounds, creating subtle overlap effects |
| energy | Color distribution vibrancy | At high energy, use more distinct palette colors per cell. At low energy, stick closer to dominant color. |
| warmth | Already drives palette hue | No additional visual mapping needed — palette warmth is pre-baked |
| saturation | Already drives palette chroma | No additional visual mapping needed — palette saturation is pre-baked |
| contrast | Already drives palette lightness spread | No additional visual mapping needed — palette contrast is pre-baked |
| paletteSize | Already drives color count | No additional visual mapping needed — palette count is pre-baked |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Canvas 2D only | Canvas 2D + OffscreenCanvas | Widely supported since 2023 | OffscreenCanvas available for thumbnail rendering but not required. Regular canvas with document.createElement sufficient for this use case. |
| requestAnimationFrame polyfill | Native everywhere | Years ago | No polyfill needed. All modern browsers support rAF natively. |
| Manual DPR handling | Still manual | Ongoing | No high-level API for HiDPI canvas. Must still set width/height * dpr and scale context. |

**Deprecated/outdated:**
- None relevant. Canvas 2D API is stable and not deprecating any methods used here.

## Performance Analysis

**GEOM-05 target: < 1 second at 800x800**

Canvas 2D performance for this workload is well within budget:
- fillRect: ~0.01ms per call (GPU-accelerated)
- arc + fill: ~0.02ms per call
- Path operations (triangle): ~0.02ms per call

Even at maximum complexity (depth 8), the subdivision produces at most ~256 cells. With shape drawing + stroke overlay, that is ~512 draw calls. At 0.02ms each, total draw time is ~10ms — well under the 1000ms budget.

The progressive animation adds requestAnimationFrame overhead (~16ms per frame at 60fps). Over 750ms animation, that is ~45 frames, each drawing an increasing number of elements. The final frame draws all elements, which takes ~10ms. Total animation CPU time is negligible.

**Thumbnail rendering (200x200):** Same scene graph, scaled down. Fewer pixels to fill. Estimated <5ms per thumbnail.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with jsdom + vitest-canvas-mock |
| Config file | vitest.config.mts (exists) |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEOM-01 | Subdivision produces cells; shapes assigned per cell | unit | `npx vitest run src/__tests__/render/subdivide.test.ts -t "produces cells"` | Wave 0 |
| GEOM-02 | No cell dimension < 4px at any complexity/density | unit | `npx vitest run src/__tests__/render/subdivide.test.ts -t "minimum size"` | Wave 0 |
| GEOM-03 | Outer padding >= 2% of canvas on all edges | unit | `npx vitest run src/__tests__/render/scene.test.ts -t "frame padding"` | Wave 0 |
| GEOM-04 | At most 2 distinct stroke widths in any scene | unit | `npx vitest run src/__tests__/render/scene.test.ts -t "stroke weights"` | Wave 0 |
| GEOM-05 | Scene generation + draw < 1s at 800x800 | unit (perf) | `npx vitest run src/__tests__/render/performance.test.ts` | Wave 0 |
| UI-07 | Canvas renders at 800x800 | integration | `npx vitest run src/__tests__/components/GeometricCanvas.test.tsx` | Wave 0 |
| UI-08 | Style selector shows active geometric + 3 locked | integration | `npx vitest run src/__tests__/components/StyleSelector.test.tsx` | Wave 0 |
| UI-09 | Progressive build uses requestAnimationFrame | integration | `npx vitest run src/__tests__/components/GeometricCanvas.test.tsx -t "progressive"` | Wave 0 |
| UI-10 | Reduced motion = instant render | integration | `npx vitest run src/__tests__/components/GeometricCanvas.test.tsx -t "reduced motion"` | Wave 0 |
| UI-11 | Panel collapsible (expanded desktop, collapsed mobile) | existing | Already tested in Phase 3 | Existing |
| UI-12 | Parameter bars with labels and values | existing | Already tested in Phase 3 | Existing |
| UI-13 | Parameters grouped by source | existing | Already tested in Phase 3 | Existing |
| UI-14 | Plain-English explanations | existing | Already tested in Phase 3 | Existing |
| UI-15 | Engine version in panel footer | existing | Already tested in Phase 3 | Existing |
| DETERMINISM | Same input = same scene graph | unit | `npx vitest run src/__tests__/render/determinism.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest-canvas-mock` — dev dependency needed for canvas tests in jsdom
- [ ] `src/__tests__/render/subdivide.test.ts` — covers GEOM-01, GEOM-02
- [ ] `src/__tests__/render/scene.test.ts` — covers GEOM-03, GEOM-04, DETERMINISM
- [ ] `src/__tests__/render/performance.test.ts` — covers GEOM-05
- [ ] `src/__tests__/components/GeometricCanvas.test.tsx` — covers UI-07, UI-09, UI-10
- [ ] `src/__tests__/components/StyleSelector.test.tsx` — covers UI-08
- [ ] `src/__tests__/render/determinism.test.ts` — covers determinism across runs
- [ ] Update `src/__tests__/setup.ts` to import `vitest-canvas-mock`

## Open Questions

1. **Exact visual balance at extremes**
   - What we know: The parameter mappings above are reasonable starting points based on the user's description.
   - What's unclear: Whether complexity=1.0 + density=1.0 produces aesthetically pleasing art or just a dense grid. Whether complexity=0.0 + density=0.0 produces interesting minimal art or looks empty.
   - Recommendation: Implement the mappings, then tune constants during visual testing. The pure-function architecture makes iteration fast.

2. **Theme switch scene graph recomputation**
   - What we know: User decided "instant re-render with adjusted palette, no animation replay."
   - What's unclear: Whether to recompute the entire scene graph (with new palette colors) or just swap colors at draw time.
   - Recommendation: Recompute the scene graph (it takes <10ms) and draw instantly. Simpler than maintaining a color-independent intermediate representation.

3. **rendererVersion bump**
   - What we know: CURRENT_VERSION.rendererVersion is currently '0.1.0' (placeholder). Context says "rendererVersion in CURRENT_VERSION should be bumped when renderer ships."
   - What's unclear: What version to set.
   - Recommendation: Bump to '0.2.0' when the geometric renderer is complete. This changes the PRNG seed for any cached results, which is correct — the art has fundamentally changed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/engine/prng.ts`, `src/lib/color/palette.ts`, `src/types/engine.ts`, `src/components/results/ResultsView.tsx` — direct code inspection
- [MDN Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — drawing primitives, HiDPI handling
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations) — animation loop pattern
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — accessibility query
- [MDN OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) — thumbnail rendering option (available in all browsers since March 2023)

### Secondary (MEDIUM confidence)
- [vitest-canvas-mock npm](https://www.npmjs.com/package/vitest-canvas-mock) — v1.1.3, canvas mocking for vitest/jsdom, verified against GitHub repo
- [Can I Use OffscreenCanvas](https://caniuse.com/offscreencanvas) — browser support confirmed across modern browsers
- [Animation with Canvas and requestAnimationFrame in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj) — React integration patterns
- [Josh Comeau: Accessible Animations with prefers-reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/) — React hook pattern for motion preference

### Tertiary (LOW confidence)
- None. All findings verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Canvas 2D API is browser-native, no libraries needed beyond existing project deps + vitest-canvas-mock for testing
- Architecture: HIGH — Pure-function scene graph pattern is well-established for generative art; existing codebase already uses this separation (e.g., palette generation is pure, component is separate)
- Pitfalls: HIGH — Canvas HiDPI, rAF cleanup, determinism concerns are well-documented and verifiable
- Parameter mappings: MEDIUM — Mappings are reasonable but will need visual tuning during implementation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable domain — Canvas 2D API is not changing)