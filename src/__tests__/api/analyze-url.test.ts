import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock safe-fetch and url analysis modules before importing the route
vi.mock('@/lib/fetch/safe-fetch', () => ({
  safeFetch: vi.fn().mockResolvedValue('<html><title>Test</title></html>'),
}));

vi.mock('@/lib/analysis/url', () => ({
  analyzeUrlContent: vi.fn().mockReturnValue({
    signals: { linkDensity: 0.1, contentToHtmlRatio: 0.5 },
    extractedText: 'Test page content',
    title: 'Test',
    metadata: { linkCount: 2, imageCount: 0, dominantColors: [] },
  }),
}));

// Mock DB cache -- replaces the in-memory snapshotCache Map (Phase 7 migration)
vi.mock('@/lib/cache/db-cache', () => ({
  getUrlSnapshot: vi.fn().mockResolvedValue(null),
  setUrlSnapshot: vi.fn().mockResolvedValue(undefined),
}));

import { safeFetch } from '@/lib/fetch/safe-fetch';
import { analyzeUrlContent } from '@/lib/analysis/url';
import { getUrlSnapshot, setUrlSnapshot } from '@/lib/cache/db-cache';
import { POST } from '@/app/api/analyze-url/route';

const mockSafeFetch = vi.mocked(safeFetch);
const mockAnalyzeUrlContent = vi.mocked(analyzeUrlContent);
const mockGetUrlSnapshot = vi.mocked(getUrlSnapshot);
const mockSetUrlSnapshot = vi.mocked(setUrlSnapshot);

const DEFAULT_ANALYZE_RESULT = {
  signals: { linkDensity: 0.1, contentToHtmlRatio: 0.5 },
  extractedText: 'Test page content',
  title: 'Test',
  metadata: { linkCount: 2, imageCount: 0, dominantColors: [] },
};

const DEFAULT_SNAPSHOT_PAYLOAD = {
  signals: { linkDensity: 0.1, contentToHtmlRatio: 0.5 },
  title: 'Test',
  metadata: { linkCount: 2, imageCount: 0, dominantColors: [] },
};

// Helper to create a minimal NextRequest-like object
function makeRequest(
  body: Record<string, unknown>,
  ip = '1.2.3.4'
): Request {
  return new Request('http://localhost/api/analyze-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-url', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSafeFetch.mockResolvedValue('<html><title>Test</title></html>');
    mockAnalyzeUrlContent.mockReturnValue(DEFAULT_ANALYZE_RESULT);
    mockGetUrlSnapshot.mockResolvedValue(null);
    mockSetUrlSnapshot.mockResolvedValue(undefined);
  });

  describe('rate limiting (SEC-03)', () => {
    it('allows first 10 requests from same IP and returns decreasing X-RateLimit-Remaining', async () => {
      // Use a unique IP for this test group to avoid state pollution
      const ip = '10.0.0.1';
      const remainingValues: number[] = [];

      // Note: rate limit map is module-level, so we use unique IPs per group
      // to isolate from other tests
      for (let i = 0; i < 10; i++) {
        const req = makeRequest({ url: 'https://example.com' }, ip);
        const res = await POST(req as never);
        expect(res.status).toBe(200);
        const remaining = parseInt(res.headers.get('X-RateLimit-Remaining') ?? '-1', 10);
        remainingValues.push(remaining);
      }

      // Should go from 9 down to 0
      expect(remainingValues[0]).toBe(9);
      expect(remainingValues[9]).toBe(0);
      // Monotonically decreasing
      for (let i = 1; i < remainingValues.length; i++) {
        expect(remainingValues[i]).toBeLessThan(remainingValues[i - 1]);
      }
    });

    it('returns 429 on the 11th request from same IP', async () => {
      const ip = '10.0.0.2';

      // Use up all 10 slots
      for (let i = 0; i < 10; i++) {
        await POST(makeRequest({ url: 'https://example.com' }, ip) as never);
      }

      const res = await POST(makeRequest({ url: 'https://example.com' }, ip) as never);
      expect(res.status).toBe(429);
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('resets rate limit after window expires (mock Date.now)', async () => {
      const ip = '10.0.0.3';
      const originalDateNow = Date.now;

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await POST(makeRequest({ url: 'https://example.com' }, ip) as never);
      }

      // Verify exhausted
      const exhaustedRes = await POST(makeRequest({ url: 'https://example.com' }, ip) as never);
      expect(exhaustedRes.status).toBe(429);

      // Advance time by 1 hour + 1ms
      const advance = 60 * 60 * 1000 + 1;
      vi.spyOn(Date, 'now').mockReturnValue(originalDateNow() + advance);

      const resetRes = await POST(makeRequest({ url: 'https://example.com' }, ip) as never);
      expect(resetRes.status).toBe(200);

      vi.restoreAllMocks();
    });
  });

  describe('snapshot mode (URL-03)', () => {
    it('returns cached result on second call without calling safeFetch twice', async () => {
      const ip = '20.0.0.1';
      const url = 'https://snapshot-test.example.com';

      // First call: no cache, fetch and store
      mockGetUrlSnapshot.mockResolvedValueOnce(null);
      const res1 = await POST(makeRequest({ url }, ip) as never);
      expect(res1.status).toBe(200);

      // Second call: cache hit returns stored snapshot
      mockGetUrlSnapshot.mockResolvedValueOnce(DEFAULT_SNAPSHOT_PAYLOAD);
      const res2 = await POST(makeRequest({ url }, ip) as never);
      expect(res2.status).toBe(200);

      // safeFetch should have been called only once (snapshot cached on second call)
      expect(mockSafeFetch).toHaveBeenCalledTimes(1);
    });

    it('returns cached: true when snapshot hit', async () => {
      const ip = '20.0.0.4';
      const url = 'https://cached-flag-test.example.com';

      mockGetUrlSnapshot.mockResolvedValueOnce(DEFAULT_SNAPSHOT_PAYLOAD);
      const res = await POST(makeRequest({ url }, ip) as never);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cached).toBe(true);
    });

    it('calls setUrlSnapshot after fetching new URL', async () => {
      const ip = '20.0.0.5';
      const url = 'https://store-snapshot-test.example.com';

      mockGetUrlSnapshot.mockResolvedValueOnce(null);
      await POST(makeRequest({ url }, ip) as never);

      expect(mockSetUrlSnapshot).toHaveBeenCalledTimes(1);
    });
  });

  describe('live mode (URL-04)', () => {
    it('always calls safeFetch for each request in live mode', async () => {
      const ip = '20.0.0.2';
      const url = 'https://live-mode-test.example.com';

      await POST(makeRequest({ url, mode: 'live' }, ip) as never);
      await POST(makeRequest({ url, mode: 'live' }, ip) as never);

      expect(mockSafeFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('re-fetch (URL-05)', () => {
    it('re-fetches and overwrites snapshot when refetch: true', async () => {
      const ip = '20.0.0.3';
      const url = 'https://refetch-test.example.com';

      // First call: caches the result
      await POST(makeRequest({ url }, ip) as never);
      // Second call with refetch: true should call safeFetch again
      await POST(makeRequest({ url, refetch: true }, ip) as never);

      expect(mockSafeFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('SSRF rejection', () => {
    it('returns 400 with error body when safeFetch throws', async () => {
      mockSafeFetch.mockRejectedValueOnce(new Error('Blocked: resolves to private IP 10.0.0.1'));
      const ip = '30.0.0.1';

      const res = await POST(makeRequest({ url: 'https://evil.example.com' }, ip) as never);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toMatch(/Blocked/i);
    });
  });

  describe('invalid input', () => {
    it('returns 400 when URL field is missing', async () => {
      const res = await POST(makeRequest({}, '40.0.0.1') as never);
      expect(res.status).toBe(400);
    });

    it('returns 400 when URL field is empty string', async () => {
      const res = await POST(makeRequest({ url: '' }, '40.0.0.2') as never);
      expect(res.status).toBe(400);
    });
  });
});
