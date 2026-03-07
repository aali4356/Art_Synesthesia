import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock db-gallery so tests don't need a real database
vi.mock('@/lib/gallery/db-gallery', () => ({
  createGalleryItem: vi.fn(),
  getGalleryItems: vi.fn(),
}));

vi.mock('@/lib/moderation/profanity', () => ({
  containsProfanity: vi.fn().mockReturnValue(false),
}));

import { createGalleryItem } from '@/lib/gallery/db-gallery';
const mockCreate = vi.mocked(createGalleryItem);

async function importRoute() {
  const mod = await import('@/app/api/gallery/route');
  return mod;
}

const VALID_BODY = {
  parameterVector: { complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5, energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5, saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5, paletteSize: 0.5, texture: 0.5, regularity: 0.5 },
  versionInfo: { analyzerVersion: '1.0', normalizerVersion: '1.0', rendererVersion: '1.0', engineVersion: '1.0' },
  styleName: 'geometric',
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '127.0.0.1', ...headers },
    body: JSON.stringify(body),
  });
}

describe('GAL-01: POST /api/gallery — save to gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'test-uuid-123', ...VALID_BODY, title: null, inputPreview: null, thumbnailData: null, creatorToken: null, createdAt: new Date(), reportCount: 0, flagged: false, upvoteCount: 0 } as never);
  });

  it('saves a valid gallery item and returns 201 with id', async () => {
    const route = await importRoute();
    const res = await route.POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const data = await res.json() as { saved: boolean; id: string };
    expect(data.saved).toBe(true);
    expect(data.id).toBe('test-uuid-123');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('returns 400 when parameterVector is missing', async () => {
    const route = await importRoute();
    const body = { ...VALID_BODY };
    delete (body as Record<string, unknown>).parameterVector;
    const res = await route.POST(makeRequest(body));
    expect(res.status).toBe(400);
  });

  it('returns 400 when rawInput is present (privacy gate, PRIV-03)', async () => {
    const route = await importRoute();
    const res = await route.POST(makeRequest({ ...VALID_BODY, rawInput: 'forbidden' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 when title contains profanity (SEC-05)', async () => {
    const { containsProfanity } = await import('@/lib/moderation/profanity');
    vi.mocked(containsProfanity).mockReturnValueOnce(true);
    const route = await importRoute();
    const res = await route.POST(makeRequest({ ...VALID_BODY, title: 'bad word' }));
    expect(res.status).toBe(422);
  });

  it('returns 400 when inputPreview exceeds 50 chars', async () => {
    const route = await importRoute();
    const res = await route.POST(makeRequest({ ...VALID_BODY, inputPreview: 'a'.repeat(51) }));
    expect(res.status).toBe(400);
  });
});
