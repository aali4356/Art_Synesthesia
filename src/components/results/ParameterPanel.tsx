'use client';

import { useState } from 'react';
import type { ParameterVector, ParameterProvenance, VersionInfo } from '@/types/engine';
import { getVersionString } from '@/lib/engine/version';

// ---------------------------------------------------------------------------
// Parameter groupings (museum-exhibit style)
// ---------------------------------------------------------------------------

const PARAMETER_GROUPS = [
  {
    label: 'Composition',
    params: ['complexity', 'density', 'layering', 'regularity'] as const,
  },
  {
    label: 'Form',
    params: ['symmetry', 'curvature', 'scaleVariation', 'texture'] as const,
  },
  {
    label: 'Expression',
    params: ['warmth', 'energy', 'rhythm', 'directionality'] as const,
  },
  {
    label: 'Color',
    params: ['saturation', 'contrast', 'paletteSize'] as const,
  },
];

// ---------------------------------------------------------------------------
// Format parameter name for display
// ---------------------------------------------------------------------------

function formatName(param: string): string {
  return param.replace(/([A-Z])/g, ' $1').toLowerCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ParameterPanelProps {
  vector: ParameterVector;
  provenance: ParameterProvenance[];
  summaries: Record<string, string>;
  version: VersionInfo;
}

export function ParameterPanel({
  vector,
  provenance,
  summaries,
  version,
}: ParameterPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);

  // Build provenance lookup
  const provenanceMap: Record<string, ParameterProvenance> = {};
  for (const p of provenance) {
    provenanceMap[p.parameter] = p;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-light tracking-wide text-[var(--muted-foreground)] uppercase">
          Parameters
        </h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost text-xs"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Parameter groups */}
      {PARAMETER_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <h3 className="text-xs font-light tracking-widest uppercase text-[var(--muted-foreground)] mb-3">
            {group.label}
          </h3>

          <div className="space-y-3">
            {group.params.map((param) => {
              const value = vector[param] as number;
              const summary = summaries[param];
              const prov = provenanceMap[param];
              const isExpanded = expandedParam === param;

              return (
                <div key={param}>
                  {/* Bar row */}
                  <button
                    onClick={() => {
                      if (showDetails) {
                        setExpandedParam(isExpanded ? null : param);
                      }
                    }}
                    className={`w-full text-left ${showDetails ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-expanded={showDetails ? isExpanded : undefined}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-[var(--foreground)]">
                        {formatName(param)}
                      </span>
                      <span className="font-mono text-xs text-[var(--muted-foreground)]">
                        {value.toFixed(2)}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(1, value * 100)}%`,
                          backgroundColor: 'var(--color-accent)',
                        }}
                      />
                    </div>
                  </button>

                  {/* Summary */}
                  {summary && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                      {summary}
                    </p>
                  )}

                  {/* Expanded provenance details */}
                  {showDetails && isExpanded && prov && (
                    <div className="mt-2 ml-2 pl-3 border-l border-[var(--border)] space-y-1">
                      {prov.contributors
                        .slice()
                        .sort((a, b) => b.weight - a.weight)
                        .map((c, ci) => (
                          <div key={ci} className="text-xs text-[var(--muted-foreground)]">
                            <span className="font-mono">{c.signal}</span>
                            <span className="mx-1">w={c.weight.toFixed(2)}</span>
                            <span className="opacity-60">raw={c.rawValue.toFixed(3)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Version footer */}
      <div className="pt-4 border-t border-[var(--border)]">
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {getVersionString(version)}
        </span>
      </div>
    </div>
  );
}
