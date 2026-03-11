# T02: 04-geometric-renderer-canvas-ui 02

**Slice:** S04 — **Milestone:** M001

## Description

Create the React canvas component with progressive build animation, style selector with thumbnail previews, and integrate into the results layout replacing the placeholder canvas.

Purpose: This connects the pure-function geometric engine (Plan 01) to the user-visible canvas, delivering the core visual experience of the MVP. Users see their text transformed into geometric artwork with a satisfying progressive build animation.

Output: GeometricCanvas component with HiDPI support and animation, StyleSelector with active/locked states, updated ResultsView layout.

## Must-Haves

- [ ] "An 800x800 canvas renders geometric artwork on desktop, full-width on mobile"
- [ ] "Canvas builds progressively over 0.5-1 second with elements fading in from largest to smallest"
- [ ] "When prefers-reduced-motion is set, canvas renders complete artwork immediately with no animation"
- [ ] "Style selector shows Geometric as active with real thumbnail, and 3 locked placeholder styles"
- [ ] "Theme toggle instantly re-renders canvas with adjusted palette colors without replay animation"

## Files

- `src/components/results/GeometricCanvas.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/components/results/ResultsView.tsx`
- `src/hooks/useTextAnalysis.ts`
- `src/__tests__/components/GeometricCanvas.test.tsx`
- `src/__tests__/components/StyleSelector.test.tsx`
