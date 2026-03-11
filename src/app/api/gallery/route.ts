import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { containsProfanity } from '@/lib/moderation/profanity';
import { createGalleryItem, getGalleryItems } from '@/lib/gallery/db-gallery';

// ---------------------------------------------------------------------------
// Rate limiting (SEC-04): 10 gallery saves per IP per day, in-memory
// Phase 8 note: in-memory is acceptable for single-instance v1.
// ---------------------------------------------------------------------------

const gallerySaveMap = new Map<
  string,
  { count: number; windowStart: number }
>();
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SAVES_PER_DAY = 10;

function getGalleryRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = gallerySaveMap.get(ip);
  if (!entry || now - entry.windowStart > DAY_MS) {
    gallerySaveMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_SAVES_PER_DAY - 1 };
  }
  if (entry.count >= MAX_SAVES_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_SAVES_PER_DAY - entry.count };
}

/**
 * POST /api/gallery
 *
 * Gallery save endpoint (GAL-01, GAL-02).
 *
 * Body: {
 *   parameterVector: ParameterVector,
 *   versionInfo: VersionInfo,
 *   styleName: string,
 *   title?: string,
 *   inputPreview?: string,     -- max 50 chars, user-edited, NOT raw input
 *   thumbnailData?: string,    -- base64 PNG data URL
 *   creatorToken?: string,     -- random UUID from client localStorage (GAL-08)
 * }
 */
export async function POST(request: Request): Promise<Response> {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    (forwarded ? forwarded.split(',')[0].trim() : null) ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const { allowed, remaining } = getGalleryRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Gallery save rate limit exceeded (10 per day)' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const rateLimitHeader = { 'X-RateLimit-Remaining': String(remaining) };

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  // Privacy gate: no raw input fields (PRIV-02, PRIV-03)
  if ('rawInput' in body || 'inputText' in body || 'raw_input' in body) {
    return NextResponse.json(
      { error: 'Gallery entries must not contain raw input text' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  const {
    parameterVector,
    versionInfo,
    styleName,
    title,
    inputPreview,
    thumbnailData,
    creatorToken,
  } = body;

  if (!parameterVector || typeof parameterVector !== 'object') {
    return NextResponse.json(
      { error: 'Missing parameterVector' },
      { status: 400, headers: rateLimitHeader }
    );
  }
  if (!versionInfo || typeof versionInfo !== 'object') {
    return NextResponse.json(
      { error: 'Missing versionInfo' },
      { status: 400, headers: rateLimitHeader }
    );
  }
  if (!styleName || typeof styleName !== 'string') {
    return NextResponse.json(
      { error: 'Missing styleName' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  if (title && typeof title === 'string' && containsProfanity(title)) {
    return NextResponse.json(
      { error: 'Title contains inappropriate content' },
      { status: 422, headers: rateLimitHeader }
    );
  }

  if (
    inputPreview &&
    typeof inputPreview === 'string' &&
    containsProfanity(inputPreview)
  ) {
    return NextResponse.json(
      { error: 'Input preview contains inappropriate content' },
      { status: 422, headers: rateLimitHeader }
    );
  }

  if (
    inputPreview &&
    typeof inputPreview === 'string' &&
    inputPreview.length > 50
  ) {
    return NextResponse.json(
      { error: 'Input preview must be 50 characters or fewer' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  // Write to gallery_items table (Phase 8 — replaces stub)
  const item = await createGalleryItem({
    parameterVector: parameterVector as never,
    versionInfo: versionInfo as never,
    styleName: styleName as string,
    title: title && typeof title === 'string' ? title : null,
    inputPreview: inputPreview && typeof inputPreview === 'string' ? inputPreview : null,
    thumbnailData: thumbnailData && typeof thumbnailData === 'string' ? thumbnailData : null,
    creatorToken: creatorToken && typeof creatorToken === 'string' ? creatorToken : null,
  });

  return NextResponse.json(
    { saved: true, id: item.id },
    { status: 201, headers: rateLimitHeader }
  );
}

/**
 * GET /api/gallery
 * Browse gallery items with optional style filter and sort (GAL-03, GAL-05).
 * Query params: style, sort (recent|popular), page, limit
 */
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
