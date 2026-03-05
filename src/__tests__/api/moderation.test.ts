import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * SEC-06: Items with 3+ reports get flagged; admin can review/remove.
 */
describe('Moderation — SEC-06', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('item is not flagged after 1 report', async () => {
    const { POST } = await import('@/app/api/moderation/report/route');
    const request = new Request('http://localhost/api/moderation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'item-test-1' }),
    });
    const response = await POST(request);
    const body = await response.json();
    expect(body.flagged).toBe(false);
    expect(body.reportCount).toBe(1);
  });

  it('item is flagged after 3 reports', async () => {
    const { POST } = await import('@/app/api/moderation/report/route');
    const itemId = 'item-test-flag';

    for (let i = 0; i < 2; i++) {
      await POST(
        new Request('http://localhost/api/moderation/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        })
      );
    }

    const response = await POST(
      new Request('http://localhost/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
    );
    const body = await response.json();
    expect(body.flagged).toBe(true);
    expect(body.reportCount).toBe(3);
  });

  it('admin route requires ADMIN_SECRET authorization', async () => {
    const { GET } = await import('@/app/api/admin/review/route');

    // No auth header
    const unauthResponse = await GET(
      new Request('http://localhost/api/admin/review')
    );
    expect(unauthResponse.status).toBe(401);

    // Wrong secret
    vi.stubEnv('ADMIN_SECRET', 'correct-secret');
    const wrongResponse = await GET(
      new Request('http://localhost/api/admin/review', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    );
    expect(wrongResponse.status).toBe(401);
  });

  it('admin route returns flagged items with correct secret', async () => {
    vi.stubEnv('ADMIN_SECRET', 'test-admin-secret-abc');
    const { GET } = await import('@/app/api/admin/review/route');

    const response = await GET(
      new Request('http://localhost/api/admin/review', {
        headers: { authorization: 'Bearer test-admin-secret-abc' },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('flagged');
    expect(body).toHaveProperty('total');
  });

  it('returns 400 for report without itemId', async () => {
    const { POST } = await import('@/app/api/moderation/report/route');
    const response = await POST(
      new Request('http://localhost/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });
});
