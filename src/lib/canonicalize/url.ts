import type { CanonResult } from '@/types/engine';

/**
 * Canonicalize URL input.
 * CANON-04: Lowercase scheme/host, remove default ports, sort query params
 * alphabetically, remove trailing slashes and fragments.
 */
export function canonicalizeUrl(input: string): CanonResult {
  const changes: string[] = [];

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`Invalid URL: "${input}"`);
  }

  // Track if scheme/host were lowercased (URL API does this automatically)
  const schemeHost = `${url.protocol}//${url.hostname}`;
  const originalSchemeHost = input.match(/^([a-zA-Z]+:\/\/[^/:?#]+)/)?.[1] || '';
  if (
    originalSchemeHost &&
    originalSchemeHost.toLowerCase() !== originalSchemeHost
  ) {
    changes.push('Lowercased scheme and host');
  }

  // Detect default ports (URL API strips them automatically, so check original input)
  const portMatch = input.match(/:\/\/[^/:]+:(\d+)/);
  if (portMatch) {
    const originalPort = portMatch[1];
    if (
      (url.protocol === 'http:' && originalPort === '80') ||
      (url.protocol === 'https:' && originalPort === '443')
    ) {
      changes.push('Removed default port');
    }
  }
  // Also handle the case where URL API didn't strip it yet
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }

  // Sort query parameters alphabetically
  const params = [...url.searchParams.entries()];
  const sortedParams = [...params].sort((a, b) => a[0].localeCompare(b[0]));
  const originalQuery = url.searchParams.toString();
  url.search = new URLSearchParams(sortedParams).toString();
  if (url.searchParams.toString() !== originalQuery && params.length > 1) {
    changes.push('Sorted query parameters alphabetically');
  }

  // Remove trailing slashes (but preserve root /)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
    changes.push('Removed trailing slash');
  }

  // Remove fragment
  if (url.hash) {
    changes.push('Removed URL fragment');
    url.hash = '';
  }

  return { canonical: url.toString(), changes, inputType: 'url' };
}
