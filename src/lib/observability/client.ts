'use client';

import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
import type { ObservabilityEventName } from '@/lib/observability/events';
import { buildObservabilityEvent } from '@/lib/observability/events';
import {
  buildSafeErrorContext,
  filterTags,
  type PrivacyVerdict,
  type SafeObservabilityProperties,
} from '@/lib/observability/privacy';

export interface ClientObservabilityConfig {
  posthogKey?: string;
  posthogHost?: string;
  sentryDsn?: string;
  sampleRate: number;
}

export interface ClientObservabilityAdapter {
  captureEvent?: (eventName: string, properties: SafeObservabilityProperties) => void;
  captureError?: (
    error: unknown,
    payload: {
      tags: Record<string, string>;
      extra: SafeObservabilityProperties;
    }
  ) => void;
}

export interface ClientCaptureResult {
  enabled: boolean;
  emitted: boolean;
  droppedKeys: string[];
  verdict: PrivacyVerdict;
  sampledOut: boolean;
  properties: SafeObservabilityProperties;
}

function parseSampleRate(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.min(parsed, 1);
}

export function getClientObservabilityConfig(): ClientObservabilityConfig {
  return {
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined,
    sampleRate: parseSampleRate(process.env.NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE),
  };
}

export function isClientObservabilityEnabled(
  config: ClientObservabilityConfig = getClientObservabilityConfig()
): boolean {
  return Boolean(config.posthogKey || config.sentryDsn);
}

export function getDefaultClientAdapter(
  config: ClientObservabilityConfig = getClientObservabilityConfig()
): ClientObservabilityAdapter {
  return {
    captureEvent: config.posthogKey
      ? (eventName, properties) => {
          posthog.capture(eventName, properties);
        }
      : undefined,
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

export function captureClientEvent(
  eventName: ObservabilityEventName,
  properties?: Record<string, unknown>,
  options?: {
    adapter?: ClientObservabilityAdapter;
    config?: ClientObservabilityConfig;
    sampleRate?: number;
  }
): ClientCaptureResult {
  const config = options?.config ?? getClientObservabilityConfig();
  const adapter = options?.adapter ?? getDefaultClientAdapter(config);
  const payload = buildObservabilityEvent(eventName, properties);
  const enabled = isClientObservabilityEnabled(config);
  const sampleRate = options?.sampleRate ?? config.sampleRate;
  const sampledOut = sampleRate < 1 && Math.random() > sampleRate;

  if (!enabled || !adapter.captureEvent || payload.verdict === 'blocked' || sampledOut) {
    return {
      enabled,
      emitted: false,
      droppedKeys: payload.droppedKeys,
      verdict: payload.verdict,
      sampledOut,
      properties: payload.properties,
    };
  }

  adapter.captureEvent(payload.name, payload.properties);

  return {
    enabled,
    emitted: true,
    droppedKeys: payload.droppedKeys,
    verdict: payload.verdict,
    sampledOut: false,
    properties: payload.properties,
  };
}

export function captureClientError(
  error: unknown,
  context?: {
    tags?: Record<string, string | number | boolean | undefined>;
    extra?: Record<string, unknown>;
  },
  options?: {
    adapter?: ClientObservabilityAdapter;
    config?: ClientObservabilityConfig;
  }
): ClientCaptureResult & { category: string } {
  const config = options?.config ?? getClientObservabilityConfig();
  const adapter = options?.adapter ?? getDefaultClientAdapter(config);
  const enabled = isClientObservabilityEnabled(config);
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
      sampledOut: false,
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
    sampledOut: false,
    properties: safeContext.extra,
    category: safeContext.category,
  };
}
