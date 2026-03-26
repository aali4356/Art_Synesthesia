import { describe, expect, it, vi } from 'vitest';
import { OBSERVABILITY_EVENTS, buildObservabilityEvent } from '@/lib/observability/events';
import {
  buildSafeErrorContext,
  classifyObservabilityError,
  filterObservabilityProperties,
  sanitizeSentryEvent,
} from '@/lib/observability/privacy';
import { captureClientError, captureClientEvent } from '@/lib/observability/client';
import { captureServerError, captureServerEvent } from '@/lib/observability/server';

describe('observability privacy filtering', () => {
  it('strips raw source fields, canonical URLs, dataset bodies, and preview hints centrally', () => {
    const result = filterObservabilityProperties({
      sourceKind: 'text',
      status: 'failed',
      durationMs: 182,
      inputText: 'private poem fragment',
      canonicalUrl: 'https://example.com/private?draft=1',
      datasetBody: 'secret,csv\n1,2',
      galleryPreviewText: 'preview me',
      previewHints: ['raw hint'],
      safeNested: {
        sourceKind: 'url',
        rawText: 'nope',
        statusBucket: '4xx',
      },
    });

    expect(result.properties).toEqual({
      sourceKind: 'text',
      status: 'failed',
      durationMs: 182,
      safeNested: {
        sourceKind: 'url',
        statusBucket: '4xx',
      },
    });
    expect(result.droppedKeys).toEqual(
      expect.arrayContaining([
        'inputText',
        'canonicalUrl',
        'datasetBody',
        'galleryPreviewText',
        'previewHints',
      ])
    );
    expect(result.verdict).toBe('sanitized');
  });

  it('keeps canonical event names tied to the shared helper', () => {
    const payload = buildObservabilityEvent(OBSERVABILITY_EVENTS.generation.failed, {
      sourceKind: 'url',
      failureCategory: 'network-failure',
      url: 'https://example.com/private',
    });

    expect(payload.name).toBe('generation.failed');
    expect(payload.properties).toEqual({
      sourceKind: 'url',
      failureCategory: 'network-failure',
    });
    expect(payload.droppedKeys).toContain('url');
  });

  it('leaves client capture as a no-op when telemetry env vars are missing', () => {
    const captureEvent = vi.fn();

    const result = captureClientEvent(
      OBSERVABILITY_EVENTS.generation.started,
      {
        sourceKind: 'text',
        inputText: 'should never leave the browser',
      },
      {
        adapter: { captureEvent },
        config: { sampleRate: 1 },
      }
    );

    expect(result.enabled).toBe(false);
    expect(result.emitted).toBe(false);
    expect(result.verdict).toBe('sanitized');
    expect(result.properties).toEqual({ sourceKind: 'text' });
    expect(captureEvent).not.toHaveBeenCalled();
  });

  it('sanitizes client event payloads before an SDK adapter receives them', () => {
    const captureEvent = vi.fn();

    const result = captureClientEvent(
      OBSERVABILITY_EVENTS.generation.completed,
      {
        sourceKind: 'data',
        status: 'completed',
        datasetBody: 'secret,csv\n1,2',
        previewHint: 'tell them this',
      },
      {
        adapter: { captureEvent },
        config: { posthogKey: 'phc_test', sampleRate: 1 },
      }
    );

    expect(result.enabled).toBe(true);
    expect(result.emitted).toBe(true);
    expect(captureEvent).toHaveBeenCalledWith('generation.completed', {
      sourceKind: 'data',
      status: 'completed',
    });
  });

  it('tags intentional local no-db proof-mode errors distinctly without forwarding raw error context', () => {
    const captureError = vi.fn();
    const error = new Error('DATABASE_URL is not set for the current local proof mode');

    const result = captureServerError(
      error,
      {
        tags: { route_family: 'gallery' },
        extra: {
          canonicalUrl: 'https://example.com/private',
          datasetBody: '{"rows":42}',
          statusBucket: '5xx',
        },
      },
      {
        adapter: { captureError },
        config: { sentryDsn: 'https://examplePublicKey@o0.ingest.sentry.io/0' },
      }
    );

    expect(result.category).toBe('local-proof-unavailable');
    expect(result.emitted).toBe(true);
    expect(result.properties).toEqual({ statusBucket: '5xx' });
    expect(captureError).toHaveBeenCalledWith(error, {
      tags: {
        route_family: 'gallery',
        error_category: 'local-proof-unavailable',
      },
      extra: {
        statusBucket: '5xx',
      },
    });
  });

  it('drops blocked server event payloads instead of sending replay-grade properties', () => {
    const captureEvent = vi.fn();

    const result = captureServerEvent(
      OBSERVABILITY_EVENTS.route.failure,
      {
        inputText: 'private copy',
        canonicalUrl: 'https://example.com/private',
      },
      {
        adapter: { captureEvent },
        config: { sentryDsn: 'https://examplePublicKey@o0.ingest.sentry.io/0' },
      }
    );

    expect(result.verdict).toBe('blocked');
    expect(result.emitted).toBe(false);
    expect(result.properties).toEqual({});
    expect(captureEvent).not.toHaveBeenCalled();
  });

  it('sanitizes Sentry event envelopes before send', () => {
    const sanitized = sanitizeSentryEvent(
      {
        message: 'Request failed',
        extra: {
          sourceKind: 'url',
          inputText: 'private source',
        },
        contexts: {
          requestMeta: {
            canonicalUrl: 'https://example.com/private',
            statusBucket: '4xx',
          },
        },
        request: {
          url: 'https://example.com/private',
          data: { rawText: 'private payload' },
        },
        user: { id: 'abc' },
      },
      {
        originalException: new Error('DATABASE_URL is not set'),
      }
    );

    expect(sanitized).not.toBeNull();
    expect(sanitized?.extra).toEqual({ sourceKind: 'url' });
    expect(sanitized?.contexts).toEqual({
      requestMeta: {
        statusBucket: '4xx',
      },
    });
    expect(sanitized?.request?.url).toBeUndefined();
    expect(sanitized?.request?.data).toBeUndefined();
    expect(sanitized?.user).toBeUndefined();
    expect(sanitized?.tags?.error_category).toBe('local-proof-unavailable');
  });

  it('exposes standalone error classification and safe context helpers for downstream callers', () => {
    expect(classifyObservabilityError(new Error('Request timeout while loading share'))).toBe('timeout');
    expect(classifyObservabilityError(new Error('Invalid JSON body'))).toBe('malformed-payload');
    expect(classifyObservabilityError(new Error('Rate limit exceeded'))).toBe('rate-limited');

    const safeContext = buildSafeErrorContext(new Error('Network socket closed'), {
      tags: { route_family: 'analyze-url' },
      extra: {
        url: 'https://example.com/private',
        statusBucket: 'network',
      },
    });

    expect(safeContext.category).toBe('network-failure');
    expect(safeContext.tags).toEqual({
      route_family: 'analyze-url',
      error_category: 'network-failure',
    });
    expect(safeContext.extra).toEqual({ statusBucket: 'network' });
  });

  it('keeps server error capture inert when no Sentry env vars are configured', () => {
    const captureError = vi.fn();

    const result = captureServerError(
      new Error('Invalid JSON body'),
      {
        extra: {
          body: '{bad json}',
          statusBucket: '4xx',
        },
      },
      {
        adapter: { captureError },
        config: {},
      }
    );

    expect(result.enabled).toBe(false);
    expect(result.emitted).toBe(false);
    expect(result.category).toBe('malformed-payload');
    expect(result.properties).toEqual({ statusBucket: '4xx' });
    expect(captureError).not.toHaveBeenCalled();
  });

  it('sanitizes client error context before adapter delivery', () => {
    const captureError = vi.fn();
    const error = new Error('Fetch failed for gallery save');

    const result = captureClientError(
      error,
      {
        tags: { surface: 'results' },
        extra: {
          previewHints: ['private'],
          fullUrl: 'https://example.com/private',
          statusBucket: 'network',
        },
      },
      {
        adapter: { captureError },
        config: { sentryDsn: 'https://examplePublicKey@o0.ingest.sentry.io/0', sampleRate: 1 },
      }
    );

    expect(result.category).toBe('network-failure');
    expect(captureError).toHaveBeenCalledWith(error, {
      tags: {
        surface: 'results',
        error_category: 'network-failure',
      },
      extra: {
        statusBucket: 'network',
      },
    });
  });
});
