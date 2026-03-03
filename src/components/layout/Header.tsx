import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="text-sm font-light tracking-widest uppercase text-muted">
        Synesthesia Machine
      </span>
      <ThemeToggle />
    </header>
  );
}
