import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PRIV-04: Local-only mode for text input.
 * - Analysis runs client-side
 * - Lock icon indicator shown
 * - No server requests made
 */
describe('Privacy — PRIV-04: local-only mode', () => {
  it('InputZone renders lock icon for text tab (local-only indicator)', () => {
    const componentPath = path.resolve(
      __dirname,
      '../../components/input/InputZone.tsx'
    );
    const source = fs.readFileSync(componentPath, 'utf-8');
    // Must contain local-only indicator
    expect(source).toMatch(/Local only|local.only|lock/i);
    // Must be conditionally shown for text tab
    expect(source).toMatch(/activeTab.*text|text.*activeTab/);
  });

  it('useTextAnalysis hook is free of fetch calls (pure client-side)', () => {
    const hookPath = path.resolve(
      __dirname,
      '../../hooks/useTextAnalysis.ts'
    );
    const source = fs.readFileSync(hookPath, 'utf-8');
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });

  it('InputZone lock icon has accessible label', () => {
    const componentPath = path.resolve(
      __dirname,
      '../../components/input/InputZone.tsx'
    );
    const source = fs.readFileSync(componentPath, 'utf-8');
    // Lock icon must have aria-label or title for screen readers
    expect(source).toMatch(/aria-label|title.*[Ll]ocal/);
  });
});
