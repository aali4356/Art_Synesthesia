import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const BANNED_PATTERNS = [
  /raw_input/,
  /rawInput/,
  /input_text/,
  /inputText/,
  /raw_text/,
  /rawText/,
];

const DB_SCHEMA_DIR = path.resolve(__dirname, '../../db/schema');

/**
 * PRIV-02: Raw input never stored server-side.
 * PRIV-03: No DB table has a raw input column.
 */
describe('Privacy — PRIV-02, PRIV-03: no raw input storage', () => {
  it('no DB schema file contains raw input column names', () => {
    if (!fs.existsSync(DB_SCHEMA_DIR)) return;
    const files = fs.readdirSync(DB_SCHEMA_DIR).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = fs.readFileSync(path.join(DB_SCHEMA_DIR, file), 'utf-8');
      for (const pattern of BANNED_PATTERNS) {
        expect(
          source,
          `${file} must not define column matching ${pattern}`
        ).not.toMatch(pattern);
      }
    }
  });

  it('share API route does not persist raw input', () => {
    const routePath = path.resolve(
      __dirname,
      '../../app/api/share/route.ts'
    );
    if (!fs.existsSync(routePath)) return;
    const source = fs.readFileSync(routePath, 'utf-8');

    // The route should have a privacy gate that checks for raw input fields
    expect(source).toContain('rawInput');
    // But the check must be a rejection, not storage
    expect(source).toContain('400');
    // No column with raw input name should be passed to db.insert
    expect(source).not.toMatch(/rawInput\s*:/);
  });

  it('gallery API route does not accept raw input', () => {
    const routePath = path.resolve(
      __dirname,
      '../../app/api/gallery/route.ts'
    );
    if (!fs.existsSync(routePath)) return;
    const source = fs.readFileSync(routePath, 'utf-8');
    expect(source).toContain('rawInput');
    expect(source).toContain('400');
  });
});
