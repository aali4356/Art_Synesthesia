import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gallery/db-gallery', () => ({
  deleteGalleryItem: vi.fn(),
  getGalleryItem: vi.fn(),
  incrementUpvoteCount: vi.fn(),
}));

import { deleteGalleryItem } from '@/lib/gallery/db-gallery';
const mockDelete = vi.mocked(deleteGalleryItem);

async function importRoute() {
  return import('@/app/api/gallery/[id]/route');
}

function makeRequest(method: string, token?: string) {
  return new Request('http://localhost/api/gallery/test-id', {
    method,
    headers: token ? { 'x-creator-token': token } : {},
  });
}

describe('GAL-08: DELETE /api/gallery/[id] — owner delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes when token matches', async () => {
    mockDelete.mockResolvedValue(true);
    const route = await importRoute();
    const res = await route.DELETE(
      makeRequest('DELETE', 'valid-token'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as { deleted: boolean };
    expect(data.deleted).toBe(true);
  });

  it('returns 403 when token does not match', async () => {
    mockDelete.mockResolvedValue(false);
    const route = await importRoute();
    const res = await route.DELETE(
      makeRequest('DELETE', 'wrong-token'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    expect(res.status).toBe(403);
  });

  it('returns 401 when X-Creator-Token header is missing', async () => {
    const route = await importRoute();
    const res = await route.DELETE(
      makeRequest('DELETE'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    expect(res.status).toBe(401);
  });
});
