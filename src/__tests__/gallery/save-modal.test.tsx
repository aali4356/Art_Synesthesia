import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GallerySaveModal } from '@/components/gallery/GallerySaveModal';

vi.mock('@/lib/gallery/creator-token', () => ({
  getOrCreateCreatorToken: vi.fn().mockReturnValue('mock-token-uuid'),
}));

const BASE_PROPS = {
  parameterVector: { complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5, energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5, saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5, paletteSize: 0.5, texture: 0.5, regularity: 0.5 },
  versionInfo: { analyzerVersion: '1.0', normalizerVersion: '1.0', rendererVersion: '1.0', engineVersion: '1.0' },
  styleName: 'geometric',
  inputTextPreview: 'Hello world',
  thumbnailDataUrl: '',
  onClose: vi.fn(),
  onSaved: vi.fn(),
};

describe('GAL-01: GallerySaveModal renders preview before save', () => {
  it('shows style name, title input, input preview, and save button', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);
    expect(screen.getByText('geometric')).toBeDefined();
    expect(screen.getByLabelText(/title/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/short description/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /save to gallery/i })).toBeDefined();
  });
});

describe('GAL-02: GallerySaveModal allows editing or removing input preview', () => {
  it('pre-fills input preview with provided text', () => {
    render(<GallerySaveModal {...BASE_PROPS} inputTextPreview="Hello world preview" />);
    const previewInput = screen.getByPlaceholderText(/short description/i) as HTMLInputElement;
    expect(previewInput.value).toBe('Hello world preview');
  });

  it('allows removing input preview via Remove button', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);
    const removeBtn = screen.getByText('Remove');
    fireEvent.click(removeBtn);
    expect(screen.queryByPlaceholderText(/short description/i)).toBeNull();
    expect(screen.getByText(/no input preview/i)).toBeDefined();
  });

  it('truncates inputTextPreview to 50 chars', () => {
    const longPreview = 'a'.repeat(60);
    render(<GallerySaveModal {...BASE_PROPS} inputTextPreview={longPreview} />);
    const previewInput = screen.getByPlaceholderText(/short description/i) as HTMLInputElement;
    expect(previewInput.value.length).toBeLessThanOrEqual(50);
  });
});
