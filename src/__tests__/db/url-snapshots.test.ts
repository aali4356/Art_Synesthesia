import { describe, it, expect, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    query: { urlSnapshots: { findFirst: vi.fn().mockResolvedValue(null) } },
  },
}));

describe('URL snapshots cache — INFRA-04', () => {
  it('url_snapshots has no TTL column (snapshots are permanent until re-fetch)', async () => {
    const { urlSnapshots } = await import('@/db/schema/url-snapshots');
    const columnKeys = Object.keys(urlSnapshots);
    expect(columnKeys).not.toContain('expiresAt');
    expect(columnKeys).not.toContain('expires_at');
  });

  it('canonical URL is the primary lookup key', async () => {
    const { urlSnapshots } = await import('@/db/schema/url-snapshots');
    expect(urlSnapshots).toHaveProperty('canonicalUrl');
  });

  it('snapshot stores signals, title, and metadata (no raw HTML)', async () => {
    const { urlSnapshots } = await import('@/db/schema/url-snapshots');
    expect(urlSnapshots).toHaveProperty('signals');
    expect(urlSnapshots).toHaveProperty('title');
    expect(urlSnapshots).toHaveProperty('metadata');
    expect(urlSnapshots).not.toHaveProperty('rawHtml');
    expect(urlSnapshots).not.toHaveProperty('htmlContent');
  });
});
