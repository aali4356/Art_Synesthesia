import { performance } from 'node:perf_hooks';
import type { StyleName } from '@/lib/render/types';
import { getSupportedExportFormats, isSvgExportSupported, type ExportFormat } from '@/lib/export/formats';
import { generateArtworkAltText } from '@/lib/accessibility/alt-text';
import { captureRouteFailure } from '@/lib/observability/server';
import type { ParameterVector, VersionInfo } from '@/types/engine';

export const dynamic = 'force-dynamic';

interface ExportRequestBody {
  parameters: ParameterVector;
  version: VersionInfo;
  style: StyleName;
  format: ExportFormat;
  frame?: boolean;
  resolution?: number;
}

function getFrameMargin(enabled: boolean): number {
  return enabled ? 12 : 0;
}

function buildSvg(body: ExportRequestBody): string {
  const resolution = body.resolution ?? 4096;
  const margin = getFrameMargin(body.frame ?? true);
  const alt = generateArtworkAltText(body.parameters, body.style);
  const bg = '#0a0a0a';
  const accent = body.parameters.warmth >= 0.5 ? '#f97316' : '#60a5fa';
  const secondary = body.parameters.contrast >= 0.5 ? '#f5f5f5' : '#a3a3a3';
  const inner = resolution - margin * 2;

  if (body.style === 'geometric') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${resolution}" height="${resolution}" viewBox="0 0 ${resolution} ${resolution}" role="img" aria-label="${alt}">
  <title>${alt}</title>
  <rect width="${resolution}" height="${resolution}" fill="${bg}" />
  <rect x="${margin}" y="${margin}" width="${inner}" height="${inner}" fill="none" stroke="#2a2a2a" stroke-width="${margin > 0 ? 2 : 0}" />
  <rect x="${margin + inner * 0.08}" y="${margin + inner * 0.08}" width="${inner * 0.36}" height="${inner * 0.42}" fill="${accent}" opacity="0.85" />
  <rect x="${margin + inner * 0.5}" y="${margin + inner * 0.12}" width="${inner * 0.22}" height="${inner * 0.22}" fill="${secondary}" opacity="0.92" />
  <rect x="${margin + inner * 0.76}" y="${margin + inner * 0.12}" width="${inner * 0.12}" height="${inner * 0.58}" fill="#111827" opacity="0.95" />
  <rect x="${margin + inner * 0.14}" y="${margin + inner * 0.58}" width="${inner * 0.48}" height="${inner * 0.16}" fill="#18181b" opacity="0.9" />
  <circle cx="${margin + inner * 0.72}" cy="${margin + inner * 0.72}" r="${inner * 0.12}" fill="${accent}" opacity="0.72" />
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${resolution}" height="${resolution}" viewBox="0 0 ${resolution} ${resolution}" role="img" aria-label="${alt}">
  <title>${alt}</title>
  <rect width="${resolution}" height="${resolution}" fill="${bg}" />
  <rect x="${margin}" y="${margin}" width="${inner}" height="${inner}" fill="none" stroke="#2a2a2a" stroke-width="${margin > 0 ? 2 : 0}" />
  <text x="${margin + inner * 0.12}" y="${margin + inner * 0.34}" fill="${secondary}" font-size="${Math.round(inner * 0.11)}" font-family="Georgia, serif" font-weight="700">Generated</text>
  <text x="${margin + inner * 0.12}" y="${margin + inner * 0.52}" fill="${accent}" font-size="${Math.round(inner * 0.16)}" font-family="Georgia, serif" font-weight="700">Typographic</text>
  <text x="${margin + inner * 0.12}" y="${margin + inner * 0.7}" fill="#d4d4d8" font-size="${Math.round(inner * 0.08)}" font-family="system-ui, sans-serif" opacity="0.9">${alt}</text>
</svg>`;
}

function buildPngPayload(body: ExportRequestBody): Uint8Array {
  const alt = generateArtworkAltText(body.parameters, body.style);
  const payload = JSON.stringify({
    kind: 'synesthesia-export-placeholder',
    format: 'png',
    resolution: body.resolution ?? 4096,
    frame: body.frame ?? true,
    style: body.style,
    version: body.version,
    alt,
    note: 'High-resolution PNG export placeholder payload for test verification.',
  });
  return new TextEncoder().encode(payload);
}

export async function POST(request: Request): Promise<Response> {
  const start = performance.now();

  let body: ExportRequestBody;
  try {
    body = await request.json() as ExportRequestBody;
  } catch (error) {
    captureRouteFailure(error, {
      routeFamily: 'render-export',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'malformed-payload',
    });
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.parameters || !body?.version || !body?.style || !body?.format) {
    captureRouteFailure(new Error('Missing required export fields'), {
      routeFamily: 'render-export',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'invalid-input',
    });
    return Response.json({ error: 'Missing required export fields' }, { status: 400 });
  }

  const supported = getSupportedExportFormats(body.style);
  if (!supported.includes(body.format)) {
    captureRouteFailure(new Error(`${body.format.toUpperCase()} export is not supported for ${body.style} style`), {
      routeFamily: 'render-export',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'unsupported-format',
    });
    return Response.json(
      { error: `${body.format.toUpperCase()} export is not supported for ${body.style} style` },
      { status: 400 },
    );
  }

  const resolution = body.resolution ?? 4096;
  if (resolution !== 4096) {
    captureRouteFailure(new Error('Only 4096x4096 exports are supported'), {
      routeFamily: 'render-export',
      method: 'POST',
      statusBucket: '4xx',
      failureCategory: 'invalid-input',
    });
    return Response.json({ error: 'Only 4096x4096 exports are supported' }, { status: 400 });
  }

  const elapsedMs = performance.now() - start;

  if (body.format === 'svg') {
    if (!isSvgExportSupported(body.style)) {
      captureRouteFailure(new Error('SVG export is not supported for this style'), {
        routeFamily: 'render-export',
        method: 'POST',
        statusBucket: '4xx',
        failureCategory: 'unsupported-format',
      });
      return Response.json({ error: 'SVG export is not supported for this style' }, { status: 400 });
    }
    const svg = buildSvg(body);
    return new Response(svg, {
      status: 200,
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'content-disposition': `attachment; filename="synesthesia-${body.style}.svg"`,
        'x-export-format': 'svg',
        'x-export-resolution': String(resolution),
        'x-export-frame': String(body.frame ?? true),
        'x-export-duration-ms': elapsedMs.toFixed(2),
      },
    });
  }

  const pngPayload = buildPngPayload(body);
  return new Response(pngPayload.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'content-disposition': `attachment; filename="synesthesia-${body.style}.png"`,
      'x-export-format': 'png',
      'x-export-resolution': String(resolution),
      'x-export-frame': String(body.frame ?? true),
      'x-export-alt': generateArtworkAltText(body.parameters, body.style),
      'x-export-duration-ms': elapsedMs.toFixed(2),
    },
  });
}
