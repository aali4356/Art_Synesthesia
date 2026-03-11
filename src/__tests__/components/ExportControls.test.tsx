import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ExportControls } from '@/components/results/ExportControls';
import type { ParameterVector, VersionInfo } from '@/types/engine';

const vector: ParameterVector = {
  complexity: 0.6,
  warmth: 0.7,
  symmetry: 0.3,
  rhythm: 0.5,
  energy: 0.8,
  density: 0.4,
  scaleVariation: 0.35,
  curvature: 0.65,
  saturation: 0.72,
  contrast: 0.55,
  layering: 0.48,
  directionality: 0.69,
  paletteSize: 0.44,
  texture: 0.53,
  regularity: 0.38,
};

const version: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.2.0',
  normalizerVersion: '0.3.0',
  rendererVersion: '0.4.0',
};

describe('ExportControls', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(new Response(new Blob(['ok']), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-disposition': 'attachment; filename="synesthesia-geometric.png"',
      },
    })) as typeof fetch;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLAnchorElement.prototype.click = originalClick;
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows PNG and SVG options for geometric style', () => {
    render(<ExportControls parameterVector={vector} versionInfo={version} styleName="geometric" />);
    expect(screen.getByRole('button', { name: 'PNG' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'SVG' })).toBeDefined();
  });

  it('shows only PNG for organic style', () => {
    render(<ExportControls parameterVector={vector} versionInfo={version} styleName="organic" />);
    expect(screen.getByRole('button', { name: 'PNG' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'SVG' })).toBeNull();
  });

  it('frame toggle is enabled by default', () => {
    render(<ExportControls parameterVector={vector} versionInfo={version} styleName="geometric" />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('submits 4096 export request with frame enabled by default', async () => {
    render(<ExportControls parameterVector={vector} versionInfo={version} styleName="geometric" />);
    fireEvent.click(screen.getByRole('button', { name: /download png/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.resolution).toBe(4096);
    expect(body.frame).toBe(true);
    expect(body.format).toBe('png');
    expect(body.style).toBe('geometric');
  });
});
