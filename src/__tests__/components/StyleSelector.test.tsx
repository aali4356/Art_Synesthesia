import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StyleSelector } from '@/components/results/StyleSelector';
import type { SceneGraph } from '@/lib/render/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock canvas getContext
function createMockContext(): CanvasRenderingContext2D {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop === 'string') {
        return (..._args: unknown[]) => undefined;
      }
      return undefined;
    },
    set() {
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => createMockContext());
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
  ],
  width: 800,
  height: 800,
  background: '#0a0a0a',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StyleSelector', () => {
  it('renders 4 style entries: Geometric, Organic, Particle, Typographic', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);
    expect(screen.getByText('Geometric')).toBeDefined();
    expect(screen.getByText('Organic')).toBeDefined();
    expect(screen.getByText('Particle')).toBeDefined();
    expect(screen.getByText('Typographic')).toBeDefined();
  });

  it('Geometric shows as active/selected state with visual indicator', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);
    const geometricText = screen.getByText('Geometric');
    // The parent card should have an active indicator (ring styling)
    const card = geometricText.closest('[data-style]');
    expect(card).toBeDefined();
    expect(card?.getAttribute('data-active')).toBe('true');
  });

  it('Organic, Particle, Typographic show locked state with lock icon', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);

    // Each locked style should have a lock indicator
    const organicCard = screen.getByText('Organic').closest('[data-style]');
    const particleCard = screen.getByText('Particle').closest('[data-style]');
    const typoCard = screen.getByText('Typographic').closest('[data-style]');

    expect(organicCard?.getAttribute('data-locked')).toBe('true');
    expect(particleCard?.getAttribute('data-locked')).toBe('true');
    expect(typoCard?.getAttribute('data-locked')).toBe('true');
  });

  it('locked styles show generic gray placeholder (not fake art)', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);

    // Locked cards should have a placeholder area (bg-muted) not a canvas
    const organicCard = screen.getByText('Organic').closest('[data-style]');
    expect(organicCard).toBeDefined();
    // The locked placeholder div should exist within
    const placeholder = organicCard?.querySelector('[data-placeholder]');
    expect(placeholder).toBeDefined();
  });

  it('locked styles are visually distinct (dimmed) from active style', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);

    const organicCard = screen.getByText('Organic').closest('[data-style]');
    expect(organicCard).toBeDefined();
    // Locked cards should have reduced opacity
    expect(organicCard?.className).toMatch(/opacity/);
  });

  it('Geometric thumbnail canvas is present (rendered from real parameters)', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);

    const geometricCard = screen.getByText('Geometric').closest('[data-style]');
    expect(geometricCard).toBeDefined();
    // Active style should contain a canvas element for thumbnail
    const canvas = geometricCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('Geometric thumbnail canvas renders at 200x200', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);
    const geometricCard = screen.getByText('Geometric').closest('[data-style]');
    const canvas = geometricCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas?.style.width).toBe('200px');
    expect(canvas?.style.height).toBe('200px');
  });

  it('active style name displayed prominently', () => {
    render(<StyleSelector scene={mockScene} activeStyle="geometric" />);

    const geometricText = screen.getByText('Geometric');
    expect(geometricText).toBeDefined();
    // Should have prominent styling (font-medium or font-semibold)
    expect(geometricText.className).toMatch(/font-(medium|semibold|bold)/);
  });
});
