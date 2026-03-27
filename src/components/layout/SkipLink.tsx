'use client';

import type { MouseEvent } from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const main = document.getElementById(targetId);
    if (main instanceof HTMLElement) {
      main.focus();
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="absolute left-4 top-4 z-50 -translate-y-24 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-soft)] transition-transform duration-150 focus:translate-y-0 focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
