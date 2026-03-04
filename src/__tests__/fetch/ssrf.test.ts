import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPrivateIpV4, isPrivateIpV6, resolveAndValidate } from '@/lib/fetch/ssrf';

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

import * as dns from 'node:dns/promises';

describe('isPrivateIpV4', () => {
  it('returns true for 10.0.0.1 (RFC1918 10/8)', () => {
    expect(isPrivateIpV4('10.0.0.1')).toBe(true);
  });

  it('returns true for 172.16.0.1 (RFC1918 172.16/12)', () => {
    expect(isPrivateIpV4('172.16.0.1')).toBe(true);
  });

  it('returns true for 192.168.1.1 (RFC1918 192.168/16)', () => {
    expect(isPrivateIpV4('192.168.1.1')).toBe(true);
  });

  it('returns true for 127.0.0.1 (loopback)', () => {
    expect(isPrivateIpV4('127.0.0.1')).toBe(true);
  });

  it('returns true for 0.0.0.1 (this network)', () => {
    expect(isPrivateIpV4('0.0.0.1')).toBe(true);
  });

  it('returns true for 169.254.169.254 (link-local / cloud metadata)', () => {
    expect(isPrivateIpV4('169.254.169.254')).toBe(true);
  });

  it('returns true for 224.0.0.1 (multicast)', () => {
    expect(isPrivateIpV4('224.0.0.1')).toBe(true);
  });

  it('returns true for 240.0.0.1 (reserved)', () => {
    expect(isPrivateIpV4('240.0.0.1')).toBe(true);
  });

  it('returns false for 1.1.1.1 (Cloudflare public DNS)', () => {
    expect(isPrivateIpV4('1.1.1.1')).toBe(false);
  });

  it('returns false for 8.8.8.8 (Google public DNS)', () => {
    expect(isPrivateIpV4('8.8.8.8')).toBe(false);
  });

  it('returns false for 93.184.216.34 (example.com)', () => {
    expect(isPrivateIpV4('93.184.216.34')).toBe(false);
  });

  it('returns true for malformed input: not-an-ip', () => {
    expect(isPrivateIpV4('not-an-ip')).toBe(true);
  });

  it('returns true for malformed input: 256.0.0.1 (out of range)', () => {
    expect(isPrivateIpV4('256.0.0.1')).toBe(true);
  });
});

describe('isPrivateIpV6', () => {
  it('returns true for ::1 (loopback)', () => {
    expect(isPrivateIpV6('::1')).toBe(true);
  });

  it('returns true for fc00::1 (unique local fc00::/7)', () => {
    expect(isPrivateIpV6('fc00::1')).toBe(true);
  });

  it('returns true for fd00::1 (unique local fd00::/8)', () => {
    expect(isPrivateIpV6('fd00::1')).toBe(true);
  });

  it('returns true for fe80::1 (link-local fe80::/10)', () => {
    expect(isPrivateIpV6('fe80::1')).toBe(true);
  });

  it('returns false for 2606:4700:4700::1111 (Cloudflare public DNS)', () => {
    expect(isPrivateIpV6('2606:4700:4700::1111')).toBe(false);
  });
});

describe('resolveAndValidate', () => {
  const mockResolve4 = vi.mocked(dns.resolve4);
  const mockResolve6 = vi.mocked(dns.resolve6);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws when hostname is localhost', async () => {
    await expect(resolveAndValidate('localhost')).rejects.toThrow(/Blocked hostname/i);
  });

  it('throws when hostname is metadata.google.internal', async () => {
    await expect(resolveAndValidate('metadata.google.internal')).rejects.toThrow(
      /Blocked hostname/i
    );
  });

  it('throws when DNS resolves to a private IP (127.0.0.1)', async () => {
    mockResolve4.mockResolvedValueOnce(['127.0.0.1']);
    mockResolve6.mockRejectedValueOnce(new Error('ENODATA'));
    await expect(resolveAndValidate('evil.example.com')).rejects.toThrow(/private IP/i);
  });

  it('resolves without throwing when DNS resolves to a public IP (1.1.1.1)', async () => {
    mockResolve4.mockResolvedValueOnce(['1.1.1.1']);
    mockResolve6.mockRejectedValueOnce(new Error('ENODATA'));
    await expect(resolveAndValidate('one.one.one.one')).resolves.toBeUndefined();
  });

  it('throws when DNS returns no records (both resolve4 and resolve6 throw)', async () => {
    mockResolve4.mockRejectedValueOnce(new Error('ENODATA'));
    mockResolve6.mockRejectedValueOnce(new Error('ENODATA'));
    await expect(resolveAndValidate('nonexistent.example.com')).rejects.toThrow(
      /DNS resolution failed/i
    );
  });
});
