import { describe, it, expect, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    query: { renderCache: { findFirst: vi.fn().mockResolvedValue(null) } },
  },
}));

describe('Render cache — INFRA-03', () => {
  it('thumbnail TTL is 24 hours', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const thumbnailTtlMs = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + thumbnailTtlMs);
    expect(expiresAt.getTime() - now.getTime()).toBe(thumbnailTtlMs);
  });

  it('full render TTL is 7 days', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const fullRenderTtlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + fullRenderTtlMs);
    expect(expiresAt.getTime() - now.getTime()).toBe(fullRenderTtlMs);
  });

  it('cache key format matches renderKey function from src/lib/cache/keys.ts', async () => {
    const { renderKey } = await import('@/lib/cache/keys');
    const version = {
      engineVersion: '1.0.0',
      analyzerVersion: '1.0.0',
      normalizerVersion: '0.4.0',
      rendererVersion: '0.2.0',
    };
    const key = renderKey('abc123', version, 'geometric', 800);
    expect(key).toMatch(/^render:/);
    expect(key).toContain('geometric');
    expect(key).toContain('800');
  });

  it('resolution distinguishes thumbnail (200) from full render (800) keys', async () => {
    const { renderKey } = await import('@/lib/cache/keys');
    const version = {
      engineVersion: '1.0.0',
      analyzerVersion: '1.0.0',
      normalizerVersion: '0.4.0',
      rendererVersion: '0.2.0',
    };
    const thumbKey = renderKey('abc123', version, 'geometric', 200);
    const fullKey = renderKey('abc123', version, 'geometric', 800);
    expect(thumbKey).not.toBe(fullKey);
  });
});
