import { describe, it, expect } from 'vitest';
import { canonicalizeCsv } from '@/lib/canonicalize/csv';

describe('CSV canonicalization', () => {
  it('parses comma-delimited CSV correctly', () => {
    const result = canonicalizeCsv('a,b,c\n1,2,3');
    expect(result.canonical).toContain('a,b,c');
    expect(result.inputType).toBe('csv');
  });

  it('handles double-quote escaped fields', () => {
    const result = canonicalizeCsv('name,value\n"John ""J"" Doe",42');
    expect(result.canonical).toContain('John');
  });

  it('trims cell whitespace', () => {
    const result = canonicalizeCsv(' a , b , c \n 1 , 2 , 3 ');
    expect(result.changes.some((c) => c.includes('Trimmed whitespace'))).toBe(
      true
    );
  });

  it('normalizes empty cells to null', () => {
    const result = canonicalizeCsv('a,,c\n1,,3');
    expect(result.canonical).toContain('null');
    expect(result.changes.some((c) => c.includes('empty cell'))).toBe(true);
  });

  it('handles single-column CSV', () => {
    const result = canonicalizeCsv('value\n1\n2\n3');
    expect(result.canonical).toContain('value');
  });

  it('handles CSV with headers', () => {
    const result = canonicalizeCsv('name,age,city\nAlice,30,NYC');
    expect(result.canonical).toContain('name,age,city');
  });

  it('handles empty CSV', () => {
    const result = canonicalizeCsv('');
    expect(result.canonical).toBe('');
    expect(result.changes).toContain('Input was empty');
  });

  it('handles whitespace-only CSV', () => {
    const result = canonicalizeCsv('   \n   ');
    expect(result.canonical).toBe('');
  });

  it('produces identical output across multiple calls', () => {
    const input = ' a , b \n 1 , 2 ';
    const r1 = canonicalizeCsv(input);
    const r2 = canonicalizeCsv(input);
    expect(r1.canonical).toBe(r2.canonical);
  });
});
