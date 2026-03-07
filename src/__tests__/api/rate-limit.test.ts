import { describe, it, expect, vi } from 'vitest';

// Mock db-gallery so rate-limit tests don't need a real database connection.
// The gallery route now writes to DB in Phase 8; mocking returns a valid stub.
vi.mock('@/lib/gallery/db-gallery', () => ({
  createGalleryItem: vi.fn().mockResolvedValue({
    id: 'rate-limit-stub-id',
    parameterVector: {},
    versionInfo: {},
    styleName: 'geometric',
    title: null,
    inputPreview: null,
    thumbnailData: null,
    creatorToken: null,
    createdAt: new Date(),
    reportCount: 0,
    flagged: false,
    upvoteCount: 0,
  }),
  getGalleryItems: vi.fn().mockResolvedValue([]),
}));

/**
 * SEC-04: Gallery save rate limiter caps at 10 saves per IP per day.
 */
describe('Gallery rate limiting — SEC-04', () => {
  const makeGalleryRequest = async (
    ip: string,
    body: Record<string, unknown> = {}
  ) => {
    const { POST } = await import('@/app/api/gallery/route');
    const defaultBody = {
      parameterVector: {
        complexity: 0.5, warmth: 0.5, symmetry: 0.5, rhythm: 0.5,
        energy: 0.5, density: 0.5, scaleVariation: 0.5, curvature: 0.5,
        saturation: 0.5, contrast: 0.5, layering: 0.5, directionality: 0.5,
        paletteSize: 0.5, texture: 0.5, regularity: 0.5,
      },
      versionInfo: {
        engineVersion: '1.0.0', analyzerVersion: '1.0.0',
        normalizerVersion: '0.4.0', rendererVersion: '0.2.0',
      },
      styleName: 'geometric',
      ...body,
    };
    return POST(
      new Request('http://localhost/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify(defaultBody),
      })
    );
  };

  it('allows saves up to the limit', async () => {
    const ip = '10.0.0.1';
    const response = await makeGalleryRequest(ip);
    expect([200, 201]).toContain(response.status);
  });

  it('returns 429 after 10 saves from the same IP', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 10; i++) {
      await makeGalleryRequest(ip);
    }
    const response = await makeGalleryRequest(ip);
    expect(response.status).toBe(429);
  });

  it('returns X-RateLimit-Remaining header', async () => {
    const ip = '10.0.0.2';
    const response = await makeGalleryRequest(ip);
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });

  it('rejects body containing rawInput (privacy gate)', async () => {
    const ip = '10.0.0.3';
    const response = await makeGalleryRequest(ip, { rawInput: 'secret text' });
    expect(response.status).toBe(400);
  });
});
