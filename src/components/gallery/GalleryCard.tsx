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

  // Check ownership client-side (creator token in localStorage)
  useEffect(() => {
    const token = getCreatorToken();
    if (token && creatorToken && token === creatorToken) {
      setIsOwner(true);
    }
    // Check if already upvoted
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
    <div className="border border-border rounded-xl overflow-hidden bg-background hover:border-accent/60 transition-colors">
      {/* Thumbnail — links to detail page (GAL-06) */}
      <Link href={`/gallery/${id}`} aria-label={`View ${title ?? styleName} artwork`}>
        <div className="w-full aspect-square bg-muted flex items-center justify-center">
          {thumbnailData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailData}
              alt={title ?? `${styleName} artwork`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-xs">No preview</span>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="p-3">
        {/* Title and style */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            {title && (
              <p className="text-sm font-medium leading-snug truncate">{title}</p>
            )}
            <p className="text-xs text-muted-foreground capitalize">{styleName}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formattedDate}</span>
        </div>

        {/* Input preview — hidden by default (GAL-04) */}
        {inputPreview && (
          <div className="mt-2">
            {previewRevealed ? (
              <p className="text-xs text-muted-foreground italic">&quot;{inputPreview}&quot;</p>
            ) : (
              <button
                type="button"
                onClick={() => setPreviewRevealed(true)}
                className="text-xs text-accent underline"
                aria-label="Reveal input preview"
              >
                Click to reveal hint
              </button>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
          {/* Upvote */}
          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoted}
            className="text-xs text-muted-foreground flex items-center gap-1 disabled:opacity-50"
            aria-label={upvoted ? 'Already upvoted' : 'Upvote this artwork'}
          >
            <span aria-hidden="true">{upvoted ? '♥' : '♡'}</span>
            <span>{upvoteCount}</span>
          </button>

          {/* Report (GAL-07) */}
          {!reported ? (
            <button
              type="button"
              onClick={handleReport}
              disabled={reporting}
              className="text-xs text-muted-foreground ml-auto hover:text-red-500"
              aria-label="Report this artwork"
            >
              {reporting ? 'Reporting…' : 'Report'}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground ml-auto">Reported</span>
          )}

          {/* Delete — owner only (GAL-08) */}
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-red-500 hover:underline"
              aria-label="Delete your gallery entry"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
