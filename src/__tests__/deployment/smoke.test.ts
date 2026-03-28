import { describe, expect, it, vi } from 'vitest';
import {
  DeploymentSmokeRunFailedError,
  formatDeploymentSmokeOutput,
  parseDeploymentSmokeCliArgs,
  runDeploymentSmoke,
} from '@/lib/deployment/smoke';

const PASS_BASE_URL = 'https://deploy.example.com';
const CRON_SECRET = 'cron-secret-value';
const ADMIN_SECRET = 'admin-secret-value';
const FIXED_NOW = Date.parse('2026-03-28T12:00:00.000Z');
const PROOF_TITLE = 'deploy-smoke-2026-03-28T12-00-00-000z-gallery';

type FetchImpl = typeof fetch;

function makeResponse(body: BodyInit, init: ResponseInit & { url?: string } = {}): Response {
  const response = new Response(body, init);
  Object.defineProperty(response, 'url', {
    value: init.url ?? PASS_BASE_URL,
    configurable: true,
  });
  return response;
}

function extractAuthorizationHeader(init?: RequestInit): string | null {
  const headers = init?.headers;

  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get('authorization');
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => key.toLowerCase() === 'authorization');
    return entry?.[1] ?? null;
  }

  const record = headers as Record<string, string>;
  return record.authorization ?? record.Authorization ?? null;
}

function buildHappyFetch(): ReturnType<typeof vi.fn<FetchImpl>> {
  return vi.fn<FetchImpl>(async (input, init) => {
    const url = String(input);
    const authHeader = extractAuthorizationHeader(init);

    if (url.endsWith('/api/share') && init?.method === 'POST') {
      return makeResponse(
        JSON.stringify({ shareId: 'share-123', url: '/share/share-123' }),
        { status: 201, url },
      );
    }

    if (url.endsWith('/api/share/share-123')) {
      return makeResponse(
        JSON.stringify({
          parameterVector: { complexity: 0.5 },
          versionInfo: { engineVersion: 'deploy-smoke' },
          styleName: 'geometric',
          createdAt: '2026-03-28T12:00:00.000Z',
        }),
        { status: 200, url },
      );
    }

    if (url.endsWith('/share/share-123')) {
      return makeResponse(
        '<html><body><h1>Shared artwork</h1><p>parameter-only payload</p></body></html>',
        { status: 200, url },
      );
    }

    if (url.endsWith('/api/gallery') && init?.method === 'POST') {
      return makeResponse(
        JSON.stringify({ saved: true, id: 'gallery-456' }),
        { status: 201, url },
      );
    }

    if (url.endsWith('/api/gallery?sort=recent&limit=10')) {
      return makeResponse(
        JSON.stringify({
          items: [{ id: 'gallery-456', title: PROOF_TITLE }],
          page: 1,
          limit: 10,
        }),
        { status: 200, url },
      );
    }

    if (url.endsWith('/gallery/gallery-456')) {
      return makeResponse(
        `<html><body><h1>${PROOF_TITLE}</h1><p>collector surface</p></body></html>`,
        { status: 200, url },
      );
    }

    if (url.endsWith('/api/cron/cleanup') && !authHeader) {
      return makeResponse('Unauthorized', { status: 401, url });
    }

    if (url.endsWith('/api/cron/cleanup') && authHeader === `Bearer ${CRON_SECRET}`) {
      return makeResponse(
        JSON.stringify({
          status: 'ok',
          cleaned: { analysis: 0, render: 0 },
          timestamp: '2026-03-28T12:00:00.000Z',
        }),
        { status: 200, url },
      );
    }

    if (url.endsWith('/api/admin/review') && !authHeader) {
      return makeResponse('Unauthorized', { status: 401, url });
    }

    if (url.endsWith('/api/admin/review') && authHeader === `Bearer ${ADMIN_SECRET}`) {
      return makeResponse(JSON.stringify({ flagged: [], total: 0 }), { status: 200, url });
    }

    throw new Error(`Unexpected fetch: ${url} ${init?.method ?? 'GET'}`);
  });
}

describe('deployment smoke', () => {
  it('executes the full deployed share/gallery/operator proof path', async () => {
    const fetchImpl = buildHappyFetch();

    const result = await runDeploymentSmoke(
      {
        baseUrl: PASS_BASE_URL,
        cronSecret: CRON_SECRET,
        adminSecret: ADMIN_SECRET,
      },
      { fetchImpl, now: () => FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    expect(result.shareId).toBe('share-123');
    expect(result.galleryId).toBe('gallery-456');
    expect(result.steps).toHaveLength(10);
    expect(result.steps.every((step) => step.ok)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(10);
  });

  it('fails the named share page step when branded fallback markers appear', async () => {
    const happy = buildHappyFetch();
    const fetchImpl = vi.fn<FetchImpl>(async (input, init) => {
      const url = String(input);
      const pathname = new URL(url).pathname;

      if (pathname === '/share/share-123') {
        return makeResponse(
          '<html><body><p>Unavailable state</p><h1>Share viewer unavailable</h1></body></html>',
          { status: 200, url },
        );
      }

      return (happy.getMockImplementation() as FetchImpl)(input, init);
    });

    await expect(
      runDeploymentSmoke(
        {
          baseUrl: PASS_BASE_URL,
          cronSecret: CRON_SECRET,
          adminSecret: ADMIN_SECRET,
        },
        { fetchImpl, now: () => FIXED_NOW },
      ),
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        step: 'share.page',
        kind: 'fallback-detected',
      }),
      result: {
        steps: expect.arrayContaining([
          expect.objectContaining({
            step: 'share.page',
            ok: false,
            kind: 'fallback-detected',
          }),
        ]),
      },
    });
  });

  it('treats unauthorized cron success as a boundary violation', async () => {
    const happy = buildHappyFetch();
    const fetchImpl = vi.fn<FetchImpl>(async (input, init) => {
      const url = String(input);
      const authHeader = extractAuthorizationHeader(init);

      if (url.endsWith('/api/cron/cleanup') && !authHeader) {
        return makeResponse(JSON.stringify({ leaked: true }), { status: 200, url });
      }

      return (happy.getMockImplementation() as FetchImpl)(input, init);
    });

    await expect(
      runDeploymentSmoke(
        {
          baseUrl: PASS_BASE_URL,
          cronSecret: CRON_SECRET,
          adminSecret: ADMIN_SECRET,
        },
        { fetchImpl, now: () => FIXED_NOW },
      ),
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        step: 'cron.unauthorized',
        kind: 'boundary-violation',
      }),
    });
  });

  it('fails authorized admin checks on malformed JSON responses', async () => {
    const happy = buildHappyFetch();
    const fetchImpl = vi.fn<FetchImpl>(async (input, init) => {
      const url = String(input);
      const authHeader = extractAuthorizationHeader(init);

      if (url.endsWith('/api/admin/review') && authHeader === `Bearer ${ADMIN_SECRET}`) {
        return makeResponse('not-json', { status: 200, url });
      }

      return (happy.getMockImplementation() as FetchImpl)(input, init);
    });

    await expect(
      runDeploymentSmoke(
        {
          baseUrl: PASS_BASE_URL,
          cronSecret: CRON_SECRET,
          adminSecret: ADMIN_SECRET,
        },
        { fetchImpl, now: () => FIXED_NOW },
      ),
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        step: 'admin.authorized',
        kind: 'malformed-response',
      }),
    });
  });

  it('fails fast for missing base URL and blank secrets', async () => {
    await expect(
      runDeploymentSmoke({
        baseUrl: '   ',
        cronSecret: 'cron',
        adminSecret: 'admin',
      }),
    ).rejects.toBeInstanceOf(DeploymentSmokeRunFailedError);

    await expect(
      runDeploymentSmoke({
        baseUrl: PASS_BASE_URL,
        cronSecret: '   ',
        adminSecret: ADMIN_SECRET,
      }),
    ).rejects.toBeInstanceOf(DeploymentSmokeRunFailedError);
  });

  it('parses CLI args with env fallbacks and formats redacted failure output', () => {
    const args = parseDeploymentSmokeCliArgs(['--timeout-ms', '2500'], {
      SYNESTHESIA_PUBLIC_BASE_URL: PASS_BASE_URL,
      CRON_SECRET,
      ADMIN_SECRET,
    });

    expect(args).toMatchObject({
      baseUrl: PASS_BASE_URL,
      cronSecret: CRON_SECRET,
      adminSecret: ADMIN_SECRET,
      timeoutMs: 2500,
    });

    const output = formatDeploymentSmokeOutput({
      ok: false,
      baseUrl: PASS_BASE_URL,
      proofTag: 'deploy-smoke-test',
      startedAt: '2026-03-28T12:00:00.000Z',
      finishedAt: '2026-03-28T12:00:01.000Z',
      durationMs: 1000,
      steps: [
        {
          step: 'cron.authorized',
          ok: false,
          kind: 'http-error',
          detail: 'Expected authorized cron access to succeed, received 401.',
          durationMs: 12,
          snippet: 'Bearer [redacted]',
          statusCode: 401,
          url: `${PASS_BASE_URL}/api/cron/cleanup`,
        },
      ],
    });

    expect(output).toContain('step=cron.authorized');
    expect(output).toContain('snippet="Bearer [redacted]"');
    expect(output).not.toContain(CRON_SECRET);
    expect(output).not.toContain(ADMIN_SECRET);
  });
});
