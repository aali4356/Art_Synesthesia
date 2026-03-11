# Phase 5: Additional Renderers - Research

**Researched:** 2026-03-04
**Domain:** Canvas 2D rendering -- organic flow fields, particle systems, typographic layout, multi-style selector
**Confidence:** HIGH

## Summary

Phase 5 adds three new rendering styles (organic, particle, typographic) to the existing geometric renderer, and unlocks the style selector to allow switching between all four. The codebase already establishes strong patterns from Phase 4: each renderer lives in `src/lib/render/{style}/` with a pure `buildSceneGraph()` function, a `draw.ts` for Canvas API calls, and a corresponding React canvas component. New renderers follow this exact same architecture.

The primary new dependency is `simplex-noise` v4.0.3 for the organic flow field renderer. It accepts a custom PRNG function (the project already uses `seedrandom.alea()`) and is zero-dependency, TypeScript-native, and ESM-compatible. Particle and typographic renderers need no external dependencies -- they use Canvas 2D APIs directly. The typographic renderer uses `ctx.measureText()` with `TextMetrics` bounding box properties for word placement collision detection.

**Primary recommendation:** Follow the established geometric renderer pattern exactly. Each style gets its own `buildSceneGraph()` that returns a style-specific scene graph, its own `draw.ts` for Canvas operations, its own React canvas component, and integration through the ResultsView/StyleSelector. The type system needs extending to support polymorphic scene graphs (organic curves, particle positions, text placements) while maintaining a common render interface.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Organic renderer: Flow field aesthetic with parallel curves following Perlin/simplex noise vector field, smooth continuous curves, color shifts along curve, soft gradient wash background, directionality parameter controls dominant flow direction
- Particle renderer: Cosmic/starfield aesthetic, mixed particle sizes (large 8-12px, small 1-3px), radial glow on large particles, faint constellation-like connecting lines between nearby particles, slow orbital drift idle animation (disabled on prefers-reduced-motion)
- Typographic renderer: Layered poster layout with key words large in foreground, word sizing by semantic weight (nouns/unique words priority), bold serif + clean sans-serif font mix, single word fills canvas for 1-3 word inputs
- Style switching: Full progressive build animation on style change, all 4 thumbnails render simultaneously at 200x200, typographic disabled with tooltip for data input type, mobile horizontal scroll for thumbnails
- Composition laws per spec: ORGN-02 (2-6 noise octaves), ORGN-03 (max 5 transparent layers), ORGN-04 (dominant flow direction), PTCL-02 (2K mobile/10K desktop particle cap), PTCL-03 (min 2 clusters), PTCL-04 (15% negative space unless density > 0.85), TYPO-02 (3 prominent words readable), TYPO-03 (max 30% rotated), TYPO-04 (overlap only below 0.4 opacity)

### Claude's Discretion
- Flow field line density, thickness variation, and noise frequency mapping
- Particle clustering algorithm (force-directed vs k-means vs spatial hashing)
- Number of flow curves and their starting positions
- Exact glow radius and opacity for particle bloom effect
- Serif/sans-serif font choices (web-safe or already loaded)
- Semantic weight scoring algorithm for typographic word sizing
- Progressive animation timing per style (may differ from geometric's 750ms)
- Orbit speed and radius for particle idle animation
- How each parameter (complexity, warmth, symmetry, etc.) maps to visual properties per style

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORGN-01 | Organic style renders flowing curves, blob shapes, and gradient fields using Perlin/simplex noise | simplex-noise v4.0.3 with seeded PRNG; flow field algorithm with Canvas 2D bezier curves |
| ORGN-02 | Composition law: minimum 2 octaves of noise, maximum 6 | simplex-noise fractional Brownian motion (fBm) with configurable octave count clamped to [2,6] |
| ORGN-03 | Composition law: maximum 5 overlapping transparent layers; beyond that, reduce opacity | Layer count derived from `layering` parameter, opacity auto-reduction when layers > 5 |
| ORGN-04 | Composition law: flow fields must have dominant direction set by directionality parameter | Noise offset + angle bias applied to flow field vector computation |
| PTCL-01 | Particle style renders force-directed/physics-based particle arrangements | Pure Canvas 2D particle placement with clustering algorithm using seeded PRNG |
| PTCL-02 | Max 2,000 particles mobile (viewport width), max 10,000 desktop | Viewport width detection via `window.innerWidth < 768` threshold |
| PTCL-03 | At least 2 visible clusters or flows; no uniform random scatter | k-means or centroid-based clustering with seeded PRNG; cluster count derived from complexity |
| PTCL-04 | At least 15% canvas area empty/negative space unless density > 0.85 | Post-placement spatial analysis with cluster radius constraints |
| PTCL-05 | Subtle idle animation respects prefers-reduced-motion; static when reduced | `window.matchMedia('(prefers-reduced-motion: reduce)')` check; rAF loop with abort |
| TYPO-01 | Typographic style uses input text as visual medium (text and URL inputs only) | Input type check in ResultsView; disabled state in StyleSelector for data inputs |
| TYPO-02 | 3 most prominent words fully readable (no rotation >15 deg, min 16px font) | Word scoring by semantic weight; top 3 get protected placement constraints |
| TYPO-03 | Maximum 30% of words rotated beyond 10 degrees | Rotation budget counter during word placement |
| TYPO-04 | Words overlap only if opacity below 0.4; full-opacity words never overlap | Bounding box collision detection via ctx.measureText() TextMetrics |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| simplex-noise | 4.0.3 | 2D/3D simplex noise for organic flow fields | Zero-dependency, TypeScript-native, ESM, accepts custom PRNG function, ~2KB gzipped, ~20ns per sample |
| seedrandom (existing) | 3.0.5 | Seeded PRNG (Alea) | Already in project; simplex-noise accepts `() => number` PRNG directly |
| Canvas 2D API (built-in) | -- | All rendering (curves, particles, text) | No external rendering library needed; project pattern uses Canvas 2D exclusively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| culori (existing) | 4.0.2 | OKLCH color manipulation for gradient computation | Background gradient washes, particle glow colors |
| next/font (existing) | -- | Font loading for typographic renderer | Geist fonts already loaded; may add serif variant |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| simplex-noise | open-simplex-noise | open-simplex is patent-free variant but simplex-noise has better API, TypeScript types, and PRNG injection |
| simplex-noise | noisejs | noisejs is older, no TypeScript types, global state-based API vs functional |
| Canvas 2D for particles | WebGL | WebGL would handle 10K+ particles better but adds massive complexity; Canvas 2D sufficient at 10K cap |
| Custom text layout | d3-cloud | d3-cloud is word-cloud focused but brings D3 dependency; custom layout gives more control for poster aesthetic |

**Installation:**
```bash
npm install simplex-noise
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/render/
  types.ts              # Extended: polymorphic scene graph types
  geometric/            # EXISTING - no changes
    index.ts
    subdivide.ts
    shapes.ts
    scene.ts
    draw.ts
  organic/              # NEW
    index.ts            # Barrel exports
    noise.ts            # fBm noise with octave control
    flowfield.ts        # Flow field vector computation
    curves.ts           # Curve path generation (start points, tracing)
    scene.ts            # buildOrganicSceneGraph()
    draw.ts             # drawOrganicScene() - gradient wash + curves
  particle/             # NEW
    index.ts            # Barrel exports
    cluster.ts          # k-means-like clustering with seeded PRNG
    placement.ts        # Particle position, size, glow assignment
    scene.ts            # buildParticleSceneGraph()
    draw.ts             # drawParticleScene() - stars, glow, connections
    animate.ts          # Idle orbital drift animation loop
  typographic/          # NEW
    index.ts            # Barrel exports
    words.ts            # Word extraction, semantic weight scoring
    layout.ts           # Word placement with collision detection
    scene.ts            # buildTypographicSceneGraph()
    draw.ts             # drawTypographicScene() - text rendering

src/components/results/
  OrganicCanvas.tsx     # NEW - same pattern as GeometricCanvas
  ParticleCanvas.tsx    # NEW - adds idle animation support
  TypographicCanvas.tsx # NEW - same pattern as GeometricCanvas
  StyleSelector.tsx     # MODIFIED - unlock all 4, multi-scene support
  ResultsView.tsx       # MODIFIED - style switching, multi-scene building
```

### Pattern 1: Polymorphic Scene Graph
**What:** Each renderer produces a style-specific scene graph type that shares a common base interface
**When to use:** Always -- the scene graph is the pure data contract between build and draw
**Example:**
```typescript
// src/lib/render/types.ts - extended

/** Common base for all scene graph types */
interface BaseSceneGraph {
  width: number;
  height: number;
  background: string;
  style: 'geometric' | 'organic' | 'particle' | 'typographic';
}

/** Organic scene: flow curves over gradient wash */
interface OrganicSceneGraph extends BaseSceneGraph {
  style: 'organic';
  gradientStops: Array<{ offset: number; color: string }>;
  curves: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    opacity: number;
  }>;
  layers: number; // 1-5, ORGN-03
}

/** Particle scene: positioned particles with connections */
interface ParticleSceneGraph extends BaseSceneGraph {
  style: 'particle';
  particles: Array<{
    x: number; y: number;
    radius: number; // 1-12px
    color: string;
    glowRadius: number; // 0 for small particles
    opacity: number;
    clusterId: number;
  }>;
  connections: Array<{
    from: number; to: number; // particle indices
    opacity: number;
  }>;
  clusters: Array<{ cx: number; cy: number; radius: number }>;
}

/** Typographic scene: positioned words */
interface TypographicSceneGraph extends BaseSceneGraph {
  style: 'typographic';
  words: Array<{
    text: string;
    x: number; y: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    rotation: number; // degrees
    opacity: number;
    isProminent: boolean; // top 3
  }>;
}

type AnySceneGraph = SceneGraph | OrganicSceneGraph | ParticleSceneGraph | TypographicSceneGraph;
```

### Pattern 2: Builder Function Signature (Established)
**What:** Every renderer exposes the same `buildXxxSceneGraph()` signature
**When to use:** Always -- ensures consistency and interchangeability
**Example:**
```typescript
// Same signature as geometric's buildSceneGraph
export function buildOrganicSceneGraph(
  params: ParameterVector,
  palette: PaletteResult,
  theme: 'dark' | 'light',
  seed: string,
  canvasSize: number = 800,
): OrganicSceneGraph { ... }
```

### Pattern 3: Canvas Component Pattern (Established)
**What:** Each style gets a React component following GeometricCanvas's pattern
**When to use:** Always -- HiDPI scaling, progressive animation, cleanup
**Example:**
```typescript
// Same interface pattern as GeometricCanvas
interface OrganicCanvasProps {
  scene: OrganicSceneGraph;
  animated: boolean;
  onRenderComplete?: () => void;
  className?: string;
}

export function OrganicCanvas({ scene, animated, onRenderComplete, className }: OrganicCanvasProps) {
  // useRef for canvas, useEffect for draw/animate, HiDPI scaling
  // Same abort/cleanup pattern
}
```

### Pattern 4: Seeded Noise with Octave fBm
**What:** Fractal Brownian motion using simplex-noise with seeded PRNG
**When to use:** Organic renderer -- flow field direction computation
**Example:**
```typescript
import { createNoise2D } from 'simplex-noise';
import { createPRNG } from '@/lib/engine/prng';

function createFbm(seed: string, octaves: number) {
  const prng = createPRNG(seed);
  const noise2D = createNoise2D(prng);

  return (x: number, y: number): number => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      value += noise2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= 0.5;  // persistence
      frequency *= 2.0;  // lacunarity
    }

    return value / maxAmplitude; // normalized to [-1, 1]
  };
}
```

### Pattern 5: Style Switching in ResultsView
**What:** ResultsView builds scene graphs for all active styles, switches canvas component
**When to use:** When user clicks a different style thumbnail
**Example:**
```typescript
// ResultsView builds all scenes on parameter change
const [activeStyle, setActiveStyle] = useState<StyleName>('geometric');
const [scenes, setScenes] = useState<Record<StyleName, AnySceneGraph | null>>({});

// Build all 4 scenes when result changes
useEffect(() => {
  async function buildAllScenes() {
    const seeds = await Promise.all(
      STYLE_NAMES.map(s => deriveSeed(result.canonical, s, CURRENT_VERSION.engineVersion))
    );
    // Build each scene graph
    const built = { geometric: null, organic: null, particle: null, typographic: null };
    built.geometric = buildSceneGraph(result.vector, result.palette, theme, seeds[0]);
    built.organic = buildOrganicSceneGraph(result.vector, result.palette, theme, seeds[1]);
    built.particle = buildParticleSceneGraph(result.vector, result.palette, theme, seeds[2]);
    if (result.inputType !== 'data') {
      built.typographic = buildTypographicSceneGraph(result.vector, result.palette, theme, seeds[3], inputText);
    }
    setScenes(built);
  }
  buildAllScenes();
}, [result, theme]);
```

### Anti-Patterns to Avoid
- **Shared mutable state between renderers:** Each scene graph must be independently buildable. Never share PRNG instances across styles (each gets its own seed via `deriveSeed(canonical, styleName, ...)`).
- **Canvas API in scene builders:** Scene builders must be pure functions producing data. Only draw.ts files touch the Canvas API. This enables testing without canvas mocks.
- **Unbounded particle counts:** Always cap particles using viewport detection. Never let complexity parameter generate more particles than the mobile/desktop cap.
- **Blocking animation loops:** The particle idle animation must use `requestAnimationFrame` with cleanup in the useEffect return. Never use `setInterval`.
- **Font measurement in scene builder:** Canvas text measurement (`measureText`) requires a real or mocked context. The typographic scene builder should compute layout using estimated metrics or accept a measurement function as a parameter to keep the builder testable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Simplex/Perlin noise | Custom noise function | `simplex-noise` v4.0.3 | Noise quality, distribution uniformity, performance (~20ns/sample), and octave artifacts are notoriously hard to get right |
| Seeded PRNG | Custom LCG or xorshift | `seedrandom.alea()` (existing) | Already validated in Phase 1; simplex-noise accepts it directly |
| Color space math | Manual OKLCH conversion | `culori` (existing) | Already in project; handles gamut mapping, contrast checks |
| HiDPI canvas setup | Manual DPR handling | Follow GeometricCanvas pattern | Pattern already handles `devicePixelRatio`, scaling, and CSS sizing |

**Key insight:** The noise algorithm is the only genuinely complex computation. Everything else (curve tracing, particle placement, text layout) is straightforward Canvas 2D work that benefits from custom implementation matched to the specific aesthetic requirements.

## Common Pitfalls

### Pitfall 1: Noise-Based PRNG State Corruption
**What goes wrong:** Creating a simplex-noise instance consumes values from the PRNG. If the same PRNG instance is shared with other logic, the noise output changes based on call order.
**Why it happens:** `createNoise2D(prng)` calls `prng()` multiple times during initialization to build its permutation table.
**How to avoid:** Create a dedicated PRNG instance for noise initialization: `const noisePrng = createPRNG(seed + '-noise')`. Use a separate PRNG for other scene-building randomness: `const scenePrng = createPRNG(seed + '-scene')`.
**Warning signs:** Scene graph changes when unrelated code is added/removed before the noise initialization.

### Pitfall 2: Canvas Gradient Performance on Particle Glow
**What goes wrong:** Creating a `createRadialGradient()` for every single particle (up to 10,000) tanks frame rate.
**Why it happens:** Each gradient creation allocates objects and color stop interpolation state.
**How to avoid:** Pre-render glow sprites onto an offscreen canvas at a few standard sizes (e.g., 4px, 8px, 16px, 24px radius). Use `ctx.drawImage()` to stamp them -- drawImage from canvas is GPU-accelerated and much faster than per-particle gradients.
**Warning signs:** Draw time exceeds 100ms at 5,000+ particles; profiler shows gradient creation dominating.

### Pitfall 3: Text Measurement Without Canvas Context
**What goes wrong:** `ctx.measureText()` requires a real CanvasRenderingContext2D with the font already set. In tests (jsdom), this returns 0 for all measurements.
**Why it happens:** jsdom does not implement text shaping or font metrics.
**How to avoid:** The typographic scene builder should accept an optional `measureFn` parameter. In production, pass a function that uses a real offscreen canvas. In tests, pass a mock that returns estimated widths (e.g., `text.length * fontSize * 0.6`). Keep layout logic testable.
**Warning signs:** All words placed at (0,0) in test output; zero-width bounding boxes.

### Pitfall 4: Particle Idle Animation Memory Leak
**What goes wrong:** The `requestAnimationFrame` loop for particle orbital drift continues after component unmount.
**Why it happens:** Missing cleanup in useEffect, or animation ID not tracked.
**How to avoid:** Follow the exact same pattern as GeometricCanvas: `let aborted = false; let animationId = 0;` with cleanup returning `() => { aborted = true; cancelAnimationFrame(animationId); }`.
**Warning signs:** CPU usage increases with each navigation; "Can't perform state update on unmounted component" warning.

### Pitfall 5: Flow Curve Start Position Bias
**What goes wrong:** All flow curves start from the left edge, creating a uniform left-to-right appearance regardless of directionality parameter.
**Why it happens:** Naive implementation places start points along one edge only.
**How to avoid:** Distribute curve start points based on directionality: low directionality = scattered across canvas, high directionality = aligned perpendicular to dominant flow. Use the PRNG to jitter start positions.
**Warning signs:** All curves have same visual direction; changing `directionality` has no visible effect.

### Pitfall 6: Typographic Font Loading Race
**What goes wrong:** Canvas text renders in fallback font (Times New Roman / serif) because the custom font hasn't loaded when `ctx.font` is set.
**Why it happens:** Next.js font loading is async; canvas rendering may execute before fonts are ready.
**How to avoid:** Use `document.fonts.ready` promise before building typographic scene, or use web-safe font stacks that have immediate availability. Georgia (serif) and system-ui (sans-serif) are safe choices that don't need loading.
**Warning signs:** Text appears in wrong font on first render but correct on subsequent renders.

## Code Examples

### Organic: Flow Field Curve Tracing
```typescript
// Source: Established flow field technique (Canvas 2D)

function traceFlowCurve(
  startX: number, startY: number,
  fbm: (x: number, y: number) => number,
  directionBias: number, // radians
  steps: number,
  stepSize: number,
  canvasSize: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;

  for (let i = 0; i < steps; i++) {
    // Sample noise at current position (scale to noise space)
    const noiseScale = 0.003; // controls flow "zoom"
    const angle = fbm(x * noiseScale, y * noiseScale) * Math.PI * 2 + directionBias;

    // Step forward
    x += Math.cos(angle) * stepSize;
    y += Math.sin(angle) * stepSize;

    // Stop if out of bounds
    if (x < 0 || x > canvasSize || y < 0 || y > canvasSize) break;

    points.push({ x, y });
  }

  return points;
}
```

### Organic: Drawing Curves with Color Shift
```typescript
// Source: Canvas 2D quadraticCurveTo for smooth curves

function drawFlowCurve(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  colors: string[],
  lineWidth: number,
  opacity: number,
): void {
  if (points.length < 2) return;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw segments with color interpolation
  const segmentsPerColor = Math.ceil(points.length / colors.length);

  for (let i = 0; i < points.length - 1; i++) {
    const colorIdx = Math.min(Math.floor(i / segmentsPerColor), colors.length - 1);
    ctx.strokeStyle = colors[colorIdx];
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);

    if (i + 2 < points.length) {
      // Smooth with quadratic curve
      const midX = (points[i + 1].x + points[i + 2].x) / 2;
      const midY = (points[i + 1].y + points[i + 2].y) / 2;
      ctx.quadraticCurveTo(points[i + 1].x, points[i + 1].y, midX, midY);
    } else {
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
}
```

### Particle: Pre-rendered Glow Sprite
```typescript
// Source: Canvas 2D offscreen rendering pattern

function createGlowSprite(
  radius: number,
  color: string,
  dpr: number,
): HTMLCanvasElement | OffscreenCanvas {
  const size = radius * 4 * dpr; // enough for full glow
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(size, size)
    : document.createElement('canvas');

  if ('width' in canvas) {
    canvas.width = size;
    canvas.height = size;
  }

  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius * 2 * dpr);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}
```

### Particle: Seeded K-Means Clustering
```typescript
// Source: Standard k-means with seeded initialization

function seedKMeansClusters(
  particleCount: number,
  clusterCount: number,
  canvasSize: number,
  prng: () => number,
  negativeSpaceRatio: number, // minimum empty area fraction
): Array<{ cx: number; cy: number; radius: number; count: number }> {
  const padding = canvasSize * 0.1;
  const maxRadius = canvasSize * (1 - negativeSpaceRatio) / (clusterCount * 1.5);

  return Array.from({ length: clusterCount }, () => ({
    cx: padding + prng() * (canvasSize - padding * 2),
    cy: padding + prng() * (canvasSize - padding * 2),
    radius: maxRadius * (0.5 + prng() * 0.5),
    count: Math.floor(particleCount / clusterCount),
  }));
}
```

### Typographic: Word Collision Detection
```typescript
// Source: Canvas 2D measureText TextMetrics API (MDN)

interface WordBox {
  x: number; y: number;
  width: number; height: number;
  rotation: number; // degrees
}

function wordsOverlap(a: WordBox, b: WordBox): boolean {
  // For non-rotated or slightly rotated words, use AABB check
  // (rotation < 15 deg for prominent words makes AABB sufficient)
  if (Math.abs(a.rotation) < 15 && Math.abs(b.rotation) < 15) {
    return !(a.x + a.width < b.x || b.x + b.width < a.x ||
             a.y + a.height < b.y || b.y + b.height < a.y);
  }
  // For rotated words, expand bounding box by rotation amount
  const expandA = getRotatedBoundingBox(a);
  const expandB = getRotatedBoundingBox(b);
  return !(expandA.x + expandA.width < expandB.x || expandB.x + expandB.width < expandA.x ||
           expandA.y + expandA.height < expandB.y || expandB.y + expandB.height < expandA.y);
}

function measureWord(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
): { width: number; height: number } {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight),
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| simplex-noise v3 (class-based) | simplex-noise v4 (functional, createNoise2D) | v4.0.0 (2022) | Must use functional API; class API removed |
| noisejs (global state) | simplex-noise (PRNG injection) | -- | Deterministic seeding is trivial with v4 |
| Canvas gradients per particle | Pre-rendered glow sprites + drawImage | Performance practice | 5-10x faster at high particle counts |
| wordcloud2.js library | Custom layout per aesthetic | -- | Custom gives poster aesthetic vs generic cloud |

**Deprecated/outdated:**
- `simplex-noise` v3.x class-based API: replaced by functional `createNoise2D()` in v4
- `noisejs` package: no TypeScript types, not maintained, uses global state

## Open Questions

1. **Typographic font loading guarantee**
   - What we know: Next.js loads Geist fonts via `next/font/google`. Canvas needs fonts loaded before `measureText` returns accurate values.
   - What's unclear: Whether `document.fonts.ready` is sufficient or whether we need to wait for specific font families.
   - Recommendation: Use web-safe fonts for typographic renderer (Georgia for serif, system-ui for sans-serif) to avoid font loading issues entirely. The Geist font is for UI, not canvas artwork.

2. **Typographic renderer needs input text access**
   - What we know: The geometric/organic/particle renderers only need `ParameterVector` + `PaletteResult` + `seed`. The typographic renderer also needs the actual input words.
   - What's unclear: Whether to pass full text through the scene builder or extract words earlier in the pipeline.
   - Recommendation: Pass a `words: string[]` parameter to `buildTypographicSceneGraph()`. Extract words from `inputText` (or fetched URL content) in ResultsView before calling the builder.

3. **Particle count on mid-size tablets**
   - What we know: PTCL-02 specifies 2,000 mobile / 10,000 desktop threshold.
   - What's unclear: Whether tablets (768px-1024px) should be mobile or desktop tier.
   - Recommendation: Use `window.innerWidth >= 768` as the desktop threshold (matches Tailwind `md:` breakpoint used throughout the project). Tablets at 768px+ get the desktop cap.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/__tests__/render/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORGN-01 | Organic scene graph has curves, gradient stops, background | unit | `npx vitest run src/__tests__/render/organic-scene.test.ts -x` | No -- Wave 0 |
| ORGN-02 | Octave count clamped to [2, 6] based on complexity | unit | `npx vitest run src/__tests__/render/organic-scene.test.ts -x` | No -- Wave 0 |
| ORGN-03 | Layer count capped at 5; opacity reduces beyond | unit | `npx vitest run src/__tests__/render/organic-scene.test.ts -x` | No -- Wave 0 |
| ORGN-04 | Curves follow dominant direction from directionality param | unit | `npx vitest run src/__tests__/render/organic-scene.test.ts -x` | No -- Wave 0 |
| PTCL-01 | Particle scene graph has particles, connections, clusters | unit | `npx vitest run src/__tests__/render/particle-scene.test.ts -x` | No -- Wave 0 |
| PTCL-02 | Particle count respects mobile/desktop cap | unit | `npx vitest run src/__tests__/render/particle-scene.test.ts -x` | No -- Wave 0 |
| PTCL-03 | At least 2 visible clusters in scene | unit | `npx vitest run src/__tests__/render/particle-scene.test.ts -x` | No -- Wave 0 |
| PTCL-04 | Negative space >= 15% unless density > 0.85 | unit | `npx vitest run src/__tests__/render/particle-scene.test.ts -x` | No -- Wave 0 |
| PTCL-05 | Animation absent when prefers-reduced-motion | unit | `npx vitest run src/__tests__/components/ParticleCanvas.test.tsx -x` | No -- Wave 0 |
| TYPO-01 | Typographic only available for text/URL inputs | unit | `npx vitest run src/__tests__/render/typographic-scene.test.ts -x` | No -- Wave 0 |
| TYPO-02 | Top 3 words: no rotation >15 deg, min 16px font | unit | `npx vitest run src/__tests__/render/typographic-scene.test.ts -x` | No -- Wave 0 |
| TYPO-03 | Max 30% words rotated beyond 10 degrees | unit | `npx vitest run src/__tests__/render/typographic-scene.test.ts -x` | No -- Wave 0 |
| TYPO-04 | Full-opacity words never overlap | unit | `npx vitest run src/__tests__/render/typographic-scene.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/render/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/render/organic-scene.test.ts` -- covers ORGN-01 through ORGN-04
- [ ] `src/__tests__/render/particle-scene.test.ts` -- covers PTCL-01 through PTCL-04
- [ ] `src/__tests__/render/typographic-scene.test.ts` -- covers TYPO-01 through TYPO-04
- [ ] `src/__tests__/components/ParticleCanvas.test.tsx` -- covers PTCL-05 (reduced motion)
- [ ] `src/__tests__/components/OrganicCanvas.test.tsx` -- component rendering tests
- [ ] `src/__tests__/components/TypographicCanvas.test.tsx` -- component rendering tests
- [ ] `src/__tests__/render/organic-determinism.test.ts` -- determinism verification
- [ ] `src/__tests__/render/particle-determinism.test.ts` -- determinism verification
- [ ] `src/__tests__/render/typographic-determinism.test.ts` -- determinism verification
- [ ] Framework install: `npm install simplex-noise` -- new dependency

## Sources

### Primary (HIGH confidence)
- simplex-noise v4.0.3 README (GitHub: jwagner/simplex-noise.js) - API surface, PRNG injection, TypeScript types, ESM support
- Canvas 2D API (MDN) - TextMetrics.actualBoundingBox properties, createRadialGradient, quadraticCurveTo
- Existing codebase analysis - GeometricCanvas, buildSceneGraph, draw.ts patterns, proxy-based canvas mock, test structure

### Secondary (MEDIUM confidence)
- [Flow field techniques](https://codepen.io/DonKarlssonSan/post/particles-in-simplex-noise-flow-field) - Johan Karlsson's simplex noise flow field implementation
- [Noise in Creative Coding](https://varun.ca/noise/) - fBm octave patterns, lacunarity/persistence tuning
- [Canvas glowing particles](https://miguelmota.com/bytes/canvas-glowing-particles/) - Radial gradient glow technique
- [Understanding Canvas Text Metrics](https://erikonarheim.com/posts/canvas-text-metrics/) - Detailed TextMetrics explanation with bounding box calculations
- [d3-cloud algorithm](https://github.com/jasondavies/d3-cloud) - Spiral placement word layout algorithm (reference, not dependency)
- [Josh Comeau: Accessible Animations](https://www.joshwcomeau.com/react/prefers-reduced-motion/) - prefers-reduced-motion in React with Canvas

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or established codepen implementations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - simplex-noise is the established library for this; Canvas 2D is already used in the project
- Architecture: HIGH - follows exact patterns established by Phase 4 geometric renderer
- Pitfalls: HIGH - identified from real implementation experience with canvas rendering and noise functions
- Composition laws: HIGH - directly from REQUIREMENTS.md, testable as numeric constraints on scene graph data

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable domain, no fast-moving dependencies)