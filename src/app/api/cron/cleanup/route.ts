import { NextResponse } from 'next/server';
import { cleanupExpiredCache } from '@/lib/cache/db-cache';

/**
 * GET /api/cron/cleanup
 *
 * Vercel Cron job: runs daily at 03:00 UTC.
 * Deletes expired rows from analysis_cache and render_cache.
 * Protected by CRON_SECRET env var.
 *
 * vercel.json schedule: "0 3 * * *"
 */
export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { analysisDeleted, renderDeleted } = await cleanupExpiredCache();

  return NextResponse.json({
    status: 'ok',
    cleaned: { analysis: analysisDeleted, render: renderDeleted },
    timestamp: new Date().toISOString(),
  });
}
