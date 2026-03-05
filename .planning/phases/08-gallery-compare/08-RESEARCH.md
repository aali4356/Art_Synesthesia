# Phase 8: Gallery & Compare - Research

**Researched:** 2026-03-05
**Domain:** Gallery CRUD, compare mode UI, moderation upgrade (in-memory to DB), Drizzle ORM queries
**Confidence:** HIGH

## Summary

Phase 8 builds on extensive Phase 7 infrastructure. The `gallery_items` database table already exists with the correct schema (parameter vector, version info, style name, title, input preview, thumbnail, report count, flagged status). The `POST /api/gallery` route already has rate limiting (SEC-04), profanity filtering (SEC-05), and privacy gates (PRIV-02/03) -- but returns a stub response instead of writing to the database. The `POST /api/moderation/report` and `GET/DELETE /api/admin/review` routes exist as in-memory stubs. Phase 8 upgrades all of these to use real DB operations.

The primary new work is: (1) completing the gallery save flow with preview UI and DB write, (2) building a gallery browse page with filtering/sorting/pagination, (3) creating a compare mode that renders two inputs side-by-side with parameter diff, and (4) upgrading moderation from in-memory maps to DB-backed report counts. Two schema gaps were identified: no `upvoteCount` column for "popular" sorting, and no creator identification column for ownership/deletion.

**Primary recommendation:** Add `upvote_count` integer column and `creator_token` text column to gallery_items schema. Use a random token stored in localStorage for creator identification (no auth system). Upgrade existing stub routes to real DB operations using the established db-cache.ts pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAL-01 | Save to Gallery is explicit opt-in with preview of public content (thumbnail, input preview first 50 chars, title, style) | Gallery save modal component + existing POST /api/gallery route upgrade |
| GAL-02 | User can edit or remove input preview before saving | Save modal with editable input preview field, max 50 chars, removable |
| GAL-03 | Gallery page shows thumbnails with style name, date, optional title | New /gallery page with server component, Drizzle query on gallery_items |
| GAL-04 | Input preview hidden by default in gallery cards (click to reveal) | GalleryCard component with collapsed/expanded state for input preview |
| GAL-05 | Filter gallery by style and sort by recent or popular (upvote count) | Query builder with WHERE styleName filter, ORDER BY createdAt or upvoteCount; schema needs upvote_count column |
| GAL-06 | Click gallery card to view full size with translation panel | /gallery/[id] page with GalleryViewer (reuses ShareViewer pattern) |
| GAL-07 | Report button on every gallery item | Upgrade /api/moderation/report to DB-backed report_count increment |
| GAL-08 | User can delete their own gallery entries | Creator token (localStorage) stored in gallery_items; DELETE /api/gallery/[id] with token check |
| COMP-01 | Two inputs side by side in same style | CompareMode component with dual InputZone + dual canvas layout |
| COMP-02 | Parameter vectors displayed in parallel with visual diff highlighting | Dual ParameterPanel with color-coded bars showing delta |
| COMP-03 | Auto-generated difference summary ("differ most in rhythm (+0.43)") | Pure function computing top-N parameter deltas with formatted text |
| COMP-04 | Style selector changes both artworks simultaneously | Shared activeStyle state across both canvases in CompareMode |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.0 | Database ORM for gallery queries | Already used for share_links, caches; established pattern |
| @neondatabase/serverless | ^0.10.0 | PostgreSQL driver | Already configured in src/db/index.ts |
| next | 16.1.6 | App Router for pages and API routes | Project framework |
| react | 19.2.3 | UI components | Project framework |
| obscenity | ^0.4.0 | Profanity filtering | Already used in src/lib/moderation/profanity.ts |
| next-themes | ^0.4.6 | Theme resolution for canvas rendering | Already used in ShareViewer |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| culori | ^4.0.2 | Color utilities for diff highlighting | Compare mode parameter diff colors |
| vitest | ^4.0.18 | Test framework | All new tests |
| @testing-library/react | ^16.3.2 | Component testing | Gallery/compare UI tests |

### No New Dependencies Needed
All Phase 8 requirements can be met with the existing dependency set. No new npm packages are required.

## Architecture Patterns

### Schema Changes Required

The existing `gallery_items` schema is mostly complete but needs two new columns:

```typescript
// Add to src/db/schema/gallery-items.ts
upvoteCount: integer('upvote_count').default(0).notNull(),
creatorToken: text('creator_token'),  // random token from localStorage, not IP
```

**Why `creatorToken` instead of IP:**
- IPs are shared (NAT, VPN, corporate networks) -- cannot reliably identify creators
- A random UUID stored in localStorage is unique per browser session
- No GDPR/privacy concern since it is not an IP address
- Matches the project's privacy-first philosophy (no user accounts, PRIV-01)

**Why `upvoteCount` is needed:**
- GAL-05 requires sorting by "popular" which spec defines as "upvote count"
- Current schema only has `reportCount` (negative signal)
- A simple integer counter suffices; anti-abuse via IP-based rate limiting

### Recommended Project Structure
```
src/
  app/
    gallery/
      page.tsx              # Gallery browse page (Server Component)
      [id]/
        page.tsx            # Gallery detail page (Server Component)
        GalleryViewer.tsx   # Client component (similar to ShareViewer)
    compare/
      page.tsx              # Compare mode page
      CompareMode.tsx       # Client component with dual canvases
    api/
      gallery/
        route.ts            # UPGRADE: POST (save), GET (browse with filters)
        [id]/
          route.ts          # NEW: GET (detail), DELETE (owner delete), POST (upvote)
      moderation/
        report/
          route.ts          # UPGRADE: in-memory -> DB-backed
      admin/
        review/
          route.ts          # UPGRADE: in-memory -> DB query
  components/
    gallery/
      GalleryCard.tsx       # Thumbnail card with reveal, report, upvote
      GallerySaveModal.tsx  # Opt-in save dialog with preview/edit
      GalleryGrid.tsx       # Grid layout with filter/sort controls
      GalleryFilters.tsx    # Style filter dropdown, sort selector
  lib/
    gallery/
      db-gallery.ts         # DB operations for gallery (follows db-cache.ts pattern)
    compare/
      diff.ts               # Parameter vector diff computation
      summary.ts            # Auto-generated difference summary text
  __tests__/
    api/
      gallery-save.test.ts  # POST /api/gallery DB integration
      gallery-browse.test.ts # GET /api/gallery with filters
      gallery-delete.test.ts # DELETE /api/gallery/[id]
      gallery-upvote.test.ts # POST /api/gallery/[id] (upvote)
    gallery/
      save-modal.test.tsx   # GallerySaveModal component
      gallery-card.test.tsx # GalleryCard component
    compare/
      diff.test.ts          # Parameter vector diff
      summary.test.ts       # Difference summary generation
      compare-mode.test.tsx # CompareMode component
    moderation/
      db-report.test.ts     # DB-backed moderation tests
```

### Pattern 1: Gallery DB Operations (follows db-cache.ts pattern)
**What:** Centralize all gallery DB operations in `src/lib/gallery/db-gallery.ts`
**When to use:** All gallery API routes import from db-gallery, not from `@/db` directly
**Example:**
```typescript
// src/lib/gallery/db-gallery.ts
import { db } from '@/db';
import { galleryItems } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { GalleryItem, NewGalleryItem } from '@/db/schema/gallery-items';

export async function createGalleryItem(item: NewGalleryItem): Promise<GalleryItem> {
  const [row] = await db.insert(galleryItems).values(item).returning();
  return row;
}

export async function getGalleryItems(opts: {
  style?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
  offset?: number;
}): Promise<GalleryItem[]> {
  const { style, sort = 'recent', limit = 20, offset = 0 } = opts;
  const conditions = [];
  if (style) conditions.push(eq(galleryItems.styleName, style));
  conditions.push(eq(galleryItems.flagged, false)); // hide flagged items

  const orderBy = sort === 'popular'
    ? desc(galleryItems.upvoteCount)
    : desc(galleryItems.createdAt);

  return db.query.galleryItems.findMany({
    where: and(...conditions),
    orderBy: [orderBy],
    limit,
    offset,
  });
}

export async function deleteGalleryItem(id: string, creatorToken: string): Promise<boolean> {
  const result = await db
    .delete(galleryItems)
    .where(and(eq(galleryItems.id, id), eq(galleryItems.creatorToken, creatorToken)));
  return (result as unknown as { rowCount?: number }).rowCount !== 0;
}

export async function incrementReportCount(id: string): Promise<{ reportCount: number; flagged: boolean }> {
  const [row] = await db
    .update(galleryItems)
    .set({
      reportCount: sql`${galleryItems.reportCount} + 1`,
      flagged: sql`${galleryItems.reportCount} + 1 >= 3`,
    })
    .where(eq(galleryItems.id, id))
    .returning({ reportCount: galleryItems.reportCount, flagged: galleryItems.flagged });
  return row;
}
```

### Pattern 2: Creator Token (localStorage-based ownership)
**What:** Generate a random UUID on first gallery save, store in localStorage, send as header
**When to use:** Gallery save and delete operations
**Example:**
```typescript
// Client-side: src/lib/gallery/creator-token.ts
const STORAGE_KEY = 'synesthesia-creator-token';

export function getOrCreateCreatorToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}
```

### Pattern 3: Gallery Detail Page (reuses ShareViewer pattern)
**What:** Server Component fetches gallery item from DB, passes to GalleryViewer client component
**When to use:** /gallery/[id] page
**Example:**
```typescript
// Follows exact same pattern as src/app/share/[id]/page.tsx
export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.query.galleryItems.findFirst({
    where: eq(galleryItems.id, id),
  });
  if (!item) return <NotFound />;
  return <GalleryViewer item={item} />;
}
```

### Pattern 4: Compare Mode (dual pipeline)
**What:** Two independent input zones feeding two canvas renders with a shared style selector
**When to use:** /compare page
**Example:**
```typescript
// CompareMode uses two useTextAnalysis hooks
const left = useTextAnalysis();
const right = useTextAnalysis();
const [activeStyle, setActiveStyle] = useState<StyleName>('geometric');
// Both canvases render with the same activeStyle
```

### Anti-Patterns to Avoid
- **Direct DB imports in API routes:** Always go through `db-gallery.ts` (follows db-cache.ts pattern from Phase 7). This makes testing straightforward -- mock `@/lib/gallery/db-gallery` not `@/db`.
- **IP-based ownership:** IPs are shared and ephemeral. Use localStorage token instead.
- **Storing raw input in gallery:** The privacy contract (PRIV-03) explicitly forbids this. `inputPreview` is a max-50-char user-edited summary, NOT the raw input.
- **Building custom pagination:** Use Drizzle's `limit` + `offset` with cursor-based fallback if needed later. Keep it simple for v1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Profanity filtering | Custom word list | `obscenity` library (already installed) | Handles l33tspeak, Unicode evasion, homoglyphs |
| Database queries | Raw SQL strings | Drizzle ORM query builder | Type-safe, composable, already established |
| UUID generation | Custom ID generator | `crypto.randomUUID()` + Drizzle `defaultRandom()` | Already used in share_links schema |
| Theme detection | Manual `prefers-color-scheme` | `next-themes` useTheme() | Already used in ShareViewer, handles SSR |
| Parameter diff display | Custom bar chart renderer | Extend existing ParameterPanel with diff mode | Bars already rendered as CSS widths in ParameterPanel |

**Key insight:** Phase 8 is primarily a wiring phase. Almost all infrastructure exists (schema, profanity filter, rate limiter, scene graph builders, canvas components, parameter panel). The work is connecting these pieces and building UI around them.

## Common Pitfalls

### Pitfall 1: Gallery Save Without Thumbnail Data
**What goes wrong:** Saving to gallery without generating a thumbnail means the browse page has nothing to show.
**Why it happens:** The canvas renders client-side; the thumbnail needs to be captured before the save request is sent to the server.
**How to avoid:** Use `canvas.toDataURL('image/png')` on the existing rendered canvas to capture a base64 thumbnail. The 200x200 thumbnail rendering already exists in StyleSelector (Phase 4 decision: 04-04). Resize the main canvas to thumbnail dimensions before capture, or render a separate small canvas.
**Warning signs:** Gallery cards showing blank or placeholder images.

### Pitfall 2: Stale Creator Token After Browser Clear
**What goes wrong:** User clears localStorage, loses ability to delete their gallery entries.
**Why it happens:** Creator token is only in localStorage -- no server-side session recovery.
**How to avoid:** Accept this limitation. It is consistent with the no-auth design. The entry remains in the gallery but the user cannot delete it. This is acceptable for a portfolio project. Document the behavior in UI ("Clearing browser data will prevent you from managing saved gallery items").
**Warning signs:** Users unable to delete entries.

### Pitfall 3: Report Count Race Condition
**What goes wrong:** Two concurrent reports on the same item might both read count=2 and both write count=3, but only one atomic increment actually happens.
**Why it happens:** Read-then-write pattern without atomic operation.
**How to avoid:** Use SQL `SET report_count = report_count + 1` (atomic increment) rather than reading count, adding 1, and writing back. The Drizzle `sql` template tag handles this: `sql\`${galleryItems.reportCount} + 1\``.
**Warning signs:** Report counts lower than expected.

### Pitfall 4: Compare Mode Memory Pressure
**What goes wrong:** Two full scene graphs (each with up to 10,000 particles) rendered simultaneously causes jank.
**Why it happens:** Double the normal rendering workload.
**How to avoid:** For compare mode, cap particle count lower (e.g., 5,000 on desktop) and use smaller canvas sizes (600x600 instead of 800x800). Use `animated={false}` for compare canvases -- static rendering is sufficient for comparison.
**Warning signs:** Low frame rates, browser tab unresponsive during compare mode rendering.

### Pitfall 5: Pagination Offset Drift
**What goes wrong:** If gallery items are added or deleted while a user is browsing, offset-based pagination shows duplicates or skips items.
**Why it happens:** New items shift all offsets.
**How to avoid:** For v1, offset-based pagination is acceptable. The gallery will have low write volume. If needed later, switch to cursor-based pagination (WHERE createdAt < lastSeen). Keep the API contract flexible (return a `nextCursor` field alongside items).
**Warning signs:** Duplicate gallery cards when paging.

### Pitfall 6: Mock Leakage From Phase 7 In-Memory Stubs
**What goes wrong:** Existing tests for moderation/report and admin/review use in-memory maps. When upgrading to DB-backed, the old tests will need updating.
**Why it happens:** Phase 7 intentionally created stubs that Phase 8 replaces.
**How to avoid:** Create new test files for DB-backed versions. Do not try to incrementally modify the in-memory stub tests -- replace the implementation and write fresh tests that mock `@/lib/gallery/db-gallery`.
**Warning signs:** Old tests passing but not testing real behavior.

## Code Examples

### Gallery Save Modal (GAL-01, GAL-02)
```typescript
// src/components/gallery/GallerySaveModal.tsx
interface GallerySaveModalProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  inputText: string;  // raw input (for generating preview, NOT sent to server)
  thumbnailDataUrl: string;  // captured from canvas
  onClose: () => void;
  onSaved: (id: string) => void;
}

// The modal shows:
// 1. Thumbnail preview (from captured canvas)
// 2. Title input (optional, profanity-checked client-side)
// 3. Input preview (first 50 chars of input, editable, removable)
// 4. Style name (read-only)
// 5. "Save to Gallery" button
```

### Parameter Vector Diff (COMP-02, COMP-03)
```typescript
// src/lib/compare/diff.ts
export interface ParameterDiff {
  parameter: string;
  leftValue: number;
  rightValue: number;
  delta: number;  // right - left (signed)
  absDelta: number;
}

export function computeParameterDiff(
  left: ParameterVector,
  right: ParameterVector
): ParameterDiff[] {
  const keys = Object.keys(left).filter(k => k !== 'extensions') as (keyof ParameterVector)[];
  return keys.map(key => ({
    parameter: key,
    leftValue: left[key] as number,
    rightValue: right[key] as number,
    delta: (right[key] as number) - (left[key] as number),
    absDelta: Math.abs((right[key] as number) - (left[key] as number)),
  })).sort((a, b) => b.absDelta - a.absDelta);
}

// COMP-03: Auto-generated difference summary
export function generateDiffSummary(diffs: ParameterDiff[]): string {
  const top = diffs.slice(0, 3);
  if (top.length === 0) return 'These inputs produce identical parameters.';
  const parts = top.map(d => {
    const sign = d.delta > 0 ? '+' : '';
    return `${d.parameter} (${sign}${d.delta.toFixed(2)})`;
  });
  return `These differ most in ${parts.join(', ')}`;
}
```

### Gallery Browse API (GAL-03, GAL-05)
```typescript
// GET /api/gallery?style=geometric&sort=recent&page=1&limit=20
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const style = url.searchParams.get('style') || undefined;
  const sort = (url.searchParams.get('sort') || 'recent') as 'recent' | 'popular';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const items = await getGalleryItems({ style, sort, limit, offset });
  return NextResponse.json({ items, page, limit });
}
```

### Thumbnail Capture (for gallery save)
```typescript
// Capture thumbnail from existing canvas element
export function captureThumbnail(canvas: HTMLCanvasElement, size = 200): string {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = size;
  thumbCanvas.height = size;
  const ctx = thumbCanvas.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, size, size);
  return thumbCanvas.toDataURL('image/png');
}
```

## State of the Art

| Old Approach (Phase 7) | Current Approach (Phase 8) | Impact |
|------------------------|---------------------------|--------|
| In-memory reportCounts Map | DB-backed report_count column on gallery_items | Persists across server restarts, scales to multiple instances |
| In-memory gallerySaveMap for rate limiting | Keep in-memory for now (acceptable for v1 single-instance) | Rate limiting resets on deploy -- acceptable tradeoff |
| Gallery save returns stub JSON | Gallery save writes to gallery_items table via Drizzle | Real persistence |
| No gallery browse page | /gallery page with SSR, filters, pagination | Full browse experience |
| No compare feature | /compare page with dual canvases and parameter diff | Core differentiator feature |
| No creator identification | localStorage creator token in gallery_items | Enables self-deletion without auth |

**No deprecated/outdated patterns to worry about** -- all existing code uses current Next.js 16 App Router conventions.

## Open Questions

1. **Upvote Spam Prevention**
   - What we know: GAL-05 requires sorting by "popular (upvote count)". No user auth exists.
   - What's unclear: What prevents one person from upvoting the same item many times?
   - Recommendation: Use IP-based rate limiting (1 upvote per IP per item). Store upvoted items in localStorage to disable the button visually. Accept that determined users can bypass this -- acceptable for a portfolio project.

2. **Thumbnail Storage Size**
   - What we know: Base64 PNG at 200x200 could be 5-50KB depending on complexity. Stored as text in PostgreSQL.
   - What's unclear: At scale, this could be large for the gallery_items table.
   - Recommendation: For v1, base64 in PostgreSQL is fine. The gallery will have at most hundreds of items (10 saves/IP/day rate limit). If needed, migrate to object storage (S3/R2) later. Keep the `thumbnailData` column as-is.

3. **Gallery Item Count Display**
   - What we know: GAL-05 mentions "popular" sorting but the requirements don't specify showing upvote counts.
   - What's unclear: Should upvote counts be visible on gallery cards?
   - Recommendation: Show a small upvote count on cards. Keeps UI informative and encourages engagement.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | vitest.config.mts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAL-01 | Save to gallery opt-in with preview | unit + component | `npx vitest run src/__tests__/api/gallery-save.test.ts -t "GAL-01" -x` | Wave 0 |
| GAL-02 | Edit/remove input preview before save | component | `npx vitest run src/__tests__/gallery/save-modal.test.tsx -t "GAL-02" -x` | Wave 0 |
| GAL-03 | Gallery page shows thumbnails | unit | `npx vitest run src/__tests__/api/gallery-browse.test.ts -t "GAL-03" -x` | Wave 0 |
| GAL-04 | Input preview hidden, click to reveal | component | `npx vitest run src/__tests__/gallery/gallery-card.test.tsx -t "GAL-04" -x` | Wave 0 |
| GAL-05 | Filter by style, sort by recent/popular | unit | `npx vitest run src/__tests__/api/gallery-browse.test.ts -t "GAL-05" -x` | Wave 0 |
| GAL-06 | Click card to view full size | component | `npx vitest run src/__tests__/gallery/gallery-card.test.tsx -t "GAL-06" -x` | Wave 0 |
| GAL-07 | Report button on every gallery item | unit | `npx vitest run src/__tests__/moderation/db-report.test.ts -t "GAL-07" -x` | Wave 0 |
| GAL-08 | Delete own gallery entries | unit | `npx vitest run src/__tests__/api/gallery-delete.test.ts -t "GAL-08" -x` | Wave 0 |
| COMP-01 | Two inputs side by side in same style | component | `npx vitest run src/__tests__/compare/compare-mode.test.tsx -t "COMP-01" -x` | Wave 0 |
| COMP-02 | Parallel parameter vectors with diff highlighting | unit | `npx vitest run src/__tests__/compare/diff.test.ts -t "COMP-02" -x` | Wave 0 |
| COMP-03 | Auto-generated difference summary | unit | `npx vitest run src/__tests__/compare/summary.test.ts -t "COMP-03" -x` | Wave 0 |
| COMP-04 | Style selector changes both artworks | component | `npx vitest run src/__tests__/compare/compare-mode.test.tsx -t "COMP-04" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/api/gallery-save.test.ts` -- covers GAL-01, GAL-02
- [ ] `src/__tests__/api/gallery-browse.test.ts` -- covers GAL-03, GAL-05
- [ ] `src/__tests__/api/gallery-delete.test.ts` -- covers GAL-08
- [ ] `src/__tests__/api/gallery-upvote.test.ts` -- covers GAL-05 (popular sort)
- [ ] `src/__tests__/gallery/save-modal.test.tsx` -- covers GAL-01, GAL-02
- [ ] `src/__tests__/gallery/gallery-card.test.tsx` -- covers GAL-04, GAL-06, GAL-07
- [ ] `src/__tests__/compare/diff.test.ts` -- covers COMP-02
- [ ] `src/__tests__/compare/summary.test.ts` -- covers COMP-03
- [ ] `src/__tests__/compare/compare-mode.test.tsx` -- covers COMP-01, COMP-04
- [ ] `src/__tests__/moderation/db-report.test.ts` -- covers GAL-07 (DB upgrade)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/db/schema/gallery-items.ts` -- existing schema with all columns except upvoteCount and creatorToken
- Codebase inspection: `src/app/api/gallery/route.ts` -- existing stub with rate limiting, profanity filter, privacy gate
- Codebase inspection: `src/app/api/moderation/report/route.ts` -- in-memory report tracking to be upgraded
- Codebase inspection: `src/app/api/admin/review/route.ts` -- in-memory admin review to be upgraded
- Codebase inspection: `src/lib/cache/db-cache.ts` -- established pattern for DB operation layer
- Codebase inspection: `src/app/share/[id]/page.tsx` + `ShareViewer.tsx` -- pattern for Server Component + Client viewer
- Codebase inspection: `src/components/results/ResultsView.tsx` -- where gallery save button will be added
- Codebase inspection: `src/components/results/ParameterPanel.tsx` -- to be extended for diff mode

### Secondary (MEDIUM confidence)
- Requirements spec: REQUIREMENTS.md GAL-01 through GAL-08, COMP-01 through COMP-04
- Drizzle ORM documentation for query builder patterns (well-established in codebase)

### Tertiary (LOW confidence)
- None -- all research based on direct codebase inspection and documented requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use; no new dependencies needed
- Architecture: HIGH -- patterns directly derived from existing codebase (db-cache, ShareViewer, API routes)
- Pitfalls: HIGH -- identified from concrete codebase analysis (schema gaps, in-memory stubs, thumbnail capture)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- no external dependency changes expected)
