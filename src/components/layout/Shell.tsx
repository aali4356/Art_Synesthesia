import type { ReactNode } from 'react';
import { Header, type ShellRouteFamily } from './Header';
import { SkipLink } from './SkipLink';

interface ShellProps {
  children: ReactNode;
  currentRoute?: ShellRouteFamily;
}

const MAIN_CONTENT_ID = 'shell-main-content';

export function Shell({ children, currentRoute = 'detail' }: ShellProps) {
  return (
    <div className="editorial-shell min-h-screen flex flex-col">
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <div className="editorial-shell__ambient" aria-hidden="true" />
      <Header currentRoute={currentRoute} />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 gallery-padding relative">
        <div className="mx-auto max-w-7xl w-full">{children}</div>
      </main>
    </div>
  );
}
