import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * GAL-07: Report button on every gallery item — DB-backed moderation tests.
 *
 * These tests verify that the report route correctly delegates to
 * the db-gallery layer and handles DB responses appropriately.
 */
vi.mock('@/lib/gallery/db-gallery', () => ({
  incrementReportCount: vi.fn(),
  getFlaggedItems: vi.fn(),
  deleteFlaggedItem: vi.fn(),
}));

import { incrementReportCount, getFlaggedItems, deleteFlaggedItem } from '@/lib/gallery/db-gallery';
const mockIncrement = vi.mocked(incrementReportCount);
const mockGetFlagged = vi.mocked(getFlaggedItems);
const mockDeleteFlagged = vi.mocked(deleteFlaggedItem);

function makeReportRequest(body: unknown) {
  return new Request('http://localhost/api/moderation/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeAdminRequest(method: string, body?: unknown, secret = 'test-secret') {
  vi.stubEnv('ADMIN_SECRET', secret);
  return new Request('http://localhost/api/admin/review', {
    method,
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${secret}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GAL-07: DB-backed report route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls incrementReportCount with the provided itemId', async () => {
    mockIncrement.mockResolvedValue({ reportCount: 1, flagged: false });
    const { POST } = await import('@/app/api/moderation/report/route');
    await POST(makeReportRequest({ itemId: 'gallery-item-abc' }));
    expect(mockIncrement).toHaveBeenCalledWith('gallery-item-abc');
  });

  it('returns 200 with correct shape when item is found', async () => {
    mockIncrement.mockResolvedValue({ reportCount: 2, flagged: false });
    const { POST } = await import('@/app/api/moderation/report/route');
    const res = await POST(makeReportRequest({ itemId: 'item-x' }));
    expect(res.status).toBe(200);
    const data = await res.json() as { reported: boolean; reportCount: number; flagged: boolean };
    expect(data.reported).toBe(true);
    expect(data.reportCount).toBe(2);
    expect(data.flagged).toBe(false);
  });

  it('returns 200 with flagged=true when report count reaches 3', async () => {
    mockIncrement.mockResolvedValue({ reportCount: 3, flagged: true });
    const { POST } = await import('@/app/api/moderation/report/route');
    const res = await POST(makeReportRequest({ itemId: 'item-y' }));
    const data = await res.json() as { flagged: boolean; message: string };
    expect(data.flagged).toBe(true);
    expect(data.message).toContain('flagged');
  });

  it('returns 404 when item is not found in DB', async () => {
    mockIncrement.mockResolvedValue(null);
    const { POST } = await import('@/app/api/moderation/report/route');
    const res = await POST(makeReportRequest({ itemId: 'nonexistent' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing itemId', async () => {
    const { POST } = await import('@/app/api/moderation/report/route');
    const res = await POST(makeReportRequest({}));
    expect(res.status).toBe(400);
    expect(mockIncrement).not.toHaveBeenCalled();
  });
});

describe('GAL-07: DB-backed admin review route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/review calls getFlaggedItems and returns results', async () => {
    const mockItems = [
      { id: 'item-1', flagged: true, reportCount: 3, styleName: 'geometric' },
    ];
    mockGetFlagged.mockResolvedValue(mockItems as never);
    const { GET } = await import('@/app/api/admin/review/route');
    const res = await GET(makeAdminRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json() as { flagged: unknown[]; total: number };
    expect(data.flagged).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(mockGetFlagged).toHaveBeenCalledOnce();
  });

  it('DELETE /api/admin/review calls deleteFlaggedItem and returns removed', async () => {
    mockDeleteFlagged.mockResolvedValue(true);
    const { DELETE } = await import('@/app/api/admin/review/route');
    const res = await DELETE(makeAdminRequest('DELETE', { itemId: 'item-1' }));
    expect(res.status).toBe(200);
    const data = await res.json() as { removed: boolean; itemId: string };
    expect(data.removed).toBe(true);
    expect(data.itemId).toBe('item-1');
    expect(mockDeleteFlagged).toHaveBeenCalledWith('item-1');
  });

  it('DELETE /api/admin/review returns 404 when item not found', async () => {
    mockDeleteFlagged.mockResolvedValue(false);
    const { DELETE } = await import('@/app/api/admin/review/route');
    const res = await DELETE(makeAdminRequest('DELETE', { itemId: 'ghost-item' }));
    expect(res.status).toBe(404);
  });

  it('requires ADMIN_SECRET on GET', async () => {
    const { GET } = await import('@/app/api/admin/review/route');
    const res = await GET(
      new Request('http://localhost/api/admin/review', { method: 'GET' })
    );
    expect(res.status).toBe(401);
    expect(mockGetFlagged).not.toHaveBeenCalled();
  });
});
