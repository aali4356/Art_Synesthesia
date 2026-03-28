import { filterObservabilityProperties, type PrivacyFilterResult, type SafeObservabilityProperties } from '@/lib/observability/privacy';

export const OBSERVABILITY_EVENTS = {
  generation: {
    started: 'generation.started',
    completed: 'generation.completed',
    failed: 'generation.failed',
  },
  continuity: {
    saved: 'continuity.saved',
    resumed: 'continuity.resumed',
    removed: 'continuity.removed',
    failed: 'continuity.failed',
  },
  results: {
    styleChanged: 'results.style_changed',
    saveIntent: 'results.save_intent',
  },
  publicActions: {
    shareRequested: 'public.share.requested',
    shareCompleted: 'public.share.completed',
    shareCopied: 'public.share.copied',
    shareFailed: 'public.share.failed',
    gallerySaveRequested: 'public.gallery_save.requested',
    gallerySaveCompleted: 'public.gallery_save.completed',
    gallerySaveFailed: 'public.gallery_save.failed',
    exportRequested: 'public.export.requested',
    exportCompleted: 'public.export.completed',
    exportFailed: 'public.export.failed',
  },
  route: {
    failure: 'route.failure',
    unavailable: 'route.unavailable',
  },
} as const;

type ValueOf<T> = T extends unknown ? T[keyof T] : never;

export type ObservabilityEventName = ValueOf<ValueOf<typeof OBSERVABILITY_EVENTS>>;

export type RouteFamily = 'analyze-url' | 'share' | 'gallery' | 'render-export' | 'unknown';
export type StatusBucket = '2xx' | '4xx' | '5xx' | 'timeout' | 'network';
export type PublicMode = 'share-link' | 'gallery-save' | 'export';

export interface ObservabilityEventPayload {
  name: ObservabilityEventName;
  properties: SafeObservabilityProperties;
  droppedKeys: string[];
  verdict: PrivacyFilterResult['verdict'];
}

export function buildObservabilityEvent(
  name: ObservabilityEventName,
  properties?: Record<string, unknown>
): ObservabilityEventPayload {
  const filtered = filterObservabilityProperties(properties ?? {});

  return {
    name,
    properties: filtered.properties,
    droppedKeys: filtered.droppedKeys,
    verdict: filtered.verdict,
  };
}

export function buildGenerationEventProperties(input: {
  sourceKind: 'text' | 'url' | 'data';
  mode?: 'standard' | 'live' | 'cached' | 'resume';
  durationMs?: number;
  status?: 'started' | 'completed' | 'failed';
  statusCode?: number;
  continuityMode?: 'fresh' | 'resumed';
  cached?: boolean;
  failureCategory?: string;
}): SafeObservabilityProperties {
  return buildObservabilityEvent(OBSERVABILITY_EVENTS.generation.started, input).properties;
}

export function buildContinuityEventProperties(input: {
  continuityMode: 'fresh' | 'resumed';
  action: 'save' | 'resume' | 'remove' | 'error';
  sourceKind?: 'text' | 'url' | 'data' | 'mixed';
  storedItems?: number;
  failureCategory?: string;
}): SafeObservabilityProperties {
  return buildObservabilityEvent(OBSERVABILITY_EVENTS.continuity.saved, input).properties;
}

export function buildPublicActionEventProperties(input: {
  routeFamily: Extract<RouteFamily, 'share' | 'gallery' | 'render-export'>;
  publicMode: PublicMode;
  continuityMode?: 'fresh' | 'resumed';
  styleName?: string;
  action?: 'requested' | 'completed' | 'copied' | 'failed';
  statusBucket?: StatusBucket;
  failureCategory?: string;
  format?: string;
  frame?: boolean;
  includePreview?: boolean;
}): SafeObservabilityProperties {
  return buildObservabilityEvent(OBSERVABILITY_EVENTS.publicActions.shareRequested, input).properties;
}

export function buildRouteFailureProperties(input: {
  routeFamily: RouteFamily;
  statusBucket?: StatusBucket;
  failureCategory: string;
  method?: 'GET' | 'POST';
  localProofMode?: boolean;
}): SafeObservabilityProperties {
  return buildObservabilityEvent(OBSERVABILITY_EVENTS.route.failure, input).properties;
}

export function buildUnavailableStateEventProperties(input: {
  routeFamily: Extract<RouteFamily, 'share' | 'gallery' | 'unknown'>;
  unavailableCategory: string;
  statusBucket?: Extract<StatusBucket, '4xx' | '5xx'>;
  localProofMode?: boolean;
  viewerSurface?: 'detail' | 'viewer';
}): SafeObservabilityProperties {
  return buildObservabilityEvent(OBSERVABILITY_EVENTS.route.unavailable, input).properties;
}

export function getStatusBucket(status: number): Extract<StatusBucket, '2xx' | '4xx' | '5xx'> {
  if (status >= 500) {
    return '5xx';
  }

  if (status >= 400) {
    return '4xx';
  }

  return '2xx';
}
