import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShareButton } from '@/components/results/ShareButton';
import { ExportControls } from '@/components/results/ExportControls';
import { GallerySaveModal } from '@/components/gallery/GallerySaveModal';
import { BrandedUnavailableState } from '@/components/viewers/BrandedViewerScaffold';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';
import { captureClientEvent } from '@/lib/observability/client';
import { captureRouteFailure, captureUnavailableState } from '@/lib/observability/server';

vi.mock('@/lib/observability/client', () => ({
  captureClientEvent: vi.fn(),
}));

vi.mock('@/lib/observability/server', () => ({
  captureRouteFailure: vi.fn(),
  captureUnavailableState: vi.fn(),
}));

vi.mock('@/lib/gallery/creator-token', () => ({
  getOrCreateCreatorToken: vi.fn(() => 'creator-token-1'),
}));

vi.mock('@/lib/fetch/safe-fetch', () => ({
  safeFetch: vi.fn().mockResolvedValue('<html><title>Safe</title></html>'),
}));

vi.mock('@/lib/analysis/url', () => ({
  analyzeUrlContent: vi.fn().mockReturnValue({
    signals: { linkDensity: 0.3 },
    title: 'Safe title',
    metadata: { linkCount: 2, imageCount: 1, dominantColors: ['#111111'] },
  }),
}));

vi.mock('@/lib/cache/db-cache', () => ({
  getUrlSnapshot: vi.fn().mockResolvedValue(null),
  setUrlSnapshot: vi.fn().mockResolvedValue(undefined),
}));

const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
const mockFindFirst = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: mockInsert,
    query: {
      shareLinks: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock('@/db/schema', () => ({
  shareLinks: { id: 'id' },
}));

const mockCreateGalleryItem = vi.fn();
const mockGetGalleryItems = vi.fn();
const mockGetGalleryItem = vi.fn();
vi.mock('@/lib/gallery/db-gallery', () => ({
  createGalleryItem: mockCreateGalleryItem,
  getGalleryItems: mockGetGalleryItems,
  getGalleryItem: mockGetGalleryItem,
}));

vi.mock('@/lib/moderation/profanity', () => ({
  containsProfanity: vi.fn().mockReturnValue(false),
}));

vi.mock('./noop', () => ({}), { virtual: true });

vi.mock('@/app/share/[id]/ShareViewer', () => ({
  ShareViewer: () => <div>share viewer</div>,
}));

vi.mock('@/app/gallery/[id]/GalleryViewer', () => ({
  GalleryViewer: () => <div>gallery viewer</div>,
}));

const vector = {
  complexity: 0.51,
  warmth: 0.62,
  symmetry: 0.33,
  rhythm: 0.74,
  energy: 0.68,
  density: 0.49,
  scaleVariation: 0.44,
  curvature: 0.59,
  saturation: 0.71,
  contrast: 0.64,
  layering: 0.52,
  directionality: 0.48,
  paletteSize: 0.58,
  texture: 0.42,
  regularity: 0.31,
};

const version = {
  engineVersion: '1.0.0',
  analyzerVersion: '1.0.0',
  normalizerVersion: '1.0.0',
  rendererVersion: '1.0.0',
};

function findEventCall(eventName: string, predicate?: (properties: Record<string, unknown>) => boolean) {
  return vi.mocked(captureClientEvent).mock.calls.find(([name, properties]) => {
    if (name !== eventName) {
      return false;
    }

    return predicate ? predicate((properties ?? {}) as Record<string, unknown>) : true;
  });
}

describe('public-route observability', () => {
  const originalFetch = global.fetch;
  const originalClipboard = navigator.clipboard;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('share-uuid-1'),
    });
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3010' },
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    URL.createObjectURL = vi.fn(() => 'blob:export-url');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName === 'a') {
        Object.assign(element, { click: vi.fn() });
      }
      return element;
    }) as typeof document.createElement);
    mockCreateGalleryItem.mockResolvedValue({ id: 'gallery-id-1' });
    mockGetGalleryItems.mockResolvedValue([]);
    mockGetGalleryItem.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('emits safe share create and copy events without leaking the share URL', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ shareId: 'share-id-1', url: '/share/share-id-1' }),
    } as unknown as Response);

    render(
      <ShareButton
        parameterVector={vector}
        versionInfo={version}
        styleName="organic"
        continuityMode="resumed"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Share this artwork' }));
    await screen.findByRole('button', { name: 'Copy share link to clipboard' });
    fireEvent.click(screen.getByRole('button', { name: 'Copy share link to clipboard' }));

    await waitFor(() => {
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.shareRequested)).toBeDefined();
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.shareCompleted, (properties) => properties.statusBucket === '2xx')).toBeDefined();
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.shareCopied)).toBeDefined();
    });

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('/share/share-id-1');
    expect(serializedCalls).not.toContain('http://localhost:3010/share/share-id-1');
  });

  it('emits safe failure categories for share, export, and gallery-save client actions', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({ error: 'DATABASE_URL is not set' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: 'PNG export failed' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({ error: 'DATABASE_URL is not set' }),
      } as unknown as Response);

    render(
      <div>
        <ShareButton parameterVector={vector} versionInfo={version} styleName="geometric" />
        <ExportControls parameterVector={vector} versionInfo={version} styleName="geometric" />
        <GallerySaveModal
          parameterVector={vector}
          versionInfo={version}
          styleName="particle"
          inputTextPreview="private gallery hint"
          thumbnailDataUrl="data:image/png;base64,thumb"
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Share this artwork' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save to Gallery' }));

    await waitFor(() => {
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.shareFailed, (properties) => properties.failureCategory === 'request-failed' && properties.statusBucket === '5xx')).toBeDefined();
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.exportFailed, (properties) => properties.failureCategory === 'invalid-request' && properties.statusBucket === '4xx')).toBeDefined();
      expect(findEventCall(OBSERVABILITY_EVENTS.publicActions.gallerySaveFailed, (properties) => properties.failureCategory === 'gallery-backend-unavailable' && properties.statusBucket === '5xx')).toBeDefined();
    });

    const serializedCalls = JSON.stringify(vi.mocked(captureClientEvent).mock.calls);
    expect(serializedCalls).not.toContain('private gallery hint');
    expect(serializedCalls).not.toContain('data:image/png;base64,thumb');
  });

  it('degrades analyze-url cache failures while tagging local proof mode safely', async () => {
    const { getUrlSnapshot, setUrlSnapshot } = await import('@/lib/cache/db-cache');
    vi.mocked(getUrlSnapshot).mockRejectedValueOnce(new Error('DATABASE_URL is not set for local proof mode'));
    vi.mocked(setUrlSnapshot).mockRejectedValueOnce(new Error('DATABASE_URL is not set for local proof mode'));

    const { POST } = await import('@/app/api/analyze-url/route');
    const response = await POST(new Request('http://localhost/api/analyze-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '50.0.0.1',
      },
      body: JSON.stringify({ url: 'https://example.com' }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cached).toBe(false);
    expect(vi.mocked(captureRouteFailure)).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        routeFamily: 'analyze-url',
        failureCategory: 'snapshot-cache-unavailable',
        localProofMode: true,
      }),
    );
    expect(vi.mocked(captureRouteFailure)).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        routeFamily: 'analyze-url',
        failureCategory: 'snapshot-cache-write-failed',
        localProofMode: true,
      }),
    );
  });

  it('captures stable server failure categories for malformed and unsupported public-route requests', async () => {
    const { POST: sharePost } = await import('@/app/api/share/route');
    const shareResponse = await sharePost(new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad-json',
    }));

    const { POST: exportPost } = await import('@/app/api/render-export/route');
    const exportResponse = await exportPost(new Request('http://localhost/api/render-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: vector,
        version,
        style: 'organic',
        format: 'svg',
        resolution: 4096,
      }),
    }));

    expect(shareResponse.status).toBe(400);
    expect(exportResponse.status).toBe(400);
    expect(vi.mocked(captureRouteFailure)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        routeFamily: 'share',
        failureCategory: 'malformed-payload',
        statusBucket: '4xx',
      }),
    );
    expect(vi.mocked(captureRouteFailure)).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        routeFamily: 'render-export',
        failureCategory: 'unsupported-format',
        statusBucket: '4xx',
      }),
    );
  });

  it('tags gallery backend failures and unavailable-state renders without leaking diagnostics', async () => {
    mockCreateGalleryItem.mockRejectedValueOnce(new Error('DATABASE_URL is not set'));
    const { POST: galleryPost } = await import('@/app/api/gallery/route');
    const galleryResponse = await galleryPost(new Request('http://localhost/api/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '60.0.0.1',
      },
      body: JSON.stringify({
        parameterVector: vector,
        versionInfo: version,
        styleName: 'geometric',
      }),
    }));

    expect(galleryResponse.status).toBe(503);
    expect(vi.mocked(captureRouteFailure)).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        routeFamily: 'gallery',
        failureCategory: 'gallery-backend-unavailable',
        localProofMode: true,
      }),
    );

    render(
      <BrandedUnavailableState
        title="Share viewer unavailable"
        description="This shared route needs a working database backend in the current environment."
        diagnosticLabel="Diagnostics"
        diagnosticMessage="DATABASE_URL is not set"
        observability={{
          routeFamily: 'share',
          unavailableCategory: 'local-proof-unavailable',
          statusBucket: '5xx',
          localProofMode: true,
          viewerSurface: 'detail',
        }}
      />,
    );

    expect(vi.mocked(captureUnavailableState)).toHaveBeenCalledWith({
      routeFamily: 'share',
      unavailableCategory: 'local-proof-unavailable',
      statusBucket: '5xx',
      localProofMode: true,
      viewerSurface: 'detail',
    });
    expect(JSON.stringify(vi.mocked(captureUnavailableState).mock.calls)).not.toContain('DATABASE_URL is not set');
  });

  it('passes safe unavailable-state categories through the share page fallbacks', async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    const { default: SharePage } = await import('@/app/share/[id]/page');

    render(await SharePage({ params: Promise.resolve({ id: 'missing-link' }) }));
    expect(screen.getByText('Share viewer unavailable')).toBeDefined();
    expect(vi.mocked(captureUnavailableState)).toHaveBeenCalledWith(
      expect.objectContaining({
        routeFamily: 'share',
        unavailableCategory: 'missing-resource',
        statusBucket: '4xx',
      }),
    );

    vi.mocked(captureUnavailableState).mockClear();
    mockFindFirst.mockRejectedValueOnce(new Error('DATABASE_URL is not set'));
    render(await SharePage({ params: Promise.resolve({ id: 'db-proof' }) }));
    expect(vi.mocked(captureUnavailableState)).toHaveBeenCalledWith(
      expect.objectContaining({
        routeFamily: 'share',
        unavailableCategory: 'local-proof-unavailable',
        statusBucket: '5xx',
        localProofMode: true,
      }),
    );
  });
});
