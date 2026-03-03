'use client';

import type { PipelineStage } from '@/hooks/useTextAnalysis';

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'parsing', label: 'Parsing' },
  { key: 'analyzing', label: 'Analyzing' },
  { key: 'normalizing', label: 'Normalizing' },
  { key: 'rendering', label: 'Rendering' },
];

const STAGE_ORDER: Record<string, number> = {
  idle: -1,
  parsing: 0,
  analyzing: 1,
  normalizing: 2,
  rendering: 3,
  complete: 4,
};

interface PipelineProgressProps {
  currentStage: PipelineStage;
}

export function PipelineProgress({ currentStage }: PipelineProgressProps) {
  const currentIndex = STAGE_ORDER[currentStage] ?? -1;

  return (
    <div
      role="progressbar"
      aria-label="Generation progress"
      aria-valuenow={Math.max(0, Math.min(4, currentIndex + 1))}
      aria-valuemin={0}
      aria-valuemax={4}
      className="flex items-center justify-center gap-4 py-4"
    >
      {STAGES.map((stage, i) => {
        const isCompleted = currentIndex > i;
        const isActive = currentIndex === i;

        return (
          <div
            key={stage.key}
            className="flex items-center gap-2"
          >
            {/* Stage indicator */}
            <span
              className={`
                font-mono text-sm transition-colors duration-300
                ${isCompleted ? 'text-[var(--muted-foreground)]' : ''}
                ${isActive ? 'text-[var(--color-accent)] font-medium' : ''}
                ${!isCompleted && !isActive ? 'text-[var(--muted-foreground)] opacity-40' : ''}
              `}
            >
              {isCompleted ? (
                <span className="inline-flex items-center gap-1">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="inline"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {stage.label}
                </span>
              ) : (
                stage.label
              )}
            </span>

            {/* Connector line (between stages, not after last) */}
            {i < STAGES.length - 1 && (
              <span
                className={`
                  w-6 h-px
                  ${currentIndex > i ? 'bg-[var(--color-accent-muted)]' : 'bg-[var(--border)]'}
                  transition-colors duration-300
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
