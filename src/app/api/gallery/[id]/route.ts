import { NextResponse } from 'next/server';
import { deleteGalleryItem, getGalleryItem, incrementUpvoteCount } from '@/lib/gallery/db-gallery';

/**
 * GET /api/gallery/[id]
 * Fetch a single gallery item by id for full-size view (GAL-06).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const item = await getGalleryItem(id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ item });
}

/**
 * DELETE /api/gallery/[id]
 * Deletes the gallery item only when X-Creator-Token matches (GAL-08).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const token = request.headers.get('x-creator-token');
  if (!token) {
    return NextResponse.json(
      { error: 'Missing X-Creator-Token header' },
      { status: 401 }
    );
  }

  const deleted = await deleteGalleryItem(id, token);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Item not found or token mismatch' },
      { status: 403 }
    );
  }

  return NextResponse.json({ deleted: true, id });
}

/**
 * POST /api/gallery/[id] — upvote
 * Atomically increments upvote_count (GAL-05 popular sort).
 * Anti-spam: client stores upvoted IDs in localStorage (disable button).
 * Server-side per-IP deduplication is out of scope for v1.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const newCount = await incrementUpvoteCount(id);
  if (newCount === null) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  return NextResponse.json({ upvoted: true, upvoteCount: newCount });
}
