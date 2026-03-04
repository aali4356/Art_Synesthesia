/**
 * Tests for the data analyzer (DATA-01 through DATA-05).
 *
 * Covers CSV and JSON parsing, statistical computation, null/missing ratio,
 * correlation, cardinality, type detection, and performance.
 */

import { describe, it, expect } from 'vitest';
import { analyzeData } from '@/lib/analysis/data';

// ---------------------------------------------------------------------------
// CSV Parsing (DATA-01, DATA-02)
// ---------------------------------------------------------------------------

describe('CSV parsing', () => {
  it('produces correct columnCount and rowCount for simple 3-column CSV', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6';
    const result = analyzeData(csv, 'csv');
    expect(result.columnCount).toBe(3);
    expect(result.rowCount).toBe(2);
  });

  it('produces numericColumnRatio === 1.0 for all-numeric CSV', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6\n7,8,9';
    const result = analyzeData(csv, 'csv');
    expect(result.numericColumnRatio).toBe(1.0);
  });

  it('produces avgMean > 0 for positive numeric CSV', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6';
    const result = analyzeData(csv, 'csv');
    expect(result.avgMean).toBeGreaterThan(0);
  });

  it('produces avgVariance >= 0 for any numeric CSV', () => {
    const csv = 'x,y\n1,2\n3,4\n5,6';
    const result = analyzeData(csv, 'csv');
    expect(result.avgVariance).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Null / missing ratio (DATA-03)
// ---------------------------------------------------------------------------

describe('Null/missing ratio', () => {
  it('produces nullRatio > 0 for CSV with empty cells', () => {
    const csv = 'a,b\n1,\n,3';
    const result = analyzeData(csv, 'csv');
    expect(result.nullRatio).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Correlation (DATA-03)
// ---------------------------------------------------------------------------

describe('Correlation', () => {
  it('produces maxCorrelation > 0.99 for perfectly correlated columns', () => {
    const csv = 'a,b\n1,2\n2,4\n3,6';
    const result = analyzeData(csv, 'csv');
    expect(result.maxCorrelation).toBeGreaterThan(0.99);
  });

  it('produces maxCorrelation < 0.5 for uncorrelated columns', () => {
    // Columns with opposite-ish trends: a goes up, b alternates low/high
    const csv = 'a,b\n1,10\n2,1\n3,10\n4,1\n5,10';
    const result = analyzeData(csv, 'csv');
    expect(result.maxCorrelation).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// Cardinality (DATA-03)
// ---------------------------------------------------------------------------

describe('Cardinality', () => {
  it('produces avgCardinality close to 1.0 for all-unique string column', () => {
    const csv = 'name\nalice\nbob\ncharlie';
    const result = analyzeData(csv, 'csv');
    // All unique: cardinality = 3/3 = 1.0
    expect(result.avgCardinality).toBeCloseTo(1.0, 1);
  });

  it('produces avgCardinality < 0.5 for string column with repeating values', () => {
    const csv = 'category\nA\nA\nA\nA\nB';
    const result = analyzeData(csv, 'csv');
    // 2 unique / 5 total = 0.4
    expect(result.avgCardinality).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// Type detection (DATA-04)
// ---------------------------------------------------------------------------

describe('Type detection', () => {
  it('produces numericColumnRatio === 0 and stringColumnRatio === 1 for all-string CSV', () => {
    const csv = 'name,city,country\nalice,london,uk\nbob,paris,france';
    const result = analyzeData(csv, 'csv');
    expect(result.numericColumnRatio).toBe(0);
    expect(result.stringColumnRatio).toBe(1);
  });

  it('produces numericColumnRatio in (0, 1) for mixed CSV', () => {
    const csv = 'name,age,city\nalice,30,london\nbob,25,paris\ncharlie,35,berlin';
    const result = analyzeData(csv, 'csv');
    expect(result.numericColumnRatio).toBeGreaterThan(0);
    expect(result.numericColumnRatio).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// JSON format (DATA-01)
// ---------------------------------------------------------------------------

describe('JSON format', () => {
  it('handles JSON array of objects and matches equivalent CSV dimensions', () => {
    const json = JSON.stringify([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
    const result = analyzeData(json, 'json');
    expect(result.columnCount).toBe(2);
    expect(result.rowCount).toBe(2);
  });

  it('handles JSON 2D array and produces correct dimensions', () => {
    const json = JSON.stringify([[1, 2], [3, 4]]);
    const result = analyzeData(json, 'json');
    expect(result.columnCount).toBe(2);
    expect(result.rowCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Performance (DATA-05)
// ---------------------------------------------------------------------------

describe('Performance', () => {
  it('analyzes a 10,000-row CSV with 5 numeric columns in under 2000ms', () => {
    // Generate large CSV
    const headers = 'a,b,c,d,e';
    const rows: string[] = [headers];
    for (let i = 0; i < 10_000; i++) {
      rows.push(`${i},${i * 2},${i * 3},${i * 4},${i * 5}`);
    }
    const csv = rows.join('\n');

    const start = performance.now();
    analyzeData(csv, 'csv');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// Signal integrity
// ---------------------------------------------------------------------------

describe('Signal integrity', () => {
  it('returns only finite numbers (no NaN, no Infinity)', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6\n7,8,9';
    const result = analyzeData(csv, 'csv');
    const values = Object.values(result);
    expect(values.every((v) => isFinite(v))).toBe(true);
  });

  it('returns all 15 expected signal keys', () => {
    const csv = 'a,b\n1,2\n3,4';
    const result = analyzeData(csv, 'csv');
    const expectedKeys = [
      'columnCount',
      'rowCount',
      'numericColumnRatio',
      'stringColumnRatio',
      'dateColumnRatio',
      'nullRatio',
      'avgMean',
      'avgVariance',
      'avgSkewness',
      'avgKurtosis',
      'maxCorrelation',
      'avgCorrelation',
      'avgCardinality',
      'varianceSpread',
      'dataUniformity',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });
});
