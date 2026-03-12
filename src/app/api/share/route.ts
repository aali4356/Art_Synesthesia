import { NextResponse } from 'next/server';
import type { ParameterVector, VersionInfo } from '@/types/engine';

async function getShareDb() {
  const [{ db }, { shareLinks }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);

  return { db, shareLinks };
}

/**
 * POST /api/share
 *
 * Creates a share link for a generated artwork.
 *
 * Body: { vector: ParameterVector, version: VersionInfo, style: string }
 *
 * Privacy contract (SHARE-01, PRIV-02):
 * - Accepts ONLY vector, version, and style
 * - Rejects any request body that includes rawInput or inputText fields
 *
 * Returns: { shareId: string, url: string }
 */
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Privacy gate: reject if caller accidentally sends raw input fields
  if ('rawInput' in body || 'inputText' in body || 'raw_input' in body) {
    return NextResponse.json(
      { error: 'Share links must not contain raw input text' },
      { status: 400 }
    );
  }

  const { vector, version, style } = body;

  if (!vector || typeof vector !== 'object') {
    return NextResponse.json(
      { error: 'Missing or invalid parameter vector' },
      { status: 400 }
    );
  }
  if (!version || typeof version !== 'object') {
    return NextResponse.json(
      { error: 'Missing or invalid version info' },
      { status: 400 }
    );
  }
  if (!style || typeof style !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid style name' },
      { status: 400 }
    );
  }

  try {
    const { db, shareLinks } = await getShareDb();

    // Generate share ID and persist
    const shareId = crypto.randomUUID();
    await db.insert(shareLinks).values({
      id: shareId,
      parameterVector: vector as ParameterVector,
      versionInfo: version as VersionInfo,
      styleName: style,
    });

    return NextResponse.json(
      { shareId, url: `/share/${shareId}` },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share backend unavailable';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
