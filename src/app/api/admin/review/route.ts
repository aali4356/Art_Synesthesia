import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getGalleryDb() {
  return import('@/lib/gallery/db-gallery');
}

/**
 * GET /api/admin/review
 *
 * Returns gallery items flagged for review (report_count >= 3).
 * Protected by ADMIN_SECRET environment variable (SEC-06).
 *
 * Phase 8: DB-backed via getFlaggedItems — replaces Phase 7 in-memory stub.
 */
export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { getFlaggedItems } = await getGalleryDb();
    const items = await getFlaggedItems();

    return NextResponse.json({
      flagged: items,
      total: items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin review backend unavailable';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/**
 * DELETE /api/admin/review
 *
 * Hard-deletes a gallery item after admin review (SEC-06).
 * Body: { itemId: string }
 *
 * Phase 8: DB-backed via deleteFlaggedItem — replaces Phase 7 in-memory stub.
 */
export async function DELETE(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { itemId } = body;
  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
  }

  try {
    const { deleteFlaggedItem } = await getGalleryDb();
    const deleted = await deleteFlaggedItem(itemId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ removed: true, itemId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin review backend unavailable';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
