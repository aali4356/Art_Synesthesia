'use client';

import { useRef } from 'react';

export type TabKey = 'text' | 'url' | 'data';

const TABS: { key: TabKey; label: string; disabled: boolean }[] = [
  { key: 'text', label: 'Text', disabled: false },
  { key: 'url', label: 'URL', disabled: false },
  { key: 'data', label: 'Data', disabled: false },
];

interface InputTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabIdPrefix: string;
  panelIdPrefix: string;
}

export function InputTabs({ activeTab, onTabChange, tabIdPrefix, panelIdPrefix }: InputTabsProps) {
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    text: null,
    url: null,
    data: null,
  });

  const focusTab = (tab: TabKey) => {
    const nextTab = TABS.find((candidate) => candidate.key === tab && !candidate.disabled);
    if (!nextTab) {
      return;
    }

    onTabChange(nextTab.key);
    tabRefs.current[nextTab.key]?.focus();
  };

  const getNextEnabledTab = (currentTab: TabKey, direction: 'next' | 'previous') => {
    const enabledTabs = TABS.filter((tab) => !tab.disabled);
    const currentIndex = enabledTabs.findIndex((tab) => tab.key === currentTab);

    if (currentIndex === -1) {
      return enabledTabs[0]?.key;
    }

    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + enabledTabs.length) % enabledTabs.length;
    return enabledTabs[nextIndex]?.key;
  };

  return (
    <div className="flex gap-6 border-b border-[var(--border)]" role="tablist" aria-label="Choose an input source">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <button
            key={tab.key}
            ref={(node) => {
              tabRefs.current[tab.key] = node;
            }}
            id={`${tabIdPrefix}-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${panelIdPrefix}-${tab.key}`}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={tab.disabled ? undefined : () => onTabChange(tab.key)}
            onKeyDown={(event) => {
              if (tab.disabled) {
                return;
              }

              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                const nextTab = getNextEnabledTab(tab.key, 'next');
                if (nextTab) {
                  focusTab(nextTab);
                }
              }

              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                const previousTab = getNextEnabledTab(tab.key, 'previous');
                if (previousTab) {
                  focusTab(previousTab);
                }
              }

              if (event.key === 'Home') {
                event.preventDefault();
                focusTab('text');
              }

              if (event.key === 'End') {
                event.preventDefault();
                focusTab('data');
              }
            }}
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
