import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GalleryCard } from '@/components/gallery/GalleryCard';

vi.mock('@/lib/gallery/creator-token', () => ({
  getCreatorToken: vi.fn().mockReturnValue(null),
}));

// Mock Next.js Link — must pass all props (including aria-label) to anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Stub localStorage for jsdom environment
const localStorageStub = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
})();

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
  localStorageStub.clear();
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

describe('GAL-03: GalleryCard renders thumbnail, style, date, title', () => {
  it('shows style name and title', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.getByText('geometric')).toBeDefined();
    expect(screen.getByText('My Artwork')).toBeDefined();
  });

  it('links to detail page (GAL-06)', () => {
    render(<GalleryCard {...BASE_CARD} />);
    const link = screen.getByRole('link', { name: /My Artwork artwork/i });
    expect((link as HTMLAnchorElement).href).toContain('/gallery/card-1');
  });
});

describe('GAL-04: GalleryCard hides input preview by default, reveals on click', () => {
  it('shows Reveal button instead of preview text', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.getByText('Click to reveal hint')).toBeDefined();
    expect(screen.queryByText(/A test poem/)).toBeNull();
  });

  it('reveals preview when button clicked', () => {
    render(<GalleryCard {...BASE_CARD} />);
    fireEvent.click(screen.getByText('Click to reveal hint'));
    expect(screen.getByText(/A test poem/)).toBeDefined();
  });

  it('does not show reveal button when inputPreview is null', () => {
    render(<GalleryCard {...BASE_CARD} inputPreview={null} />);
    expect(screen.queryByText('Click to reveal hint')).toBeNull();
  });
});

describe('GAL-07: GalleryCard has Report button', () => {
  it('renders a Report button on every card', () => {
    render(<GalleryCard {...BASE_CARD} />);
    expect(screen.getByRole('button', { name: /report this artwork/i })).toBeDefined();
  });
});
