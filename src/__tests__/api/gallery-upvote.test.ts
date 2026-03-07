import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gallery/db-gallery', () => ({
  deleteGalleryItem: vi.fn(),
  getGalleryItem: vi.fn(),
  incrementUpvoteCount: vi.fn(),
}));

import { incrementUpvoteCount, getGalleryItem } from '@/lib/gallery/db-gallery';
const mockUpvote = vi.mocked(incrementUpvoteCount);
const mockGetItem = vi.mocked(getGalleryItem);

async function importRoute() {
  return import('@/app/api/gallery/[id]/route');
}

describe('GAL-05: POST /api/gallery/[id] — upvote endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments upvote_count and returns new count', async () => {
    mockUpvote.mockResolvedValue(6);
    const route = await importRoute();
    const res = await route.POST(
      new Request('http://localhost/api/gallery/item-1', { method: 'POST' }),
      { params: Promise.resolve({ id: 'item-1' }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as { upvoted: boolean; upvoteCount: number };
    expect(data.upvoted).toBe(true);
    expect(data.upvoteCount).toBe(6);
    expect(mockUpvote).toHaveBeenCalledWith('item-1');
  });

  it('returns 404 when item not found', async () => {
    mockUpvote.mockResolvedValue(null);
    const route = await importRoute();
    const res = await route.POST(
      new Request('http://localhost/api/gallery/nonexistent', { method: 'POST' }),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('GAL-06: GET /api/gallery/[id] — single item detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns gallery item when found', async () => {
    const mockItem = {
      id: 'item-1',
      styleName: 'geometric',
      parameterVector: {},
      versionInfo: {},
      title: 'Test',
      inputPreview: null,
      thumbnailData: null,
      creatorToken: null,
      createdAt: new Date(),
      reportCount: 0,
      flagged: false,
      upvoteCount: 3,
    };
    mockGetItem.mockResolvedValue(mockItem as never);
    const route = await importRoute();
    const res = await route.GET(
      new Request('http://localhost/api/gallery/item-1'),
      { params: Promise.resolve({ id: 'item-1' }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as { item: { id: string } };
    expect(data.item.id).toBe('item-1');
  });

  it('returns 404 when item not found', async () => {
    mockGetItem.mockResolvedValue(null);
    const route = await importRoute();
    const res = await route.GET(
      new Request('http://localhost/api/gallery/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });
});
