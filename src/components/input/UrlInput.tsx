'use client';

import { useState, useCallback } from 'react';

interface UrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: (mode: 'snapshot' | 'live') => void;
  disabled: boolean;
  remainingQuota: number | null;
  error: string | null;
}

export function UrlInput({
  url,
  onUrlChange,
  onAnalyze,
  disabled,
  remainingQuota,
  error,
}: UrlInputProps) {
  const [mode, setMode] = useState<'snapshot' | 'live'>('snapshot');

  const handleAnalyze = useCallback(() => {
    onAnalyze(mode);
  }, [onAnalyze, mode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !disabled && url.trim().length > 0) {
        e.preventDefault();
        handleAnalyze();
      }
    },
    [disabled, url, handleAnalyze]
  );

  const isAnalyzeDisabled = disabled || url.trim().length === 0;

  return (
    <div className="w-full">
      {/* URL input field */}
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="https://example.com"
        aria-label="URL input for artwork generation"
        className={`
          w-full bg-transparent
          border-b border-[var(--border)]
          focus:border-[var(--color-accent)]
          outline-none
          text-base leading-relaxed p-4
          placeholder:text-[var(--muted-foreground)]
          transition-colors duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />

      {/* Mode toggle */}
      <div className="flex items-center gap-2 pt-3 pb-1">
        <span className="text-xs text-[var(--muted-foreground)]">Mode:</span>
        <button
          type="button"
          onClick={() => setMode('snapshot')}
          aria-pressed={mode === 'snapshot'}
          className={`
            text-xs px-3 py-1 rounded border transition-colors duration-150
            ${mode === 'snapshot'
              ? 'border-[var(--color-accent)] text-[var(--foreground)] bg-[var(--color-accent)]/10'
              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
          `}
        >
          Snapshot
        </button>
        <button
          type="button"
          onClick={() => setMode('live')}
          aria-pressed={mode === 'live'}
          className={`
            text-xs px-3 py-1 rounded border transition-colors duration-150
            ${mode === 'live'
              ? 'border-[var(--color-accent)] text-[var(--foreground)] bg-[var(--color-accent)]/10'
              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
          `}
        >
          Live
        </button>
      </div>

      {/* Live mode warning */}
      {mode === 'live' && (
        <p className="text-xs text-[var(--muted-foreground)] pb-2">
          Live mode re-fetches on every request. Art may change.
        </p>
      )}

      {/* Rate limit quota */}
      {remainingQuota !== null && (
        <p className="text-xs text-[var(--muted-foreground)] py-1">
          {remainingQuota} URL {remainingQuota === 1 ? 'analysis' : 'analyses'} remaining this hour
        </p>
      )}

      {/* Error display */}
      {error !== null && (
        <p className="text-xs text-red-500 dark:text-red-400 py-1" role="alert">
          {error}
        </p>
      )}

      {/* Analyze button */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzeDisabled}
          className={`
            btn-accent active:scale-95 transition-transform
            ${isAnalyzeDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {disabled ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>
  );
}
