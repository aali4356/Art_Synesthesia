# T04: 01-foundation-determinism-infrastructure 04

**Slice:** S01 — **Milestone:** M001

## Description

Implement the design system foundation: dark/light mode with next-themes, responsive layout shell, OKLCH color tokens, and the gallery-inspired visual aesthetic. This plan establishes the visual language that all subsequent UI work builds upon.

Purpose: The design system defines how the app looks and feels. User locked decisions require a gallery/museum aesthetic with near-black dark mode, Geist fonts, violet accent, and minimal chrome. This plan implements all of those decisions.
Output: ThemeProvider, ThemeToggle, responsive Shell, and CSS custom properties with OKLCH color palette.

## Must-Haves

- [ ] "App renders in dark mode by default with near-black background (#0a0a0a)"
- [ ] "User can toggle between dark and light mode"
- [ ] "System color preference is detected on first visit"
- [ ] "User's theme preference persists across sessions via localStorage"
- [ ] "Geist Sans is used for all UI text, Geist Mono for technical elements"
- [ ] "Layout is responsive: stacks vertically on mobile"
- [ ] "Minimal chrome: no visible borders or shadows on containers"
- [ ] "Violet accent color is defined in OKLCH and used for interactive elements"

## Files

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/theme/ThemeProvider.tsx`
- `src/components/theme/ThemeToggle.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Shell.tsx`
- `src/__tests__/components/ThemeToggle.test.tsx`
