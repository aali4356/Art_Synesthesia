import { NextResponse } from 'next/server';
import {
  reportCounts,
  REPORT_FLAG_THRESHOLD,
} from '../../moderation/report/route';

/**
 * GET /api/admin/review
 *
 * Returns gallery items flagged for review (report_count >= 3).
 * Protected by ADMIN_SECRET environment variable (SEC-06).
 *
 * Phase 7 stub: reads from in-memory reportCounts. Phase 8 queries DB.
 */
export async function GET(request: Request): Promise<Response> {
  // Admin auth check
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Collect flagged items
  const flaggedItems: Array<{ itemId: string; reportCount: number }> = [];
  for (const [itemId, count] of reportCounts.entries()) {
    if (count >= REPORT_FLAG_THRESHOLD) {
      flaggedItems.push({ itemId, reportCount: count });
    }
  }

  return NextResponse.json({
    flagged: flaggedItems,
    total: flaggedItems.length,
  });
}

/**
 * DELETE /api/admin/review
 * Body: { itemId: string }
 * Removes an item from the flagged list after admin review.
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

  reportCounts.delete(itemId);
  return NextResponse.json({ removed: true, itemId });
}
