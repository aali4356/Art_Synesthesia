import { describe, it, expect } from 'vitest';
import { canonicalizeText } from '@/lib/canonicalize/text';

describe('Text canonicalization', () => {
  it('applies Unicode NFC normalization', () => {
    // e with combining acute accent (NFD) vs precomposed e-acute (NFC)
    const nfd = 'caf\u0065\u0301'; // "café" in NFD
    const result = canonicalizeText(nfd);
    expect(result.canonical).toBe('caf\u00e9'); // NFC form
    expect(result.changes).toContain('Applied Unicode NFC normalization');
  });

  it('converts \\r\\n to \\n', () => {
    const result = canonicalizeText('line1\r\nline2\r\nline3');
    expect(result.canonical).toBe('line1\nline2\nline3');
    expect(result.changes.some((c) => c.includes('\\r\\n'))).toBe(true);
  });

  it('converts \\r to \\n', () => {
    const result = canonicalizeText('line1\rline2');
    expect(result.canonical).toBe('line1\nline2');
    expect(result.changes.some((c) => c.includes('\\r'))).toBe(true);
  });

  it('trims trailing whitespace per line but preserves leading', () => {
    const result = canonicalizeText('  hello  \n  world  ');
    expect(result.canonical).toBe('  hello\n  world');
    expect(result.changes).toContain('Trimmed trailing whitespace');
  });

  it('does NOT collapse internal whitespace', () => {
    const input = 'hello    world    test';
    const result = canonicalizeText(input);
    expect(result.canonical).toBe('hello    world    test');
  });

  it('returns empty changes array when input is already canonical', () => {
    const result = canonicalizeText('hello world');
    expect(result.changes).toHaveLength(0);
  });

  it('handles empty string input', () => {
    const result = canonicalizeText('');
    expect(result.canonical).toBe('');
    expect(result.inputType).toBe('text');
  });

  it('handles whitespace-only input', () => {
    const result = canonicalizeText('   \n   \n   ');
    expect(result.canonical).toBe('\n\n');
  });

  it('handles emoji and special Unicode characters', () => {
    const input = 'Hello 🌍 World! 你好';
    const result = canonicalizeText(input);
    expect(result.canonical).toBe(input);
  });

  it('produces identical output across multiple calls (determinism)', () => {
    const input = 'test\r\ninput  \r  with\t  spaces  ';
    const r1 = canonicalizeText(input);
    const r2 = canonicalizeText(input);
    const r3 = canonicalizeText(input);
    expect(r1.canonical).toBe(r2.canonical);
    expect(r2.canonical).toBe(r3.canonical);
  });
});
