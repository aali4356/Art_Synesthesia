import type { ReactNode } from 'react';
import { Header } from './Header';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="editorial-shell min-h-screen flex flex-col">
      <div className="editorial-shell__ambient" aria-hidden="true" />
      <Header />
      <main className="flex-1 gallery-padding relative">
        <div className="mx-auto max-w-7xl w-full">{children}</div>
      </main>
    </div>
  );
}
