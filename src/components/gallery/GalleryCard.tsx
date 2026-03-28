'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCreatorToken } from '@/lib/gallery/creator-token';

interface GalleryCardProps {
  id: string;
  styleName: string;
  title: string | null;
  inputPreview: string | null;
  thumbnailData: string | null;
  creatorToken: string | null;
  createdAt: string;
  upvoteCount: number;
  reportCount: number;
}

/**
 * GalleryCard — displays one gallery entry in the browse grid.
 *
 * GAL-03: Shows thumbnail, style name, date, optional title.
 * GAL-04: Input preview hidden by default, revealed on button click.
 * GAL-07: Report button calls /api/moderation/report.
 * GAL-08: Delete button shown when localStorage creator token matches.
 */
export function GalleryCard({
  id,
  styleName,
  title,
  inputPreview,
  thumbnailData,
  creatorToken,
  createdAt,
  upvoteCount: initialUpvoteCount,
}: GalleryCardProps) {
  const [previewRevealed, setPreviewRevealed] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount);
  const [upvoted, setUpvoted] = useState(false);

  useEffect(() => {
    const token = getCreatorToken();
    if (token && creatorToken && token === creatorToken) {
      setIsOwner(true);
    }
    const upvotedIds = JSON.parse(localStorage.getItem('synesthesia-upvoted') ?? '[]') as string[];
    if (upvotedIds.includes(id)) {
      setUpvoted(true);
    }
  }, [id, creatorToken]);

  async function handleReport() {
    setReporting(true);
    await fetch('/api/moderation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: id }),
    });
    setReported(true);
    setReporting(false);
  }

  async function handleDelete() {
    const token = getCreatorToken();
    if (!token) return;
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'x-creator-token': token },
    });
    if (res.ok) setDeleted(true);
  }

  async function handleUpvote() {
    if (upvoted) return;
    const res = await fetch(`/api/gallery/${id}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json() as { upvoteCount: number };
      setUpvoteCount(data.upvoteCount);
      setUpvoted(true);
      const upvotedIds = JSON.parse(localStorage.getItem('synesthesia-upvoted') ?? '[]') as string[];
      localStorage.setItem('synesthesia-upvoted', JSON.stringify([...upvotedIds, id]));
    }
  }

  if (deleted) return null;

  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      className="gallery-collector-card"
      data-testid="gallery-collector-card"
      aria-label={`${title ?? styleName} collector card`}
    >
      <div className="gallery-collector-card__ambient" aria-hidden="true" />

      <div className="gallery-collector-card__content">
        <header className="gallery-collector-card__header">
          <div>
            <p className="gallery-collector-card__eyebrow">Collector edition</p>
            <div className="gallery-collector-card__headline">
              <h3 className="gallery-collector-card__title">
                {title ?? `${styleName} study`}
              </h3>
              <p className="gallery-collector-card__style">{styleName}</p>
            </div>
          </div>
          <div className="gallery-collector-card__meta" aria-label="Edition metadata">
            <span className="gallery-collector-card__meta-label">Published</span>
            <span className="gallery-collector-card__meta-value">{formattedDate}</span>
          </div>
        </header>

        <Link
          href={`/gallery/${id}`}
          aria-label={`View ${title ?? styleName} artwork`}
          className="gallery-collector-card__media-link"
        >
          <div className="gallery-collector-card__media-frame">
            {thumbnailData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailData}
                alt={title ?? `${styleName} artwork`}
                className="gallery-collector-card__image"
              />
            ) : (
              <div className="gallery-collector-card__empty-state">
                <span className="gallery-collector-card__empty-kicker">Preview pending</span>
                <span className="gallery-collector-card__empty-copy">No archived thumbnail available yet.</span>
              </div>
            )}
          </div>
        </Link>

        <section className="gallery-collector-card__hint" aria-label="Gallery hint">
          <div>
            <p className="gallery-collector-card__section-label">Optional hint</p>
            <p className="gallery-collector-card__section-copy">
              Collector browse keeps hints concealed unless you intentionally reveal the contributor-approved excerpt.
            </p>
          </div>
          {inputPreview ? (
            previewRevealed ? (
              <p className="gallery-collector-card__hint-copy">&quot;{inputPreview}&quot;</p>
            ) : (
              <button
                type="button"
                onClick={() => setPreviewRevealed(true)}
                className="gallery-collector-card__hint-button"
                aria-label="Reveal input preview"
              >
                Reveal optional hint
              </button>
            )
          ) : (
            <p className="gallery-collector-card__hint-state">No public hint attached to this edition.</p>
          )}
        </section>

        <footer className="gallery-collector-card__footer">
          <div className="gallery-collector-card__action-row" aria-label="Edition actions">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoted}
              className="gallery-collector-card__action-button"
              aria-label={upvoted ? 'Already upvoted' : 'Upvote this artwork'}
            >
              <span aria-hidden="true">{upvoted ? '♥' : '♡'}</span>
              <span>{upvoteCount} {upvoteCount === 1 ? 'vote' : 'votes'}</span>
            </button>

            <Link
              href={`/gallery/${id}`}
              className="gallery-collector-card__detail-link"
              aria-label={`Open collector detail for ${title ?? styleName}`}
            >
              Open detail
            </Link>

            {!reported ? (
              <button
                type="button"
                onClick={handleReport}
                disabled={reporting}
                className="gallery-collector-card__text-action gallery-collector-card__text-action--danger"
                aria-label="Report this artwork"
              >
                {reporting ? 'Reporting…' : 'Report'}
              </button>
            ) : (
              <span className="gallery-collector-card__status">Reported</span>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                className="gallery-collector-card__text-action gallery-collector-card__text-action--delete"
                aria-label="Delete your gallery entry"
              >
                Delete
              </button>
            )}
          </div>

          <div className="gallery-collector-card__footer-note">
            <span className="gallery-collector-card__section-label">Browse contract</span>
            <p>
              Public archive card with route-safe detail access, lightweight reactions, and no raw input exposure.
            </p>
          </div>
        </footer>
      </div>
    </article>
  );
}
