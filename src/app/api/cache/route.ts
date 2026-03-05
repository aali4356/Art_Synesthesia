import { NextResponse } from 'next/server';
import {
  getAnalysisCache,
  setAnalysisCache,
  getRenderCache,
  setRenderCache,
} from '@/lib/cache/db-cache';
import type { VersionInfo } from '@/types/engine';

/**
 * GET /api/cache?type=analysis&inputHash=...&analyzerVersion=...&normalizerVersion=...&rendererVersion=...&engineVersion=...
 * GET /api/cache?type=render&inputHash=...&style=...&resolution=...&analyzerVersion=...&normalizerVersion=...&rendererVersion=...&engineVersion=...
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const inputHash = searchParams.get('inputHash');

  if (!inputHash) {
    return NextResponse.json({ error: 'Missing inputHash' }, { status: 400 });
  }

  const version: VersionInfo = {
    engineVersion: searchParams.get('engineVersion') ?? '',
    analyzerVersion: searchParams.get('analyzerVersion') ?? '',
    normalizerVersion: searchParams.get('normalizerVersion') ?? '',
    rendererVersion: searchParams.get('rendererVersion') ?? '',
  };

  if (type === 'analysis') {
    const result = await getAnalysisCache(inputHash, version);
    if (!result) return NextResponse.json({ hit: false });
    return NextResponse.json({ hit: true, ...result });
  }

  if (type === 'render') {
    const style = searchParams.get('style') ?? '';
    const resolution = parseInt(searchParams.get('resolution') ?? '800', 10);
    const result = await getRenderCache(inputHash, version, style, resolution);
    if (!result) return NextResponse.json({ hit: false });
    return NextResponse.json({ hit: true, ...result });
  }

  return NextResponse.json({ error: 'Invalid cache type' }, { status: 400 });
}

/**
 * PUT /api/cache
 * Body: { type: 'analysis'|'render', inputHash, version, ...payload }
 */
export async function PUT(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, inputHash, version } = body;

  if (!inputHash || typeof inputHash !== 'string') {
    return NextResponse.json({ error: 'Missing inputHash' }, { status: 400 });
  }
  if (!version || typeof version !== 'object') {
    return NextResponse.json({ error: 'Missing version' }, { status: 400 });
  }

  const versionInfo = version as VersionInfo;

  if (type === 'analysis') {
    const { parameterVector, provenance } = body;
    if (!parameterVector || !provenance) {
      return NextResponse.json(
        { error: 'Missing parameterVector or provenance' },
        { status: 400 }
      );
    }
    await setAnalysisCache(inputHash, versionInfo, {
      parameterVector: parameterVector as never,
      provenance: provenance as never,
    });
    return NextResponse.json({ stored: true });
  }

  if (type === 'render') {
    const { styleName, resolution, renderData } = body;
    if (!styleName || !resolution || !renderData) {
      return NextResponse.json(
        { error: 'Missing styleName, resolution, or renderData' },
        { status: 400 }
      );
    }
    await setRenderCache(inputHash, versionInfo, {
      styleName: styleName as string,
      resolution: resolution as number,
      renderData,
    });
    return NextResponse.json({ stored: true });
  }

  return NextResponse.json({ error: 'Invalid cache type' }, { status: 400 });
}
