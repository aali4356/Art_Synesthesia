# Architecture Research

**Domain:** Deterministic generative art web application (multi-stage input-analysis-rendering pipeline)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                          SYNESTHESIA MACHINE ARCHITECTURE
 ============================================================================

 CLIENT (Next.js App Router)
 +---------------------------------------------------------------------------+
 |                                                                           |
 |  +-----------+    +-----------------+    +---------------------------+    |
 |  | Input     |    | Client-Side     |    | Rendering Engine          |    |
 |  | Layer     |--->| Analysis        |--->| (Canvas 2D / SVG / WebGL)|    |
 |  | (Forms,   |    | (text-only,     |    |                           |    |
 |  |  DnD,     |    |  local mode)    |    | Strategy: Geometric       |    |
 |  |  Tabs)    |    +-----------------+    |          Organic          |    |
 |  +-----------+            |              |          Particle         |    |
 |       |                   |              |          Typographic      |    |
 |       | (URL/Data)        | (text)       +---------------------------+    |
 |       v                   v                          ^                    |
 |  +-----------------------------+                     |                    |
 |  | Server Request              |    +----------------+                    |
 |  | (Route Handler / Server     |    | Parameter Vector                   |
 |  |  Action)                    |    | (fixed 15-dim schema)              |
 |  +-----------------------------+    +----------------+                    |
 |       |                                    ^                              |
 +-------|------------------------------------|--------------+---------------+
         |                                    |              |
         v                                    |              v
 SERVER (Next.js Route Handlers + Python Microservice)       |
 +-----------------------------------------------+    +-----+---------+
 |                                                |    | Export        |
 |  +--------------+    +------------------+      |    | Service       |
 |  | Canonicalizer|--->| Analyzer         |      |    | (node-canvas  |
 |  | (per-type)   |    | (per-type)       |      |    |  / sharp)     |
 |  +--------------+    +------------------+      |    | 4096x4096     |
 |       |                    |                   |    +---------------+
 |       v                    v                   |
 |  +--------------+    +------------------+      |
 |  | Input Hash   |    | Raw Features     |      |
 |  | (SHA-256)    |    | (type-specific)  |      |
 |  +--------------+    +------------------+      |
 |                            |                   |
 |                            v                   |
 |                  +------------------+          |
 |                  | Normalizer       |          |
 |                  | (quantile-based, |          |
 |                  |  versioned)      |          |
 |                  +------------------+          |
 |                            |                   |
 |                            v                   |
 |                  +------------------+          |
 |                  | Provenance       |          |
 |                  | Generator        |          |
 |                  +------------------+          |
 |                            |                   |
 +----------------------------+-------------------+
                              |
                              v
 DATA LAYER (PostgreSQL + Drizzle ORM)
 +-----------------------------------------------+
 |  +----------+  +----------+  +----------+     |
 |  | Gallery  |  | Analysis |  | URL      |     |
 |  | Items    |  | Cache    |  | Snapshots|     |
 |  +----------+  +----------+  +----------+     |
 +-----------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Input Layer** | Collect and validate user input (text, URL, CSV/JSON). Provide type tabs, drag-and-drop, quick-start buttons. | React components in Next.js App Router. Client Components for interactive forms. |
| **Canonicalizer** | Normalize input into a deterministic form per type (NFC text, sorted JSON keys, normalized URLs). Produces stable hash. | Pure functions, one per input type. Runs server-side for URL/data, client-side for text in local mode. |
| **Analyzer** | Extract raw features from canonicalized input. Text: NLP signals. URL: scrape + NLP. Data: statistics. | Strategy pattern -- one analyzer per input type. Python microservice (FastAPI) for NLP/stats, or Node.js with natural/simple-statistics. |
| **Normalizer** | Map raw features to 0-1 parameter vector using quantile-based scaling against calibration distributions. | Shared module, versioned independently. Stores calibration data. Pure function: `(rawFeatures, calibration) => ParameterVector`. |
| **Provenance Generator** | Track per-parameter signal contributions with weights and plain-English explanations. | Computed alongside normalization. Output: `ParameterProvenance[]` array. |
| **Parameter Vector** | Fixed 15-dimension intermediate representation (0-1 floats). The "DNA" of the artwork. | TypeScript interface with named fields (not dynamic keys). Serializable to JSON. |
| **Rendering Engine** | Interpret parameter vector visually. Multiple styles share the interface but produce different output. | Strategy pattern. Each renderer implements a common `Renderer` interface. Seeded PRNG (Mulberry32) for all randomness. |
| **Export Service** | Server-side high-resolution re-rendering (4096x4096 PNG, SVG for vector styles). | node-canvas or @napi-rs/canvas on the server. Reuses identical rendering code as client. |
| **Gallery/Social** | Persist shared artworks, browse, compare, moderate. | PostgreSQL + Drizzle ORM. Route Handlers for CRUD. Parameters-only storage (no raw input). |
| **Cache Layer** | Avoid recomputing analyses and renders. Three-tier: analysis, render, URL snapshot. | Keyed by inputHash + version components. Database-backed for durability, in-memory for hot path. |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── (main)/                   # Main app route group
│   │   ├── page.tsx              # Home / generator page
│   │   ├── layout.tsx            # Main layout with dark mode
│   │   └── loading.tsx           # Suspense boundary
│   ├── art/
│   │   └── [shareId]/
│   │       └── page.tsx          # Shared artwork view
│   ├── gallery/
│   │   └── page.tsx              # Public gallery browse
│   ├── compare/
│   │   └── page.tsx              # Side-by-side comparison
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # POST /api/analyze
│   │   ├── artwork/
│   │   │   └── [shareId]/
│   │   │       └── route.ts      # GET /api/artwork/:shareId
│   │   ├── gallery/
│   │   │   └── route.ts          # GET/POST /api/gallery
│   │   ├── export/
│   │   │   └── route.ts          # POST /api/render-export
│   │   └── compare/
│   │       └── route.ts          # GET /api/compare
│   └── layout.tsx                # Root layout
│
├── lib/                          # Shared business logic (engine-agnostic)
│   ├── pipeline/                 # The core pipeline
│   │   ├── canonicalize/
│   │   │   ├── index.ts          # Dispatcher: input type -> canonicalizer
│   │   │   ├── text.ts           # NFC, whitespace, newline normalization
│   │   │   ├── url.ts            # URL normalization
│   │   │   ├── json.ts           # Stable key ordering, number formatting
│   │   │   └── csv.ts            # Delimiter, quoting, column sorting
│   │   ├── analyze/
│   │   │   ├── index.ts          # Dispatcher: input type -> analyzer
│   │   │   ├── text.ts           # NLP: sentiment, entropy, syllables, etc.
│   │   │   ├── url.ts            # Scrape + text analysis + page metadata
│   │   │   ├── data.ts           # Statistical analysis for CSV/JSON
│   │   │   └── types.ts          # RawFeatures interfaces per type
│   │   ├── normalize/
│   │   │   ├── index.ts          # Quantile-based normalizer
│   │   │   ├── calibration.ts    # Reference distributions
│   │   │   └── provenance.ts     # Signal tracking + explanations
│   │   └── types.ts              # ParameterVector, VersionInfo, etc.
│   │
│   ├── render/                   # Rendering engine
│   │   ├── index.ts              # Renderer dispatcher / factory
│   │   ├── base.ts               # Abstract base: palette, PRNG, composition
│   │   ├── geometric.ts          # Geometric style renderer
│   │   ├── organic.ts            # Organic style renderer
│   │   ├── particle.ts           # Particle style renderer
│   │   ├── typographic.ts        # Typographic style renderer
│   │   ├── palette.ts            # OKLCH palette generation + coherence
│   │   ├── prng.ts               # Seeded Mulberry32 / xoshiro256**
│   │   └── composition.ts        # Shared composition rules (margins, caps)
│   │
│   ├── hash.ts                   # SHA-256 hashing utilities
│   ├── version.ts                # Engine/analyzer/normalizer/renderer versions
│   └── constants.ts              # Parameter names, limits, defaults
│
├── server/                       # Server-only code
│   ├── db/
│   │   ├── index.ts              # Drizzle client initialization
│   │   ├── schema.ts             # Drizzle schema (gallery, cache, snapshots)
│   │   └── migrations/           # SQL migrations
│   ├── export/
│   │   └── renderer.ts           # Server-side canvas (node-canvas) rendering
│   ├── cache/
│   │   └── index.ts              # Analysis/render/snapshot cache logic
│   ├── security/
│   │   ├── ssrf.ts               # IP blocking, DNS rebinding prevention
│   │   └── rate-limit.ts         # Per-IP rate limiting
│   └── scraper/
│       └── index.ts              # URL fetching + content extraction (Cheerio)
│
├── components/                   # React UI components
│   ├── input/
│   │   ├── InputArea.tsx         # Main input container with tabs
│   │   ├── TextInput.tsx         # Textarea for text input
│   │   ├── UrlInput.tsx          # URL input field
│   │   ├── DataInput.tsx         # File drop zone + paste area
│   │   └── QuickStart.tsx        # Try buttons + Surprise Me
│   ├── canvas/
│   │   ├── ArtCanvas.tsx         # Main canvas wrapper + progressive render
│   │   ├── StyleSelector.tsx     # Thumbnail-based style picker
│   │   └── FrameToggle.tsx       # Export frame option
│   ├── panel/
│   │   ├── TranslationPanel.tsx  # Parameter bars + provenance display
│   │   └── ParameterBar.tsx      # Single parameter visualization
│   ├── gallery/
│   │   ├── GalleryGrid.tsx       # Gallery card grid
│   │   ├── GalleryCard.tsx       # Single gallery item
│   │   └── GalleryFilters.tsx    # Style filter + sort controls
│   ├── compare/
│   │   ├── CompareView.tsx       # Side-by-side layout
│   │   └── ParameterDiff.tsx     # Parameter diff visualization
│   ├── actions/
│   │   ├── ShareButton.tsx       # Generate share link
│   │   ├── DownloadButton.tsx    # PNG/SVG export trigger
│   │   └── SaveToGallery.tsx     # Opt-in gallery save
│   ├── progress/
│   │   └── PipelineProgress.tsx  # Staged progress animation
│   └── layout/
│       ├── Header.tsx
│       ├── ThemeToggle.tsx       # Dark/light mode
│       └── Footer.tsx
│
├── hooks/                        # Custom React hooks
│   ├── usePipeline.ts            # Orchestrates analyze -> normalize -> render
│   ├── useCanvas.ts              # Canvas ref management + rendering loop
│   ├── useReducedMotion.ts       # prefers-reduced-motion detection
│   └── useLocalMode.ts           # Client-side analysis toggle
│
└── styles/                       # Global styles
    └── globals.css               # Tailwind base + custom properties
```

### Structure Rationale

- **`lib/pipeline/`:** The core deterministic pipeline (canonicalize -> analyze -> normalize) is isolated from React, Next.js, and the server. This is the most critical code. It must be pure, testable, and sharable between client (local mode) and server. No framework imports here.
- **`lib/render/`:** Rendering engines are also framework-agnostic. They operate on a `CanvasRenderingContext2D` (or SVG builder) and a `ParameterVector`. This allows the same code to run in browser canvas, node-canvas for exports, and test environments.
- **`server/`:** Server-only concerns -- database, caching, SSRF protection, URL scraping, rate limiting. Never imported by client bundles. Next.js tree-shaking handles this when files are only imported in Route Handlers.
- **`components/`:** UI only. No business logic. Components receive parameters and call hooks. Organized by feature area, not by component type.
- **`hooks/`:** Orchestration layer between UI and business logic. `usePipeline` is the primary hook that wires the entire generation flow together.
- **`app/api/`:** Thin Route Handlers that validate input, call `lib/` functions, manage caching via `server/`, and return responses. No business logic in route files.

## Architectural Patterns

### Pattern 1: Pipeline Pattern (Sequential Stage Processing)

**What:** The core generation flow is a typed pipeline where each stage transforms data and passes it forward. Each stage is a pure function with explicit input/output types. Stages compose left-to-right: `canonicalize -> analyze -> normalize -> render`.

**When to use:** The entire input-to-artwork flow. Every generation request passes through this pipeline.

**Trade-offs:** Very testable (each stage is independently testable). Easy to version (each stage has its own version). Slightly more boilerplate than a monolithic function, but the determinism guarantees demand this separation.

**Example:**
```typescript
// lib/pipeline/types.ts
interface PipelineInput {
  type: "text" | "url" | "data";
  content: string;
  mode?: "snapshot" | "live";
}

interface PipelineResult {
  parameters: ParameterVector;
  provenance: ParameterProvenance[];
  metadata: AnalysisMetadata;
  hash: string;
  version: VersionInfo;
}

// lib/pipeline/index.ts
export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  // Stage 1: Canonicalize
  const canonical = canonicalize(input.type, input.content);
  const hash = await sha256(canonical);

  // Stage 2: Analyze (type-specific)
  const rawFeatures = await analyze(input.type, canonical);

  // Stage 3: Normalize (shared across all types)
  const { parameters, provenance } = normalize(rawFeatures, CALIBRATION_DATA);

  // Stage 4: Version stamp
  const version = getCurrentVersionInfo();

  return { parameters, provenance, metadata: { inputType: input.type, inputHash: hash, ... }, hash, version };
}
```

### Pattern 2: Strategy Pattern (Pluggable Renderers)

**What:** Each rendering style (Geometric, Organic, Particle, Typographic) implements a common `Renderer` interface. The system selects the active renderer at runtime based on user choice. All renderers receive the same `ParameterVector` and produce output on the same canvas context.

**When to use:** All rendering operations. Style switching. Thumbnail generation. Server-side export.

**Trade-offs:** Adding new styles requires only implementing the interface, not modifying existing code (Open/Closed Principle). The interface contract enforces determinism requirements (seeded PRNG, composition laws). Each renderer can be developed and tested in isolation.

**Example:**
```typescript
// lib/render/base.ts
interface Renderer {
  readonly name: string;
  readonly supportsVector: boolean; // true = can export SVG

  render(
    ctx: CanvasRenderingContext2D,
    params: ParameterVector,
    seed: string,
    options: RenderOptions
  ): void;

  renderSVG?(
    params: ParameterVector,
    seed: string,
    options: RenderOptions
  ): string; // SVG markup
}

interface RenderOptions {
  width: number;
  height: number;
  animate: boolean;       // false for exports, prefers-reduced-motion
  frame: boolean;         // border matte
  onProgress?: (stage: string, pct: number) => void;
}

// lib/render/index.ts
const renderers: Record<string, Renderer> = {
  geometric: new GeometricRenderer(),
  organic: new OrganicRenderer(),
  particle: new ParticleRenderer(),
  typographic: new TypographicRenderer(),
};

export function getRenderer(style: string): Renderer {
  const renderer = renderers[style];
  if (!renderer) throw new Error(`Unknown style: ${style}`);
  return renderer;
}
```

### Pattern 3: Seeded PRNG Isolation (Determinism Boundary)

**What:** All randomness in rendering is provided by a seeded PRNG instance scoped to each render call. The PRNG is created from `SHA-256(canonicalized_input + styleName + engineVersion)` and passed through as a dependency -- never accessed as a global. This ensures identical inputs produce identical outputs.

**When to use:** Every rendering code path. Palette generation. Shape placement. Noise generation. Anything that needs "random" values.

**Trade-offs:** Requires discipline -- every function that needs randomness must receive the PRNG instance as a parameter. No fallback to `Math.random()`. Worth it because determinism is a core product promise.

**Example:**
```typescript
// lib/render/prng.ts
export function createPRNG(seed: string): () => number {
  // Mulberry32: fast, good distribution, 32-bit state
  let h = cyrb53Hash(seed);
  return function(): number {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage in renderer -- PRNG passed explicitly, never global
class GeometricRenderer implements Renderer {
  render(ctx: CanvasRenderingContext2D, params: ParameterVector, seed: string, options: RenderOptions) {
    const random = createPRNG(seed);
    const palette = generatePalette(params, random);  // random passed in
    const grid = computeGrid(params, random);          // random passed in
    drawShapes(ctx, grid, palette, random);             // random passed in
  }
}
```

### Pattern 4: Client/Server Isomorphic Pipeline (Local Mode)

**What:** The text analysis pipeline is designed to run in both environments. For "local-only mode," the entire `canonicalize -> analyze -> normalize` chain runs in the browser with zero server requests. For URL and data inputs, it runs server-side. The pipeline code in `lib/pipeline/` has no Node.js or browser-specific dependencies.

**When to use:** Text input in local/private mode (client-side). All input types on server (Route Handlers).

**Trade-offs:** Forces the text analyzer to use only browser-compatible libraries (AFINN lexicon as a static JSON, pure-JS syllable counting, etc.). Limits NLP sophistication for text -- but the spec explicitly says lexicon-based sentiment is sufficient. URL and data analyzers are server-only and can use heavier libraries.

### Pattern 5: Version-Keyed Caching

**What:** Every cached result is keyed by a composite of input hash + relevant version numbers. When any pipeline stage version bumps, affected cache entries naturally become misses. No manual cache invalidation needed.

**When to use:** Analysis cache, render cache, URL snapshot cache.

**Trade-offs:** Cache key complexity (4-5 components) means more cache misses after version bumps. This is intentional -- stale cached results would break the determinism guarantee.

**Example:**
```typescript
// Cache key construction
function analysisCacheKey(inputHash: string, version: VersionInfo): string {
  return `analysis:${inputHash}:${version.analyzerVersion}:${version.normalizerVersion}`;
}

function renderCacheKey(inputHash: string, style: string, version: VersionInfo, resolution: number): string {
  return `render:${inputHash}:${style}:${version.analyzerVersion}:${version.normalizerVersion}:${version.rendererVersion}:${resolution}`;
}
```

## Data Flow

### Primary Generation Flow (Text Input, Server Mode)

```
User types text in <TextInput>
    |
    v
usePipeline hook: validates input, shows PipelineProgress
    |
    v
POST /api/analyze  { type: "text", content: "Hello world" }
    |
    v
Route Handler:
    ├── 1. canonicalize("text", content)        --> "hello world" (NFC, trimmed)
    ├── 2. sha256(canonical)                     --> "abc123..."
    ├── 3. Check analysis cache (hash + versions)--> HIT? return cached result
    ├── 4. analyze("text", canonical)            --> RawFeatures { sentimentScore: 0.2, entropy: 3.8, ... }
    ├── 5. normalize(rawFeatures, calibration)   --> ParameterVector { complexity: 0.3, warmth: 0.6, ... }
    ├── 6. generateProvenance(rawFeatures, params)--> ParameterProvenance[]
    ├── 7. Store in analysis cache
    └── 8. Return PipelineResult
    |
    v
Client receives PipelineResult
    |
    v
useCanvas hook:
    ├── 1. getRenderer(selectedStyle)            --> GeometricRenderer
    ├── 2. computeSeed(hash, style, version)     --> "seed-string"
    ├── 3. renderer.render(ctx, params, seed, opts)
    │       ├── createPRNG(seed)
    │       ├── generatePalette(params, random)
    │       ├── computeComposition(params, random)
    │       └── drawToCanvas(ctx, composition)
    └── 4. Update canvas element with result
    |
    v
TranslationPanel: displays params + provenance
StyleSelector: renders 200x200 thumbnails for other styles
```

### Local-Only Mode Flow (Text Input, No Server)

```
User enables "Private Mode" toggle
    |
    v
User types text -> usePipeline hook (client-side path)
    |
    v
Client-side pipeline (same lib/pipeline/ code):
    ├── canonicalize("text", content)
    ├── sha256(canonical)             (Web Crypto API)
    ├── analyze("text", canonical)    (AFINN lexicon, pure JS stats)
    ├── normalize(rawFeatures, calibration)
    └── generateProvenance(rawFeatures, params)
    |
    v
useCanvas hook: renders identically to server mode
    (No /api/analyze call was made)
```

### URL Input Flow (Server-Only)

```
User enters URL -> POST /api/analyze { type: "url", content: "https://example.com", mode: "snapshot" }
    |
    v
Route Handler:
    ├── 1. canonicalize("url", url)              --> normalized URL
    ├── 2. Check URL snapshot cache              --> HIT? return stored snapshot
    ├── 3. SSRF validation (resolve DNS, check IP)--> BLOCK if private range
    ├── 4. Fetch URL (10s timeout, 5MB limit)
    ├── 5. Extract content (Cheerio + readability)
    ├── 6. analyze("url", { text, title, linkDensity, colorHints, ... })
    │       ├── Run text sub-pipeline on extracted text
    │       └── Merge URL-specific features (linkDensity, contentRatio)
    ├── 7. normalize(rawFeatures, calibration)
    ├── 8. Store URL snapshot + analysis cache
    └── 9. Return PipelineResult
```

### Export Flow (High-Resolution Server Rendering)

```
User clicks "Download PNG"
    |
    v
POST /api/render-export { parameters, style, version, format: "png", resolution: 4096 }
    |
    v
Route Handler:
    ├── 1. Check render cache (params hash + style + version + resolution)
    ├── 2. Create server-side canvas (node-canvas, 4096x4096)
    ├── 3. getRenderer(style).render(serverCtx, params, seed, { width: 4096, ... })
    │       (Same rendering code as client -- isomorphic)
    ├── 4. canvas.toBuffer("image/png")
    ├── 5. Store in render cache
    └── 6. Return binary PNG (Content-Type: image/png)
```

### Key Data Flows

1. **Analysis flow:** Input -> Canonicalize -> Hash -> Analyze -> Normalize -> ParameterVector + Provenance. This is the heart of the system. Each stage is independently versioned. Runs server-side (all types) or client-side (text only in local mode).

2. **Render flow:** ParameterVector + Style + Seed -> Renderer -> Canvas. Stateless and deterministic. Same code runs in browser and on server (node-canvas). The renderer never touches the network or database.

3. **Share flow:** User clicks Share -> Server generates UUID, stores parameters + metadata (no raw input) -> Returns permalink. Recipient loads `/art/[shareId]` -> Fetches stored parameters -> Renders client-side.

4. **Cache flow:** Every analysis and render result is keyed by hash + version components. Version bumps auto-invalidate. No manual purge needed.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single Vercel deployment + single PostgreSQL instance. Python microservice on Railway. Analysis cache in database. No render cache needed (fast enough). |
| 1k-100k users | Add Redis for analysis cache (faster than DB queries). Pre-render gallery thumbnails. Add CDN for exported images. Consider moving render-export to a dedicated worker (Vercel Functions have 10s timeout on Hobby, 60s on Pro). |
| 100k+ users | Render-export becomes the bottleneck. Move to a queue-based system (Bull/BullMQ + Redis) with dedicated rendering workers. Consider storing exported PNGs in S3/R2 with CDN. Rate limiting becomes critical. May need to horizontally scale Python microservice. |

### Scaling Priorities

1. **First bottleneck: Server-side PNG export.** Rendering 4096x4096 canvases is CPU-intensive (2-3 seconds each). At modest traffic, this will saturate a single serverless function. Mitigation: aggressive render cache, consider background job queue early.

2. **Second bottleneck: URL analysis.** Each URL fetch takes 1-5 seconds plus CPU for content extraction and NLP. Rate limiting (10/IP/hour) helps, but at scale the Python microservice needs horizontal scaling. Mitigation: URL snapshot cache means each URL is fetched at most once.

3. **Third bottleneck: Gallery queries.** Browsing/filtering thousands of gallery items with thumbnails. Mitigation: paginate early, lazy-load thumbnails, add database indexes on (style, createdAt, likes).

## Anti-Patterns

### Anti-Pattern 1: Math.random() Leaks

**What people do:** Use `Math.random()` somewhere in the rendering pipeline, maybe in a utility function or imported library.
**Why it's wrong:** Destroys determinism. Same input produces different output on each render. Users notice when their "personal art" changes on reload.
**Do this instead:** Lint rule banning `Math.random()` in `lib/render/` directory. All randomness flows through the seeded PRNG instance passed as a function argument. Review third-party libraries for hidden `Math.random()` calls.

### Anti-Pattern 2: Coupled Pipeline Stages

**What people do:** Analysis function directly calls the normalizer, or the renderer directly calls the analyzer. Stages reach into each other.
**Why it's wrong:** Prevents independent versioning, independent testing, and the client-side local mode (which needs analysis without server-side normalization context).
**Do this instead:** Each stage is a pure function with typed input/output. The orchestrator (`runPipeline` or `usePipeline` hook) wires stages together. Stages never import each other.

### Anti-Pattern 3: Storing Raw Input Server-Side

**What people do:** Log the raw input for debugging, store it in the gallery entry, include it in the share link.
**Why it's wrong:** Users will paste sensitive text (passwords, personal notes, private messages). Storing raw input is a privacy liability and violates the core design principle.
**Do this instead:** Store only: parameter vector, provenance (which contains feature names and weights, not raw text), inputHash, inputPreview (first 50 chars, only for creator's session). Raw input exists only in the request lifetime.

### Anti-Pattern 4: Monolithic Renderer

**What people do:** Single giant `render()` function with a `switch(style)` that inlines all rendering logic. 3,000-line file.
**Why it's wrong:** Impossible to test individual styles. Adding a new style requires modifying existing code. Composition laws cannot be enforced per-style.
**Do this instead:** Strategy pattern. Each renderer is its own module implementing the `Renderer` interface. A factory function returns the correct renderer by name. Each renderer owns its composition laws.

### Anti-Pattern 5: Tight Coupling to Browser Canvas

**What people do:** Renderer code directly accesses `document.getElementById("canvas")` or browser-specific APIs.
**Why it's wrong:** Breaks server-side rendering for exports. Breaks testing. Forces separate export code path that will diverge from client rendering.
**Do this instead:** Renderers accept a `CanvasRenderingContext2D` parameter. They never create or access DOM elements. The calling code (React component or Node.js export handler) provides the context. This is the key to isomorphic rendering.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Python Microservice (FastAPI)** | Next.js Route Handlers call via HTTP (internal network). POST `/analyze/text`, POST `/analyze/data`. | Deploy on Railway/Fly.io. Internal network if possible (no public endpoint). Health check endpoint for monitoring. JSON request/response. Timeout: 10s for text, 30s for data. |
| **PostgreSQL** | Drizzle ORM from Next.js server-side code. | Connection pooling via pgBouncer or Neon's built-in pooler. Vercel Postgres or Neon for managed hosting. Migrations via `drizzle-kit push`. |
| **Vercel** | Next.js deployment. Route Handlers as serverless functions. Static pages for gallery SSR. | Be aware of function timeout limits (10s Hobby, 60s Pro). Export rendering may need background function. Edge functions for caching headers. |
| **CDN (Vercel Edge)** | Static assets + cached export images. | Gallery thumbnails and exported PNGs should be served from CDN after first generation. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **UI <-> Pipeline** | `usePipeline` hook orchestrates. Calls Route Handlers via fetch, or runs client-side pipeline directly (local mode). Returns typed `PipelineResult`. | Hook manages loading states, error handling, and progress callbacks. |
| **Route Handler <-> Pipeline** | Direct function import. Route Handler calls `runPipeline()` from `lib/pipeline/`. | No HTTP overhead for internal calls. Route Handler adds caching, rate limiting, auth checks around the pure pipeline. |
| **Route Handler <-> Python Microservice** | HTTP POST with JSON body. Next.js Route Handler acts as proxy/orchestrator. | Client never calls Python directly. Next.js is the single API surface. Python is an implementation detail. |
| **Pipeline <-> Renderer** | `ParameterVector` is the contract. Pipeline produces it, renderer consumes it. They share only the `types.ts` file. | This boundary is the core architectural insight. These two systems can be developed and tested completely independently as long as the parameter schema is stable. |
| **Renderer <-> Canvas** | Renderer receives `CanvasRenderingContext2D`. Never creates its own canvas. | Enables isomorphic rendering: browser canvas, node-canvas, test canvas, thumbnail canvas all work identically. |

## Build Order Implications

The architecture has clear dependency chains that dictate build order:

### Phase 1 Critical Path (Must build first)

```
ParameterVector type definition
    |
    +--> Seeded PRNG (Mulberry32)
    |       |
    |       +--> Palette generation (OKLCH)
    |       |       |
    |       |       +--> Geometric Renderer (first style)
    |       |
    |       +--> Composition rules (shared base)
    |
    +--> Text Canonicalizer
    |       |
    |       +--> Text Analyzer (NLP features)
    |               |
    |               +--> Normalizer (quantile-based)
    |                       |
    |                       +--> Provenance Generator
    |
    +--> Calibration Harness (30+ text reference inputs)
```

**Why this order:** The ParameterVector schema is the interface contract that both sides of the system depend on -- define it first. The PRNG and canonicalizer are low-level utilities needed by everything above. The calibration harness must exist before normalization tuning. Build one renderer (Geometric is simplest) to prove the full pipeline end-to-end before adding styles.

### Phase 2 Dependencies (After pipeline works end-to-end)

```
Geometric Renderer (already built)
    |
    +--> Organic Renderer (reuses palette + PRNG + composition base)
    +--> Particle Renderer (reuses palette + PRNG, adds mobile cap)
    +--> Typographic Renderer (reuses palette + PRNG, text-specific)
    |
    +--> Style Selector with mini-preview thumbnails
    +--> Progressive canvas animation
```

**Why this order:** All additional renderers share the base infrastructure (palette, PRNG, composition rules) built in Phase 1. They are independent of each other and could theoretically be built in parallel.

### Phase 3 Dependencies (After core rendering is stable)

```
URL Canonicalizer + SSRF Protection
    |
    +--> URL Scraper (Cheerio + readability)
    |       |
    |       +--> URL Analyzer (text sub-pipeline + URL-specific features)
    |
Data Canonicalizer (JSON/CSV)
    |
    +--> Data Analyzer (statistics)
    |
Both --> Expand calibration harness to 60+ inputs
         |
         +--> Retune normalization across all input types
```

**Why this order:** URL and data analyzers are completely independent of each other but both depend on the normalization system being stable. SSRF protection is a prerequisite for the URL scraper (not optional, not "add later"). The calibration harness expansion and normalization retuning must happen after all input types exist.

### Phase 4 Dependencies (After all input types work)

```
PostgreSQL + Drizzle Schema
    |
    +--> Analysis Cache (depends on schema)
    +--> Gallery CRUD (depends on schema)
    +--> Share Links (depends on schema)
    +--> Compare Mode (depends on share links)
    |
Client-side Text Analysis (depends on pipeline being stable)
    |
    +--> Local-Only Mode toggle
```

**Why this order:** Database is the foundation for all persistence features. Gallery, sharing, and compare mode all depend on stored data. Local-only mode requires the pipeline to be stable and proven correct before porting to client-side execution.

### Phase 5 Dependencies (Polish, mostly independent)

```
Server-side Export Rendering (node-canvas)
    |
    +--> PNG export at 4096x4096
    +--> SVG export (Geometric, Typographic)
    |
Dark/light mode, keyboard nav, reduced motion, progress animation
    (Independent of each other, can be built in any order)
```

## Decision: Hybrid Stack vs All-Node

**Recommendation: Start All-Node, add Python only if analysis quality is insufficient.**

Rationale: The spec explicitly states lexicon-based sentiment (AFINN-165) is sufficient for text. The `sentiment` npm package and pure-JS statistics are adequate for the V1 feature set. Starting with a single deployment (Vercel) eliminates inter-service communication complexity, deployment coordination, and the "cold start" problem of two services. If the NLP needs outgrow the Node.js ecosystem (e.g., adding VADER, spaCy, or ML-based analysis), the pipeline's stage separation makes it straightforward to swap in a Python microservice later -- the analyzer interface stays the same, only the implementation changes.

**Confidence: MEDIUM.** This contradicts the spec's default recommendation of Python, but is grounded in the principle of minimizing deployment complexity for a portfolio project. The architecture supports either approach without structural changes.

## Sources

- [The Pipeline Pattern: Streamlining Data Processing](https://dev.to/wallacefreitas/the-pipeline-pattern-streamlining-data-processing-in-software-architecture-44hn) -- Pipeline stage composition patterns in TypeScript
- [Generative Art with Node.js and Canvas](https://mattdesl.svbtle.com/generative-art-with-nodejs-and-canvas) -- Dual-entry-point architecture (browser + Node.js) with seeded PRNG for deterministic rendering
- [Strategy Pattern in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example) -- Strategy pattern for pluggable renderers
- [Mulberry32 PRNG](https://github.com/cprosche/mulberry32) -- Fast 32-bit seeded PRNG for JavaScript
- [TC39 Seeded Random Proposal](https://github.com/tc39/proposal-seeded-random) -- Standards track for native seeded PRNG (ChaCha12)
- [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) -- Perceptual color space rationale
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) -- Route Handler vs Server Action architecture
- [Next.js Server Actions](https://nextjs.org/docs/app) -- Data mutation patterns for App Router
- [Skia Canvas](https://github.com/samizdatco/skia-canvas) -- Server-side canvas alternative to node-canvas
- [Canvas Anti-Aliasing (WHATWG)](https://github.com/whatwg/html/issues/3181) -- Cross-browser canvas determinism limitations
- [FastAPI Microservices Patterns](https://talent500.com/blog/fastapi-microservices-python-api-design-patterns-2025/) -- Python microservice communication patterns
- [Next.js + Drizzle ORM](https://vercel.com/templates/next.js/postgres-drizzle) -- Database integration template
- [Data Pipeline Architecture Patterns](https://dagster.io/guides/data-pipeline-architecture-5-design-patterns-with-examples) -- General pipeline architecture principles

---
*Architecture research for: Synesthesia Machine (deterministic generative art web application)*
*Researched: 2026-03-02*
