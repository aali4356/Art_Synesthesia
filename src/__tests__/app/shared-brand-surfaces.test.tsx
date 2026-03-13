import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import GalleryPage from '@/app/gallery/page';
import ComparePage from '@/app/compare/page';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}));

vi.mock('@/hooks/useTextAnalysis', () => ({
  useTextAnalysis: vi.fn().mockReturnValue({
    result: null,
    generate: vi.fn(),
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
  it('requires gallery browse to inherit the shared editorial shell and route-intro language', async () => {
    const page = await GalleryPage({
      searchParams: Promise.resolve({ sort: 'recent', page: '1' }),
    });

    render(page);

    expect(screen.getByText('Synesthesia Machine')).toBeDefined();
    expect(screen.getByText('Editorial visual engine')).toBeDefined();
    expect(screen.getByText('Gallery browse')).toBeDefined();
    expect(screen.getByText('A collector view for public opt-ins inside the same editorial shell.')).toBeDefined();
    expect(screen.getByText('Route intro')).toBeDefined();
    expect(screen.getByText('Public opt-ins only · viewer-safe metadata')).toBeDefined();
  });

  it('requires compare mode to present branded intro, viewer framing, and action language without breaking the two-pane contract', () => {
    render(<ComparePage />);

    expect(screen.getByText('Compare atelier')).toBeDefined();
    expect(screen.getByText('Two proof-safe inputs, one editorial stage, shared style control.')).toBeDefined();
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
