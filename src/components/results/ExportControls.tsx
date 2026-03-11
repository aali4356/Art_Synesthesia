'use client';

import { useMemo, useState } from 'react';
import type { ParameterVector, VersionInfo } from '@/types/engine';
import type { StyleName } from '@/lib/render/types';
import { getSupportedExportFormats, type ExportFormat } from '@/lib/export/formats';

interface ExportControlsProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: StyleName;
  className?: string;
}

interface ExportState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export function ExportControls({
  parameterVector,
  versionInfo,
  styleName,
  className = '',
}: ExportControlsProps) {
  const supportedFormats = useMemo(() => getSupportedExportFormats(styleName), [styleName]);
  const [format, setFormat] = useState<ExportFormat>(supportedFormats[0] ?? 'png');
  const [frame, setFrame] = useState(true);
  const [state, setState] = useState<ExportState>({ status: 'idle' });

  async function handleExport() {
    setState({ status: 'loading' });
    try {
      const response = await fetch('/api/render-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: parameterVector,
          version: versionInfo,
          style: styleName,
          format,
          frame,
          resolution: 4096,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        setState({ status: 'error', message: err.error ?? 'Export failed' });
        return;
      }

      const disposition = response.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const fileName = match?.[1] ?? `synesthesia-export.${format}`;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setState({ status: 'success', message: `Downloaded ${fileName}` });
    } catch {
      setState({ status: 'error', message: 'Network error. Please try again.' });
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Export</h3>
            <p className="text-xs text-muted-foreground">High-resolution 4096×4096 server render.</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={state.status === 'loading'}
            className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {state.status === 'loading' ? 'Exporting…' : `Download ${format.toUpperCase()}`}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2" role="group" aria-label="Export format">
            {supportedFormats.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setFormat(candidate)}
                aria-pressed={format === candidate}
                className={`text-xs px-3 py-1 rounded border transition-colors duration-150 ${
                  format === candidate
                    ? 'border-[var(--color-accent)] text-[var(--foreground)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {candidate.toUpperCase()}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={frame}
              onChange={(e) => setFrame(e.target.checked)}
            />
            Include export frame
          </label>
        </div>

        {state.status === 'success' && state.message && (
          <p className="mt-2 text-xs text-muted-foreground">{state.message}</p>
        )}
        {state.status === 'error' && state.message && (
          <p className="mt-2 text-xs text-destructive" role="alert">{state.message}</p>
        )}
      </div>
    </div>
  );
}
