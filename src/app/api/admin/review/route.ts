import { NextResponse } from 'next/server';
import { getFlaggedItems, deleteFlaggedItem } from '@/lib/gallery/db-gallery';

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

  const items = await getFlaggedItems();

  return NextResponse.json({
    flagged: items,
    total: items.length,
  });
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

  const deleted = await deleteFlaggedItem(itemId);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ removed: true, itemId });
}
