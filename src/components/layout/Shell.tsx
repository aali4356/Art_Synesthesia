import type { ReactNode } from 'react';
import { Header } from './Header';

interface ShellProps {
  children: ReactNode;
}

/**
 * Responsive layout shell.
 * Desktop: content centered with generous gallery whitespace.
 * Mobile: full width with stacked sections.
 * DS-04: Responsive breakpoints for input/canvas/panel layout.
 */
export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 gallery-padding">
        <div className="mx-auto max-w-6xl w-full">{children}</div>
      </main>
    </div>
  );
}
