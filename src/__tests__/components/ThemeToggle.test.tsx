import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    resolvedTheme: 'dark',
  }),
}));

describe('ThemeToggle', () => {
  it('renders toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme|switch to/i });
    expect(button).toBeDefined();
  });

  it('has accessible aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBeTruthy();
  });

  it('uses ghost button styling', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-ghost');
  });
});
