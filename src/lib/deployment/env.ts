export type DeploymentRuntimeMode = 'local-proof' | 'migrate' | 'deployed-runtime';
export type DeploymentEnvKey =
  | 'DATABASE_URL'
  | 'ADMIN_SECRET'
  | 'CRON_SECRET'
  | 'SYNESTHESIA_PUBLIC_BASE_URL'
  | 'NEXT_PUBLIC_POSTHOG_KEY'
  | 'NEXT_PUBLIC_POSTHOG_HOST'
  | 'NEXT_PUBLIC_SENTRY_DSN'
  | 'SENTRY_DSN'
  | 'SENTRY_AUTH_TOKEN'
  | 'NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE';

export interface DeploymentEnvSource {
  [key: string]: string | undefined;
}

export interface DeploymentEnvContract {
  mode: DeploymentRuntimeMode;
  requiredKeys: DeploymentEnvKey[];
  optionalKeys: DeploymentEnvKey[];
  databaseUrl?: string;
  adminSecret?: string;
  cronSecret?: string;
  publicBaseUrl?: string;
  observability: {
    nextPublicPosthogKey?: string;
    nextPublicPosthogHost?: string;
    nextPublicSentryDsn?: string;
    sentryDsn?: string;
    sentryAuthToken?: string;
    nextPublicObservabilitySampleRate?: string;
  };
}

export class DeploymentEnvError extends Error {
  readonly name = 'DeploymentEnvError';
  readonly kind: 'missing' | 'malformed';
  readonly key: DeploymentEnvKey;
  readonly mode: DeploymentRuntimeMode;

  constructor(
    kind: 'missing' | 'malformed',
    key: DeploymentEnvKey,
    mode: DeploymentRuntimeMode,
    detail: string,
  ) {
    super(`[deployment-env:${kind}] ${key} ${detail}`);
    this.kind = kind;
    this.key = key;
    this.mode = mode;
  }
}

const ALL_DEPLOYMENT_ENV_KEYS: DeploymentEnvKey[] = [
  'DATABASE_URL',
  'ADMIN_SECRET',
  'CRON_SECRET',
  'SYNESTHESIA_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE',
];

const REQUIRED_KEYS_BY_MODE: Record<DeploymentRuntimeMode, DeploymentEnvKey[]> = {
  'local-proof': [],
  migrate: ['DATABASE_URL'],
  'deployed-runtime': ['DATABASE_URL', 'ADMIN_SECRET', 'CRON_SECRET'],
};

function isBlank(value: string | undefined): value is undefined {
  return value === undefined || value.trim().length === 0;
}

function missingGuidance(mode: DeploymentRuntimeMode, key: DeploymentEnvKey): string {
  if (mode === 'migrate') {
    return `is required for ${mode} mode. Set it in local .env/.env.local or the deployment shell before running migrations.`;
  }

  if (mode === 'deployed-runtime') {
    return `is required for ${mode} mode. Set it in Vercel project environment variables before promoting the public runtime.`;
  }

  return `is optional for ${mode} mode. Remove the blank placeholder or provide a real value before using it.`;
}

function malformedGuidance(mode: DeploymentRuntimeMode, key: DeploymentEnvKey, rule: string): string {
  return `is malformed for ${mode} mode: ${rule}`;
}

function readRawValue(env: DeploymentEnvSource, key: DeploymentEnvKey): string | undefined {
  const value = env[key];
  return value === undefined ? undefined : value;
}

function readOptionalString(
  env: DeploymentEnvSource,
  key: DeploymentEnvKey,
  mode: DeploymentRuntimeMode,
  validator?: (value: string) => string,
): string | undefined {
  const rawValue = readRawValue(env, key);

  if (rawValue === undefined) {
    return undefined;
  }

  const trimmed = rawValue.trim();

  if (trimmed.length === 0) {
    throw new DeploymentEnvError('malformed', key, mode, malformedGuidance(mode, key, 'blank strings are not allowed'));
  }

  return validator ? validator(trimmed) : trimmed;
}

function readRequiredString(
  env: DeploymentEnvSource,
  key: DeploymentEnvKey,
  mode: DeploymentRuntimeMode,
  validator?: (value: string) => string,
): string {
  const rawValue = readRawValue(env, key);

  if (rawValue === undefined) {
    throw new DeploymentEnvError('missing', key, mode, missingGuidance(mode, key));
  }

  const trimmed = rawValue.trim();

  if (trimmed.length === 0) {
    throw new DeploymentEnvError('malformed', key, mode, malformedGuidance(mode, key, 'blank strings are not allowed'));
  }

  return validator ? validator(trimmed) : trimmed;
}

function validateDatabaseUrl(value: string, mode: DeploymentRuntimeMode): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new DeploymentEnvError(
      'malformed',
      'DATABASE_URL',
      mode,
      malformedGuidance(mode, 'DATABASE_URL', 'expected a valid postgres:// or postgresql:// URL'),
    );
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new DeploymentEnvError(
      'malformed',
      'DATABASE_URL',
      mode,
      malformedGuidance(mode, 'DATABASE_URL', 'expected postgres:// or postgresql:// protocol'),
    );
  }

  if (!parsed.hostname.trim()) {
    throw new DeploymentEnvError(
      'malformed',
      'DATABASE_URL',
      mode,
      malformedGuidance(mode, 'DATABASE_URL', 'expected a hostname for the Neon/Postgres connection'),
    );
  }

  return value;
}

function validateHttpUrl(key: 'SYNESTHESIA_PUBLIC_BASE_URL' | 'NEXT_PUBLIC_POSTHOG_HOST', value: string, mode: DeploymentRuntimeMode): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new DeploymentEnvError(
      'malformed',
      key,
      mode,
      malformedGuidance(mode, key, 'expected a valid http:// or https:// URL'),
    );
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new DeploymentEnvError(
      'malformed',
      key,
      mode,
      malformedGuidance(mode, key, 'expected http:// or https:// protocol'),
    );
  }

  return value;
}

function validateSampleRate(value: string, mode: DeploymentRuntimeMode): string {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
    throw new DeploymentEnvError(
      'malformed',
      'NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE',
      mode,
      malformedGuidance(mode, 'NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE', 'expected a number between 0 and 1'),
    );
  }

  return value;
}

export function getRequiredDeploymentEnvKeys(mode: DeploymentRuntimeMode): DeploymentEnvKey[] {
  return [...REQUIRED_KEYS_BY_MODE[mode]];
}

export function getOptionalDeploymentEnvKeys(mode: DeploymentRuntimeMode): DeploymentEnvKey[] {
  const required = new Set(REQUIRED_KEYS_BY_MODE[mode]);
  return ALL_DEPLOYMENT_ENV_KEYS.filter((key) => !required.has(key));
}

export function resolveDeploymentEnv(
  mode: DeploymentRuntimeMode,
  env: DeploymentEnvSource = process.env,
): DeploymentEnvContract {
  const requiredKeys = getRequiredDeploymentEnvKeys(mode);
  const optionalKeys = getOptionalDeploymentEnvKeys(mode);

  const databaseUrl = requiredKeys.includes('DATABASE_URL')
    ? readRequiredString(env, 'DATABASE_URL', mode, (value) => validateDatabaseUrl(value, mode))
    : readOptionalString(env, 'DATABASE_URL', mode, (value) => validateDatabaseUrl(value, mode));

  const adminSecret = requiredKeys.includes('ADMIN_SECRET')
    ? readRequiredString(env, 'ADMIN_SECRET', mode)
    : readOptionalString(env, 'ADMIN_SECRET', mode);

  const cronSecret = requiredKeys.includes('CRON_SECRET')
    ? readRequiredString(env, 'CRON_SECRET', mode)
    : readOptionalString(env, 'CRON_SECRET', mode);

  return {
    mode,
    requiredKeys,
    optionalKeys,
    databaseUrl,
    adminSecret,
    cronSecret,
    publicBaseUrl: readOptionalString(env, 'SYNESTHESIA_PUBLIC_BASE_URL', mode, (value) =>
      validateHttpUrl('SYNESTHESIA_PUBLIC_BASE_URL', value, mode)
    ),
    observability: {
      nextPublicPosthogKey: readOptionalString(env, 'NEXT_PUBLIC_POSTHOG_KEY', mode),
      nextPublicPosthogHost: readOptionalString(env, 'NEXT_PUBLIC_POSTHOG_HOST', mode, (value) =>
        validateHttpUrl('NEXT_PUBLIC_POSTHOG_HOST', value, mode)
      ),
      nextPublicSentryDsn: readOptionalString(env, 'NEXT_PUBLIC_SENTRY_DSN', mode),
      sentryDsn: readOptionalString(env, 'SENTRY_DSN', mode),
      sentryAuthToken: readOptionalString(env, 'SENTRY_AUTH_TOKEN', mode),
      nextPublicObservabilitySampleRate: readOptionalString(
        env,
        'NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE',
        mode,
        (value) => validateSampleRate(value, mode),
      ),
    },
  };
}

function formatPresenceLine(key: DeploymentEnvKey, value: string | undefined, requiredKeys: DeploymentEnvKey[]): string {
  const expectation = requiredKeys.includes(key) ? 'required' : 'optional';
  const status = value ? 'present' : 'missing';
  return `[deployment-env] key=${key} expectation=${expectation} status=${status}`;
}

export function runDeploymentPreflight(
  mode: DeploymentRuntimeMode,
  env: DeploymentEnvSource = process.env,
  logger: Pick<Console, 'log' | 'error'> = console,
): DeploymentEnvContract {
  try {
    const contract = resolveDeploymentEnv(mode, env);

    logger.log(`[deployment-env] mode=${mode} status=ok`);
    logger.log(formatPresenceLine('DATABASE_URL', contract.databaseUrl, contract.requiredKeys));
    logger.log(formatPresenceLine('ADMIN_SECRET', contract.adminSecret, contract.requiredKeys));
    logger.log(formatPresenceLine('CRON_SECRET', contract.cronSecret, contract.requiredKeys));
    logger.log(formatPresenceLine('SYNESTHESIA_PUBLIC_BASE_URL', contract.publicBaseUrl, contract.requiredKeys));

    return contract;
  } catch (error) {
    if (error instanceof DeploymentEnvError) {
      logger.error(`[deployment-env] mode=${error.mode} status=failed kind=${error.kind} key=${error.key}`);
    }

    throw error;
  }
}

export function parseDeploymentRuntimeMode(input: string | undefined): DeploymentRuntimeMode {
  if (!input || input.trim().length === 0) {
    return 'local-proof';
  }

  const normalized = input.trim() as DeploymentRuntimeMode;

  if (normalized === 'local-proof' || normalized === 'migrate' || normalized === 'deployed-runtime') {
    return normalized;
  }

  throw new Error(
    `[deployment-env] Unknown DEPLOYMENT_ENV_MODE "${input}". Expected local-proof, migrate, or deployed-runtime.`,
  );
}

export function runDeploymentPreflightCli(modeInput: string | undefined, env: DeploymentEnvSource = process.env): void {
  const mode = parseDeploymentRuntimeMode(modeInput);
  runDeploymentPreflight(mode, env);
}
