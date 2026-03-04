import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { StyleSelector } from '@/components/results/StyleSelector';
import type { StyleName, SceneGraph, OrganicSceneGraph, ParticleSceneGraph, TypographicSceneGraph } from '@/lib/render/types';

// ---------------------------------------------------------------------------
// Mocks — prevent real canvas draw calls in jsdom
// ---------------------------------------------------------------------------

vi.mock('@/lib/render/geometric', () => ({ drawSceneComplete: vi.fn() }));
vi.mock('@/lib/render/organic', () => ({ drawOrganicSceneComplete: vi.fn() }));
vi.mock('@/lib/render/particle', () => ({ drawParticleSceneComplete: vi.fn() }));
vi.mock('@/lib/render/typographic', () => ({ drawTypographicSceneComplete: vi.fn() }));

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

const nullScenes: Record<StyleName, null> = {
  geometric: null,
  organic: null,
  particle: null,
  typographic: null,
};

const mockGeoScene: SceneGraph = {
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
  ],
  width: 800,
  height: 800,
  background: '#0a0a0a',
};

const mockOrgScene: OrganicSceneGraph = {
  style: 'organic',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  gradientStops: [{ offset: 0, color: '#ff0000' }],
  curves: [],
  layers: 1,
  octaves: 2,
  dominantDirection: 0,
};

const mockPtclScene: ParticleSceneGraph = {
  style: 'particle',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  particles: [],
  connections: [],
  clusters: [],
};

const mockTypoScene: TypographicSceneGraph = {
  style: 'typographic',
  width: 800,
  height: 800,
  background: '#0a0a0a',
  words: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StyleSelector', () => {
  it('renders 4 style entries: Geometric, Organic, Particle, Typographic', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Geometric')).toBeDefined();
    expect(screen.getByText('Organic')).toBeDefined();
    expect(screen.getByText('Particle')).toBeDefined();
    expect(screen.getByText('Typographic')).toBeDefined();
  });

  it('active style has data-active="true"', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="organic"
        onStyleChange={vi.fn()}
      />,
    );
    const organicCard = screen.getByText('Organic').closest('[data-style]');
    expect(organicCard?.getAttribute('data-active')).toBe('true');

    const geoCard = screen.getByText('Geometric').closest('[data-style]');
    expect(geoCard?.getAttribute('data-active')).toBeNull();
  });

  it('clicking a non-active style calls onStyleChange with style id', () => {
    const onStyleChange = vi.fn();
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={onStyleChange}
      />,
    );
    const organicCard = screen.getByText('Organic').closest('[data-style]') as HTMLElement;
    fireEvent.click(organicCard);
    expect(onStyleChange).toHaveBeenCalledWith('organic');
  });

  it('clicking active style still calls onStyleChange', () => {
    const onStyleChange = vi.fn();
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={onStyleChange}
      />,
    );
    const geoCard = screen.getByText('Geometric').closest('[data-style]') as HTMLElement;
    fireEvent.click(geoCard);
    expect(onStyleChange).toHaveBeenCalledWith('geometric');
  });

  it('typographic is not clickable (no onStyleChange call) when inputType="data"', () => {
    const onStyleChange = vi.fn();
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={onStyleChange}
        inputType="data"
      />,
    );
    const typoCard = screen.getByText('Typographic').closest('[data-style]') as HTMLElement;
    fireEvent.click(typoCard);
    expect(onStyleChange).not.toHaveBeenCalled();
  });

  it('typographic has title="Text or URL input required" when inputType="data"', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
        inputType="data"
      />,
    );
    const typoCard = screen.getByText('Typographic').closest('[data-style]');
    expect(typoCard?.getAttribute('title')).toBe('Text or URL input required');
  });

  it('typographic has data-disabled="true" when inputType="data"', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
        inputType="data"
      />,
    );
    const typoCard = screen.getByText('Typographic').closest('[data-style]');
    expect(typoCard?.getAttribute('data-disabled')).toBe('true');
  });

  it('typographic is NOT disabled when inputType="text"', () => {
    const onStyleChange = vi.fn();
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={onStyleChange}
        inputType="text"
      />,
    );
    const typoCard = screen.getByText('Typographic').closest('[data-style]') as HTMLElement;
    fireEvent.click(typoCard);
    expect(onStyleChange).toHaveBeenCalledWith('typographic');
  });

  it('shows placeholder when scene is null for a style', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    const geoCard = screen.getByText('Geometric').closest('[data-style]');
    const placeholder = geoCard?.querySelector('[data-placeholder]');
    expect(placeholder).toBeDefined();
  });

  it('shows canvas when geometric scene is provided', () => {
    render(
      <StyleSelector
        scenes={{ ...nullScenes, geometric: mockGeoScene }}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    const geoCard = screen.getByText('Geometric').closest('[data-style]');
    const canvas = geoCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('thumbnail canvas renders at 200x200', () => {
    render(
      <StyleSelector
        scenes={{ ...nullScenes, geometric: mockGeoScene }}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    const geoCard = screen.getByText('Geometric').closest('[data-style]');
    const canvas = geoCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas?.style.width).toBe('200px');
    expect(canvas?.style.height).toBe('200px');
  });

  it('shows canvas for organic scene when provided', () => {
    render(
      <StyleSelector
        scenes={{ ...nullScenes, organic: mockOrgScene }}
        activeStyle="organic"
        onStyleChange={vi.fn()}
      />,
    );
    const orgCard = screen.getByText('Organic').closest('[data-style]');
    const canvas = orgCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('shows canvas for particle scene when provided', () => {
    render(
      <StyleSelector
        scenes={{ ...nullScenes, particle: mockPtclScene }}
        activeStyle="particle"
        onStyleChange={vi.fn()}
      />,
    );
    const ptclCard = screen.getByText('Particle').closest('[data-style]');
    const canvas = ptclCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('shows canvas for typographic scene when provided', () => {
    render(
      <StyleSelector
        scenes={{ ...nullScenes, typographic: mockTypoScene }}
        activeStyle="typographic"
        onStyleChange={vi.fn()}
      />,
    );
    const typoCard = screen.getByText('Typographic').closest('[data-style]');
    const canvas = typoCard?.querySelector('canvas');
    expect(canvas).toBeDefined();
  });

  it('active style name displays prominently', () => {
    render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    const geoText = screen.getByText('Geometric');
    expect(geoText.className).toMatch(/font-(medium|semibold|bold)/);
  });

  it('overflow-x scroll container present for mobile', () => {
    const { container } = render(
      <StyleSelector
        scenes={nullScenes}
        activeStyle="geometric"
        onStyleChange={vi.fn()}
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('overflow-x-auto');
  });
});
