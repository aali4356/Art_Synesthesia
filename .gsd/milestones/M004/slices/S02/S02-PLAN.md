# S02: Adaptive onboarding, empty states, and repeat-use navigation

**Goal:** Make the homepage, shell, and results family adapt truthfully for first-time versus returning visitors so users can resume local work, discover compare/gallery routes, and move through the product without route-discovery guesswork.
**Demo:** A first-time visitor sees clear guidance, while a returning visitor sees resume/recent-entry cues in the homepage/header/results family and can move through the product without route-discovery guesswork.

## Must-Haves

- Homepage orchestration derives first-visit, returning, and resumed states from the existing recent-local-work seam and presents distinct onboarding/empty-state guidance for each state without adding new persistence.
- Shared shell navigation exposes Home/Recent local work, Compare, and Gallery inside a semantic nav landmark with keyboard-usable links and correct `aria-current` state across routes.
- Results follow-through and continuity copy point users back to homepage continuity and outward to public routes without blurring browser-local private recall versus public share/gallery persistence, directly advancing active requirement `R004`.
- Regression coverage proves adaptive onboarding, repeat-use navigation, and product-family wording across `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, and `src/__tests__/app/product-family-coherence.test.tsx`.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx`
- `npm test -- --run src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- Live browser verification on `http://localhost:3000`, `http://localhost:3000/gallery`, and `http://localhost:3000/compare` confirms adaptive homepage copy, shared nav discovery, and repeat-use results cues.

## Observability / Diagnostics

- Runtime signals: adaptive homepage/recent-work state, active navigation state via `aria-current`, and repeat-use results guidance remain visible in rendered UI and locked by RTL assertions.
- Inspection surfaces: `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/app/product-family-coherence.test.tsx`, plus browser verification against the local app routes.
- Failure visibility: copy/nav regressions should fail in route-specific tests so a future agent can localize whether the break is homepage orchestration, shared shell navigation, or results follow-through.
- Redaction constraints: adaptive guidance must preserve the S01 privacy boundary by never exposing raw source content and by keeping browser-local continuity language distinct from public share/gallery routes.

## Integration Closure

- Upstream surfaces consumed: `src/hooks/useRecentWorks.ts`, `src/components/continuity/RecentLocalWorkPanel.tsx`, `src/components/layout/Shell.tsx`, and the existing homepage/results route family.
- New wiring introduced in this slice: derived visitor-mode onboarding in `src/app/page.tsx`, adaptive guidance props into `src/components/input/InputZone.tsx` and `src/components/results/ResultsView.tsx`, plus shared route navigation and active-route semantics in `src/components/layout/Header.tsx`.
- What remains before the milestone is truly usable end-to-end: S03 still needs privacy-filtered analytics/error visibility and broader accessibility verification for the new continuity/onboarding surfaces.

## Tasks

- [ ] **T01: Adapt homepage onboarding for first-time, returning, and resumed visitors** `est:50m`
  - Why: This task closes the main R004-facing gap in the current product: the homepage still speaks like every visitor is new even when browser-local recent work exists.
  - Files: `src/app/page.tsx`, `src/components/input/InputZone.tsx`, `src/components/continuity/RecentLocalWorkPanel.tsx`, `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`
  - Do: Derive visitor mode from `recentWorksLoaded`, `recentWorks.length`, and `resumedWork`; adapt hero/support/input guidance for first-time versus returning users; keep the browser-local/private boundary explicit; extend homepage and continuity tests to assert both states.
  - Verify: `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx`
  - Done when: Rendering `Home` with and without recent local work produces materially different onboarding language, and the tests prove first-visit and returning-user states.
- [ ] **T02: Add shared-shell route discovery with active navigation semantics** `est:45m`
  - Why: S01 made continuity discoverable, but users still have to guess how gallery and compare fit into the product family because the header is not yet a real navigation system.
  - Files: `src/components/layout/Header.tsx`, `src/components/layout/Shell.tsx`, `src/app/gallery/page.tsx`, `src/app/compare/CompareMode.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/app/product-family-coherence.test.tsx`
  - Do: Turn the header into a semantic nav landmark with Home/Recent local work, Compare, and Gallery links; expose active-route state with `aria-current`; align route intro copy so the shared shell reads as one truthful family; update route-family/coherence tests.
  - Verify: `npm test -- --run src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
  - Done when: A keyboard user can discover and move among Home, Compare, and Gallery from the shared shell, and route-family tests lock the wording and semantics.
- [ ] **T03: Carry repeat-use guidance through results and lock the cross-surface contract** `est:40m`
  - Why: The slice is only truly done once resume-oriented guidance continues from results back to the homepage and out to public routes in language that still reads like one coherent product contract.
  - Files: `src/components/results/ResultsView.tsx`, `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/app/product-family-coherence.test.tsx`
  - Do: Update results guidance for live and reopened recent-local states; tighten any remaining homepage/results/header copy seams; finalize one regression bundle covering homepage, continuity, shared-brand, and product-family behavior; then verify the same flow in the live browser.
  - Verify: `npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
  - Done when: Adaptive homepage guidance, shared nav, and results follow-through all read as one product family in tests and live local verification.

## Files Likely Touched

- `src/app/page.tsx`
- `src/components/input/InputZone.tsx`
- `src/components/continuity/RecentLocalWorkPanel.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Shell.tsx`
- `src/app/gallery/page.tsx`
- `src/app/compare/CompareMode.tsx`
- `src/components/results/ResultsView.tsx`
- `src/__tests__/app/home-editorial-flow.test.tsx`
- `src/__tests__/app/anonymous-continuity.test.tsx`
- `src/__tests__/app/shared-brand-surfaces.test.tsx`
- `src/__tests__/app/product-family-coherence.test.tsx`
