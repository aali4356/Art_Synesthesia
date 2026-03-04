import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TypographicCanvas } from '@/components/results/TypographicCanvas';
import type { TypographicSceneGraph } from '@/lib/render/types';

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

const minimalScene: TypographicSceneGraph = {
  style: 'typographic',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  words: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TypographicCanvas', () => {
  it('renders a canvas element with aria-label="Generated typographic artwork"', () => {
    render(<TypographicCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated typographic artwork');
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('canvas has correct HiDPI dimensions (width * dpr)', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    render(<TypographicCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated typographic artwork') as HTMLCanvasElement;
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1600);
  });

  it('animated=false draws complete scene without requestAnimationFrame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<TypographicCanvas scene={minimalScene} animated={false} />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('animated=true with prefers-reduced-motion does not call requestAnimationFrame', () => {
    mockMatchMedia(true);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<TypographicCanvas scene={minimalScene} animated={true} />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('animated=true (no reduced-motion) calls requestAnimationFrame for fade-in', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<TypographicCanvas scene={minimalScene} animated={true} />);
    expect(rafSpy).toHaveBeenCalled();
  });

  it('cleanup cancels animation on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
    const { unmount } = render(<TypographicCanvas scene={minimalScene} animated={true} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('onRenderComplete fires after instant draw when animated=false', async () => {
    const onComplete = vi.fn();
    render(
      <TypographicCanvas scene={minimalScene} animated={false} onRenderComplete={onComplete} />,
    );
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
