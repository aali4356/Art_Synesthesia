import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export type ShellRouteFamily = 'home' | 'compare' | 'gallery' | 'detail';

interface HeaderProps {
  currentRoute?: ShellRouteFamily;
}

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  match: ShellRouteFamily;
}> = [
  {
    href: '/',
    label: 'Home / Recent local work',
    match: 'home',
  },
  {
    href: '/compare',
    label: 'Compare',
    match: 'compare',
  },
  {
    href: '/gallery',
    label: 'Gallery',
    match: 'gallery',
  },
];

export function Header({ currentRoute = 'detail' }: HeaderProps) {
  return (
    <header className="relative z-10 border-b border-[var(--border-soft)] bg-[var(--surface-veil)]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <span className="editorial-kicker">Editorial visual engine</span>
            <span className="text-sm uppercase tracking-[0.32em] text-[var(--foreground)]/88">
              Synesthesia Machine
            </span>
          </div>

          <div className="flex items-start gap-3 self-start lg:self-center">
            <div className="hidden max-w-sm text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Browser-local continuity
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Recent local work stays private to this browser on Home. Compare and Gallery are public route surfaces, not browser-local recall.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-3 border-t border-[var(--border-soft)]/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap items-center gap-2 sm:gap-3">
            {NAV_ITEMS.map((item) => {
              const isCurrent = currentRoute === item.match;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`btn-ghost text-sm ${isCurrent ? 'border-[var(--foreground)]/25 bg-[var(--foreground)]/8 text-[var(--foreground)]' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="max-w-xl text-xs leading-relaxed text-[var(--muted-foreground)]">
            Route discovery stays public and shareable here, while recent local work remains a browser-local privacy boundary on the homepage only.
          </p>
        </nav>
      </div>
    </header>
  );
}
