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
        // Only vector, version, and style -- never raw input
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
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 p-2 rounded border border-border text-sm font-mono break-all">
          <span className="flex-1 text-muted-foreground">{state.fullUrl}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Copy share link to clipboard"
          >
            Copy
          </button>
        </div>
        <button
          onClick={() => setState({ status: 'idle' })}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Create new link
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        onClick={handleShare}
        disabled={state.status === 'loading'}
        className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium"
        aria-label="Share this artwork"
      >
        {state.status === 'loading' ? 'Creating link...' : 'Share'}
      </button>
      {state.status === 'error' && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
    </div>
  );
}
