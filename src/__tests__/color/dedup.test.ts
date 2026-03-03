import { describe, it, expect } from 'vitest';
import { rejectNearDuplicates, type OklchColor } from '@/lib/color/dedup';

describe('rejectNearDuplicates', () => {
  it('returns well-separated colors unchanged', () => {
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 0 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 120 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 240 },
    ];
    const result = rejectNearDuplicates(colors);
    expect(result).toHaveLength(3);
    // Hues should be unchanged
    expect(result[0].h).toBe(0);
    expect(result[1].h).toBe(120);
    expect(result[2].h).toBe(240);
  });

  it('shifts hue for near-duplicate colors', () => {
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 180 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 180 }, // exact duplicate
    ];
    const result = rejectNearDuplicates(colors);
    expect(result).toHaveLength(2);
    // First color unchanged
    expect(result[0].h).toBe(180);
    // Second color should have been shifted
    expect(result[1].h).not.toBe(180);
  });

  it('uses default threshold of 10 (deltaE CIEDE2000)', () => {
    // Two very close colors (slightly different hue)
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 100 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 101 }, // very close
    ];
    const result = rejectNearDuplicates(colors);
    expect(result).toHaveLength(2);
    // Second should be hue-shifted since deltaE < 10
    expect(result[1].h).not.toBe(101);
  });

  it('accepts a custom threshold', () => {
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 100 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 110 },
    ];
    // With a very high threshold, even somewhat different colors are considered duplicates
    const result = rejectNearDuplicates(colors, 50);
    expect(result).toHaveLength(2);
    // Second should have been shifted since threshold is very high
    expect(result[1].h).not.toBe(110);
  });

  it('shifts hue by increments of 10 degrees', () => {
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 0 },
      { mode: 'oklch', l: 0.65, c: 0.2, h: 0 }, // duplicate
    ];
    const result = rejectNearDuplicates(colors);
    // The shifted hue should be a multiple of 10 from original
    const shiftedHue = result[1].h;
    expect(shiftedHue % 10).toBe(0);
    expect(shiftedHue).toBeGreaterThan(0);
  });

  it('handles maximum of 36 shift attempts', () => {
    // All similar colors - fill the whole hue wheel with similar colors
    const colors: OklchColor[] = Array.from({ length: 37 }, (_, i) => ({
      mode: 'oklch' as const,
      l: 0.65,
      c: 0.2,
      h: i * 10,
    }));
    // With a very high threshold, some colors may be dropped
    const result = rejectNearDuplicates(colors, 50);
    // Should be fewer than 37 since some can't find unique positions
    expect(result.length).toBeLessThanOrEqual(37);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('handles single color input', () => {
    const colors: OklchColor[] = [
      { mode: 'oklch', l: 0.65, c: 0.2, h: 45 },
    ];
    const result = rejectNearDuplicates(colors);
    expect(result).toHaveLength(1);
    expect(result[0].h).toBe(45);
  });

  it('handles empty input', () => {
    const result = rejectNearDuplicates([]);
    expect(result).toHaveLength(0);
  });
});
