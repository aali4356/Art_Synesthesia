---
phase: 01-foundation-determinism-infrastructure
plan: 04
subsystem: ui
tags: [next-themes, dark-mode, oklch, tailwind-v4, responsive, gallery-aesthetic, design-system]

# Dependency graph
requires:
  - phase: 01-01
    provides: Project scaffold, next-themes dependency, Geist fonts, Tailwind v4
provides:
  - ThemeProvider with dark default, system detection, localStorage persistence
  - ThemeToggle component (ghost-style, hydration-safe)
  - Responsive Shell layout with Header
  - OKLCH design tokens (violet accent, dark/light palettes)
  - Gallery-padding responsive utility
  - Ghost and accent button styles
affects: [03-02, 03-03, 04-02, 04-03, all-ui-phases]

# Tech tracking
tech-stack:
  added: [next-themes (class-based dark mode)]
  patterns: [OKLCH color space for perceptual uniformity, CSS custom properties for theme tokens, class-based dark mode via .dark selector]

key-files:
  created: [src/components/theme/ThemeProvider.tsx, src/components/theme/ThemeToggle.tsx, src/components/layout/Header.tsx, src/components/layout/Shell.tsx, src/__tests__/components/ThemeToggle.test.tsx]
  modified: [src/app/layout.tsx, src/app/page.tsx, src/app/globals.css]

key-decisions:
  - "Violet accent: oklch(0.65 0.25 285) — high chroma at 285 hue for vibrant purple"
  - "Dark mode background: oklch(0.09 0.005 250) approximating #0a0a0a per user requirement"
  - "ThemeProvider uses storageKey='synesthesia-theme' for namespaced localStorage"
  - "Gallery-padding scales from 2rem (mobile) to 4rem (desktop at 1024px)"
  - "No borders or shadows on containers (gallery aesthetic, user locked decision)"

patterns-established:
  - "Design tokens in @theme block using Tailwind v4 CSS-first config"
  - "Dark/light mode via CSS custom properties + .dark class selector"
  - "Hydration-safe client components: useState(false) + useEffect(() => setMounted(true))"
  - "Shell wraps all pages with Header + responsive main content area"
  - "Ghost buttons as default interactive style; accent for primary actions only"

requirements-completed: [DS-01, DS-02, DS-04]

# Metrics
duration: 10min
completed: 2026-03-02
---

# Plan 01-04: Design System Summary

**Gallery-aesthetic design system with OKLCH color tokens, dark/light mode via next-themes, and responsive Shell layout**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 8
- **Tests:** 3 new (74 total passing)

## Accomplishments
- ThemeProvider wrapping app with dark default, system preference detection, localStorage persistence
- ThemeToggle with ghost-style button, sun/moon SVG icons, hydration-safe rendering
- OKLCH design tokens: violet accent at oklch(0.65 0.25 285), near-black dark background, warm white light mode
- Responsive Shell layout: Header (logo + toggle) and gallery-padded main content area
- Gallery-style landing page with placeholder artwork area and tagline
- Custom utility classes: btn-ghost, btn-accent, gallery-padding, text-muted, bg-muted

## Task Commits

1. **Tasks 1-2: Full design system** - `134bba6` (feat)

## Files Created/Modified
- `src/components/theme/ThemeProvider.tsx` - next-themes wrapper with dark default and enableSystem
- `src/components/theme/ThemeToggle.tsx` - Ghost button with sun/moon icons, hydration-safe
- `src/components/layout/Header.tsx` - Minimal header with logo text and ThemeToggle
- `src/components/layout/Shell.tsx` - Responsive layout shell with gallery-padding
- `src/app/globals.css` - Full OKLCH design token system, dark/light mode, utility classes
- `src/app/layout.tsx` - Updated to wrap with ThemeProvider
- `src/app/page.tsx` - Updated to use Shell with gallery-style landing
- `src/__tests__/components/ThemeToggle.test.tsx` - Rendering and accessibility tests

## Decisions Made
- Used inline SVG for sun/moon icons to avoid icon library dependency
- max-w-6xl (1152px) for main content area width constraint
- min-h-[70vh] for landing content to create gallery-like vertical centering

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design system foundation established for all future UI work
- Shell layout ready for input zone (Phase 3), canvas (Phase 4), translation panel (Phase 4)
- Color tokens and button styles ready for interactive elements

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*
