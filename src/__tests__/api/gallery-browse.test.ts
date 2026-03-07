import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gallery/db-gallery', () => ({
  getGalleryItems: vi.fn(),
  createGalleryItem: vi.fn(),
}));

import { getGalleryItems } from '@/lib/gallery/db-gallery';
const mockGetItems = vi.mocked(getGalleryItems);

const SAMPLE_ITEMS = [
  {
    id: 'item-1',
    parameterVector: {},
    versionInfo: {},
    styleName: 'geometric',
    title: 'Sunset',
    inputPreview: 'A peaceful scene',
    thumbnailData: null,
    creatorToken: null,
    createdAt: new Date('2026-03-01'),
    reportCount: 0,
    flagged: false,
    upvoteCount: 5,
  },
  {
    id: 'item-2',
    parameterVector: {},
    versionInfo: {},
    styleName: 'organic',
    title: null,
    inputPreview: null,
    thumbnailData: null,
    creatorToken: null,
    createdAt: new Date('2026-03-02'),
    reportCount: 0,
    flagged: false,
    upvoteCount: 2,
  },
];

async function importRoute() {
  return import('@/app/api/gallery/route');
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/gallery');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString(), { method: 'GET' });
}

describe('GAL-03: GET /api/gallery — browse gallery items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItems.mockResolvedValue(SAMPLE_ITEMS as never);
  });

  it('returns items with page and limit', async () => {
    const route = await importRoute();
    const res = await route.GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as { items: unknown[]; page: number; limit: number };
    expect(data.items).toHaveLength(2);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  it('passes style filter to getGalleryItems', async () => {
    const route = await importRoute();
    await route.GET(makeGetRequest({ style: 'geometric' }));
    expect(mockGetItems).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'geometric' })
    );
  });
});

describe('GAL-05: GET /api/gallery — filter by style and sort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItems.mockResolvedValue(SAMPLE_ITEMS as never);
  });

  it('passes sort=popular to getGalleryItems', async () => {
    const route = await importRoute();
    await route.GET(makeGetRequest({ sort: 'popular' }));
    expect(mockGetItems).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'popular' })
    );
  });

  it('defaults to sort=recent', async () => {
    const route = await importRoute();
    await route.GET(makeGetRequest());
    expect(mockGetItems).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'recent' })
    );
  });

  it('computes correct offset for page 2', async () => {
    const route = await importRoute();
    await route.GET(makeGetRequest({ page: '2', limit: '10' }));
    expect(mockGetItems).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, limit: 10 })
    );
  });

  it('caps limit at 50', async () => {
    const route = await importRoute();
    await route.GET(makeGetRequest({ limit: '999' }));
    expect(mockGetItems).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });
});
