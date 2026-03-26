import type { Event as SentryEvent, EventHint as SentryEventHint } from '@sentry/nextjs';

export type SafeObservabilityValue =
  | string
  | number
  | boolean
  | null
  | SafeObservabilityValue[]
  | { [key: string]: SafeObservabilityValue };

export type SafeObservabilityProperties = Record<string, SafeObservabilityValue>;

export type PrivacyVerdict = 'safe' | 'sanitized' | 'blocked';

export type ObservabilityErrorCategory =
  | 'local-proof-unavailable'
  | 'timeout'
  | 'malformed-payload'
  | 'rate-limited'
  | 'network-failure'
  | 'unknown';

export interface PrivacyFilterResult {
  properties: SafeObservabilityProperties;
  droppedKeys: string[];
  verdict: PrivacyVerdict;
}

export interface ErrorContextResult {
  tags: Record<string, string>;
  extra: SafeObservabilityProperties;
  droppedKeys: string[];
  verdict: PrivacyVerdict;
  category: ObservabilityErrorCategory;
}

const EXPLICIT_UNSAFE_KEYS = new Set([
  'body',
  'canonical',
  'canonicalUrl',
  'content',
  'datasetBody',
  'datasetPreviewText',
  'fullUrl',
  'galleryPreviewText',
  'html',
  'input',
  'inputText',
  'previewHint',
  'previewHints',
  'rawInput',
  'rawText',
  'requestBody',
  'responseBody',
  'sourceContent',
  'sourceText',
  'text',
  'url',
]);

const UNSAFE_KEY_PATTERNS = [
  /canonical/i,
  /dataset.*body/i,
  /html/i,
  /input(text)?/i,
  /preview(hint|text)?/i,
  /^raw/i,
  /(request|response)Body/i,
  /(source|full).*url/i,
  /(source|raw).*text/i,
  /^url$/i,
];

const SAFE_ARRAY_LIMIT = 25;
const SAFE_STRING_LENGTH = 240;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnsafeKey(key: string): boolean {
  return EXPLICIT_UNSAFE_KEYS.has(key) || UNSAFE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeStringValue(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  if (trimmed.length > SAFE_STRING_LENGTH) {
    return `${trimmed.slice(0, SAFE_STRING_LENGTH)}…`;
  }

  return value;
}

function sanitizeValue(value: unknown): SafeObservabilityValue | undefined {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeStringValue(value);
  }

  if (Array.isArray(value)) {
    const sanitized = value
      .slice(0, SAFE_ARRAY_LIMIT)
      .map((item) => sanitizeValue(item))
      .filter((item): item is SafeObservabilityValue => item !== undefined);

    return sanitized;
  }

  if (isPlainObject(value)) {
    return filterObservabilityProperties(value).properties;
  }

  return String(value);
}

export function filterObservabilityProperties(
  input: Record<string, unknown> | undefined | null
): PrivacyFilterResult {
  if (!input) {
    return { properties: {}, droppedKeys: [], verdict: 'safe' };
  }

  const properties: SafeObservabilityProperties = {};
  const droppedKeys: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (isUnsafeKey(key)) {
      droppedKeys.push(key);
      continue;
    }

    const sanitizedValue = sanitizeValue(value);

    if (sanitizedValue === undefined) {
      droppedKeys.push(key);
      continue;
    }

    properties[key] = sanitizedValue;
  }

  return {
    properties,
    droppedKeys,
    verdict:
      droppedKeys.length === 0
        ? 'safe'
        : Object.keys(properties).length > 0
          ? 'sanitized'
          : 'blocked',
  };
}

export function classifyObservabilityError(error: unknown): ObservabilityErrorCategory {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (
    normalized.includes('database_url is not set') ||
    normalized.includes('local proof mode') ||
    normalized.includes('no-db proof mode') ||
    normalized.includes('db unavailable')
  ) {
    return 'local-proof-unavailable';
  }

  if (normalized.includes('timeout') || normalized.includes('aborted')) {
    return 'timeout';
  }

  if (
    normalized.includes('invalid json') ||
    normalized.includes('malformed') ||
    normalized.includes('unexpected token')
  ) {
    return 'malformed-payload';
  }

  if (normalized.includes('rate limit') || normalized.includes('429')) {
    return 'rate-limited';
  }

  if (
    normalized.includes('fetch failed') ||
    normalized.includes('network') ||
    normalized.includes('socket')
  ) {
    return 'network-failure';
  }

  return 'unknown';
}

export function buildSafeErrorContext(
  error: unknown,
  context?: {
    tags?: Record<string, string | undefined>;
    extra?: Record<string, unknown>;
  }
): ErrorContextResult {
  const sanitizedExtra = filterObservabilityProperties(context?.extra);
  const category = classifyObservabilityError(error);

  const tags = Object.fromEntries(
    Object.entries({
      ...context?.tags,
      error_category: category,
    }).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
  );

  return {
    tags,
    extra: sanitizedExtra.properties,
    droppedKeys: sanitizedExtra.droppedKeys,
    verdict: sanitizedExtra.verdict,
    category,
  };
}

export function sanitizeSentryEvent(
  event: SentryEvent,
  hint?: SentryEventHint
): SentryEvent | null {
  const sanitizedExtra = filterObservabilityProperties((event.extra as Record<string, unknown> | undefined) ?? {});
  const sanitizedContexts = filterObservabilityProperties(
    (event.contexts as Record<string, unknown> | undefined) ?? {}
  );
  const derivedCategory = classifyObservabilityError(hint?.originalException ?? event.message ?? '');

  const sanitizedEvent: SentryEvent = {
    ...event,
    extra: sanitizedExtra.properties,
    contexts: sanitizedContexts.properties,
    request: event.request
      ? {
          ...event.request,
          data: undefined,
          url: undefined,
        }
      : undefined,
    tags: {
      ...event.tags,
      error_category: String(event.tags?.error_category ?? derivedCategory),
      privacy_filter_verdict:
        sanitizedExtra.verdict === 'safe' && sanitizedContexts.verdict === 'safe'
          ? 'safe'
          : 'sanitized',
    },
    user: undefined,
  };

  return sanitizedEvent;
}

export function filterTags(
  input: Record<string, string | number | boolean | undefined> | undefined
): Record<string, string> {
  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
      .filter(([key, value]) => !isUnsafeKey(key) && sanitizeStringValue(value) !== undefined)
  );
}
