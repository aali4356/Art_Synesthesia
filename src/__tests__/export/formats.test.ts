import { describe, it, expect } from 'vitest';
import { getSupportedExportFormats, isSvgExportSupported } from '@/lib/export/formats';

describe('export format support', () => {
  it('supports PNG for every style', () => {
    expect(getSupportedExportFormats('geometric')).toContain('png');
    expect(getSupportedExportFormats('organic')).toContain('png');
    expect(getSupportedExportFormats('particle')).toContain('png');
    expect(getSupportedExportFormats('typographic')).toContain('png');
  });

  it('supports SVG only for geometric and typographic styles', () => {
    expect(isSvgExportSupported('geometric')).toBe(true);
    expect(isSvgExportSupported('typographic')).toBe(true);
    expect(isSvgExportSupported('organic')).toBe(false);
    expect(isSvgExportSupported('particle')).toBe(false);
  });
});
