'use client';

import { SURPRISE_PHRASES } from '@/data/surprise-phrases';

// ---------------------------------------------------------------------------
// Quick-start items
// ---------------------------------------------------------------------------

interface QuickStartItem {
  label: string;
  text: string | null; // null = "Surprise me" (random from pool)
  isSurprise?: boolean;
}

const QUICK_START_ITEMS: QuickStartItem[] = [
  { label: 'your name', text: 'Ada Lovelace' },
  {
    label: 'a haiku',
    text: 'An old silent pond\nA frog jumps into the pond\nSplash! Silence again',
  },
  {
    label: 'a recipe',
    text: 'Combine two cups of flour with a pinch of salt. Slowly add warm water, kneading until the dough is smooth and elastic. Let it rest for thirty minutes under a damp cloth.',
  },
  {
    label: 'a famous quote',
    text: 'We are all in the gutter, but some of us are looking at the stars.',
  },
  { label: 'Surprise me', text: null, isSurprise: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuickStartProps {
  onQuickStart: (text: string) => void;
  disabled?: boolean;
}

export function QuickStart({ onQuickStart, disabled }: QuickStartProps) {
  const handleClick = (item: QuickStartItem) => {
    if (disabled) return;

    if (item.text !== null) {
      onQuickStart(item.text);
    } else {
      // Surprise me: pick random from pool (Math.random is fine for UI randomness)
      const phrase =
        SURPRISE_PHRASES[Math.floor(Math.random() * SURPRISE_PHRASES.length)];
      onQuickStart(phrase);
    }
  };

  return (
    <div
      className={`
        flex flex-wrap items-center gap-2 pt-4
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <span className="text-sm font-light text-[var(--muted-foreground)]">
        Try:
      </span>

      {QUICK_START_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => handleClick(item)}
          disabled={disabled}
          className={`
            text-sm px-3 py-1.5 rounded-full transition-colors cursor-pointer
            ${item.isSurprise
              ? 'border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)]'
              : 'bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)]'}
          `}
        >
          {item.isSurprise && (
            <span className="mr-1" aria-hidden="true">
              &#9734;
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}
