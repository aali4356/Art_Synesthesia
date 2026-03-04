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

  it('passes AbortSignal to fetch and aborts after timeout', async () => {
    // Verify that safeFetch passes a signal to fetch and the signal is used
    // to abort. We capture the signal from the fetch call and verify it fires.
    let capturedSignal: AbortSignal | undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        capturedSignal = opts.signal as AbortSignal;
        // Return a promise that hangs indefinitely (simulating slow server)
        return new Promise<Response>(() => {
          // Never resolves
        });
      })
    );

    vi.useFakeTimers();

    // Start the fetch (won't resolve)
    const fetchPromise = safeFetch('https://example.com');

    // The signal should not be aborted yet
    await vi.advanceTimersByTimeAsync(9_000);
    expect(capturedSignal?.aborted).toBe(false);

    // Advance past 10 second timeout
    await vi.advanceTimersByTimeAsync(2_000);
    expect(capturedSignal?.aborted).toBe(true);

    // Suppress the hanging promise (it's never resolved in this test)
    fetchPromise.catch(() => {
      /* expected: the hanging promise will never reject either since the mock
         doesn't react to abort -- we tested the signal was set */
    });

    vi.unstubAllGlobals();
  });
});
