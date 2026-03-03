import { describe, it, expect } from 'vitest';
import { buildSceneGraph } from '@/lib/render/geometric/scene';
import { drawSceneComplete } from '@/lib/render/geometric/draw';
import type { ParameterVector } from '@/types/engine';
import type { PaletteResult } from '@/lib/color/palette';

/** Helper: create a default ParameterVector. */
function makeParams(overrides: Partial<ParameterVector> = {}): ParameterVector {
  return {
    complexity: 0.5,
    warmth: 0.5,
    symmetry: 0.5,
    rhythm: 0.5,
    energy: 0.5,
    density: 0.5,
    scaleVariation: 0.5,
    curvature: 0.5,
    saturation: 0.5,
    contrast: 0.5,
    layering: 0.5,
    directionality: 0.5,
    paletteSize: 0.5,
    texture: 0.5,
    regularity: 0.5,
    ...overrides,
  };
}

/** Helper: create a mock PaletteResult. */
function makePalette(): PaletteResult {
  const colors = [
    { oklch: { mode: 'oklch' as const, l: 0.65, c: 0.25, h: 285 }, hex: '#7b3dd4', css: 'oklch(0.65 0.25 285)' },
    { oklch: { mode: 'oklch' as const, l: 0.60, c: 0.20, h: 30 }, hex: '#d4783d', css: 'oklch(0.60 0.20 30)' },
    { oklch: { mode: 'oklch' as const, l: 0.55, c: 0.18, h: 120 }, hex: '#3dd47b', css: 'oklch(0.55 0.18 120)' },
  ];
  return {
    dark: colors,
    light: colors,
    harmony: 'triadic',
    count: 3,
  };
}

/**
 * Create a minimal CanvasRenderingContext2D mock that records calls.
 * Used instead of vitest-canvas-mock to avoid dependency issues.
 */
function createMockContext(): CanvasRenderingContext2D {
  const calls: string[] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (prop === '__calls') return calls;
      if (typeof prop === 'string') {
        // Return a settable property or a callable function
        if (prop in target) return target[prop];
        // Return a no-op function for any method call
        return (...args: unknown[]) => {
          calls.push(`${prop}(${args.length})`);
        };
      }
      return undefined;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
}

describe('performance', () => {
  it('buildSceneGraph at 800x800 with complexity=1.0 completes in < 100ms (GEOM-05)', () => {
    const params = makeParams({ complexity: 1.0, density: 1.0 });
    const palette = makePalette();

    const start = performance.now();
    const scene = buildSceneGraph(params, palette, 'dark', 'perf-build', 800);
    const elapsed = performance.now() - start;

    expect(scene.elements.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });

  it('drawSceneComplete on mock canvas at 800x800 completes in < 50ms (GEOM-05)', () => {
    const params = makeParams({ complexity: 1.0, density: 1.0 });
    const palette = makePalette();
    const scene = buildSceneGraph(params, palette, 'dark', 'perf-draw', 800);
    const ctx = createMockContext();

    const start = performance.now();
    drawSceneComplete(ctx, scene);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('combined scene build + draw completes in < 200ms (GEOM-05)', () => {
    const params = makeParams({ complexity: 1.0, density: 1.0 });
    const palette = makePalette();
    const ctx = createMockContext();

    const start = performance.now();
    const scene = buildSceneGraph(params, palette, 'dark', 'perf-combined', 800);
    drawSceneComplete(ctx, scene);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
  });
});
