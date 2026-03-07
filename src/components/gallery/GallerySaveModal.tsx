'use client';

import { useState } from 'react';
import type { ParameterVector, VersionInfo } from '@/types/engine';
import { getOrCreateCreatorToken } from '@/lib/gallery/creator-token';

interface GallerySaveModalProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  /** First 50 chars of user input — provided by ResultsView. NOT sent to server. */
  inputTextPreview: string;
  /** Base64 data URL captured from current canvas */
  thumbnailDataUrl: string;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const MAX_PREVIEW_CHARS = 50;

/**
 * GallerySaveModal — opt-in gallery save dialog (GAL-01, GAL-02).
 *
 * Shows a preview of what will be public and lets the user edit or remove
 * the input preview before confirming save.
 */
export function GallerySaveModal({
  parameterVector,
  versionInfo,
  styleName,
  inputTextPreview,
  thumbnailDataUrl,
  onClose,
  onSaved,
}: GallerySaveModalProps) {
  const [title, setTitle] = useState('');
  const [inputPreview, setInputPreview] = useState(
    inputTextPreview.slice(0, MAX_PREVIEW_CHARS)
  );
  const [includePreview, setIncludePreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const creatorToken = getOrCreateCreatorToken();
    const body: Record<string, unknown> = {
      parameterVector,
      versionInfo,
      styleName,
      thumbnailData: thumbnailDataUrl,
      creatorToken,
    };
    if (title.trim()) body.title = title.trim();
    if (includePreview && inputPreview.trim()) {
      body.inputPreview = inputPreview.trim().slice(0, MAX_PREVIEW_CHARS);
    }

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { saved?: boolean; id?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Save failed. Please try again.');
        setSaving(false);
        return;
      }
      onSaved(data.id!);
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Save to Gallery"
    >
      <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Save to Gallery</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Preview what will be publicly visible before saving.
        </p>

        {/* Thumbnail preview */}
        {thumbnailDataUrl && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailDataUrl}
              alt="Artwork thumbnail preview"
              className="w-24 h-24 object-cover rounded border border-border"
            />
          </div>
        )}

        {/* Style name (read-only) */}
        <div className="mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Style</span>
          <p className="font-mono text-sm capitalize">{styleName}</p>
        </div>

        {/* Title (optional) */}
        <div className="mb-3">
          <label htmlFor="gallery-title" className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
            Title (optional)
          </label>
          <input
            id="gallery-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your artwork a name"
            className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-accent"
            maxLength={100}
          />
        </div>

        {/* Input preview (editable, removable) — GAL-02 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="gallery-preview" className="text-xs text-muted-foreground uppercase tracking-wide">
              Input preview (optional)
            </label>
            <button
              type="button"
              onClick={() => setIncludePreview(!includePreview)}
              className="text-xs text-muted-foreground underline"
            >
              {includePreview ? 'Remove' : 'Add back'}
            </button>
          </div>
          {includePreview ? (
            <div>
              <input
                id="gallery-preview"
                type="text"
                value={inputPreview}
                onChange={(e) => setInputPreview(e.target.value.slice(0, MAX_PREVIEW_CHARS))}
                placeholder="Short description (max 50 chars)"
                className="w-full border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                maxLength={MAX_PREVIEW_CHARS}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {inputPreview.length}/{MAX_PREVIEW_CHARS} chars — this is NOT your full input, just a public hint
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No input preview will be shown</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mb-3" role="alert">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-ghost text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm"
          >
            {saving ? 'Saving…' : 'Save to Gallery'}
          </button>
        </div>
      </div>
    </div>
  );
}
