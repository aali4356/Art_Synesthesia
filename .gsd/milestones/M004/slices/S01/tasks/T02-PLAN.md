---
estimated_steps: 15
estimated_files: 6
skills_used: []
---

# T02: Wire results save and homepage resume around recent local work

## Why
This task closes the core user-facing loop for R008: a generated edition must be intentionally kept in the current browser, survive a refresh/return, and reopen from a visible continuity surface rather than disappearing between sessions.

## Steps
1. Add a results-surface action that saves the current edition family into recent local work with clear browser-local/private-first copy and a visible saved state.
2. Add homepage continuity UI that reads recent local work on load, shows freshness/context labels, and exposes an intentional reopen/resume action for each saved item.
3. Plumb page state so reopening a saved local item restores the results view with the stored parameter-safe payload and preferred style, without requiring the original raw source.
4. Add branded empty/fallback handling so first-time users still see the current homepage, while returning users see continuity cues without route-discovery guesswork.
5. Add RTL coverage for save, reload-like rehydration, and resume behavior through the real `Home`/`ResultsView` relationship.

## Must-Haves
- The save action is visibly distinct from Share and Save to Gallery.
- Reopening recent local work restores a usable results surface from browser-local data only.
- Returning users can find recent local work from the homepage without needing to rediscover a route.

## Done when
- A user can save from results, revisit/refresh, and intentionally reopen recent local work from a visible homepage continuity surface.
- The continuity panel and results state both behave correctly when no recent items exist.

## Inputs

- ``src/app/page.tsx``
- ``src/components/results/ResultsView.tsx``
- ``src/hooks/useTextAnalysis.ts``
- ``src/hooks/useUrlAnalysis.ts``
- ``src/hooks/useDataAnalysis.ts``
- ``src/lib/continuity/recent-work.ts``
- ``src/lib/continuity/types.ts``

## Expected Output

- ``src/app/page.tsx``
- ``src/components/results/ResultsView.tsx``
- ``src/components/continuity/RecentLocalWorkPanel.tsx``
- ``src/hooks/useRecentWorks.ts``
- ``src/app/globals.css``
- ``src/__tests__/app/anonymous-continuity.test.tsx``

## Verification

npm test -- --run src/__tests__/app/anonymous-continuity.test.tsx

## Observability Impact

- Signals added/changed: visible local-save confirmation, recent-item freshness metadata, and branded empty/fallback continuity states.
- How a future agent inspects this: load the homepage in the browser after saving an edition, or run `npm test -- --run src/__tests__/app/anonymous-continuity.test.tsx`.
- Failure state exposed: unavailable/corrupt recent-work data yields an empty continuity panel state instead of hidden or broken resume actions.
