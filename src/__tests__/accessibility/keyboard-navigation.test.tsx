import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { InputZone } from '@/components/input/InputZone';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Toggle theme</button>,
}));

describe('keyboard navigation accessibility', () => {
  it('exposes a skip link that focuses the main content target', () => {
    render(
      <Shell currentRoute="home">
        <section>
          <h1>Desk</h1>
        </section>
      </Shell>,
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    const main = screen.getByRole('main');

    skipLink.focus();
    expect(document.activeElement).toBe(skipLink);
    expect(skipLink.getAttribute('href')).toBe('#shell-main-content');
    expect(main.getAttribute('id')).toBe('shell-main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(skipLink);

    expect(document.activeElement).toBe(main);
  });

  it('keeps the input switcher keyboard-usable with stable tab and panel semantics', () => {
    render(
      <InputZone
        text="Midnight brass"
        onTextChange={vi.fn()}
        onGenerate={vi.fn()}
        isPrivate
        onTogglePrivate={vi.fn()}
        isGenerating={false}
        url="https://example.com"
        onUrlChange={vi.fn()}
        onAnalyzeUrl={vi.fn()}
        isAnalyzingUrl={false}
        urlError={null}
        urlRemainingQuota={8}
        data="genre,tempo\njazz,132"
        onDataChange={vi.fn()}
        onAnalyzeData={vi.fn()}
        isAnalyzingData={false}
        dataError={null}
        dataFormatHint="csv"
        visitorMode="first-visit"
      />,
    );

    const textTab = screen.getByRole('tab', { name: 'Text' });
    const urlTab = screen.getByRole('tab', { name: 'URL' });
    const dataTab = screen.getByRole('tab', { name: 'Data' });

    expect(textTab.getAttribute('aria-selected')).toBe('true');
    expect(textTab.getAttribute('tabindex')).toBe('0');
    expect(urlTab.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('tabpanel', { name: 'Text' })).toBeDefined();

    textTab.focus();
    fireEvent.keyDown(textTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(urlTab);
    expect(urlTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'URL' })).toBeDefined();

    fireEvent.keyDown(urlTab, { key: 'End' });
    expect(document.activeElement).toBe(dataTab);
    expect(dataTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Data' })).toBeDefined();

    fireEvent.keyDown(dataTab, { key: 'Home' });
    expect(document.activeElement).toBe(textTab);
    expect(textTab.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(textTab, { key: 'Tab' });
    expect(textTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Text' })).toBeDefined();
  });
});
