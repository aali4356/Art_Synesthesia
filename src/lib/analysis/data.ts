/**
 * Client-side data analyzer for CSV and JSON inputs.
 *
 * Uses PapaParse for CSV parsing (consistent with canonicalize/csv.ts) and
 * simple-statistics for statistical computation. All analysis runs entirely
 * in the browser -- no external fetch, no server side.
 *
 * Produces a flat Record<string, number> of 15 signals that map to the
 * ParameterVector via DATA_MAPPINGS in the pipeline mapping table.
 */

import Papa from 'papaparse';
import {
  mean,
  variance,
  sampleSkewness,
  sampleKurtosis,
  sampleCorrelation,
} from 'simple-statistics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 10_000;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type Row = Record<string, string>;

interface ParseResult {
  columns: string[];
  rows: Row[];
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/**
 * Parse CSV string to rows using PapaParse.
 * dynamicTyping: false -- consistent with canonicalize/csv.ts decision.
 */
function parseCsv(raw: string): ParseResult {
  const result = Papa.parse<Row>(raw, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });
  const columns: string[] = result.meta.fields ?? [];
  const rows: Row[] = result.data.slice(0, MAX_ROWS);
  return { columns, rows };
}

/**
 * Parse JSON string to rows.
 * Supports:
 * - Array of objects: [{"a":1,"b":2},...]
 * - 2D array: [[1,2],[3,4],...]
 */
function parseJson(raw: string): ParseResult {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array of objects or a 2D array');
  }

  if (parsed.length === 0) {
    return { columns: [], rows: [] };
  }

  const first = parsed[0];

  if (Array.isArray(first)) {
    // 2D array: positional column names
    const columns = (first as unknown[]).map((_, i) => `col_${i}`);
    const rows: Row[] = (parsed as unknown[][]).slice(0, MAX_ROWS).map((rowArr) => {
      const row: Row = {};
      columns.forEach((col, i) => {
        row[col] = String(rowArr[i] ?? '');
      });
      return row;
    });
    return { columns, rows };
  }

  // Array of objects
  const columns = Object.keys(first as object);
  const rows: Row[] = (parsed as Record<string, unknown>[]).slice(0, MAX_ROWS).map((obj) => {
    const row: Row = {};
    for (const col of columns) {
      row[col] = String(obj[col] ?? '');
    }
    return row;
  });
  return { columns, rows };
}

// ---------------------------------------------------------------------------
// Type detection helpers
// ---------------------------------------------------------------------------

/** Returns true if the string value parses as a finite float */
function isNumericValue(v: string): boolean {
  if (v === '' || v === null || v === undefined) return false;
  const f = parseFloat(v);
  return !isNaN(f) && isFinite(f);
}

/** Returns true if the string value looks like a date (but not purely numeric) */
function isDateValue(v: string): boolean {
  if (v === '' || isNumericValue(v)) return false;
  // ISO date pattern (YYYY-MM-DD or ISO 8601)
  const isoPattern = /^\d{4}-\d{2}-\d{2}/;
  if (isoPattern.test(v)) return true;
  // Parseable by Date.parse and not purely numeric
  const ts = Date.parse(v);
  return !isNaN(ts);
}

// ---------------------------------------------------------------------------
// Column classifier
// ---------------------------------------------------------------------------

interface ColumnClassification {
  numericCols: Array<{ name: string; values: number[] }>;
  stringCols: Array<{ name: string; values: string[] }>;
  dateCols: string[];
  nullCount: number;
  totalCells: number;
}

function classifyColumns(columns: string[], rows: Row[]): ColumnClassification {
  const numericCols: Array<{ name: string; values: number[] }> = [];
  const stringCols: Array<{ name: string; values: string[] }> = [];
  const dateCols: string[] = [];
  let nullCount = 0;
  let totalCells = 0;

  for (const col of columns) {
    const rawValues = rows.map((r) => r[col] ?? '');
    totalCells += rawValues.length;
    const nulls = rawValues.filter((v) => v === '' || v === null || v === undefined).length;
    nullCount += nulls;
    const nonNull = rawValues.filter((v) => v !== '' && v !== null && v !== undefined);

    if (nonNull.length === 0) {
      // All null -- treat as string column
      stringCols.push({ name: col, values: rawValues.map(String) });
      continue;
    }

    const numericCount = nonNull.filter(isNumericValue).length;
    const dateCount = nonNull.filter(isDateValue).length;

    if (numericCount > nonNull.length * 0.5) {
      // Majority numeric
      numericCols.push({
        name: col,
        values: nonNull.filter(isNumericValue).map(parseFloat),
      });
    } else if (dateCount > nonNull.length * 0.5) {
      // Majority date
      dateCols.push(col);
    } else {
      // String column
      stringCols.push({ name: col, values: nonNull.map(String) });
    }
  }

  return { numericCols, stringCols, dateCols, nullCount, totalCells };
}

// ---------------------------------------------------------------------------
// Statistical helpers (with guards)
// ---------------------------------------------------------------------------

/** Safe mean -- returns 0 for empty arrays */
function safeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return mean(values);
}

/** Safe variance -- returns 0 for < 2 values */
function safeVariance(values: number[]): number {
  if (values.length < 2) return 0;
  return variance(values);
}

/** Safe sampleSkewness -- returns 0 for < 3 values or on error */
function safeSkewness(values: number[]): number {
  if (values.length < 3) return 0;
  try {
    const s = sampleSkewness(values);
    return isFinite(s) ? Math.abs(s) : 0;
  } catch {
    return 0;
  }
}

/** Safe sampleKurtosis -- returns 0 for < 4 values or on error */
function safeKurtosis(values: number[]): number {
  if (values.length < 4) return 0;
  try {
    const k = sampleKurtosis(values);
    return isFinite(k) ? k : 0;
  } catch {
    return 0;
  }
}

/** Safe sampleCorrelation -- returns NaN on error or insufficient data */
function safeCorrelation(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen < 3) return NaN;
  try {
    const c = sampleCorrelation(a.slice(0, minLen), b.slice(0, minLen));
    return isFinite(c) ? Math.abs(c) : NaN;
  } catch {
    return NaN;
  }
}

// ---------------------------------------------------------------------------
// Main analyzer
// ---------------------------------------------------------------------------

/**
 * Analyze CSV or JSON data and return a flat signal record.
 *
 * @param raw - Raw string content (CSV text or JSON string)
 * @param format - 'csv' or 'json'
 * @returns Record of 15 numeric signals
 * @throws Error if raw exceeds 5MB or JSON is invalid
 */
export function analyzeData(raw: string, format: 'csv' | 'json'): Record<string, number> {
  // Size cap
  if (raw.length > MAX_BYTES) {
    throw new Error('Data exceeds 5MB limit');
  }

  // Parse
  const { columns, rows } = format === 'csv' ? parseCsv(raw) : parseJson(raw);

  const columnCount = columns.length;
  const rowCount = rows.length;

  // Guard: no data
  if (columnCount === 0 || rowCount === 0) {
    return {
      columnCount: 0,
      rowCount: 0,
      numericColumnRatio: 0,
      stringColumnRatio: 0,
      dateColumnRatio: 0,
      nullRatio: 0,
      avgMean: 0,
      avgVariance: 0,
      avgSkewness: 0,
      avgKurtosis: 0,
      maxCorrelation: 0,
      avgCorrelation: 0,
      avgCardinality: 0,
      varianceSpread: 0,
      dataUniformity: 0.5,
    };
  }

  // Classify columns
  const { numericCols, stringCols, dateCols, nullCount, totalCells } =
    classifyColumns(columns, rows);

  // Ratios
  const numericColumnRatio = numericCols.length / columnCount;
  const stringColumnRatio = stringCols.length / columnCount;
  const dateColumnRatio = dateCols.length / columnCount;
  const nullRatio = totalCells > 0 ? nullCount / totalCells : 0;

  // Numeric distribution statistics
  const means = numericCols.map((c) => mean(c.values));
  const variances = numericCols.map((c) => safeVariance(c.values));
  const skewnesses = numericCols.map((c) => safeSkewness(c.values));
  const kurtoses = numericCols.map((c) => safeKurtosis(c.values));

  const avgMean = means.length > 0 ? safeMean(means.map(Math.abs)) : 0;
  const avgVariance = variances.length > 0 ? safeMean(variances) : 0;
  const avgSkewness = skewnesses.length > 0 ? safeMean(skewnesses) : 0;
  const avgKurtosis = kurtoses.length > 0 ? safeMean(kurtoses) : 0;

  // Correlation between all pairs of numeric columns
  const correlations: number[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const c = safeCorrelation(numericCols[i].values, numericCols[j].values);
      if (!isNaN(c)) {
        correlations.push(c);
      }
    }
  }
  const maxCorrelation = correlations.length > 0 ? Math.max(...correlations) : 0;
  const avgCorrelation = correlations.length > 0 ? safeMean(correlations) : 0;

  // Categorical cardinality (string columns)
  const cardinalities = stringCols.map(
    (c) => new Set(c.values).size / Math.max(1, c.values.length)
  );
  const avgCardinality = cardinalities.length > 0 ? safeMean(cardinalities) : 0;

  // Variance spread (variance of per-column variances)
  const varianceSpread = variances.length > 1 ? safeVariance(variances) : 0;

  // Data uniformity (inverse of cardinality for string cols; 0.5 if no string cols)
  const dataUniformity =
    cardinalities.length > 0 ? 1 - safeMean(cardinalities) : 0.5;

  return {
    columnCount,
    rowCount,
    numericColumnRatio,
    stringColumnRatio,
    dateColumnRatio,
    nullRatio,
    avgMean,
    avgVariance,
    avgSkewness,
    avgKurtosis,
    maxCorrelation,
    avgCorrelation,
    avgCardinality,
    varianceSpread,
    dataUniformity,
  };
}
