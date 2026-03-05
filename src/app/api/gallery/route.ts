import { NextResponse } from 'next/server';
import { containsProfanity } from '@/lib/moderation/profanity';

// ---------------------------------------------------------------------------
// Rate limiting (SEC-04): 10 gallery saves per IP per day, in-memory
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
 * Gallery save endpoint (Phase 7 stub -- full implementation in Phase 8).
 *
 * Phase 7 implements:
 * - Rate limiting: 10 saves/IP/day (SEC-04)
 * - Profanity filter: title and inputPreview checked (SEC-05)
 * - Privacy gate: no raw input text accepted (PRIV-02, PRIV-03)
 *
 * Body: {
 *   parameterVector: ParameterVector,
 *   versionInfo: VersionInfo,
 *   styleName: string,
 *   title?: string,
 *   inputPreview?: string  -- max 50 chars, user-edited summary (not raw input)
 * }
 */
export async function POST(request: Request): Promise<Response> {
  // Extract IP for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    (forwarded ? forwarded.split(',')[0].trim() : null) ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Rate limit check (SEC-04)
  const { allowed, remaining } = getGalleryRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Gallery save rate limit exceeded (10 per day)' },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': '0' },
      }
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

  // Privacy gate: no raw input text fields permitted (PRIV-02, PRIV-03)
  if ('rawInput' in body || 'inputText' in body || 'raw_input' in body) {
    return NextResponse.json(
      { error: 'Gallery entries must not contain raw input text' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  const { parameterVector, versionInfo, styleName, title, inputPreview } =
    body;

  // Validate required fields
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

  // Profanity filter on title (SEC-05)
  if (title && typeof title === 'string' && containsProfanity(title)) {
    return NextResponse.json(
      { error: 'Title contains inappropriate content' },
      { status: 422, headers: rateLimitHeader }
    );
  }

  // Profanity filter on input preview (SEC-05)
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

  // Input preview length limit (GAL-01: max 50 chars)
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

  // TODO (Phase 8): Write to gallery_items table using db
  return NextResponse.json(
    {
      saved: true,
      id: 'gallery-save-stub-' + Date.now(),
      message: 'Gallery persistence will be implemented in Phase 8',
    },
    { status: 201, headers: rateLimitHeader }
  );
}
