import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeFetch } from '@/lib/fetch/safe-fetch';

// Mock SSRF module so resolveAndValidate is a no-op by default
vi.mock('@/lib/fetch/ssrf', () => ({
  resolveAndValidate: vi.fn().mockResolvedValue(undefined),
}));

import { resolveAndValidate } from '@/lib/fetch/ssrf';
const mockResolveAndValidate = vi.mocked(resolveAndValidate);

// Helper to create a minimal ReadableStream from a string or Uint8Array
function makeStream(data: string | Uint8Array): ReadableStream<Uint8Array> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

// Helper to create a mock Response
function mockResponse(
  opts: {
    status?: number;
    headers?: Record<string, string>;
    body?: string | Uint8Array | null;
    ok?: boolean;
  } = {}
): Response {
  const status = opts.status ?? 200;
  const ok = opts.ok ?? (status >= 200 && status < 300);
  const headers = new Headers(opts.headers ?? {});
  const body = opts.body !== null ? makeStream(opts.body ?? '') : null;

  return {
    status,
    ok,
    statusText: String(status),
    headers,
    body,
    bodyUsed: false,
  } as unknown as Response;
}

describe('safeFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockResolveAndValidate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws "Blocked protocol" for ftp:// URL', async () => {
    await expect(safeFetch('ftp://example.com/file.txt')).rejects.toThrow(/Blocked protocol/i);
  });

  it('throws "Blocked protocol" for file:// URL', async () => {
    await expect(safeFetch('file:///etc/passwd')).rejects.toThrow(/Blocked protocol/i);
  });

  it('returns body string on successful 200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ body: 'hello' })));

    const result = await safeFetch('https://example.com');
    expect(result).toBe('hello');

    vi.unstubAllGlobals();
  });

  it('throws "Too many redirects" after exceeding 3 redirect hops', async () => {
    // Mock fetch to always return 301 with Location header
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse({
          status: 301,
          ok: false,
          headers: { location: 'https://example.com/redirect' },
          body: '',
        })
      )
    );

    await expect(safeFetch('https://example.com')).rejects.toThrow(/Too many redirects/i);
    vi.unstubAllGlobals();
  });

  it('throws size limit error when streamed bytes exceed 5MB', async () => {
    // Create a 6MB chunk
    const sixMB = new Uint8Array(6 * 1024 * 1024);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ body: sixMB })));

    await expect(safeFetch('https://example.com')).rejects.toThrow(/byte limit|size/i);
    vi.unstubAllGlobals();
  });

  it('re-validates each redirect Location against SSRF', async () => {
    // resolveAndValidate throws on the redirect target
    mockResolveAndValidate
      .mockResolvedValueOnce(undefined) // first call (original URL) succeeds
      .mockRejectedValueOnce(new Error('Blocked: resolves to private IP')); // redirect fails

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse({
          status: 301,
          ok: false,
          headers: { location: 'https://internal.evil.com/metadata' },
          body: '',
        })
      )
    );

    await expect(safeFetch('https://example.com')).rejects.toThrow(
      /Blocked: resolves to private IP/i
    );
    vi.unstubAllGlobals();
  });

  it('throws abort error when timeout fires after 10 seconds', async () => {
    vi.useFakeTimers();

    // Fetch that never resolves
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        return new Promise<Response>((_, reject) => {
          // Will be aborted by the controller
          setTimeout(() => reject(new Error('This should not run')), 60000);
        });
      })
    );

    // Override fetch to respond to AbortController signal
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          opts.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      })
    );

    const fetchPromise = safeFetch('https://example.com');

    // Advance timers by 11 seconds to trigger abort
    await vi.advanceTimersByTimeAsync(11_000);

    await expect(fetchPromise).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});
