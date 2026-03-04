import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ParticleCanvas } from '@/components/results/ParticleCanvas';
import type { ParticleSceneGraph } from '@/lib/render/types';

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

const minimalScene: ParticleSceneGraph = {
  style: 'particle',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  particles: [],
  connections: [],
  clusters: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParticleCanvas', () => {
  it('renders a canvas element with aria-label', () => {
    render(<ParticleCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated particle artwork');
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('canvas has width and height set (scaled by DPR)', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    render(<ParticleCanvas scene={minimalScene} animated={false} />);
    const canvas = screen.getByLabelText('Generated particle artwork') as HTMLCanvasElement;
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1600);
  });

  it('when animated=false, requestAnimationFrame is never called (PTCL-05)', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<ParticleCanvas scene={minimalScene} animated={false} />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('when animated=true and prefers-reduced-motion IS set, requestAnimationFrame is never called (PTCL-05)', () => {
    mockMatchMedia(true);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<ParticleCanvas scene={minimalScene} animated={true} />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('when animated=true and prefers-reduced-motion is NOT set, requestAnimationFrame is called', () => {
    mockMatchMedia(false);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    render(<ParticleCanvas scene={minimalScene} animated={true} />);
    expect(rafSpy).toHaveBeenCalled();
  });

  it('cleanup cancels animation on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
    const { unmount } = render(<ParticleCanvas scene={minimalScene} animated={true} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('onRenderComplete callback fires after initial draw', async () => {
    const onComplete = vi.fn();
    render(
      <ParticleCanvas scene={minimalScene} animated={false} onRenderComplete={onComplete} />,
    );
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
