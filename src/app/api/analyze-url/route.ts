import { NextResponse } from 'next/server';
import { safeFetch } from '@/lib/fetch/safe-fetch';
import { analyzeUrlContent } from '@/lib/analysis/url';
import { canonicalizeUrl } from '@/lib/canonicalize/url';
import { getUrlSnapshot, setUrlSnapshot } from '@/lib/cache/db-cache';
import { classifyObservabilityError } from '@/lib/observability/privacy';
import { captureRouteFailure } from '@/lib/observability/server';

// ---------------------------------------------------------------------------
// Rate limiting (SEC-03): 10 requests per IP per hour, sliding window
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// ---------------------------------------------------------------------------
// POST /api/analyze-url
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // Extract IP for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    (forwarded ? forwarded.split(',')[0].trim() : null) ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Rate limit check
  const { allowed, remaining } = getRateLimit(ip);
  if (!allowed) {
    captureRouteFailure(new Error('Rate limit exceeded'), {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'rate-limited',
    });
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const rateLimitHeader = { 'X-RateLimit-Remaining': String(remaining) };

  // Parse request body
  let body: { url?: unknown; mode?: unknown; refetch?: unknown };
  try {
    body = await request.json();
  } catch (error) {
    captureRouteFailure(error, {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'malformed-payload',
    });
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  const { url, mode, refetch } = body;

  // Validate URL field
  if (!url || typeof url !== 'string' || url.trim() === '') {
    captureRouteFailure(new Error('Missing or empty URL field'), {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'invalid-input',
    });
    return NextResponse.json(
      { error: 'Missing or empty URL field' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  // Canonicalize URL
  let canonical: string;
  try {
    const result = canonicalizeUrl(url.trim());
    canonical = result.canonical;
  } catch (error) {
    captureRouteFailure(error, {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'invalid-input',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid URL' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  // DB snapshot cache check (skip if mode === 'live' or refetch === true)
  const isLive = mode === 'live';
  const shouldRefetch = refetch === true;

  if (!isLive && !shouldRefetch) {
    try {
      const cached = await getUrlSnapshot(canonical);
      if (cached) {
        return NextResponse.json(
          {
            signals: cached.signals,
            canonical,
            title: cached.title,
            metadata: cached.metadata,
            cached: true,
          },
          { status: 200, headers: rateLimitHeader }
        );
      }
    } catch (error) {
      const category = classifyObservabilityError(error);
      captureRouteFailure(error, {
        routeFamily: 'analyze-url',
        method: 'POST',
        statusBucket: '5xx',
        failureCategory: 'snapshot-cache-unavailable',
        localProofMode: category === 'local-proof-unavailable',
      });
    }
  }

  // Fetch URL content with SSRF protection
  let html: string;
  try {
    html = await safeFetch(canonical);
  } catch (error) {
    const category = classifyObservabilityError(error);
    captureRouteFailure(error, {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket:
        category === 'timeout'
          ? 'timeout'
          : category === 'network-failure'
            ? 'network'
            : '4xx',
      failureCategory: category === 'unknown' ? 'fetch-failed' : category,
      localProofMode: category === 'local-proof-unavailable',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fetch failed' },
      { status: 400, headers: rateLimitHeader }
    );
  }

  // Analyze content
  const result = analyzeUrlContent(html, canonical);

  // Store in DB snapshot cache
  try {
    await setUrlSnapshot(canonical, {
      signals: result.signals,
      title: result.title,
      metadata: result.metadata,
    });
  } catch (error) {
    const category = classifyObservabilityError(error);
    captureRouteFailure(error, {
      routeFamily: 'analyze-url',
      method: 'POST',
      statusBucket: '5xx',
      failureCategory: 'snapshot-cache-write-failed',
      localProofMode: category === 'local-proof-unavailable',
    });
  }

  return NextResponse.json(
    {
      signals: result.signals,
      canonical,
      title: result.title,
      metadata: result.metadata,
      cached: false,
    },
    { status: 200, headers: rateLimitHeader }
  );
}
