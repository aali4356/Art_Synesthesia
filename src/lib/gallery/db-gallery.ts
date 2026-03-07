import { db } from '@/db';
import { galleryItems } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { GalleryItem, NewGalleryItem } from '@/db/schema/gallery-items';

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Insert a new gallery item. Returns the created row with its generated UUID.
 */
export async function createGalleryItem(item: NewGalleryItem): Promise<GalleryItem> {
  const [row] = await db.insert(galleryItems).values(item).returning();
  return row;
}

// ---------------------------------------------------------------------------
// Owner delete (GAL-08)
// ---------------------------------------------------------------------------

/**
 * Delete a gallery item by id only when creatorToken matches.
 * Returns true if a row was deleted, false if not found or token mismatch.
 */
export async function deleteGalleryItem(id: string, creatorToken: string): Promise<boolean> {
  const result = await db
    .delete(galleryItems)
    .where(and(eq(galleryItems.id, id), eq(galleryItems.creatorToken, creatorToken)));
  return ((result as unknown as { rowCount?: number }).rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Upvote (GAL-05 popular sort)
// ---------------------------------------------------------------------------

/**
 * Atomically increment upvote_count for a gallery item.
 * Returns the new upvoteCount, or null if item not found.
 */
export async function incrementUpvoteCount(id: string): Promise<number | null> {
  const rows = await db
    .update(galleryItems)
    .set({ upvoteCount: sql`${galleryItems.upvoteCount} + 1` })
    .where(eq(galleryItems.id, id))
    .returning({ upvoteCount: galleryItems.upvoteCount });
  return rows[0]?.upvoteCount ?? null;
}

// ---------------------------------------------------------------------------
// Moderation / reporting (GAL-07, SEC-06)
// ---------------------------------------------------------------------------

/**
 * Atomically increment report_count and set flagged=true when count reaches 3.
 * Returns updated { reportCount, flagged }, or null if item not found.
 */
export async function incrementReportCount(
  id: string
): Promise<{ reportCount: number; flagged: boolean } | null> {
  const rows = await db
    .update(galleryItems)
    .set({
      reportCount: sql`${galleryItems.reportCount} + 1`,
      flagged: sql`(${galleryItems.reportCount} + 1) >= 3`,
    })
    .where(eq(galleryItems.id, id))
    .returning({ reportCount: galleryItems.reportCount, flagged: galleryItems.flagged });
  const row = rows[0];
  if (!row) return null;
  return { reportCount: row.reportCount, flagged: row.flagged };
}

// ---------------------------------------------------------------------------
// Admin review (SEC-06)
// ---------------------------------------------------------------------------

/**
 * Return all flagged gallery items (flagged=true) for admin review.
 */
export async function getFlaggedItems(): Promise<GalleryItem[]> {
  return db.query.galleryItems.findMany({
    where: eq(galleryItems.flagged, true),
    orderBy: [desc(galleryItems.createdAt)],
  });
}

/**
 * Admin hard-delete: remove a flagged item from the gallery entirely.
 * Returns true if a row was deleted.
 */
export async function deleteFlaggedItem(id: string): Promise<boolean> {
  const result = await db
    .delete(galleryItems)
    .where(eq(galleryItems.id, id));
  return ((result as unknown as { rowCount?: number }).rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Browse (GAL-03, GAL-05) — used by Plan 08-02
// ---------------------------------------------------------------------------

export interface GalleryBrowseOptions {
  style?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
  offset?: number;
}

/**
 * Fetch non-flagged gallery items with optional style filter and sort.
 * Defaults: sort=recent, limit=20, offset=0.
 */
export async function getGalleryItems(opts: GalleryBrowseOptions = {}): Promise<GalleryItem[]> {
  const { style, sort = 'recent', limit = 20, offset = 0 } = opts;

  const orderBy = sort === 'popular'
    ? [desc(galleryItems.upvoteCount), desc(galleryItems.createdAt)]
    : [desc(galleryItems.createdAt)];

  if (style) {
    return db.query.galleryItems.findMany({
      where: and(eq(galleryItems.styleName, style), eq(galleryItems.flagged, false)),
      orderBy,
      limit,
      offset,
    });
  }

  return db.query.galleryItems.findMany({
    where: eq(galleryItems.flagged, false),
    orderBy,
    limit,
    offset,
  });
}

/**
 * Fetch a single gallery item by id. Returns null if not found.
 */
export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  const row = await db.query.galleryItems.findFirst({
    where: eq(galleryItems.id, id),
  });
  return row ?? null;
}
