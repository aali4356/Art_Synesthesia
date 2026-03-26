'use client';

import type { RecentWorkRecord } from '@/lib/continuity/types';

interface RecentLocalWorkPanelProps {
  items: RecentWorkRecord[];
  isLoaded: boolean;
  onResume: (id: string) => void;
}

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'recently';

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 1) return 'just now';
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, 'day');

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, 'month');

  const diffYears = Math.round(diffMonths / 12);
  return formatter.format(diffYears, 'year');
}

function formatStyleLabel(style: RecentWorkRecord['preferredStyle']): string {
  return style.charAt(0).toUpperCase() + style.slice(1);
}

export function RecentLocalWorkPanel({ items, isLoaded, onResume }: RecentLocalWorkPanelProps) {
  return (
    <section className="continuity-panel" aria-labelledby="recent-local-work-heading">
      <div className="continuity-panel__header">
        <div>
          <p className="editorial-note-label mb-1">Recent local work</p>
          <h2 id="recent-local-work-heading" className="text-xl sm:text-2xl font-medium text-[var(--foreground)]">
            Reopen private browser-local editions from this device.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)] leading-relaxed">
            Private-first browser-local continuity for this device only. Share links are public parameter-only routes, and Gallery saves are public opt-in editions.
          </p>
        </div>
        <div className="editorial-chip">same-browser recall only</div>
      </div>

      {items.length === 0 ? (
        <div className="continuity-empty-state" role="status" aria-live="polite">
          <div className="continuity-empty-state__copy">
            <p className="editorial-note-label mb-1">Continuity standby</p>
            <h3 className="text-lg font-medium text-[var(--foreground)]">
              {isLoaded ? 'No recent local work saved in this browser yet.' : 'Loading recent local work…'}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Generate an edition, then use the browser-local save action on the results surface to keep a private recall point here.
            </p>
          </div>
          <div className="continuity-empty-state__meta">
            <span className="editorial-chip">private-first</span>
            <span className="editorial-chip">no raw source stored</span>
          </div>
        </div>
      ) : (
        <div className="continuity-list" role="list" aria-label="Recent local work items">
          {items.map((item) => (
            <article key={item.id} className="continuity-card" role="listitem">
              <div className="continuity-card__header">
                <div>
                  <p className="editorial-note-label mb-1">{item.sourceLabel.primary}</p>
                  <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)]">
                    {item.sourceLabel.secondary}
                  </h3>
                </div>
                <div className="editorial-chip-stack" aria-label="Recent local work metadata">
                  <span className="editorial-chip">{formatStyleLabel(item.preferredStyle)} style</span>
                  <span className="editorial-chip">palette · {item.edition.palette.familyId}</span>
                </div>
              </div>

              <dl className="continuity-card__meta">
                <div>
                  <dt>Saved</dt>
                  <dd>
                    <time dateTime={item.savedAt}>{formatRelativeTime(item.savedAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt>Last opened</dt>
                  <dd>
                    <time dateTime={item.lastOpenedAt}>{formatRelativeTime(item.lastOpenedAt)}</time>
                  </dd>
                </div>
              </dl>

              <div className="continuity-card__footer">
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Resume from private browser-local continuity only. The original raw source was not stored or published.
                </p>
                <button
                  type="button"
                  onClick={() => onResume(item.id)}
                  className="btn-accent text-sm"
                >
                  Resume in results
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
