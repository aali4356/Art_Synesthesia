import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows style name, title input, input preview, and save button', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);
    expect(screen.getByText('geometric')).toBeDefined();
    expect(screen.getByLabelText(/title/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/short description/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /save to gallery/i })).toBeDefined();
  });

  it('moves initial focus into the dialog title input', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);

    const titleInput = screen.getByLabelText(/title/i);
    expect(document.activeElement).toBe(titleInput);
  });
});

describe('GAL-02: GallerySaveModal allows editing or removing input preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pre-fills input preview with provided text', () => {
    render(<GallerySaveModal {...BASE_PROPS} inputTextPreview="Hello world preview" />);
    const previewInput = screen.getByPlaceholderText(/short description/i) as HTMLInputElement;
    expect(previewInput.value).toBe('Hello world preview');
  });

  it('allows removing input preview via Remove button and exposes a readable status message', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);
    const removeBtn = screen.getByText('Remove');
    fireEvent.click(removeBtn);
    expect(screen.queryByPlaceholderText(/short description/i)).toBeNull();
    expect(screen.getByRole('status').textContent).toMatch(/no input preview will be shown/i);
  });

  it('truncates inputTextPreview to 50 chars', () => {
    const longPreview = 'a'.repeat(60);
    render(<GallerySaveModal {...BASE_PROPS} inputTextPreview={longPreview} />);
    const previewInput = screen.getByPlaceholderText(/short description/i) as HTMLInputElement;
    expect(previewInput.value.length).toBeLessThanOrEqual(50);
  });
});

describe('GAL-03: GallerySaveModal focus lifecycle and failure handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it('traps forward and reverse tab navigation inside the dialog', () => {
    render(<GallerySaveModal {...BASE_PROPS} />);

    const closeButton = screen.getByRole('button', { name: /close gallery save dialog/i });
    const saveButton = screen.getByRole('button', { name: /save to gallery/i });

    saveButton.focus();
    fireEvent.keyDown(saveButton, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(saveButton);
  });

  it('closes on Escape and restores focus to the opener', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open gallery modal';
    document.body.appendChild(opener);
    opener.focus();

    const onClose = vi.fn();
    render(<GallerySaveModal {...BASE_PROPS} onClose={onClose} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.keyDown(titleInput, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(document.activeElement).toBe(opener);
    });

    opener.remove();
  });

  it('restores focus to the opener when the close button is used', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open gallery modal';
    document.body.appendChild(opener);
    opener.focus();

    const onClose = vi.fn();
    render(<GallerySaveModal {...BASE_PROPS} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close gallery save dialog/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(document.activeElement).toBe(opener);
    });

    opener.remove();
  });

  it('keeps the modal open with a readable alert when the save response fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Gallery unavailable right now.' }),
    } as Response);

    render(<GallerySaveModal {...BASE_PROPS} />);

    fireEvent.click(screen.getByRole('button', { name: /save to gallery/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/gallery unavailable right now/i);
    });

    expect(screen.getByRole('dialog', { name: /save a public gallery edition/i })).toBeDefined();
    expect(document.activeElement instanceof HTMLElement).toBe(true);
  });
});
