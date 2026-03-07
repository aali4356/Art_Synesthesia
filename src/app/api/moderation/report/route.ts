import { NextResponse } from 'next/server';
import { incrementReportCount } from '@/lib/gallery/db-gallery';

/**
 * POST /api/moderation/report
 *
 * Reports a gallery item (GAL-07).
 * Phase 8: DB-backed via incrementReportCount — replaces Phase 7 in-memory stub.
 *
 * Body: { itemId: string }
 *
 * Response:
 *   200: { reported: true, reportCount: number, flagged: boolean, message: string }
 *   400: { error: string }  (missing itemId or invalid JSON)
 *   404: { error: string }  (item not found in DB)
 */
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

  const result = await incrementReportCount(itemId);

  if (!result) {
    return NextResponse.json(
      { error: 'Gallery item not found' },
      { status: 404 }
    );
  }

  const { reportCount, flagged } = result;

  return NextResponse.json({
    reported: true,
    reportCount,
    flagged,
    message: flagged
      ? 'Item flagged for admin review'
      : `Item reported (${reportCount}/3 for flagging)`,
  });
}
