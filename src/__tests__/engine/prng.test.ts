import { describe, it, expect } from 'vitest';
import { createPRNG, deriveSeed } from '@/lib/engine/prng';

describe('Seeded PRNG', () => {
  it('same seed produces identical sequence', () => {
    const rng1 = createPRNG('test-seed');
    const rng2 = createPRNG('test-seed');

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createPRNG('seed-a');
    const rng2 = createPRNG('seed-b');

    const val1 = rng1();
    const val2 = rng2();

    expect(val1).not.toBe(val2);
  });

  it('PRNG values are in [0, 1) range', () => {
    const rng = createPRNG('range-test');

    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('PRNG produces different values on successive calls', () => {
    const rng = createPRNG('variety-test');
    const values = new Set(Array.from({ length: 20 }, () => rng()));
    // With 20 calls, we should get at least 15 unique values
    expect(values.size).toBeGreaterThan(15);
  });
});

describe('deriveSeed', () => {
  it('produces consistent seed for same inputs', async () => {
    const seed1 = await deriveSeed('hello world', 'geometric', '0.1.0');
    const seed2 = await deriveSeed('hello world', 'geometric', '0.1.0');
    expect(seed1).toBe(seed2);
  });

  it('different style produces different seed', async () => {
    const seed1 = await deriveSeed('hello', 'geometric', '0.1.0');
    const seed2 = await deriveSeed('hello', 'organic', '0.1.0');
    expect(seed1).not.toBe(seed2);
  });

  it('different version produces different seed', async () => {
    const seed1 = await deriveSeed('hello', 'geometric', '0.1.0');
    const seed2 = await deriveSeed('hello', 'geometric', '0.2.0');
    expect(seed1).not.toBe(seed2);
  });

  it('returns 64-character hex string (SHA-256)', async () => {
    const seed = await deriveSeed('test', 'style', '1.0.0');
    expect(seed).toHaveLength(64);
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
  });
});
