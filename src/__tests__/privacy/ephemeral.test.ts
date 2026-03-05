import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PRIV-01: Generating art is private and ephemeral by default.
 * Text analysis runs entirely client-side -- no fetch() calls for text input.
 */
describe('Privacy — PRIV-01: ephemeral by default', () => {
  it('useTextAnalysis hook contains no fetch() calls', () => {
    const hookPath = path.resolve(
      __dirname,
      '../../hooks/useTextAnalysis.ts'
    );
    const source = fs.readFileSync(hookPath, 'utf-8');
    // Text analysis must not make server requests
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/axios|XMLHttpRequest/);
  });

  it('text analysis pipeline functions contain no fetch() calls', () => {
    const pipelineDirs = [
      path.resolve(__dirname, '../../lib/analysis'),
      path.resolve(__dirname, '../../lib/pipeline'),
      path.resolve(__dirname, '../../lib/canonicalize'),
    ];

    for (const dir of pipelineDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));
      for (const file of files) {
        const source = fs.readFileSync(path.join(dir, file), 'utf-8');
        expect(
          source,
          `${file} should not contain fetch() -- text analysis is client-side`
        ).not.toMatch(/\bfetch\s*\(/);
      }
    }
  });
});
