import { resolveAndValidate } from './ssrf';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_REDIRECTS = 3;

/**
 * Safely fetches a URL with SSRF protection, size limits, timeout, and redirect cap.
 *
 * - Validates protocol (http/https only)
 * - Resolves DNS and blocks private/reserved IPs before connecting
 * - Enforces 10-second timeout via AbortController
 * - Streams response body, aborting if > 5MB
 * - Follows redirects manually (up to 3 hops), re-validating each hop
 * - Strips Cookie/Authorization/X-Auth-Token headers from requests
 * - Returns decoded body string on success
 */
export async function safeFetch(url: string): Promise<string> {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    const parsed = new URL(currentUrl);

    // Protocol allowlist: http and https only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Blocked protocol: ${parsed.protocol}`);
    }

    // DNS resolution + private IP check (SSRF protection)
    await resolveAndValidate(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'SynesthesiaMachine/1.0 (art-generator)',
          Accept: 'text/html,application/xhtml+xml',
          // Explicitly do NOT forward Cookie, Authorization, X-Auth-Token
        },
      });

      // Manual redirect handling
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount >= MAX_REDIRECTS) {
          throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
        }
        const location = response.headers.get('location');
        if (!location) throw new Error('Redirect without Location header');
        // Resolve relative Location against current URL
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Stream body with size limit
      const body = response.body;
      if (!body) throw new Error('No response body');

      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
          if (totalBytes > MAX_BYTES) {
            reader.cancel();
            throw new Error(
              `Response exceeds ${MAX_BYTES} byte limit (downloaded ${totalBytes} bytes)`
            );
          }
          chunks.push(value);
        }
      } catch (err) {
        // Cancel the reader if we threw mid-stream
        try {
          reader.cancel();
        } catch {
          /* ignore cancel errors */
        }
        throw err;
      }

      // Decode body using TextDecoder with streaming support
      const decoder = new TextDecoder();
      return (
        chunks.map((c) => decoder.decode(c, { stream: true })).join('') + decoder.decode()
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}
