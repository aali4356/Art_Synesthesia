import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
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

// Mock crypto.randomUUID
const mockUuid = 'test-uuid-1234-5678-abcd-ef0123456789';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue(mockUuid),
});

const mockVector = {
  complexity: 0.5, warmth: 0.6, symmetry: 0.4, rhythm: 0.7,
  energy: 0.8, density: 0.3, scaleVariation: 0.5, curvature: 0.6,
  saturation: 0.7, contrast: 0.4, layering: 0.3, directionality: 0.5,
  paletteSize: 0.6, texture: 0.4, regularity: 0.5,
};
const mockVersion = {
  engineVersion: '1.0.0',
  analyzerVersion: '1.0.0',
  normalizerVersion: '0.4.0',
  rendererVersion: '0.2.0',
};

describe('POST /api/share — SHARE-01', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockResolvedValue(undefined);
  });

  it('creates share link with UUID, stores vector + version + style', async () => {
    const { POST } = await import('@/app/api/share/route');
    const request = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: mockVector,
        version: mockVersion,
        style: 'geometric',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.shareId).toBe(mockUuid);
    expect(body.url).toBe(`/share/${mockUuid}`);
    expect(mockInsert).toHaveBeenCalledOnce();
  });

  it('rejects request body containing rawInput field (privacy gate)', async () => {
    const { POST } = await import('@/app/api/share/route');
    const request = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: mockVector,
        version: mockVersion,
        style: 'geometric',
        rawInput: 'some raw text',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('raw input');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects request body containing inputText field (privacy gate)', async () => {
    const { POST } = await import('@/app/api/share/route');
    const request = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: mockVector,
        version: mockVersion,
        style: 'geometric',
        inputText: 'some text',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 400 when vector is missing', async () => {
    const { POST } = await import('@/app/api/share/route');
    const request = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: mockVersion, style: 'geometric' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/share/[id] — SHARE-02, SHARE-03', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parameterVector, versionInfo, styleName, createdAt -- no raw input', async () => {
    mockFindFirst.mockResolvedValue({
      id: mockUuid,
      parameterVector: mockVector,
      versionInfo: mockVersion,
      styleName: 'geometric',
      createdAt: new Date('2026-01-01'),
    });

    const { GET } = await import('@/app/api/share/[id]/route');
    const request = new Request(`http://localhost/api/share/${mockUuid}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: mockUuid }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('parameterVector');
    expect(body).toHaveProperty('versionInfo');
    expect(body).toHaveProperty('styleName');
    expect(body).toHaveProperty('createdAt');
    // Privacy: no raw input in response
    expect(body).not.toHaveProperty('rawInput');
    expect(body).not.toHaveProperty('inputText');
  });

  it('returns 404 for unknown share ID', async () => {
    mockFindFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/share/[id]/route');
    const request = new Request('http://localhost/api/share/nonexistent-id');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'nonexistent-id' }),
    });

    expect(response.status).toBe(404);
  });
});
