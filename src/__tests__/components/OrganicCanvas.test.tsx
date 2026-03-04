import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { OrganicCanvas } from '@/components/results/OrganicCanvas';
import type { OrganicSceneGraph } from '@/lib/render/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock canvas getContext to return a recording proxy
function createMockContext(): CanvasRenderingContext2D {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === '_calls') return calls;
      if (typeof prop === 'string') {
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
        };
      }
      return undefined;
    },
    set(_target, prop, value) {
      calls.push({ method: `set:${String(prop)}`, args: [value] });
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
}

// Patch HTMLCanvasElement.getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;
let mockCtx: CanvasRenderingContext2D = createMockContext();

beforeEach(() => {
  mockCtx = createMockContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => mockCtx);
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalScene: OrganicSceneGraph = {
  style: 'organic',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  gradientStops: [],
  curves: [],
  layers: 1,
  octaves: 2,
  dominantDirection: 0,
};

const sceneWithCurves: OrganicSceneGraph = {
  ...minimalScene,
  curves: [
    {
      points: [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 50 }],
      startColor: '#7b3dd4',
      endColor: '#d4783d',
      width: 1.5,
      opacity: 0.7,
    },
    {
      points: [{ x: 50, y: 50 }, { x: 150, y: 200 }, { x: 300, y: 150 }],
      startColor: '#3dd47b',
      endColor: '#d4783d',
      width: 2.0,
      opacity: 0.5,
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrganicCanvas', () => {
  it('renders a canvas element with aria-label', () => {
    render(<OrganicCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated organic artwork');
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('canvas has correct HiDPI dimensions (width * dpr)', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    render(<OrganicCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated organic artwork') as HTMLCanvasElement;
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1600);
  });

  it('animated=false draws complete scene without requestAnimationFrame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<OrganicCanvas scene={sceneWithCurves} animated={false} />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('animated=true uses requestAnimationFrame for progressive build', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<OrganicCanvas scene={sceneWithCurves} animated={true} />);
    expect(rafSpy).toHaveBeenCalled();
  });

  it('cleanup cancels animation on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
    const { unmount } = render(<OrganicCanvas scene={sceneWithCurves} animated={true} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('onRenderComplete fires after instant draw when animated=false', async () => {
    const onComplete = vi.fn();
    render(
      <OrganicCanvas scene={minimalScene} animated={false} onRenderComplete={onComplete} />,
    );
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('animated=true with empty curves fires onRenderComplete without rAF', async () => {
    const onComplete = vi.fn();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(
      <OrganicCanvas scene={minimalScene} animated={true} onRenderComplete={onComplete} />,
    );
    // Empty curves path: no rAF, fires complete immediately
    expect(rafSpy).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});

// Keep references to suppress unused variable warnings
void mockCtx;
