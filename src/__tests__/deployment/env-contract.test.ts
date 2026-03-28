import { describe, expect, it, vi } from 'vitest';
import {
  DeploymentEnvError,
  getOptionalDeploymentEnvKeys,
  getRequiredDeploymentEnvKeys,
  parseDeploymentRuntimeMode,
  resolveDeploymentEnv,
  runDeploymentPreflight,
} from '@/lib/deployment/env';

const VALID_DATABASE_URL = 'postgresql://user:password@ep-canonical-123.us-east-1.aws.neon.tech/synesthesia?sslmode=require';

function baseEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    DATABASE_URL: VALID_DATABASE_URL,
    ADMIN_SECRET: 'admin-secret-test-value',
    CRON_SECRET: 'cron-secret-test-value',
    SYNESTHESIA_PUBLIC_BASE_URL: 'https://synesthesia.example.com',
    NEXT_PUBLIC_POSTHOG_KEY: 'phc_test_key',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
    NEXT_PUBLIC_SENTRY_DSN: 'https://public@example.ingest.sentry.io/0',
    SENTRY_DSN: 'https://server@example.ingest.sentry.io/0',
    SENTRY_AUTH_TOKEN: 'sntrys_test_token',
    NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE: '0.5',
    ...overrides,
  };
}

describe('deployment env contract', () => {
  it('classifies required and optional keys per runtime mode', () => {
    expect(getRequiredDeploymentEnvKeys('local-proof')).toEqual([]);
    expect(getRequiredDeploymentEnvKeys('migrate')).toEqual(['DATABASE_URL']);
    expect(getRequiredDeploymentEnvKeys('deployed-runtime')).toEqual([
      'DATABASE_URL',
      'ADMIN_SECRET',
      'CRON_SECRET',
    ]);

    expect(getOptionalDeploymentEnvKeys('local-proof')).toEqual(expect.arrayContaining([
      'DATABASE_URL',
      'ADMIN_SECRET',
      'CRON_SECRET',
      'SYNESTHESIA_PUBLIC_BASE_URL',
    ]));
    expect(getOptionalDeploymentEnvKeys('deployed-runtime')).not.toContain('DATABASE_URL');
    expect(getOptionalDeploymentEnvKeys('deployed-runtime')).toContain('SYNESTHESIA_PUBLIC_BASE_URL');
  });

  it('allows local proof mode without deploy-only secrets or a database URL', () => {
    const contract = resolveDeploymentEnv('local-proof', baseEnv({
      DATABASE_URL: undefined,
      ADMIN_SECRET: undefined,
      CRON_SECRET: undefined,
    }));

    expect(contract.databaseUrl).toBeUndefined();
    expect(contract.adminSecret).toBeUndefined();
    expect(contract.cronSecret).toBeUndefined();
    expect(contract.publicBaseUrl).toBe('https://synesthesia.example.com');
  });

  it('fails fast when deployed runtime is missing DATABASE_URL', () => {
    expect(() =>
      resolveDeploymentEnv('deployed-runtime', baseEnv({ DATABASE_URL: undefined }))
    ).toThrowError(DeploymentEnvError);

    try {
      resolveDeploymentEnv('deployed-runtime', baseEnv({ DATABASE_URL: undefined }));
    } catch (error) {
      expect(error).toMatchObject({
        kind: 'missing',
        key: 'DATABASE_URL',
        mode: 'deployed-runtime',
      });
      expect((error as Error).message).toContain('Vercel project environment variables');
    }
  });

  it('keeps operator secrets required for deployed runtime paths', () => {
    expect(() =>
      resolveDeploymentEnv('deployed-runtime', baseEnv({ ADMIN_SECRET: undefined }))
    ).toThrowError(/ADMIN_SECRET/);

    expect(() =>
      resolveDeploymentEnv('deployed-runtime', baseEnv({ CRON_SECRET: '   ' }))
    ).toThrowError(/CRON_SECRET/);
  });

  it('allows migrate mode to require only DATABASE_URL', () => {
    const contract = resolveDeploymentEnv('migrate', baseEnv({
      ADMIN_SECRET: undefined,
      CRON_SECRET: undefined,
    }));

    expect(contract.databaseUrl).toBe(VALID_DATABASE_URL);
    expect(contract.adminSecret).toBeUndefined();
    expect(contract.cronSecret).toBeUndefined();
  });

  it('rejects blank strings and malformed URLs deterministically', () => {
    expect(() =>
      resolveDeploymentEnv('local-proof', baseEnv({ NEXT_PUBLIC_POSTHOG_KEY: '   ' }))
    ).toThrowError(/NEXT_PUBLIC_POSTHOG_KEY/);

    expect(() =>
      resolveDeploymentEnv('migrate', baseEnv({ DATABASE_URL: 'https://example.com/not-postgres' }))
    ).toThrowError(/postgres:\/\/ or postgresql:\/\//);

    expect(() =>
      resolveDeploymentEnv('local-proof', baseEnv({ NEXT_PUBLIC_POSTHOG_HOST: 'not-a-url' }))
    ).toThrowError(/NEXT_PUBLIC_POSTHOG_HOST/);
  });

  it('keeps observability variables optional when omitted', () => {
    const contract = resolveDeploymentEnv('deployed-runtime', baseEnv({
      NEXT_PUBLIC_POSTHOG_KEY: undefined,
      NEXT_PUBLIC_POSTHOG_HOST: undefined,
      NEXT_PUBLIC_SENTRY_DSN: undefined,
      SENTRY_DSN: undefined,
      SENTRY_AUTH_TOKEN: undefined,
      NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE: undefined,
    }));

    expect(contract.observability).toEqual({
      nextPublicPosthogKey: undefined,
      nextPublicPosthogHost: undefined,
      nextPublicSentryDsn: undefined,
      sentryDsn: undefined,
      sentryAuthToken: undefined,
      nextPublicObservabilitySampleRate: undefined,
    });
  });

  it('surfaces redacted preflight step output and named failure metadata', () => {
    const logger = {
      log: vi.fn<(message: string) => void>(),
      error: vi.fn<(message: string) => void>(),
    };

    runDeploymentPreflight('local-proof', baseEnv({ DATABASE_URL: undefined }), logger);

    expect(logger.log).toHaveBeenCalledWith('[deployment-env] mode=local-proof status=ok');
    expect(logger.log).toHaveBeenCalledWith('[deployment-env] key=DATABASE_URL expectation=optional status=missing');
    expect(logger.log.mock.calls.join(' ')).not.toContain(VALID_DATABASE_URL);

    expect(() =>
      runDeploymentPreflight('deployed-runtime', baseEnv({ DATABASE_URL: undefined }), logger)
    ).toThrowError(/DATABASE_URL/);
    expect(logger.error).toHaveBeenCalledWith(
      '[deployment-env] mode=deployed-runtime status=failed kind=missing key=DATABASE_URL'
    );
  });

  it('parses deployment runtime mode and defaults to local proof', () => {
    expect(parseDeploymentRuntimeMode(undefined)).toBe('local-proof');
    expect(parseDeploymentRuntimeMode('migrate')).toBe('migrate');
    expect(() => parseDeploymentRuntimeMode('staging-runtime')).toThrowError(/DEPLOYMENT_ENV_MODE/);
  });
});
