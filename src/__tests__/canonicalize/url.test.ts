import { describe, it, expect } from 'vitest';
import { canonicalizeUrl } from '@/lib/canonicalize/url';

describe('URL canonicalization', () => {
  it('lowercases scheme and host', () => {
    const result = canonicalizeUrl('HTTP://Example.COM/path');
    expect(result.canonical).toBe('http://example.com/path');
    expect(result.changes).toContain('Lowercased scheme and host');
  });

  it('removes default port 80 for http', () => {
    const result = canonicalizeUrl('http://example.com:80/path');
    expect(result.canonical).toBe('http://example.com/path');
    expect(result.changes).toContain('Removed default port');
  });

  it('removes default port 443 for https', () => {
    const result = canonicalizeUrl('https://example.com:443/path');
    expect(result.canonical).toBe('https://example.com/path');
    expect(result.changes).toContain('Removed default port');
  });

  it('preserves non-default ports', () => {
    const result = canonicalizeUrl('https://example.com:8080/path');
    expect(result.canonical).toContain(':8080');
  });

  it('sorts query parameters alphabetically', () => {
    const result = canonicalizeUrl('https://example.com?z=1&a=2&m=3');
    expect(result.canonical).toBe('https://example.com/?a=2&m=3&z=1');
    expect(result.changes).toContain('Sorted query parameters alphabetically');
  });

  it('removes trailing slashes (but preserves root /)', () => {
    const result = canonicalizeUrl('https://example.com/path/');
    expect(result.canonical).toBe('https://example.com/path');
    expect(result.changes).toContain('Removed trailing slash');
  });

  it('preserves root slash', () => {
    const result = canonicalizeUrl('https://example.com/');
    expect(result.canonical).toBe('https://example.com/');
  });

  it('removes URL fragment', () => {
    const result = canonicalizeUrl('https://example.com/path#section');
    expect(result.canonical).toBe('https://example.com/path');
    expect(result.changes).toContain('Removed URL fragment');
  });

  it('handles URL with no query string', () => {
    const result = canonicalizeUrl('https://example.com/path');
    expect(result.canonical).toBe('https://example.com/path');
  });

  it('handles URL with no path (just domain)', () => {
    const result = canonicalizeUrl('https://example.com');
    expect(result.canonical).toBe('https://example.com/');
  });

  it('throws on invalid URL', () => {
    expect(() => canonicalizeUrl('not-a-url')).toThrow('Invalid URL');
  });

  it('produces identical output across multiple calls', () => {
    const input = 'HTTPS://Example.COM:443/Path/?z=1&a=2#frag';
    const r1 = canonicalizeUrl(input);
    const r2 = canonicalizeUrl(input);
    expect(r1.canonical).toBe(r2.canonical);
  });
});
