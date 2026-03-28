# M004 / S02 — Research

**Date:** 2026-03-26
**Slice:** Adaptive onboarding, empty states, and repeat-use navigation
**Depth:** Targeted research

## Summary

S02 primarily owns **R009 (onboarding and value communication)** and supports **R004 (coherent product surfaces)** and **R010 (accessibility breadth)** while building directly on S01’s validated **R008** recent-work seam. The core product already has the data needed for an adaptive first-visit vs returning-visit homepage, but the UI is still mostly static: `src/app/page.tsx` always renders the same landing copy, `src/components/input/InputZone.tsx` always renders the same mode narrative, and `src/components/layout/Header.tsx` exposes only one durable shell action (`Recent local work`). The good news is that S01 already created the most important state boundary: `useRecentWorks()` returns `recentWorks`, `isLoaded`, and save/reopen helpers, so S02 can stay in the product layer and avoid touching storage contracts.

The biggest gap is **navigation coherence**, not storage. There is still no actual shared nav landmark or route family chooser in the shell: no `/gallery` or `/compare` entry from the header, no `aria-current` route state, and no explicit first-time vs returning-user routing cues beyond the homepage continuity panel. That means users can reopen saved work, but they still have to discover route structure mostly by chance. This aligns with the roadmap’s “without route-discovery guesswork” risk.

There is also a **test drift seam already visible before S02 starts**. `src/__tests__/app/shared-brand-surfaces.test.tsx` currently fails because it expects the old compare intro copy (`"one editorial stage"`) while `src/app/compare/CompareMode.tsx` now says `"one collector stage"`. Separate older privacy tests in `src/__tests__/privacy/local-only.test.ts` also fail because `InputZone.tsx` no longer includes the lock/local-only affordance those string-based tests expect. The planner should treat those as pre-existing alignment work, not regressions introduced by S02.

## Recommendation

Build S02 as three thin UI layers on top of S01’s existing continuity hook rather than inventing new persistence or routing state:

1. **Homepage adaptation first**
   - Keep `src/app/page.tsx` as the orchestration seam.
   - Derive a simple visitor mode from `recentWorksLoaded` + `recentWorks.length` + `resumedWork`.
   - Swap the hero/support copy, continuity panel framing, and input guidance based on whether the browser has saved work.

2. **Shared-shell navigation second**
   - Expand `src/components/layout/Header.tsx` from a single CTA into a real route-family nav for home/recent work, gallery, and compare.
   - Follow the accessibility skill’s consistent-navigation guidance: use a semantic `<nav>` landmark and expose `aria-current` for the active route.
   - Keep the continuity distinction explicit: local recent work remains homepage/browser-local, while gallery/share remain public.

3. **Results and empty-state guidance third**
   - Add repeat-use cues where the user already lands after generation: `src/components/results/ResultsView.tsx`.
   - Reuse S01 copy boundaries rather than inventing new nouns. Returning-user guidance should point back to homepage continuity and outward to compare/gallery only when those routes are relevant.

This follows the installed skills cleanly:
- **`react-best-practices`**: keep new onboarding logic as derived render state instead of extra effect-driven state; avoid creating another persistence layer or redundant route subscriptions.
- **`accessibility`**: keep dynamic onboarding/empty-state messaging in semantic headings/status text, preserve keyboard-first controls, and make shared navigation consistent across pages.

## Implementation Landscape

### Primary files and seams

- `src/app/page.tsx`
  - Main S02 orchestration seam.
  - Already computes `hasResult`, `activeResult`, `resumedWork`, `recentWorks`, and `recentWorksLoaded`.
  - Best place to derive **first-visit / returning / resumed** view state and thread it into child components.
  - Current limitation: landing hero, note cards, marquee, and support copy are static even when recent work exists.

- `src/components/input/InputZone.tsx`
  - Current onboarding copy hub for text / URL / data modes.
  - Already has per-tab narrative state (`tabNarrative`) and a stable, accessible tabbed structure.
  - Natural place for adaptive instructional copy, “what to do next” empty-state hints, and returning-user wording.
  - No persistence logic here yet; keep it presentational.

- `src/components/continuity/RecentLocalWorkPanel.tsx`
  - Existing returning-user panel from S01.
  - Already has strong empty/saved states and `aria-live="polite"` on the empty state.
  - Best place to add stronger “resume / start fresh / browse public work” orientation, but avoid turning it into a full nav system.

- `src/components/layout/Header.tsx`
  - Current shell-level continuity cue.
  - Biggest S02 navigation opportunity: today it is just brand text + one homepage link + theme toggle.
  - Missing semantic nav landmark, active-route state, and route discovery for compare/gallery.

- `src/components/results/ResultsView.tsx`
  - Existing action desk already separates local continuity from public share/gallery.
  - Good seam for “what next” guidance after generation and for repeat-use cues after resuming saved work.
  - Avoid changing the storage contract here; only adapt copy and action grouping.

- `src/components/layout/Shell.tsx`
  - Shared shell wrapper for homepage, compare, gallery, and viewer routes.
  - If S02 adds a route-family nav or skip-link-like shared structure, this is where it should live.

- `src/app/gallery/page.tsx` and `src/app/compare/CompareMode.tsx`
  - Already participate in the branded route family.
  - Useful verification targets for any new shared nav because they already render inside `Shell`.

### Existing tests to extend

- `src/__tests__/app/home-editorial-flow.test.tsx`
  - Current homepage → results acceptance seam.
  - Best place to add assertions for adaptive first-visit vs returning-user onboarding text.

- `src/__tests__/app/anonymous-continuity.test.tsx`
  - Already proves save / reload-like return / reopen behavior.
  - Best place to add “returning visitor sees resume-oriented guidance” assertions.

- `src/__tests__/app/shared-brand-surfaces.test.tsx`
  - Existing shared-shell / route-family test.
  - Best seam to lock new header navigation and cross-route wording.
  - Currently already failing from stale compare copy; update carefully instead of layering more drift.

- `src/__tests__/app/product-family-coherence.test.tsx`
  - Protects the local-vs-public persistence contract.
  - Extend only if S02 changes wording across header/results/home/gallery.

### Natural task split

1. **Homepage + input adaptation**
   - `src/app/page.tsx`
   - `src/components/input/InputZone.tsx`
   - Possibly `src/components/continuity/RecentLocalWorkPanel.tsx`

2. **Shared-shell route discovery**
   - `src/components/layout/Header.tsx`
   - `src/components/layout/Shell.tsx`
   - Possibly lightweight active-route detection in header only

3. **Results follow-through + regression coverage**
   - `src/components/results/ResultsView.tsx`
   - `src/__tests__/app/home-editorial-flow.test.tsx`
   - `src/__tests__/app/anonymous-continuity.test.tsx`
   - `src/__tests__/app/shared-brand-surfaces.test.tsx`
   - `src/__tests__/app/product-family-coherence.test.tsx` if copy changes cross the continuity/public boundary

## Constraints and Failure Modes

### 1. Do not reopen the S01 persistence contract

S01’s value is that the recent-work seam is already validated and privacy-safe. S02 should consume `useRecentWorks()` and the existing record labels, not expand storage shape or start persisting onboarding flags in a way that blurs the browser-local/private contract.

### 2. Route discovery must not blur local vs public persistence

The existing copy boundary is regression-tested. If header/nav or homepage CTAs start linking to gallery/share without explicit wording, S02 can accidentally undermine D048/D049. Any “recent,” “saved,” or “resume” language in shared navigation needs to keep browser-local continuity distinct from public archive routes.

### 3. Accessibility needs to improve with the nav, not regress

The `accessibility` skill guidance is directly relevant here:
- use semantic navigation landmarks for consistent navigation,
- expose active location with `aria-current`,
- keep keyboard operation intact,
- preserve live-region behavior for dynamic empty/resume states.

Right now the header is visually fine but semantically thin.

### 4. Existing tests are already stale in two places

Observed during research:
- `src/__tests__/app/shared-brand-surfaces.test.tsx` fails because it expects `"one editorial stage"` while `src/app/compare/CompareMode.tsx` now says `"one collector stage"`.
- `src/__tests__/privacy/local-only.test.ts` fails because `src/components/input/InputZone.tsx` no longer contains the lock/local-only strings the test expects.

The planner should budget either test cleanup within S02 or explicitly treat them as pre-existing unrelated debt if they are left untouched.

## Requirement Assessment

### R009 — onboarding and value communication

This is the main slice requirement. The current product explains itself well, but **does not adapt**. The same hero, note cards, and input guidance render whether the user is brand new or already has six saved local editions. S02 should prove that first-time users get clear “how to start” guidance while returning users see truthful resume-oriented guidance.

### R004 — coherent product surfaces

Still at risk if S02 adds isolated widgets. The safest approach is to reuse:
- homepage hero/support structure in `src/app/page.tsx`,
- the existing `InputZone` narrative block,
- the `Shell`/`Header` route-family seam,
- the `ResultsView` action desk.

### R010 — accessibility breadth

S02 is not the final a11y closure slice, but it does touch navigation and dynamic guidance. This slice should at least leave behind:
- semantic nav structure,
- active-route announcement,
- keyboard-usable route switching,
- status/empty-state copy that remains readable to assistive tech.

## Verification

### Existing commands worth reusing

- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx`
- `npm test -- --run src/__tests__/app/anonymous-continuity.test.tsx`
- `npm test -- --run src/__tests__/app/shared-brand-surfaces.test.tsx`
- `npm test -- --run src/__tests__/app/product-family-coherence.test.tsx`

### Research-time observations

- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx`
  - `home-editorial-flow` passed
  - `anonymous-continuity` passed
  - `shared-brand-surfaces` failed due to stale compare copy expectation (`editorial stage` vs current `collector stage`)

- `npm test -- --run src/__tests__/privacy/local-only.test.ts`
  - 2 failures from outdated `InputZone` string expectations about a lock/local-only indicator

### What S02 should prove before closeout

- first-time browser with no recent work sees onboarding/empty-state guidance that clearly explains how to start
- returning browser with recent local work sees resume/recent guidance without losing the private-vs-public distinction
- shared header/shell navigation exposes homepage/recent work plus route discovery for compare/gallery without guesswork
- keyboard users can reach and operate the new nav and adaptive surfaces
- copy regressions remain locked by updated route-family/product-family tests

## Skill Discovery

Installed skills directly relevant to this slice:
- `accessibility` — directly relevant for nav semantics, focus behavior, and adaptive status text
- `react-best-practices` — directly relevant for keeping visitor-mode logic as derived UI state instead of new effect-heavy state

Non-installed skill discovery checked during research:
- **Vitest**
  - Suggestion: `npx skills add onmax/nuxt-skills@vitest`
  - Why: highest-install match from `npx skills find "vitest"`; only worth considering if the team wants more testing-specific prompting help for the regression layer, not because S02 needs new runtime tech

## Sources

- `src/app/page.tsx`
- `src/components/input/InputZone.tsx`
- `src/components/continuity/RecentLocalWorkPanel.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Shell.tsx`
- `src/components/results/ResultsView.tsx`
- `src/app/gallery/page.tsx`
- `src/app/compare/CompareMode.tsx`
- `src/__tests__/app/home-editorial-flow.test.tsx`
- `src/__tests__/app/anonymous-continuity.test.tsx`
- `src/__tests__/app/shared-brand-surfaces.test.tsx`
- `src/__tests__/app/product-family-coherence.test.tsx`
- `src/__tests__/privacy/local-only.test.ts`
