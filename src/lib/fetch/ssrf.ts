import * as dnsPromises from 'node:dns/promises';

/**
 * Returns true if the IPv4 address falls within a private or reserved range.
 * Returns true for malformed/invalid inputs (fail-closed: block unknown).
 *
 * Blocked ranges:
 *   10.0.0.0/8       - RFC1918 private
 *   172.16.0.0/12    - RFC1918 private
 *   192.168.0.0/16   - RFC1918 private
 *   127.0.0.0/8      - Loopback
 *   0.0.0.0/8        - This network
 *   169.254.0.0/16   - Link-local (cloud metadata endpoint 169.254.169.254)
 *   224.0.0.0/4      - Multicast
 *   240.0.0.0/4      - Reserved
 */
export function isPrivateIpV4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return true; // invalid = block

  const octets = parts.map(Number);
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return true; // invalid = block

  const [a, b] = octets;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 127.0.0.0/8 - loopback
  if (a === 127) return true;
  // 0.0.0.0/8 - this network
  if (a === 0) return true;
  // 169.254.0.0/16 - link-local / cloud metadata
  if (a === 169 && b === 254) return true;
  // 224.0.0.0/4 - multicast (224–239)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 - reserved (240–255)
  if (a >= 240 && a <= 255) return true;

  return false;
}

/**
 * Returns true if the IPv6 address falls within a private or reserved range.
 * Uses string-based prefix matching on lowercased input.
 *
 * Blocked ranges:
 *   ::1          - Loopback
 *   fc00::/7     - Unique local (fc** and fd**)
 *   fe80::/10    - Link-local (fe80, fe90, fea0, feb0 prefixes)
 */
export function isPrivateIpV6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Loopback
  if (lower === '::1') return true;

  // Unique local fc00::/7 -- first byte in [0xfc, 0xfd]
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // Link-local fe80::/10 -- first 10 bits are 1111111010
  // Covers fe80, fe90, fea0, feb0 (fe8x, fe9x, feax, febx as hex prefixes)
  if (
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb')
  ) {
    return true;
  }

  return false;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.amazonaws.com',
  '169.254.169.254',
]);

/**
 * Resolves DNS for the given hostname and validates all returned IPs
 * against the private IP blocklists. Throws if:
 *   - The hostname is in the known-blocked list
 *   - DNS resolution returns no records
 *   - Any resolved IP is private/reserved
 */
export async function resolveAndValidate(hostname: string): Promise<void> {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  let ips: string[] = [];
  try {
    ips = await dnsPromises.resolve4(hostname);
  } catch {
    /* no A records -- continue to try AAAA */
  }
  try {
    ips = [...ips, ...(await dnsPromises.resolve6(hostname))];
  } catch {
    /* no AAAA records */
  }

  if (ips.length === 0) {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }

  for (const ip of ips) {
    if (isPrivateIpV4(ip) || isPrivateIpV6(ip)) {
      throw new Error(`Blocked: ${hostname} resolves to private IP ${ip}`);
    }
  }
}
