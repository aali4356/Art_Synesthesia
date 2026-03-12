import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { StyleSelector } from '@/components/results/StyleSelector';
import type { StyleName, SceneGraph, OrganicSceneGraph, ParticleSceneGraph, TypographicSceneGraph } from '@/lib/render/types';
import { deriveSeed } from '@/lib/engine/prng';
import { buildOrganicSceneGraph } from '@/lib/render/organic';
import { buildTypographicSceneGraph } from '@/lib/render/typographic';
import type { PaletteResult } from '@/lib/color/palette';
import type { ParameterVector } from '@/types/engine';

// ---------------------------------------------------------------------------
// Mocks — prevent real canvas draw calls in jsdom
// ---------------------------------------------------------------------------

vi.mock('@/lib/render/geometric', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/render/geometric')>();
  return { ...actual, drawSceneComplete: vi.fn() };
});
vi.mock('@/lib/render/organic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/render/organic')>();
  return { ...actual, drawOrganicSceneComplete: vi.fn() };
});
vi.mock('@/lib/render/particle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/render/particle')>();
  return { ...actual, drawParticleSceneComplete: vi.fn() };
});
vi.mock('@/lib/render/typographic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/render/typographic')>();
  return { ...actual, drawTypographicSceneComplete: vi.fn() };
});

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
  parameters: {
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
  },
  width: 800,
  height: 800,
  background: '#0a0a0a',
  gradientStops: [
    { offset: 0, color: '#ff0000' },
    { offset: 0.45, color: '#ffaa00' },
    { offset: 1, color: '#0a0a0a' },
  ],
  curves: [
    {
      points: [{ x: 10, y: 10 }, { x: 120, y: 64 }, { x: 200, y: 160 }],
      startColor: '#ff0000',
      endColor: '#ffaa00',
      width: 2,
      opacity: 0.72,
    },
  ],
  layers: 2,
  octaves: 3,
  dominantDirection: 0.9,
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
  expressiveness: {
    densityLift: 0.5,
    hierarchyLift: 0.5,
    rotationFreedom: 0.5,
    fontVariety: 0.5,
    placementBiasX: 0.5,
    placementBiasY: 0.5,
  },
};

const mockVector: ParameterVector = {
  complexity: 0.72,
  symmetry: 0.38,
  density: 0.66,
  curvature: 0.71,
  texture: 0.58,
  scaleVariation: 0.64,
  rhythm: 0.52,
  regularity: 0.31,
  directionality: 0.69,
  layering: 0.74,
  energy: 0.63,
  warmth: 0.44,
  saturation: 0.67,
  contrast: 0.78,
  paletteSize: 0.59,
};

const mockPaletteWithMapping: PaletteResult = {
  dark: [
    { hex: '#ff6b6b', oklch: { l: 0.72, c: 0.18, h: 24 } },
    { hex: '#ffd166', oklch: { l: 0.84, c: 0.16, h: 82 } },
    { hex: '#118ab2', oklch: { l: 0.56, c: 0.14, h: 228 } },
  ],
  light: [
    { hex: '#d1495b', oklch: { l: 0.62, c: 0.16, h: 18 } },
    { hex: '#edae49', oklch: { l: 0.76, c: 0.14, h: 84 } },
    { hex: '#00798c', oklch: { l: 0.5, c: 0.12, h: 218 } },
  ],
  familyId: 'ember-cascade',
  harmony: 'complementary',
  mapping: {
    mood: 'cinematic',
    temperatureBias: 'hot',
    harmonySource: 'family',
    hueAnchor: 'family-base',
    chromaPosture: 'vivid',
    contrastPosture: 'bold',
    harmony: 'complementary',
    familyId: 'ember-cascade',
    anchorHue: 24,
  },
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

  it('renders mapping-aware organic and typographic runtime scenes without selector API changes', async () => {
    const [organicSeed, typographicSeed] = await Promise.all([
      deriveSeed('selector-runtime-canonical', 'organic', 'test-engine'),
      deriveSeed('selector-runtime-canonical', 'typographic', 'test-engine'),
    ]);

    const organicScene = buildOrganicSceneGraph(
      mockVector,
      mockPaletteWithMapping,
      'dark',
      organicSeed,
    );
    const typographicScene = buildTypographicSceneGraph(
      mockVector,
      mockPaletteWithMapping,
      'dark',
      typographicSeed,
      'A vivid composition blooms across the page with layered cinematic phrases.',
    );

    render(
      <StyleSelector
        scenes={{
          geometric: mockGeoScene,
          organic: organicScene,
          particle: mockPtclScene,
          typographic: typographicScene,
        }}
        activeStyle="organic"
        onStyleChange={vi.fn()}
        inputType="text"
      />,
    );

    expect(organicScene.expressiveness.atmosphericRichness).toBeGreaterThan(0.7);
    expect(typographicScene.expressiveness.hierarchyLift).toBeGreaterThan(0.7);

    const organicCard = screen.getByText('Organic').closest('[data-style]');
    const typographicCard = screen.getByText('Typographic').closest('[data-style]');

    expect(organicCard?.querySelector('canvas')).toBeDefined();
    expect(typographicCard?.querySelector('canvas')).toBeDefined();
    expect(typographicCard?.getAttribute('data-disabled')).toBeNull();
  });
});
