import { NextResponse } from 'next/server';

/**
 * POST /api/moderation/report
 *
 * Reports a gallery item. After 3 reports, item is flagged for review (SEC-06).
 *
 * Phase 7 stub: Uses in-memory map. Phase 8 upgrades to DB-backed report_count column.
 *
 * Body: { itemId: string }
 */

// In-memory report tracking (Phase 7 stub; Phase 8 replaces with DB)
const reportCounts = new Map<string, number>();
const REPORT_FLAG_THRESHOLD = 3;

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { itemId } = body;
  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid itemId' },
      { status: 400 }
    );
  }

  const current = reportCounts.get(itemId) ?? 0;
  const newCount = current + 1;
  reportCounts.set(itemId, newCount);

  const flagged = newCount >= REPORT_FLAG_THRESHOLD;

  return NextResponse.json({
    reported: true,
    reportCount: newCount,
    flagged,
    message: flagged
      ? 'Item flagged for admin review'
      : `Item reported (${newCount}/${REPORT_FLAG_THRESHOLD} for flagging)`,
  });
}

// Export for testing and admin route
export { reportCounts, REPORT_FLAG_THRESHOLD };
