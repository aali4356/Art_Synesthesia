'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { getClientObservabilityConfig } from '@/lib/observability/client';
import { sanitizeSentryEvent } from '@/lib/observability/privacy';

interface ObservabilityProviderProps {
  children: React.ReactNode;
}

let posthogInitialized = false;
let sentryInitialized = false;

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  const config = getClientObservabilityConfig();
  const posthogEnabled = Boolean(config.posthogKey);
  const sentryEnabled = Boolean(config.sentryDsn);

  useEffect(() => {
    if (posthogEnabled && config.posthogKey && !posthogInitialized) {
      posthog.init(config.posthogKey, {
        api_host: config.posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: true,
        autocapture: false,
        person_profiles: 'identified_only',
        property_denylist: [
          'body',
          'canonical',
          'canonicalUrl',
          'datasetBody',
          'galleryPreviewText',
          'inputText',
          'previewHint',
          'previewHints',
          'rawInput',
          'rawText',
          'text',
          'url',
        ],
      });
      posthogInitialized = true;
    }

    if (sentryEnabled && config.sentryDsn && !sentryInitialized) {
      Sentry.init({
        dsn: config.sentryDsn,
        enabled: true,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        beforeSend: sanitizeSentryEvent,
      });
      sentryInitialized = true;
    }
  }, [config.posthogHost, config.posthogKey, config.sentryDsn, posthogEnabled, sentryEnabled]);

  if (!posthogEnabled) {
    return children;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
