import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock hooks and heavy dependencies to keep tests fast
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
  deriveSeed: vi.fn().mockResolvedValue('mock-seed'),
}));

// Mock canvas components to avoid real canvas in tests
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

vi.mock('@/lib/color/palette', () => ({
  generatePalette: vi.fn().mockReturnValue([]),
}));

import { CompareMode } from '@/app/compare/CompareMode';

describe('COMP-01: CompareMode renders two input zones side by side', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders two textarea inputs with distinct labels', () => {
    render(<CompareMode />);
    expect(screen.getByLabelText('Input A input text')).toBeDefined();
    expect(screen.getByLabelText('Input B input text')).toBeDefined();
  });

  it('renders two Generate buttons', () => {
    render(<CompareMode />);
    const buttons = screen.getAllByRole('button', { name: /generate/i });
    expect(buttons).toHaveLength(2);
  });

  it('shows empty-state placeholder in both panes before generation', () => {
    render(<CompareMode />);
    const placeholders = screen.getAllByText(/enter text and click generate/i);
    expect(placeholders).toHaveLength(2);
  });
});

describe('COMP-04: Shared style selector changes both artworks simultaneously', () => {
  it('renders style selector with all 4 styles', () => {
    render(<CompareMode />);
    const styleGroup = screen.getByRole('group', { name: /select style/i });
    expect(styleGroup).toBeDefined();
    expect(screen.getByRole('button', { name: /geometric/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /organic/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /particle/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /typographic/i })).toBeDefined();
  });

  it('pressing organic style button sets it as active (aria-pressed)', () => {
    render(<CompareMode />);
    const organicBtn = screen.getByRole('button', { name: /organic/i });
    fireEvent.click(organicBtn);
    expect(organicBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('only one style is active at a time', () => {
    render(<CompareMode />);
    fireEvent.click(screen.getByRole('button', { name: /organic/i }));
    const activeButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-pressed') === 'true'
    );
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0].textContent).toMatch(/organic/i);
  });
});
