import * as Sentry from '@sentry/nextjs';
import type { ObservabilityEventName } from '@/lib/observability/events';
import { buildObservabilityEvent } from '@/lib/observability/events';
import {
  buildSafeErrorContext,
  filterTags,
  type PrivacyVerdict,
  type SafeObservabilityProperties,
} from '@/lib/observability/privacy';

export interface ServerObservabilityConfig {
  sentryDsn?: string;
}

export interface ServerObservabilityAdapter {
  captureEvent?: (eventName: string, properties: SafeObservabilityProperties) => void;
  captureError?: (
    error: unknown,
    payload: {
      tags: Record<string, string>;
      extra: SafeObservabilityProperties;
    }
  ) => void;
}

export interface ServerCaptureResult {
  enabled: boolean;
  emitted: boolean;
  droppedKeys: string[];
  verdict: PrivacyVerdict;
  properties: SafeObservabilityProperties;
}

export function getServerObservabilityConfig(): ServerObservabilityConfig {
  return {
    sentryDsn: process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined,
  };
}

export function isServerObservabilityEnabled(
  config: ServerObservabilityConfig = getServerObservabilityConfig()
): boolean {
  return Boolean(config.sentryDsn);
}

export function getDefaultServerAdapter(
  config: ServerObservabilityConfig = getServerObservabilityConfig()
): ServerObservabilityAdapter {
  return {
    captureEvent: undefined,
    captureError: config.sentryDsn
      ? (error, payload) => {
          Sentry.withScope((scope) => {
            scope.setTags(payload.tags);
            scope.setExtras(payload.extra);
            Sentry.captureException(error);
          });
        }
      : undefined,
  };
}

export function captureServerEvent(
  eventName: ObservabilityEventName,
  properties?: Record<string, unknown>,
  options?: {
    adapter?: ServerObservabilityAdapter;
    config?: ServerObservabilityConfig;
  }
): ServerCaptureResult {
  const config = options?.config ?? getServerObservabilityConfig();
  const adapter = options?.adapter ?? getDefaultServerAdapter(config);
  const payload = buildObservabilityEvent(eventName, properties);
  const enabled = isServerObservabilityEnabled(config);

  if (!enabled || !adapter.captureEvent || payload.verdict === 'blocked') {
    return {
      enabled,
      emitted: false,
      droppedKeys: payload.droppedKeys,
      verdict: payload.verdict,
      properties: payload.properties,
    };
  }

  adapter.captureEvent(payload.name, payload.properties);

  return {
    enabled,
    emitted: true,
    droppedKeys: payload.droppedKeys,
    verdict: payload.verdict,
    properties: payload.properties,
  };
}

export function captureServerError(
  error: unknown,
  context?: {
    tags?: Record<string, string | number | boolean | undefined>;
    extra?: Record<string, unknown>;
  },
  options?: {
    adapter?: ServerObservabilityAdapter;
    config?: ServerObservabilityConfig;
  }
): ServerCaptureResult & { category: string } {
  const config = options?.config ?? getServerObservabilityConfig();
  const adapter = options?.adapter ?? getDefaultServerAdapter(config);
  const enabled = isServerObservabilityEnabled(config);
  const safeContext = buildSafeErrorContext(error, {
    tags: filterTags(context?.tags),
    extra: context?.extra,
  });

  if (!enabled || !adapter.captureError) {
    return {
      enabled,
      emitted: false,
      droppedKeys: safeContext.droppedKeys,
      verdict: safeContext.verdict,
      properties: safeContext.extra,
      category: safeContext.category,
    };
  }

  adapter.captureError(error, {
    tags: safeContext.tags,
    extra: safeContext.extra,
  });

  return {
    enabled,
    emitted: true,
    droppedKeys: safeContext.droppedKeys,
    verdict: safeContext.verdict,
    properties: safeContext.extra,
    category: safeContext.category,
  };
}
