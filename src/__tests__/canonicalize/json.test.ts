import { describe, it, expect } from 'vitest';
import { canonicalizeJson } from '@/lib/canonicalize/json';

describe('JSON canonicalization', () => {
  it('sorts top-level keys alphabetically', () => {
    const result = canonicalizeJson('{"b": 1, "a": 2}');
    expect(result.canonical).toBe('{"a":2,"b":1}');
    expect(result.changes).toContain('Sorted keys alphabetically');
  });

  it('sorts nested object keys recursively', () => {
    const input = '{"z": {"b": 1, "a": 2}, "a": 3}';
    const result = canonicalizeJson(input);
    const parsed = JSON.parse(result.canonical);
    expect(Object.keys(parsed)).toEqual(['a', 'z']);
    expect(Object.keys(parsed.z)).toEqual(['a', 'b']);
  });

  it('preserves array order (arrays are NOT sorted)', () => {
    const result = canonicalizeJson('[3, 1, 2]');
    expect(result.canonical).toBe('[3,1,2]');
  });

  it('normalizes number formatting (trailing zeros removed by JSON.stringify)', () => {
    // JSON.stringify already normalizes numbers
    const result = canonicalizeJson('{"val": 1.0}');
    expect(result.canonical).toBe('{"val":1}');
  });

  it('strips single-line JSONC comments', () => {
    const input = '{\n"a": 1 // comment\n}';
    const result = canonicalizeJson(input);
    expect(result.canonical).toBe('{"a":1}');
    expect(result.changes).toContain('Stripped JSON comments');
  });

  it('strips multi-line JSONC comments', () => {
    const input = '{"a": /* value */ 1}';
    const result = canonicalizeJson(input);
    expect(result.canonical).toBe('{"a":1}');
  });

  it('handles empty object', () => {
    const result = canonicalizeJson('{}');
    expect(result.canonical).toBe('{}');
  });

  it('handles empty array', () => {
    const result = canonicalizeJson('[]');
    expect(result.canonical).toBe('[]');
  });

  it('handles deeply nested structures', () => {
    const input = '{"c": {"b": {"a": 1}}}';
    const result = canonicalizeJson(input);
    expect(result.canonical).toBe('{"c":{"b":{"a":1}}}');
  });

  it('handles null values (preserves them)', () => {
    const result = canonicalizeJson('{"a": null, "b": 1}');
    expect(result.canonical).toBe('{"a":null,"b":1}');
  });

  it('handles special characters in string values', () => {
    const result = canonicalizeJson('{"key": "value with \\"quotes\\" and \\n"}');
    const parsed = JSON.parse(result.canonical);
    expect(parsed.key).toContain('quotes');
  });

  it('throws on invalid JSON with helpful error', () => {
    expect(() => canonicalizeJson('{invalid}')).toThrow('Invalid JSON');
  });
});
