import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Header() {
  return (
    <header className="relative z-10 border-b border-[var(--border-soft)] bg-[var(--surface-veil)]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-1">
          <span className="editorial-kicker">Editorial visual engine</span>
          <span className="text-sm uppercase tracking-[0.32em] text-[var(--foreground)]/88">
            Synesthesia Machine
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Private-first proofing
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Text, URL, and data enter the same gallery desk.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
