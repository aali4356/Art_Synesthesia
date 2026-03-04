'use client';

/**
 * DataInput component for the Data tab.
 *
 * Renders a drag-and-drop file zone (accepts .csv and .json, max 5MB)
 * and a raw paste textarea for CSV or JSON data. File selection also
 * works via click-to-browse (hidden file input).
 */

import { useRef, useState } from 'react';

interface DataInputProps {
  data: string;
  onDataChange: (data: string, hint: 'csv' | 'json' | 'auto') => void;
  onAnalyze: () => void;
  disabled: boolean;
  error: string | null;
  formatHint: 'csv' | 'json' | 'auto';
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export function DataInput({
  data,
  onDataChange,
  onAnalyze,
  disabled,
  error,
  formatHint: _formatHint,
}: DataInputProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combined error: prop error takes precedence, local file error as fallback
  const displayError = error ?? fileError;

  function processFile(file: File) {
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File exceeds 5MB limit');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const hint: 'csv' | 'json' | 'auto' =
      extension === 'json' ? 'json' : extension === 'csv' ? 'csv' : 'auto';

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setFileName(file.name);
        onDataChange(text, hint);
      }
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setFileName(null);
    setFileError(null);
    onDataChange(e.target.value, 'auto');
  }

  const canAnalyze = !disabled && data.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a CSV or JSON file here, or click to browse"
        onClick={handleDropZoneClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleDropZoneClick();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed',
          'p-6 cursor-pointer transition-colors duration-150 select-none',
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
            : 'border-[var(--border)] hover:border-[var(--muted-foreground)]',
        ].join(' ')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-[var(--muted-foreground)]"
        >
          <path
            d="M12 16V4M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {fileName ? (
          <span className="text-sm text-[var(--foreground)] font-medium">{fileName}</span>
        ) : (
          <>
            <span className="text-sm text-[var(--muted-foreground)]">
              Drop a <span className="font-medium">.csv</span> or{' '}
              <span className="font-medium">.json</span> file here
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              or click to browse &mdash; max 5MB
            </span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-foreground)]">
          &mdash; or paste raw data below &mdash;
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Paste textarea */}
      <textarea
        value={data}
        onChange={handleTextareaChange}
        rows={6}
        disabled={disabled}
        placeholder="Paste CSV or JSON data here..."
        className={[
          'w-full rounded-lg border border-[var(--border)] bg-transparent',
          'px-4 py-3 text-sm font-mono text-[var(--foreground)] resize-y',
          'placeholder:text-[var(--muted-foreground)]',
          'focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]',
          'transition-colors duration-150',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
        aria-label="Paste CSV or JSON data"
      />

      {/* Error message */}
      {displayError && (
        <p role="alert" className="text-sm text-red-500">
          {displayError}
        </p>
      )}

      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        className={[
          'w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150',
          canAnalyze
            ? 'bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer'
            : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50',
        ].join(' ')}
      >
        Analyze
      </button>
    </div>
  );
}
