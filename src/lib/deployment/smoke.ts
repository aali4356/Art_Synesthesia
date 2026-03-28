export type DeploymentSmokeStepName =
  | 'cli.args'
  | 'share.create'
  | 'share.read'
  | 'share.page'
  | 'gallery.create'
  | 'gallery.browse'
  | 'gallery.page'
  | 'cron.unauthorized'
  | 'cron.authorized'
  | 'admin.unauthorized'
  | 'admin.authorized';

export type DeploymentSmokeFailureKind =
  | 'invalid-input'
  | 'network-error'
  | 'timeout'
  | 'http-error'
  | 'malformed-response'
  | 'fallback-detected'
  | 'contract-error'
  | 'boundary-violation';

export interface DeploymentSmokeStepResult {
  step: DeploymentSmokeStepName;
  ok: boolean;
  kind: 'pass' | DeploymentSmokeFailureKind;
  detail: string;
  statusCode?: number;
  durationMs: number;
  url?: string;
  snippet?: string;
}

export interface DeploymentSmokeResult {
  ok: boolean;
  baseUrl: string;
  proofTag: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  shareId?: string;
  galleryId?: string;
  steps: DeploymentSmokeStepResult[];
}

export interface DeploymentSmokeOptions {
  baseUrl: string;
  cronSecret: string;
  adminSecret: string;
  timeoutMs?: number;
}

interface ValidatedDeploymentSmokeOptions extends DeploymentSmokeOptions {
  timeoutMs: number;
}

export interface DeploymentSmokeDependencies {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export interface DeploymentSmokeCliOptions extends DeploymentSmokeOptions {
  json?: boolean;
}

export interface DeploymentSmokeCliDependencies extends DeploymentSmokeDependencies {
  env?: Record<string, string | undefined>;
  logger?: Pick<Console, 'log' | 'error'>;
}

interface JsonStepResponse {
  response: Response;
  text: string;
  json: unknown;
}

class DeploymentSmokeStepError extends Error {
  readonly step: DeploymentSmokeStepName;
  readonly kind: DeploymentSmokeFailureKind;
  readonly statusCode?: number;
  readonly snippet?: string;
  readonly url?: string;

  constructor(
    step: DeploymentSmokeStepName,
    kind: DeploymentSmokeFailureKind,
    detail: string,
    options: {
      statusCode?: number;
      snippet?: string;
      url?: string;
    } = {},
  ) {
    super(detail);
    this.name = 'DeploymentSmokeStepError';
    this.step = step;
    this.kind = kind;
    this.statusCode = options.statusCode;
    this.snippet = options.snippet;
    this.url = options.url;
  }
}

export class DeploymentSmokeRunFailedError extends Error {
  readonly result: DeploymentSmokeResult;
  readonly failure: DeploymentSmokeStepError;

  constructor(result: DeploymentSmokeResult, failure: DeploymentSmokeStepError) {
    super(`[deployment-smoke] failed at ${failure.step}: ${failure.message}`);
    this.name = 'DeploymentSmokeRunFailedError';
    this.result = result;
    this.failure = failure;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_SNIPPET_LENGTH = 240;
const FALLBACK_MARKERS = [
  'Unavailable state',
  'Share viewer unavailable',
  'Gallery viewer unavailable',
  'Gallery unavailable',
  'current local proof mode',
  'Truthful diagnostics stay visible so missing DB-backed routes never fail silently.',
];

const PROOF_VECTOR = {
  complexity: 0.51,
  warmth: 0.62,
  symmetry: 0.34,
  rhythm: 0.73,
  energy: 0.81,
  density: 0.27,
  scaleVariation: 0.56,
  curvature: 0.63,
  saturation: 0.69,
  contrast: 0.44,
  layering: 0.38,
  directionality: 0.58,
  paletteSize: 0.61,
  texture: 0.47,
  regularity: 0.52,
};

const PROOF_VERSION = {
  engineVersion: 'deploy-smoke',
  analyzerVersion: 'deploy-smoke',
  normalizerVersion: 'deploy-smoke',
  rendererVersion: 'deploy-smoke',
};

export function parseDeploymentSmokeCliArgs(
  argv: string[],
  env: Record<string, string | undefined> = process.env,
): DeploymentSmokeCliOptions {
  const args = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      throw new DeploymentSmokeStepError(
        'cli.args',
        'invalid-input',
        `Unexpected positional argument "${token}". Expected named flags like --base-url.`,
      );
    }

    if (token === '--json') {
      args.set('--json', 'true');
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new DeploymentSmokeStepError(
        'cli.args',
        'invalid-input',
        `Missing value for ${token}.`,
      );
    }

    args.set(token, value);
    index += 1;
  }

  const timeoutRaw = args.get('--timeout-ms');
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;

  return {
    baseUrl: args.get('--base-url') ?? env.SYNESTHESIA_PUBLIC_BASE_URL ?? '',
    cronSecret: args.get('--cron-secret') ?? env.CRON_SECRET ?? '',
    adminSecret: args.get('--admin-secret') ?? env.ADMIN_SECRET ?? '',
    timeoutMs,
    json: args.get('--json') === 'true',
  };
}

export function formatDeploymentSmokeOutput(
  result: DeploymentSmokeResult,
  options: { json?: boolean } = {},
): string {
  if (options.json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `[deployment-smoke] status=${result.ok ? 'ok' : 'failed'} baseUrl=${result.baseUrl} durationMs=${result.durationMs}`,
  ];

  for (const step of result.steps) {
    const parts = [
      `[deployment-smoke] step=${step.step}`,
      `status=${step.ok ? 'pass' : 'fail'}`,
      `kind=${step.kind}`,
      `durationMs=${step.durationMs}`,
      `detail=${quote(step.detail)}`,
    ];

    if (step.statusCode !== undefined) {
      parts.push(`statusCode=${step.statusCode}`);
    }

    if (step.url) {
      parts.push(`url=${step.url}`);
    }

    if (step.snippet) {
      parts.push(`snippet=${quote(step.snippet)}`);
    }

    lines.push(parts.join(' '));
  }

  if (result.shareId) {
    lines.push(`[deployment-smoke] shareId=${result.shareId}`);
  }

  if (result.galleryId) {
    lines.push(`[deployment-smoke] galleryId=${result.galleryId}`);
  }

  return lines.join('\n');
}

export async function runDeploymentSmoke(
  options: DeploymentSmokeOptions,
  deps: DeploymentSmokeDependencies = {},
): Promise<DeploymentSmokeResult> {
  const now = deps.now ?? Date.now;
  const startedAtMs = now();
  const steps: DeploymentSmokeStepResult[] = [];

  let normalizedOptions: ValidatedDeploymentSmokeOptions;
  try {
    normalizedOptions = validateDeploymentSmokeOptions(options);
  } catch (error) {
    const failure = normalizeStepError('cli.args', error);
    const result: DeploymentSmokeResult = {
      ok: false,
      baseUrl: 'unknown',
      proofTag: buildProofTag(startedAtMs),
      startedAt: new Date(startedAtMs).toISOString(),
      finishedAt: new Date(now()).toISOString(),
      durationMs: Math.max(0, now() - startedAtMs),
      steps: [
        {
          step: failure.step,
          ok: false,
          kind: failure.kind,
          detail: failure.message,
          statusCode: failure.statusCode,
          durationMs: 0,
          url: failure.url,
          snippet: failure.snippet,
        },
      ],
    };
    throw new DeploymentSmokeRunFailedError(result, failure);
  }

  const result: DeploymentSmokeResult = {
    ok: false,
    baseUrl: normalizedOptions.baseUrl,
    proofTag: buildProofTag(startedAtMs),
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: new Date(startedAtMs).toISOString(),
    durationMs: 0,
    steps,
  };

  const fetchImpl = deps.fetchImpl ?? fetch;

  const failRun = (failure: DeploymentSmokeStepError): never => {
    result.ok = false;
    result.finishedAt = new Date(now()).toISOString();
    result.durationMs = Math.max(0, now() - startedAtMs);
    throw new DeploymentSmokeRunFailedError(result, failure);
  };

  const runStep = async <T>(
    step: DeploymentSmokeStepName,
    handler: () => Promise<T>,
  ): Promise<T> => {
    const stepStartedAt = now();

    try {
      const value = await handler();
      steps.push({
        step,
        ok: true,
        kind: 'pass',
        detail: 'ok',
        durationMs: Math.max(0, now() - stepStartedAt),
      });
      return value;
    } catch (error) {
      const failure = normalizeStepError(step, error);
      steps.push({
        step,
        ok: false,
        kind: failure.kind,
        detail: failure.message,
        statusCode: failure.statusCode,
        durationMs: Math.max(0, now() - stepStartedAt),
        url: failure.url,
        snippet: failure.snippet,
      });
      return failRun(failure);
    }
  };

  const sharePayload = {
    vector: PROOF_VECTOR,
    version: PROOF_VERSION,
    style: 'geometric',
  };

  const galleryPayload = {
    parameterVector: PROOF_VECTOR,
    versionInfo: PROOF_VERSION,
    styleName: 'organic',
    title: `${result.proofTag}-gallery`,
    inputPreview: 'deployed proof route',
  };

  const shareCreateBody = await runStep('share.create', async () => {
    const response = await requestJson(fetchImpl, 'share.create', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/share'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sharePayload),
    });

    if (response.response.status !== 201) {
      throw new DeploymentSmokeStepError(
        'share.create',
        'http-error',
        `Expected 201 from share create, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'share.create', response.text, response.response);
    const shareId = ensureString(body.shareId, 'share.create', 'shareId', response.text, response.response);
    const shareUrl = ensureString(body.url, 'share.create', 'url', response.text, response.response);

    if (!shareUrl.endsWith(`/share/${shareId}`)) {
      throw new DeploymentSmokeStepError(
        'share.create',
        'contract-error',
        'Share create returned a URL that does not match the returned shareId.',
        { snippet: response.text, url: response.response.url },
      );
    }

    result.shareId = shareId;
    return { shareId };
  });

  await runStep('share.read', async () => {
    const response = await requestJson(fetchImpl, 'share.read', {
      url: buildUrl(normalizedOptions.baseUrl, `/api/share/${shareCreateBody.shareId}`),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'share.read',
        'http-error',
        `Expected 200 from share read, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'share.read', response.text, response.response);
    ensureObject(body.parameterVector, 'share.read', response.text, response.response, 'parameterVector');
    ensureObject(body.versionInfo, 'share.read', response.text, response.response, 'versionInfo');
    ensureString(body.styleName, 'share.read', 'styleName', response.text, response.response);
    ensureString(body.createdAt, 'share.read', 'createdAt', response.text, response.response);

    if ('rawInput' in body || 'inputText' in body) {
      throw new DeploymentSmokeStepError(
        'share.read',
        'contract-error',
        'Share read unexpectedly exposed raw input fields.',
        { snippet: response.text, url: response.response.url },
      );
    }
  });

  await runStep('share.page', async () => {
    const response = await requestText(fetchImpl, 'share.page', {
      url: buildUrl(normalizedOptions.baseUrl, `/share/${shareCreateBody.shareId}`),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'share.page',
        'http-error',
        `Expected 200 from share page, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    assertNoFallbackMarkers('share.page', response.text, response.response);
    assertIncludes('share.page', response.text, 'Shared artwork', response.response);
    assertIncludes('share.page', response.text, 'parameter-only payload', response.response);
  });

  const galleryCreateBody = await runStep('gallery.create', async () => {
    const response = await requestJson(fetchImpl, 'gallery.create', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/gallery'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.10' },
      body: JSON.stringify(galleryPayload),
    });

    if (response.response.status !== 201) {
      throw new DeploymentSmokeStepError(
        'gallery.create',
        'http-error',
        `Expected 201 from gallery create, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'gallery.create', response.text, response.response);
    const saved = body.saved;
    if (saved !== true) {
      throw new DeploymentSmokeStepError(
        'gallery.create',
        'contract-error',
        'Gallery create did not confirm saved=true.',
        { snippet: response.text, url: response.response.url },
      );
    }

    const galleryId = ensureString(body.id, 'gallery.create', 'id', response.text, response.response);
    result.galleryId = galleryId;
    return { galleryId };
  });

  await runStep('gallery.browse', async () => {
    const response = await requestJson(fetchImpl, 'gallery.browse', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/gallery?sort=recent&limit=10'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'gallery.browse',
        'http-error',
        `Expected 200 from gallery browse, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'gallery.browse', response.text, response.response);
    const items = ensureArray(body.items, 'gallery.browse', 'items', response.text, response.response);
    const found = items.find((value) => {
      if (!value || typeof value !== 'object') {
        return false;
      }
      return (value as Record<string, unknown>).id === galleryCreateBody.galleryId;
    }) as Record<string, unknown> | undefined;

    if (!found) {
      throw new DeploymentSmokeStepError(
        'gallery.browse',
        'contract-error',
        `Gallery browse did not return the created id ${galleryCreateBody.galleryId}.`,
        { snippet: response.text, url: response.response.url },
      );
    }

    if (found.title !== galleryPayload.title) {
      throw new DeploymentSmokeStepError(
        'gallery.browse',
        'contract-error',
        'Gallery browse returned the created id but the title did not match the proof payload.',
        { snippet: response.text, url: response.response.url },
      );
    }
  });

  await runStep('gallery.page', async () => {
    const response = await requestText(fetchImpl, 'gallery.page', {
      url: buildUrl(normalizedOptions.baseUrl, `/gallery/${galleryCreateBody.galleryId}`),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'gallery.page',
        'http-error',
        `Expected 200 from gallery page, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    assertNoFallbackMarkers('gallery.page', response.text, response.response);
    assertIncludes('gallery.page', response.text, galleryPayload.title, response.response);
    assertIncludes('gallery.page', response.text, 'collector surface', response.response);
  });

  await runStep('cron.unauthorized', async () => {
    const response = await requestText(fetchImpl, 'cron.unauthorized', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/cron/cleanup'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (![401, 403].includes(response.response.status)) {
      throw new DeploymentSmokeStepError(
        'cron.unauthorized',
        'boundary-violation',
        `Expected unauthorized cron access to stay blocked, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }
  });

  await runStep('cron.authorized', async () => {
    const response = await requestJson(fetchImpl, 'cron.authorized', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/cron/cleanup'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
      headers: { authorization: `Bearer ${normalizedOptions.cronSecret}` },
      redactValues: [normalizedOptions.cronSecret],
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'cron.authorized',
        'http-error',
        `Expected authorized cron access to succeed, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'cron.authorized', response.text, response.response);
    if (body.status !== 'ok') {
      throw new DeploymentSmokeStepError(
        'cron.authorized',
        'contract-error',
        'Cron response did not include status="ok".',
        { snippet: response.text, url: response.response.url },
      );
    }
    ensureObject(body.cleaned, 'cron.authorized', response.text, response.response, 'cleaned');
    ensureString(body.timestamp, 'cron.authorized', 'timestamp', response.text, response.response);
  });

  await runStep('admin.unauthorized', async () => {
    const response = await requestText(fetchImpl, 'admin.unauthorized', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/admin/review'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
    });

    if (![401, 403].includes(response.response.status)) {
      throw new DeploymentSmokeStepError(
        'admin.unauthorized',
        'boundary-violation',
        `Expected unauthorized admin access to stay blocked, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }
  });

  await runStep('admin.authorized', async () => {
    const response = await requestJson(fetchImpl, 'admin.authorized', {
      url: buildUrl(normalizedOptions.baseUrl, '/api/admin/review'),
      timeoutMs: normalizedOptions.timeoutMs,
      method: 'GET',
      headers: { authorization: `Bearer ${normalizedOptions.adminSecret}` },
      redactValues: [normalizedOptions.adminSecret],
    });

    if (response.response.status !== 200) {
      throw new DeploymentSmokeStepError(
        'admin.authorized',
        'http-error',
        `Expected authorized admin access to succeed, received ${response.response.status}.`,
        {
          statusCode: response.response.status,
          snippet: response.text,
          url: response.response.url,
        },
      );
    }

    const body = ensureObject(response.json, 'admin.authorized', response.text, response.response);
    const flagged = ensureArray(body.flagged, 'admin.authorized', 'flagged', response.text, response.response);
    const total = body.total;

    if (typeof total !== 'number' || Number.isNaN(total)) {
      throw new DeploymentSmokeStepError(
        'admin.authorized',
        'contract-error',
        'Admin response did not include a numeric total field.',
        { snippet: response.text, url: response.response.url },
      );
    }

    if (total !== flagged.length) {
      throw new DeploymentSmokeStepError(
        'admin.authorized',
        'contract-error',
        'Admin response total did not match flagged item count.',
        { snippet: response.text, url: response.response.url },
      );
    }
  });

  result.ok = true;
  result.finishedAt = new Date(now()).toISOString();
  result.durationMs = Math.max(0, now() - startedAtMs);
  return result;
}

export async function runDeploymentSmokeCli(
  argv: string[],
  deps: DeploymentSmokeCliDependencies = {},
): Promise<number> {
  const logger = deps.logger ?? console;

  try {
    const options = parseDeploymentSmokeCliArgs(argv, deps.env);
    const result = await runDeploymentSmoke(options, deps);
    logger.log(formatDeploymentSmokeOutput(result, { json: options.json }));
    return 0;
  } catch (error) {
    if (error instanceof DeploymentSmokeRunFailedError) {
      logger.error(formatDeploymentSmokeOutput(error.result));
      return 1;
    }

    const failure = normalizeStepError('cli.args', error);
    const fallbackResult: DeploymentSmokeResult = {
      ok: false,
      baseUrl: 'unknown',
      proofTag: buildProofTag(Date.now()),
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [
        {
          step: failure.step,
          ok: false,
          kind: failure.kind,
          detail: failure.message,
          durationMs: 0,
          statusCode: failure.statusCode,
          url: failure.url,
          snippet: failure.snippet,
        },
      ],
    };
    logger.error(formatDeploymentSmokeOutput(fallbackResult));
    return 1;
  }
}

export async function runDeploymentSmokeCliFromSerializedArgs(
  serializedArgv: string,
  env: Record<string, string | undefined> = process.env,
): Promise<number> {
  const argv = JSON.parse(serializedArgv) as string[];
  return runDeploymentSmokeCli(argv, { env });
}

function buildProofTag(timestamp: number): string {
  return `deploy-smoke-${new Date(timestamp).toISOString().replace(/[.:]/g, '-').replace(/Z$/, 'z')}`;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function validateDeploymentSmokeOptions(options: DeploymentSmokeOptions): ValidatedDeploymentSmokeOptions {
  const baseUrl = options.baseUrl?.trim();
  const cronSecret = options.cronSecret?.trim();
  const adminSecret = options.adminSecret?.trim();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!baseUrl) {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Missing required base URL. Provide --base-url or SYNESTHESIA_PUBLIC_BASE_URL.');
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Base URL must be a valid http:// or https:// URL.');
  }

  if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Base URL must use http:// or https://.');
  }

  if (!cronSecret) {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Missing required cron secret. Provide --cron-secret or CRON_SECRET.');
  }

  if (!adminSecret) {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Missing required admin secret. Provide --admin-secret or ADMIN_SECRET.');
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new DeploymentSmokeStepError('cli.args', 'invalid-input', 'Timeout must be a positive number of milliseconds.');
  }

  return {
    baseUrl: parsedBaseUrl.origin,
    cronSecret,
    adminSecret,
    timeoutMs,
  };
}

function normalizeStepError(step: DeploymentSmokeStepName, error: unknown): DeploymentSmokeStepError {
  if (error instanceof DeploymentSmokeStepError) {
    return error;
  }

  if (error instanceof Error) {
    return new DeploymentSmokeStepError(step, 'network-error', error.message);
  }

  return new DeploymentSmokeStepError(step, 'network-error', 'Unknown deployment smoke failure.');
}

function buildUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

async function requestText(
  fetchImpl: typeof fetch,
  step: DeploymentSmokeStepName,
  options: {
    url: string;
    timeoutMs: number;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    redactValues?: string[];
  },
): Promise<{ response: Response; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), options.timeoutMs);

  try {
    const response = await fetchImpl(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });
    const text = sanitizeSnippet(await response.text(), options.redactValues ?? []);
    return { response, text };
  } catch (error) {
    if (isAbortError(error)) {
      throw new DeploymentSmokeStepError(
        step,
        'timeout',
        `Timed out after ${options.timeoutMs}ms.`,
        { url: options.url },
      );
    }

    throw new DeploymentSmokeStepError(
      step,
      'network-error',
      error instanceof Error ? error.message : 'Network request failed.',
      { url: options.url },
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson(
  fetchImpl: typeof fetch,
  step: DeploymentSmokeStepName,
  options: {
    url: string;
    timeoutMs: number;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    redactValues?: string[];
  },
): Promise<JsonStepResponse> {
  const { response, text } = await requestText(fetchImpl, step, options);

  try {
    return {
      response,
      text,
      json: JSON.parse(text) as unknown,
    };
  } catch {
    throw new DeploymentSmokeStepError(
      step,
      'malformed-response',
      'Expected a JSON response body.',
      {
        statusCode: response.status,
        snippet: text,
        url: response.url,
      },
    );
  }
}

function ensureObject(
  value: unknown,
  step: DeploymentSmokeStepName,
  snippet: string,
  response: Response,
  fieldName = 'body',
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DeploymentSmokeStepError(
      step,
      'contract-error',
      `Expected ${fieldName} to be an object.`,
      { statusCode: response.status, snippet, url: response.url },
    );
  }

  return value as Record<string, unknown>;
}

function ensureArray(
  value: unknown,
  step: DeploymentSmokeStepName,
  fieldName: string,
  snippet: string,
  response: Response,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new DeploymentSmokeStepError(
      step,
      'contract-error',
      `Expected ${fieldName} to be an array.`,
      { statusCode: response.status, snippet, url: response.url },
    );
  }

  return value;
}

function ensureString(
  value: unknown,
  step: DeploymentSmokeStepName,
  fieldName: string,
  snippet: string,
  response: Response,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DeploymentSmokeStepError(
      step,
      'contract-error',
      `Expected ${fieldName} to be a non-empty string.`,
      { statusCode: response.status, snippet, url: response.url },
    );
  }

  return value;
}

function assertNoFallbackMarkers(
  step: DeploymentSmokeStepName,
  text: string,
  response: Response,
): void {
  const marker = FALLBACK_MARKERS.find((candidate) => text.includes(candidate));

  if (marker) {
    throw new DeploymentSmokeStepError(
      step,
      'fallback-detected',
      `Detected degraded fallback marker: ${marker}`,
      { statusCode: response.status, snippet: text, url: response.url },
    );
  }
}

function assertIncludes(
  step: DeploymentSmokeStepName,
  text: string,
  expected: string,
  response: Response,
): void {
  if (!text.includes(expected)) {
    throw new DeploymentSmokeStepError(
      step,
      'contract-error',
      `Expected response to include ${JSON.stringify(expected)}.`,
      { statusCode: response.status, snippet: text, url: response.url },
    );
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function sanitizeSnippet(value: string, redactValues: string[]): string {
  let sanitized = value;

  for (const secret of redactValues) {
    if (!secret) {
      continue;
    }
    sanitized = sanitized.split(secret).join('[redacted]');
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized.length > MAX_SNIPPET_LENGTH
    ? `${sanitized.slice(0, MAX_SNIPPET_LENGTH)}…`
    : sanitized;
}
