# S01: Anonymous-first continuity and return-user seam

**Goal:** Add an anonymous-first continuity seam that lets a returning visitor intentionally reopen recent local work from the real product UI, using browser-local persistence that is clearly separated from public share/gallery publishing and never stores raw source content.
**Demo:** After this: Generate an edition, save it into recent local work through the real product UI, refresh or return in the same browser, and intentionally reopen that work from a visible continuity surface that clearly distinguishes local continuity from public share/gallery persistence.

## Tasks
- [x] **T01: Added a privacy-safe recent-work continuity contract with deterministic local storage behavior and focused redaction/fallback tests.** — ## Why
The highest-risk part of this slice is the persistence contract itself. Executors need a stable, privacy-safe browser-local model before UI wiring begins, otherwise later resume work can accidentally persist raw source text or over-promise full session restoration.

## Steps
1. Add a dedicated recent-work storage module for browser-local continuity, with typed records for edition-family recall, preferred style, timestamps, and lightweight source labels that do not contain raw source content.
2. Cap and order the recent list deterministically, and make corrupt/missing storage recover to an empty state instead of throwing.
3. Encode the explicit continuity posture in the contract/comments: this restores a recent edition family in the same browser, not an exact pixel-identical session snapshot.
4. Add focused unit tests for save/list/read/remove behavior, redaction guarantees, storage cap behavior, and corrupt JSON fallback.

## Must-Haves
- No raw text input, raw URL, raw dataset body, or secret-bearing source material is written to browser storage.
- Stored records contain enough parameter-safe data to reopen a recent edition family from the homepage continuity surface.
- Corrupt or unavailable storage never crashes callers; it degrades to a safe empty state.

## Done when
- A single browser-local helper module is the only supported read/write seam for recent local work.
- Unit tests demonstrate ordering, cap, fallback, and privacy guarantees clearly enough that later tasks can build UI on top without redefining the contract.
  - Estimate: 45m
  - Files: src/lib/continuity/recent-work.ts, src/lib/continuity/types.ts, src/__tests__/continuity/recent-work.test.ts
  - Verify: npm test -- --run src/__tests__/continuity/recent-work.test.ts
- [x] **T02: Added browser-local save and homepage resume flow for recent local work without storing raw source content.** — ## Why
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
  - Estimate: 1h15m
  - Files: src/app/page.tsx, src/components/results/ResultsView.tsx, src/components/continuity/RecentLocalWorkPanel.tsx, src/hooks/useRecentWorks.ts, src/app/globals.css, src/__tests__/app/anonymous-continuity.test.tsx
  - Verify: npm test -- --run src/__tests__/app/anonymous-continuity.test.tsx
- [ ] **T03: Make the return-user seam legible across header and action copy** — ## Why
The slice is not complete if continuity exists technically but still reads like public publishing. This task ensures the shell and action family tell the truth: browser-local continuity is private/local, while share links and gallery saves remain explicit public surfaces.

## Steps
1. Add a lightweight continuity cue in the shared header or shell so returning users have a predictable way to rediscover recent local work.
2. Tighten results/share/gallery copy so the new local-save action, share link action, and gallery action clearly describe their different persistence and privacy scopes.
3. Extend product-family coherence tests to lock the distinction in place and prevent later regressions that blur local continuity with public archive behavior.
4. Keep branded empty-state and editorial language consistent with the existing collector/product family work from M003.

## Must-Haves
- Local continuity wording always says browser-local/private-first and never implies public visibility.
- Share/gallery wording remains explicitly public and parameter-safe/public-opt-in as appropriate.
- The return-user seam is discoverable from the shared shell, not only after generating a new piece.

## Done when
- A returning user can identify where recent local work lives and understand, from copy alone, how it differs from Share and Gallery.
- Coherence tests fail if future edits blur the local/public continuity boundary.
  - Estimate: 45m
  - Files: src/components/layout/Header.tsx, src/components/results/ShareButton.tsx, src/components/gallery/GallerySaveModal.tsx, src/components/continuity/RecentLocalWorkPanel.tsx, src/__tests__/app/product-family-coherence.test.tsx
  - Verify: npm test -- --run src/__tests__/app/product-family-coherence.test.tsx
