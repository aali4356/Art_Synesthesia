import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { getCreatorToken } from '@/lib/gallery/creator-token';

vi.mock('@/lib/gallery/creator-token', () => ({
  getCreatorToken: vi.fn().mockReturnValue(null),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const localStorageStub = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
})();

const fetchMock = vi.fn();

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
  localStorageStub.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(getCreatorToken).mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const BASE_CARD = {
  id: 'card-1',
  styleName: 'geometric',
  title: 'My Artwork',
  inputPreview: 'A test poem',
  thumbnailData: null,
  creatorToken: 'owner-token',
  createdAt: '2026-03-01T00:00:00.000Z',
  upvoteCount: 3,
  reportCount: 0,
};

describe('GAL-03: GalleryCard renders editorial collector card hierarchy', () => {
  it('shows collector framing, title, style, date, and detail links', () => {
    render(<GalleryCard {...BASE_CARD} />);

    expect(screen.getByText('Collector edition')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'My Artwork' })).toBeDefined();
    expect(screen.getByText('geometric')).toBeDefined();
    expect(screen.getByText('Published')).toBeDefined();
    expect(screen.getByText('Public archive card with route-safe detail access, lightweight reactions, and no raw input exposure.')).toBeDefined();

    const artLink = screen.getByRole('link', { name: /view my artwork artwork/i });
    const detailLink = screen.getByRole('link', { name: /open collector detail for my artwork/i });
    expect((artLink as HTMLAnchorElement).href).toContain('/gallery/card-1');
    expect((detailLink as HTMLAnchorElement).href).toContain('/gallery/card-1');
  });

  it('shows a branded empty state when no thumbnail is present', () => {
    render(<GalleryCard {...BASE_CARD} thumbnailData={null} />);
    expect(screen.getByText('Preview pending')).toBeDefined();
    expect(screen.getByText('No archived thumbnail available yet.')).toBeDefined();
  });
});

describe('GAL-04: GalleryCard hides input preview by default, reveals on click', () => {
  it('shows reveal button instead of preview text', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.getByRole('button', { name: /reveal input preview/i })).toBeDefined();
    expect(screen.queryByText(/A test poem/)).toBeNull();
  });

  it('reveals preview when button clicked', () => {
    render(<GalleryCard {...BASE_CARD} />);
    fireEvent.click(screen.getByRole('button', { name: /reveal input preview/i }));
    expect(screen.getByText(/A test poem/)).toBeDefined();
  });

  it('shows a stable no-hint state when inputPreview is null', () => {
    render(<GalleryCard {...BASE_CARD} inputPreview={null} />);
    expect(screen.queryByRole('button', { name: /reveal input preview/i })).toBeNull();
    expect(screen.getByText('No public hint attached to this edition.')).toBeDefined();
  });
});

describe('GAL-07: GalleryCard actions remain accessible and stateful', () => {
  it('renders upvote and report actions with accessible labels', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.getByRole('button', { name: /upvote this artwork/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /report this artwork/i })).toBeDefined();
  });

  it('reports artwork and shows the reported state', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<GalleryCard {...BASE_CARD} />);

    fireEvent.click(screen.getByRole('button', { name: /report this artwork/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/moderation/report', expect.objectContaining({ method: 'POST' }));
    });
    expect(screen.getByText('Reported')).toBeDefined();
  });

  it('upvotes artwork, stores local state, and disables repeat voting', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ upvoteCount: 4 }) });
    render(<GalleryCard {...BASE_CARD} />);

    fireEvent.click(screen.getByRole('button', { name: /upvote this artwork/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/gallery/card-1', { method: 'POST' });
    });
    expect(screen.getByRole('button', { name: /already upvoted/i })).toBeDefined();
    expect(localStorage.getItem('synesthesia-upvoted')).toContain('card-1');
    expect(screen.getByText('4 votes')).toBeDefined();
  });
});

describe('GAL-08: GalleryCard owner delete behavior remains intact', () => {
  it('shows delete for owner and removes card after successful delete', async () => {
    vi.mocked(getCreatorToken).mockReturnValue('owner-token');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { container } = render(<GalleryCard {...BASE_CARD} />);
    const deleteButton = await screen.findByRole('button', { name: /delete your gallery entry/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/gallery/card-1', expect.objectContaining({ method: 'DELETE' }));
    });
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('does not show delete for non-owners', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.queryByRole('button', { name: /delete your gallery entry/i })).toBeNull();
  });
});
