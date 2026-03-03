'use client';

type TabKey = 'text' | 'url' | 'data';

const TABS: { key: TabKey; label: string; disabled: boolean }[] = [
  { key: 'text', label: 'Text', disabled: false },
  { key: 'url', label: 'URL', disabled: true },
  { key: 'data', label: 'Data', disabled: true },
];

interface InputTabsProps {
  activeTab: TabKey;
}

export function InputTabs({ activeTab }: InputTabsProps) {
  return (
    <div className="flex gap-6 border-b border-[var(--border)]" role="tablist">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            className={`
              relative pb-2 text-sm font-sans transition-colors duration-150
              ${isActive
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]'}
              ${tab.disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer hover:text-[var(--foreground)]'}
            `}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
