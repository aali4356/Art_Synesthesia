import { describe, it, expect } from 'vitest';
import { sha256 } from '@/lib/engine/hash';

describe('SHA-256 hashing', () => {
  it('produces consistent hash for "hello"', async () => {
    const hash = await sha256('hello');
    // Known SHA-256 of "hello"
    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('produces consistent hash for empty string', async () => {
    const hash = await sha256('');
    // Known SHA-256 of ""
    expect(hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('same input always returns same hash (determinism)', async () => {
    const input = 'determinism test';
    const hash1 = await sha256(input);
    const hash2 = await sha256(input);
    const hash3 = await sha256(input);
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('different inputs return different hashes', async () => {
    const hash1 = await sha256('input A');
    const hash2 = await sha256('input B');
    expect(hash1).not.toBe(hash2);
  });

  it('returns 64-character hex string', async () => {
    const hash = await sha256('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
