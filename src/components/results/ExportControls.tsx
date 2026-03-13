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
    <div className={`editorial-action-card ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="editorial-note-label mb-0">Export</p>
          <h3 className="text-base font-medium text-[var(--foreground)]">Download this collector edition.</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Export uses the same parameter-safe edition as the results desk: one 4096×4096 server render with the currently supported format options for this style.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={state.status === 'loading'}
          className="btn-accent text-sm disabled:opacity-50"
        >
          {state.status === 'loading' ? 'Exporting…' : `Download ${format.toUpperCase()}`}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Export format">
          {supportedFormats.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setFormat(candidate)}
              aria-pressed={format === candidate}
              className={`editorial-chip-button ${format === candidate ? 'is-active' : ''}`}
            >
              {candidate.toUpperCase()}
            </button>
          ))}
        </div>

        <label className="editorial-inline-toggle">
          <input
            type="checkbox"
            checked={frame}
            onChange={(e) => setFrame(e.target.checked)}
          />
          <span>Include export frame</span>
        </label>
      </div>

      <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
        Truth in export: this route currently ships 4096×4096 downloads only, and available formats depend on the active renderer family.
      </p>
      {state.status === 'success' && state.message && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">{state.message}</p>
      )}
      {state.status === 'error' && state.message && (
        <p className="mt-3 text-xs text-[var(--color-accent)]" role="alert">{state.message}</p>
      )}
    </div>
  );
}
