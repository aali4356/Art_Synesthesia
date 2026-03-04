import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GeometricCanvas } from '@/components/results/GeometricCanvas';
import type { SceneGraph } from '@/lib/render/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock matchMedia for prefers-reduced-motion tests
function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock canvas getContext to return a recording proxy
function createMockContext(): CanvasRenderingContext2D {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === '_calls') return calls;
      if (typeof prop === 'string') {
        // Return a function for method calls, a value for properties
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
let mockCtx: CanvasRenderingContext2D;

beforeEach(() => {
  mockCtx = createMockContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => mockCtx);
  mockMatchMedia(false);
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockScene: SceneGraph = {
  style: 'geometric',
  elements: [
    {
      type: 'rect',
      x: 10,
      y: 10,
      width: 200,
      height: 200,
      fill: '#ff0000',
      opacity: 0.9,
      area: 40000,
      depth: 1,
    },
    {
      type: 'circle',
      x: 300,
      y: 300,
      width: 100,
      height: 100,
      fill: '#00ff00',
      opacity: 0.8,
      area: 10000,
      depth: 2,
    },
    {
      type: 'triangle',
      x: 500,
      y: 500,
      width: 50,
      height: 50,
      fill: '#0000ff',
      opacity: 0.7,
      area: 2500,
      depth: 3,
    },
  ],
  width: 800,
  height: 800,
  background: '#0a0a0a',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeometricCanvas', () => {
  it('renders a canvas element with aria-label', () => {
    render(<GeometricCanvas scene={mockScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated geometric artwork');
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('canvas has width and height set (scaled by DPR)', () => {
    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    render(<GeometricCanvas scene={mockScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated geometric artwork') as HTMLCanvasElement;
    // Canvas physical size should be scene.width * dpr
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1600);
  });

  it('when animated=false, draws complete scene immediately (no rAF)', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<GeometricCanvas scene={mockScene} animated={false} />);
    // Should NOT use requestAnimationFrame for instant render
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('when animated=true, calls requestAnimationFrame (progressive build)', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<GeometricCanvas scene={mockScene} animated={true} />);
    // Should use requestAnimationFrame for progressive build
    expect(rafSpy).toHaveBeenCalled();
  });

  it('cleanup function cancels animation on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
    const { unmount } = render(<GeometricCanvas scene={mockScene} animated={true} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('re-renders when scene prop changes', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { rerender } = render(<GeometricCanvas scene={mockScene} animated={false} />);
    const callCount = rafSpy.mock.calls.length;

    // Rerender with a different scene
    const newScene: SceneGraph = {
      ...mockScene,
      background: '#fafafa',
    };
    rerender(<GeometricCanvas scene={newScene} animated={false} />);

    // The context should get new draw calls (verified by context being called)
    // Since animated=false, rAF should still not be called
    expect(rafSpy.mock.calls.length).toBe(callCount);
  });

  it('onRenderComplete callback fires after immediate draw', async () => {
    const onComplete = vi.fn();
    render(
      <GeometricCanvas scene={mockScene} animated={false} onRenderComplete={onComplete} />,
    );
    // onRenderComplete should fire synchronously for non-animated
    // Allow a microtask for useEffect
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('onRenderComplete callback fires after animation finishes', async () => {
    const onComplete = vi.fn();
    // Mock rAF to execute callbacks immediately
    let rafCallbacks: Array<(time: number) => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    render(
      <GeometricCanvas scene={mockScene} animated={true} onRenderComplete={onComplete} />,
    );

    // Execute animation frames until complete
    // Simulate enough time passing for all elements to animate (750ms)
    let time = 0;
    for (let i = 0; i < 100 && rafCallbacks.length > 0; i++) {
      const cbs = [...rafCallbacks];
      rafCallbacks = [];
      for (const cb of cbs) {
        cb(time);
      }
      time += 20; // 20ms per frame
    }

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
