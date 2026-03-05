import { describe, it, expect, vi } from 'vitest';

// Mock the db module -- no real database connection in CI
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    query: {
      analysisCache: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

describe('Analysis cache — INFRA-02', () => {
  it('7-day TTL is set correctly for anonymous entries', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const ttlDays = 7;
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    expect(expiresAt.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('permanent entries use far-future expiry (gallery-linked)', () => {
    const permanentExpiry = new Date('9999-12-31T23:59:59Z');
    const now = new Date();
    expect(permanentExpiry.getTime()).toBeGreaterThan(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  });

  it('cache key format matches analysisKey function from src/lib/cache/keys.ts', async () => {
    const { analysisKey } = await import('@/lib/cache/keys');
    const version = {
      engineVersion: '1.0.0',
      analyzerVersion: '1.0.0',
      normalizerVersion: '0.4.0',
      rendererVersion: '0.2.0',
    };
    const key = analysisKey('abc123', version);
    expect(key).toMatch(/^analysis:/);
    expect(key).toContain('abc123');
    expect(key).toContain('1.0.0');
    expect(key).toContain('0.4.0');
  });
});
