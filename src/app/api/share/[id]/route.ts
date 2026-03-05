import { NextResponse } from 'next/server';
import { db } from '@/db';
import { shareLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/share/[id]
 *
 * Resolves a share link by ID and returns the stored parameter data.
 * Returns ONLY: parameterVector, versionInfo, styleName, createdAt
 * Never exposes raw input text (SHARE-02, SHARE-03).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
  }

  const link = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.id, id),
  });

  if (!link) {
    return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
  }

  // Return ONLY the non-sensitive fields. No raw input ever stored here.
  return NextResponse.json({
    parameterVector: link.parameterVector,
    versionInfo: link.versionInfo,
    styleName: link.styleName,
    createdAt: link.createdAt,
  });
}
