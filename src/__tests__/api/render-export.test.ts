import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/render-export/route';
import type { ParameterVector, VersionInfo } from '@/types/engine';

const vector: ParameterVector = {
  complexity: 0.61,
  warmth: 0.77,
  symmetry: 0.29,
  rhythm: 0.52,
  energy: 0.81,
  density: 0.43,
  scaleVariation: 0.35,
  curvature: 0.66,
  saturation: 0.75,
  contrast: 0.58,
  layering: 0.41,
  directionality: 0.72,
  paletteSize: 0.47,
  texture: 0.56,
  regularity: 0.39,
};

const version: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.2.0',
  normalizerVersion: '0.3.0',
  rendererVersion: '0.4.0',
};

describe('POST /api/render-export', () => {
  it('returns a PNG attachment for all styles', async () => {
    const request = new Request('http://localhost:3000/api/render-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: vector,
        version,
        style: 'particle',
        format: 'png',
        frame: true,
        resolution: 4096,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(response.headers.get('content-disposition')).toContain('synesthesia-particle.png');
    expect(response.headers.get('x-export-resolution')).toBe('4096');
    expect(response.headers.get('x-export-frame')).toBe('true');
    expect(response.headers.get('x-export-alt')).toContain('Generated particle artwork');
  });

  it('returns an SVG attachment for geometric style', async () => {
    const request = new Request('http://localhost:3000/api/render-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: vector,
        version,
        style: 'geometric',
        format: 'svg',
        frame: true,
        resolution: 4096,
      }),
    });

    const response = await POST(request);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(text).toContain('<svg');
    expect(text).toContain('Generated geometric artwork');
  });

  it('rejects SVG export for non-vector styles with actionable error', async () => {
    const request = new Request('http://localhost:3000/api/render-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: vector,
        version,
        style: 'organic',
        format: 'svg',
        frame: false,
        resolution: 4096,
      }),
    });

    const response = await POST(request);
    const body = await response.json() as { error: string };
    expect(response.status).toBe(400);
    expect(body.error).toContain('SVG');
    expect(body.error).toContain('organic');
  });

  it('rejects non-4096 export resolutions', async () => {
    const request = new Request('http://localhost:3000/api/render-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: vector,
        version,
        style: 'geometric',
        format: 'png',
        frame: true,
        resolution: 2048,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Only 4096x4096 exports are supported' });
  });
});
