'use client';

interface GenerateButtonProps {
  onGenerate: () => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  disabled?: boolean;
}

export function GenerateButton({
  onGenerate,
  isPrivate,
  onTogglePrivate,
  disabled,
}: GenerateButtonProps) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <button
        onClick={onGenerate}
        disabled={disabled}
        className={`
          btn-accent active:scale-95 transition-transform
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        Generate
      </button>

      <button
        onClick={onTogglePrivate}
        aria-label="Toggle private mode"
        aria-pressed={isPrivate}
        className="btn-ghost p-2"
      >
        {isPrivate ? (
          // Lock icon
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="8"
              width="10"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M6 8V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5V8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Unlock icon
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="8"
              width="10"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M6 8V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
