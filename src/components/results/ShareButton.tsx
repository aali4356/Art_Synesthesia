'use client';

import { useState } from 'react';
import type { ParameterVector, VersionInfo } from '@/types/engine';

interface ShareButtonProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  className?: string;
}

type ShareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; shareId: string; shareUrl: string; fullUrl: string }
  | { status: 'error'; message: string };

/**
 * ShareButton creates a share link for the current artwork.
 *
 * Privacy contract (SHARE-01):
 * - Only sends parameterVector, versionInfo, and styleName to the server
 * - Never sends raw input text
 */
export function ShareButton({
  parameterVector,
  versionInfo,
  styleName,
  className = '',
}: ShareButtonProps) {
  const [state, setState] = useState<ShareState>({ status: 'idle' });

  async function handleShare() {
    setState({ status: 'loading' });
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vector: parameterVector, version: versionInfo, style: styleName }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Share failed' }));
        setState({ status: 'error', message: err.error ?? 'Share failed' });
        return;
      }

      const { shareId, url } = await response.json();
      const fullUrl = `${window.location.origin}${url}`;
      setState({ status: 'success', shareId, shareUrl: url, fullUrl });
    } catch {
      setState({ status: 'error', message: 'Network error. Please try again.' });
    }
  }

  async function handleCopy() {
    if (state.status !== 'success') return;
    try {
      await navigator.clipboard.writeText(state.fullUrl);
    } catch {
      // Clipboard API unavailable -- user can copy manually
    }
  }

  if (state.status === 'success') {
    return (
      <div className={`editorial-action-card ${className}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="editorial-note-label mb-1">Share</p>
            <h3 className="text-base font-medium text-[var(--foreground)]">Create a public proof link.</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              This opens the shared collector viewer with public parameter-only data: vector, version, and style metadata — never the raw source.
            </p>
          </div>
          <button
            onClick={() => setState({ status: 'idle' })}
            className="btn-ghost text-sm"
          >
            Create new link
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
          Anyone with this URL can open the public proof route. It stays parameter-only and routes to the shared collector viewer without the original prompt.
        </p>

        <div className="mt-4 editorial-link-strip">
          <span className="flex-1 font-mono text-sm text-[var(--muted-foreground)] break-all">{state.fullUrl}</span>
          <button
            onClick={handleCopy}
            className="btn-accent text-sm shrink-0"
            aria-label="Copy share link to clipboard"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`editorial-action-card ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="editorial-note-label mb-0">Share</p>
          <h3 className="text-base font-medium text-[var(--foreground)]">Publish a public, view-only collector link.</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Generate a public parameter-only proof route for this artwork so the shared viewer can reopen the same edition family without attaching the original prompt or source payload.
          </p>
        </div>
        <button
          onClick={handleShare}
          disabled={state.status === 'loading'}
          className="btn-accent text-sm disabled:opacity-50"
          aria-label="Share this artwork"
        >
          {state.status === 'loading' ? 'Creating link...' : 'Share'}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="mt-3 text-xs text-[var(--color-accent)]" role="alert">{state.message}</p>
      )}
    </div>
  );
}
