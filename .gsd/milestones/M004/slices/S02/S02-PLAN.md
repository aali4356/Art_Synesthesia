# S02: Adaptive onboarding, empty states, and repeat-use navigation

**Goal:** Make the homepage, shell, and results family adapt truthfully for first-time versus returning visitors so users can resume local work, discover compare/gallery routes, and move through the product without route-discovery guesswork.
**Demo:** After this: A first-time visitor sees clear guidance, while a returning visitor sees resume/recent-entry cues in the homepage/header/results family and can move through the product without route-discovery guesswork.

## Tasks
- [x] **T01: Derived homepage visitor-mode copy from recent local work state and locked it with RTL coverage.** — Why:
- This task closes the main R004/R009-facing gap in the current product: the homepage still speaks like every visitor is new even when browser-local recent work exists.

Steps:
1. Derive an explicit visitor-mode view in `src/app/page.tsx` from `recentWorksLoaded`, `recentWorks.length`, and `resumedWork` rather than introducing new persisted onboarding state.
2. Update homepage hero/support copy, note cards, and continuity framing so first-time visitors get clear start guidance while returning visitors get truthful resume/start-fresh cues that still preserve the private-vs-public boundary from S01.
3. Thread adaptive guidance into `src/components/input/InputZone.tsx` and, if needed, `src/components/continuity/RecentLocalWorkPanel.tsx` so the input narrative and empty/saved states match the visitor mode without leaking raw source material.
4. Extend homepage and anonymous-continuity tests to assert both first-visit and returning-visitor states, including resume cues and privacy-safe copy.

Must-haves:
- First-time visitors see a clear how-to-start path from the landing surface into the existing input controls.
- Returning visitors with recent local work see resume-oriented guidance without losing the explicit browser-local/private distinction.
- No new storage shape, onboarding flag, or continuity route is introduced.

Done when:
- Rendering `Home` with and without recent local work produces materially different onboarding language, and the test suite proves both states.
  - Estimate: 50m
  - Files: src/app/page.tsx, src/components/input/InputZone.tsx, src/components/continuity/RecentLocalWorkPanel.tsx, src/__tests__/app/home-editorial-flow.test.tsx, src/__tests__/app/anonymous-continuity.test.tsx
  - Verify: npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx
- [x] **T02: Added a real shared-shell navigation landmark with semantic active-route state and aligned product-family copy across Home, Compare, and Gallery.** — Why:
- S01 made continuity discoverable, but users still have to guess how gallery and compare fit into the product family because the header is not yet a real navigation system.

Steps:
1. Turn `src/components/layout/Header.tsx` into a semantic shared navigation landmark that exposes Home/Recent local work, Compare, and Gallery while keeping the continuity wording explicit about browser-local privacy.
2. Use the shared shell seam in `src/components/layout/Shell.tsx` and affected route surfaces to provide correct active-route state (`aria-current`) and keyboard-usable route switching without introducing route-local visual drift.
3. Align route intro copy where needed in `src/app/gallery/page.tsx` and `src/app/compare/CompareMode.tsx` so the shared nav reads as one truthful product family and fixes the currently stale compare wording in test coverage.
4. Update shared brand/coherence tests to assert the nav landmark, active route cues, and corrected route-family copy.

Must-haves:
- The header becomes a real, accessible navigation landmark rather than a single continuity CTA.
- Active-route state is exposed semantically and stays consistent on homepage, gallery, and compare.
- Public routes remain clearly distinct from browser-local recent work.

Done when:
- A keyboard user can discover and move among Home, Compare, and Gallery from the shared shell, and route-family tests lock the wording/semantics.
  - Estimate: 45m
  - Files: src/components/layout/Header.tsx, src/components/layout/Shell.tsx, src/app/gallery/page.tsx, src/app/compare/CompareMode.tsx, src/__tests__/app/shared-brand-surfaces.test.tsx, src/__tests__/app/product-family-coherence.test.tsx
  - Verify: npm test -- --run src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx
- [x] **T03: Added explicit results next-step guidance for fresh versus resumed editions and locked the cross-surface copy contract.** — Why:
- The slice is only truly done once resume-oriented guidance continues from results back to the homepage and out to public routes in language that still reads like one coherent product contract.

Steps:
1. Update `src/components/results/ResultsView.tsx` so live results and reopened recent-local results both offer clear next-step guidance: resume/start fresh at home, compare when evaluating variants, and gallery/share only with explicit public wording.
2. Tighten any remaining homepage/results/header wording seams so R004 stays coherent across the landing, shell, and results family after the new onboarding/nav work lands.
3. Finalize regression coverage across homepage, continuity, shared-brand, and product-family suites so the slice closes with one executable proof bundle.
4. Run live browser verification against `/`, `/gallery`, and `/compare` after the automated suite to confirm route discovery and repeat-use cues in the real UI.

Must-haves:
- Results surfaces reinforce the same navigation and continuity story introduced on the homepage/header.
- Browser-local recall versus public share/gallery persistence remains explicit in every changed surface.
- The slice ends with one regression bundle that proves the shipped user journey.

Done when:
- The adaptive homepage, shared nav, and results follow-through all read as one product family in tests and live local verification.
  - Estimate: 40m
  - Files: src/components/results/ResultsView.tsx, src/__tests__/app/home-editorial-flow.test.tsx, src/__tests__/app/anonymous-continuity.test.tsx, src/__tests__/app/shared-brand-surfaces.test.tsx, src/__tests__/app/product-family-coherence.test.tsx
  - Verify: npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx
