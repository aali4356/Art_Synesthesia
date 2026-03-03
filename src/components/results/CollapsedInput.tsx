'use client';

import { useState, useCallback } from 'react';

interface CollapsedInputProps {
  text: string;
  onRegenerate: (text: string) => void;
}

export function CollapsedInput({ text, onRegenerate }: CollapsedInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleExpand = useCallback(() => {
    setEditText(text);
    setExpanded(true);
  }, [text]);

  const handleRegenerate = useCallback(() => {
    setExpanded(false);
    onRegenerate(editText);
  }, [editText, onRegenerate]);

  const handleCancel = useCallback(() => {
    setExpanded(false);
  }, []);

  if (expanded) {
    return (
      <div className="border-b border-[var(--border)] p-3">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full min-h-[80px] bg-transparent outline-none resize-none text-sm leading-relaxed p-2 border border-[var(--border)] rounded-md"
          aria-label="Edit text for regeneration"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleRegenerate}
            disabled={editText.trim().length === 0}
            className="btn-accent text-sm px-3 py-1"
          >
            Regenerate
          </button>
          <button onClick={handleCancel} className="btn-ghost text-sm px-3 py-1">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const preview = text.length > 80 ? text.slice(0, 80) + '...' : text;

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
      <span className="font-mono text-sm text-[var(--muted-foreground)] truncate flex-1 mr-4">
        {preview}
      </span>
      <button
        onClick={handleExpand}
        className="btn-ghost text-sm whitespace-nowrap"
      >
        Edit &amp; Regenerate
      </button>
    </div>
  );
}
