'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { captureClientEvent } from '@/lib/observability/client';
import {
  OBSERVABILITY_EVENTS,
  buildPublicActionEventProperties,
  getStatusBucket,
  type StatusBucket,
} from '@/lib/observability/events';
import { classifyObservabilityError } from '@/lib/observability/privacy';
import type { ParameterVector, VersionInfo } from '@/types/engine';
import { getOrCreateCreatorToken } from '@/lib/gallery/creator-token';

interface GallerySaveModalProps {
  parameterVector: ParameterVector;
  versionInfo: VersionInfo;
  styleName: string;
  continuityMode?: 'fresh' | 'resumed';
  /** First 50 chars of user input — provided by ResultsView. NOT sent to server. */
  inputTextPreview: string;
  /** Base64 data URL captured from current canvas */
  thumbnailDataUrl: string;
  /** Explicit opener element from the trigger button for deterministic focus restoration. */
  openerElement?: HTMLElement | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const MAX_PREVIEW_CHARS = 50;
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function captureGalleryEvent(
  eventName: string,
  properties: Record<string, unknown>,
) {
  try {
    captureClientEvent(eventName as Parameters<typeof captureClientEvent>[0], properties);
  } catch {
    // Observability is non-blocking by contract.
  }
}

function classifyResponseFailure(statusBucket: StatusBucket, hasBody: boolean): string {
  if (statusBucket === '4xx') {
    return hasBody ? 'invalid-request' : 'malformed-payload';
  }

  if (statusBucket === '5xx') {
    return 'gallery-backend-unavailable';
  }

  return hasBody ? 'request-failed' : 'malformed-payload';
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute('disabled')) {
      return false;
    }

    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return true;
  });
}

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
  continuityMode = 'fresh',
  inputTextPreview,
  thumbnailDataUrl,
  openerElement,
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

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isMountedRef = useRef(false);

  const titleId = useId();
  const descriptionId = useId();
  const previewStatusId = useId();
  const errorId = useId();
  const dialogDescriptionIds = [descriptionId, previewStatusId, error ? errorId : null].filter(Boolean).join(' ');

  const restoreFocusToOpener = useCallback(() => {
    const opener = openerRef.current;

    if (!opener || !opener.isConnected) {
      return;
    }

    opener.focus();
  }, []);

  const handleRequestClose = useCallback(() => {
    onClose();

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        restoreFocusToOpener();
      });
      return;
    }

    restoreFocusToOpener();
  }, [onClose, restoreFocusToOpener]);

  useEffect(() => {
    isMountedRef.current = true;
    openerRef.current = openerElement ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    const initialFocusTarget = titleInputRef.current ?? closeButtonRef.current ?? dialogRef.current;
    initialFocusTarget?.focus();

    return () => {
      isMountedRef.current = false;
    };
  }, [openerElement]);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleRequestClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (event.shiftKey) {
      if (!activeElement || activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (!activeElement || activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

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

    captureGalleryEvent(
      OBSERVABILITY_EVENTS.publicActions.gallerySaveRequested,
      buildPublicActionEventProperties({
        routeFamily: 'gallery',
        publicMode: 'gallery-save',
        continuityMode,
        styleName,
        action: 'requested',
        includePreview,
      }),
    );

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { saved?: boolean; id?: string; error?: string } | null;

      if (!isMountedRef.current) {
        return;
      }

      if (!response.ok || !data?.saved || !data.id) {
        setError(data?.error ?? 'Save failed. Please try again.');
        setSaving(false);
        const statusBucket = response.ok ? '2xx' : getStatusBucket(response.status);
        captureGalleryEvent(
          OBSERVABILITY_EVENTS.publicActions.gallerySaveFailed,
          buildPublicActionEventProperties({
            routeFamily: 'gallery',
            publicMode: 'gallery-save',
            continuityMode,
            styleName,
            action: 'failed',
            includePreview,
            statusBucket,
            failureCategory: response.ok
              ? 'malformed-payload'
              : classifyResponseFailure(statusBucket, Boolean(data)),
          }),
        );
        return;
      }

      captureGalleryEvent(
        OBSERVABILITY_EVENTS.publicActions.gallerySaveCompleted,
        buildPublicActionEventProperties({
          routeFamily: 'gallery',
          publicMode: 'gallery-save',
          continuityMode,
          styleName,
          action: 'completed',
          includePreview,
          statusBucket: '2xx',
        }),
      );
      onSaved(data.id);
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return;
      }

      setError('Network error. Please try again.');
      setSaving(false);
      const category = classifyObservabilityError(caughtError);
      captureGalleryEvent(
        OBSERVABILITY_EVENTS.publicActions.gallerySaveFailed,
        buildPublicActionEventProperties({
          routeFamily: 'gallery',
          publicMode: 'gallery-save',
          continuityMode,
          styleName,
          action: 'failed',
          includePreview,
          statusBucket: category === 'timeout' ? 'timeout' : 'network',
          failureCategory: category,
        }),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={dialogDescriptionIds}
      onKeyDown={handleDialogKeyDown}
    >
      <div
        ref={dialogRef}
        className="editorial-modal-shell max-h-[90vh] w-full max-w-xl overflow-y-auto"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="editorial-note-label mb-1">Gallery save</p>
            <h2 id={titleId} className="editorial-display text-3xl leading-[0.95]">Save a public gallery edition</h2>
            <p id={descriptionId} className="mt-2 text-sm text-[var(--muted-foreground)] max-w-lg leading-relaxed">
              Preview exactly what will move from your private results desk into the public gallery edition. Recent local work stays browser-local, while share links remain separate public parameter-only routes.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleRequestClose}
            className="btn-ghost text-sm"
            aria-label="Close gallery save dialog"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
          <div className="editorial-action-card">
            <p className="editorial-note-label mb-2">Public preview</p>
            {thumbnailDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailDataUrl}
                alt="Artwork thumbnail preview"
                className="aspect-square w-full rounded-[1.25rem] border border-[var(--border-soft)] object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--border)] text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                preview unavailable
              </div>
            )}
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="editorial-note-label mb-1">Style</span>
                <p className="capitalize text-[var(--foreground)]">{styleName}</p>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Public gallery editions can include the artwork image, style, title, and an optional short input hint only.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="gallery-title" className="editorial-field-label">
                Title (optional)
              </label>
              <input
                ref={titleInputRef}
                id="gallery-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your artwork a name"
                className="editorial-input"
                maxLength={100}
              />
            </div>

            <div className="editorial-action-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="gallery-preview" className="editorial-field-label mb-0">
                  Input preview (optional)
                </label>
                <button
                  type="button"
                  onClick={() => setIncludePreview(!includePreview)}
                  className="btn-ghost text-sm"
                  aria-controls="gallery-preview"
                  aria-pressed={includePreview}
                >
                  {includePreview ? 'Remove' : 'Add back'}
                </button>
              </div>

              <div aria-live="polite" aria-atomic="true">
                {includePreview ? (
                  <div>
                    <input
                      id="gallery-preview"
                      type="text"
                      value={inputPreview}
                      onChange={(e) => setInputPreview(e.target.value.slice(0, MAX_PREVIEW_CHARS))}
                      placeholder="Short description (max 50 chars)"
                      className="editorial-input"
                      maxLength={MAX_PREVIEW_CHARS}
                    />
                    <p id={previewStatusId} className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed" role="status">
                      {inputPreview.length}/{MAX_PREVIEW_CHARS} chars — this is not your full input, only an optional public-facing hint for the gallery edition.
                    </p>
                  </div>
                ) : (
                  <p id={previewStatusId} className="text-xs italic text-[var(--muted-foreground)]" role="status">
                    No input preview will be shown.
                  </p>
                )}
              </div>
            </div>

            <div className="editorial-action-card">
              <p className="editorial-note-label mb-2">Privacy posture</p>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                <li>• This is a public opt-in gallery save, not a browser-local continuity action.</li>
                <li>• Raw source text is not sent with share/save metadata from this modal.</li>
                <li>• You control whether any short public input hint appears on the gallery card and detail viewer.</li>
                <li>• The saved page reflects the current collector edition, style, and render thumbnail only.</li>
              </ul>
            </div>

            {error && (
              <p id={errorId} className="text-sm text-[var(--color-accent)]" role="alert">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRequestClose}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-accent text-sm"
              >
                {saving ? 'Saving…' : 'Save to Gallery'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
