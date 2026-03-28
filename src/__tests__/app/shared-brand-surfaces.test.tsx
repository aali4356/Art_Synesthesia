import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import React from 'react';

import Home from '@/app/page';
import GalleryPage from '@/app/gallery/page';
import ComparePage from '@/app/compare/page';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}));

vi.mock('@/hooks/useTextAnalysis', () => ({
  useTextAnalysis: vi.fn().mockReturnValue({
    stage: 'idle',
    result: null,
    generate: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUrlAnalysis', () => ({
  useUrlAnalysis: vi.fn().mockReturnValue({
    stage: 'idle',
    result: null,
    error: null,
    remainingQuota: 8,
    generate: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDataAnalysis', () => ({
  useDataAnalysis: vi.fn().mockReturnValue({
    stage: 'idle',
    result: null,
    error: null,
    generate: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/lib/engine/prng', () => ({
  deriveSeed: vi.fn().mockResolvedValue('shared-brand-proof-seed'),
}));

vi.mock('@/components/results/GeometricCanvas', () => ({
  GeometricCanvas: () => <canvas data-testid="geometric-canvas" />,
}));
vi.mock('@/components/results/OrganicCanvas', () => ({
  OrganicCanvas: () => <canvas data-testid="organic-canvas" />,
}));
vi.mock('@/components/results/ParticleCanvas', () => ({
  ParticleCanvas: () => <canvas data-testid="particle-canvas" />,
}));
vi.mock('@/components/results/TypographicCanvas', () => ({
  TypographicCanvas: () => <canvas data-testid="typographic-canvas" />,
}));

vi.mock('@/lib/render/geometric', () => ({
  buildSceneGraph: vi.fn().mockReturnValue({ style: 'geometric', elements: [] }),
}));
vi.mock('@/lib/render/organic', () => ({
  buildOrganicSceneGraph: vi.fn().mockReturnValue({ style: 'organic', curves: [] }),
}));
vi.mock('@/lib/render/particle', () => ({
  buildParticleSceneGraph: vi.fn().mockReturnValue({ style: 'particle', particles: [] }),
}));
vi.mock('@/lib/render/typographic', () => ({
  buildTypographicSceneGraph: vi.fn().mockReturnValue({ style: 'typographic', words: [] }),
}));

vi.mock('@/components/gallery/GalleryGrid', () => ({
  GalleryGrid: () => <div data-testid="gallery-grid">gallery grid</div>,
}));

vi.mock('@/lib/gallery/db-gallery', () => ({
  getGalleryItems: vi.fn().mockResolvedValue([]),
}));

const mockFindFirst = vi.fn();
vi.mock('@/db', () => ({
  db: {
    query: {
      shareLinks: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));
vi.mock('@/db/schema', () => ({
  shareLinks: { id: 'id' },
}));
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

describe('S02 shared branded route-surface proof contract', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    mockFindFirst.mockReset();
  });

  it('requires the homepage shell to expose a primary nav landmark with truthful local-versus-public route cues', () => {
    render(<Home />);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const homeLink = within(nav).getByRole('link', { name: 'Home / Recent local work' });
    const compareLink = within(nav).getByRole('link', { name: 'Compare' });
    const galleryLink = within(nav).getByRole('link', { name: 'Gallery' });

    expect(homeLink.getAttribute('aria-current')).toBe('page');
    expect(compareLink.getAttribute('aria-current')).toBeNull();
    expect(galleryLink.getAttribute('aria-current')).toBeNull();
    expect(
      screen.getByText(
        'Recent local work stays private to this browser on Home. Compare and Gallery are public route surfaces, not browser-local recall.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Route discovery stays public and shareable here, while recent local work remains a browser-local privacy boundary on the homepage only.'
      )
    ).toBeDefined();
  });

  it('requires gallery browse to inherit the shared editorial shell, coherent route-intro language, and active gallery semantics', async () => {
    const page = await GalleryPage({
      searchParams: Promise.resolve({ sort: 'recent', page: '1' }),
    });

    render(page);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Gallery' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Home / Recent local work' }).getAttribute('aria-current')).toBeNull();
    expect(within(nav).getByRole('link', { name: 'Compare' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(screen.getByText('Editorial visual engine')).toBeDefined();
    expect(screen.getByText('Gallery browse')).toBeDefined();
    expect(screen.getByText('A public collector route inside the same editorial product family.')).toBeDefined();
    expect(
      screen.getByText(
        'Review public opt-in editions, filter by renderer family, and move through the archive with the same route-discovery language used by Home and Compare.'
      )
    ).toBeDefined();
    expect(screen.getByText('Route intro')).toBeDefined();
    expect(screen.getByText('Public opt-ins only · viewer-safe metadata')).toBeDefined();
  });

  it('requires compare mode to present branded intro, viewer framing, action language, and active compare semantics without breaking the two-pane contract', () => {
    render(<ComparePage />);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Compare' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Home / Recent local work' }).getAttribute('aria-current')).toBeNull();
    expect(within(nav).getByRole('link', { name: 'Gallery' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByText('Compare atelier')).toBeDefined();
    expect(screen.getByText('Two proof-safe inputs, one collector route, shared style control.')).toBeDefined();
    expect(
      screen.getByText(
        'Compare two editions under one renderer family, then inspect vector deltas without leaving the same route-discovery language used by Home, Gallery, results, share, and export.'
      )
    ).toBeDefined();
    expect(screen.getByText('Viewer stage')).toBeDefined();
    expect(screen.getAllByText('Action desk')).toHaveLength(2);
    expect(screen.getByRole('group', { name: /select style for both canvases/i })).toBeDefined();
    expect(screen.getByLabelText('Input A input text')).toBeDefined();
    expect(screen.getByLabelText('Input B input text')).toBeDefined();
  });

  it('requires unavailable DB-backed routes to stay branded and explicit instead of collapsing to plain centered copy', async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    const { default: SharePage } = await import('@/app/share/[id]/page');

    const page = await SharePage({
      params: Promise.resolve({ id: 'missing-link' }),
    });

    render(page);

    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(screen.getByText('Unavailable state')).toBeDefined();
    expect(screen.getByText('Share viewer unavailable')).toBeDefined();
    expect(screen.getByText('This share link may have expired, been removed, or is unavailable in the current local proof mode.')).toBeDefined();
    expect(screen.getByText('Truthful diagnostics stay visible so missing DB-backed routes never fail silently.')).toBeDefined();
  });
});
