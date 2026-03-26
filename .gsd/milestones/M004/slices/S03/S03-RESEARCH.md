# M004 / S03 — Research

**Date:** 2026-03-26
**Scope:** Privacy-filtered observability and accessibility breadth

## Summary

S03 is the closing slice for **R007** and **R010**, and it also supports **R004** and **R008** by making the now-shipped repeat-use loop inspectable without breaking the privacy/product-language contract established in S01/S02. The codebase currently has **no analytics SDK, no error-monitoring SDK, no instrumentation files, no observability provider seam, and no environment-gated telemetry wrapper**. `src/app/layout.tsx` only mounts `ThemeProvider`, so there is one clean app-level seam for adding opt-in observability.

The highest-leverage observability entry points already exist in product code:
- generation flows in `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, and `src/hooks/useDataAnalysis.ts`
- continuity actions in `src/app/page.tsx`, `src/hooks/useRecentWorks.ts`, and `src/components/results/ResultsView.tsx`
- public actions in `src/components/results/ShareButton.tsx`, `src/components/results/ExportControls.tsx`, and `src/components/gallery/GallerySaveModal.tsx`
- truthful no-DB / unavailable seams in `src/app/gallery/page.tsx`, `src/app/share/[id]/page.tsx`, and `src/components/viewers/BrandedViewerScaffold.tsx`
- failure-heavy API routes in `src/app/api/analyze-url/route.ts`, `src/app/api/share/route.ts`, `src/app/api/gallery/route.ts`, and `src/app/api/render-export/route.ts`

The biggest accessibility gaps are real and code-local, not speculative:
1. **No skip link or focusable main target** in the shared shell. `src/components/layout/Shell.tsx` renders `<main>` but gives keyboard users no fast path past the header/nav.
2. **`StyleSelector` is not keyboard-operable.** `src/components/results/StyleSelector.tsx` uses clickable `<div role="tab">` elements with `onClick` only. This violates the accessibility skill’s “prefer native elements” and keyboard-access rules.
3. **`InputTabs` is only partially tab-semantics compliant.** `src/components/input/InputTabs.tsx` uses `role="tab"` buttons, but there are no `aria-controls`/tabpanel links and no arrow-key behavior.
4. **`GallerySaveModal` has no focus management.** `src/components/gallery/GallerySaveModal.tsx` exposes `role="dialog" aria-modal="true"`, but there is no initial focus, no focus trap, no Escape close, and no focus restoration to the invoking button.
5. **Reduced-motion coverage is incomplete.** Renderers check `prefers-reduced-motion`, but `src/app/globals.css` has no global reduced-motion override for the many transitions/hover lifts used across the new editorial surfaces.

This slice is therefore best treated as **two coupled seams**:
- a **privacy-filtered observability foundation** added at app/client/server boundaries
- an **accessibility breadth pass** focused on keyboard semantics, focus management, and motion hygiene across the new M004 surfaces

## Recommendation

Use **PostHog for product analytics** and **Sentry for error monitoring/traces**, but keep both integrations **env-optional, privacy-filtered, and mostly manual**.

Recommended default contract:
- **PostHog**
  - pageviews via App Router pageview helper
  - manual capture for core product-loop events only
  - **no broad autocapture of user content surfaces**
  - **no session recording in v1** for this slice
  - event payloads limited to safe metadata: source kind (`text|url|data`), route family, continuity mode, preferred style, palette family id, request mode (`snapshot|live`), success/failure category, status code bucket
- **Sentry**
  - browser + server + route-handler errors
  - low traces sample rate
  - **Replay off initially**; if ever enabled later, keep full masking/blocking defaults
  - filter intentional local no-DB states so the truthful local proof mode does not become noise

Do **not** rely on raw PostHog autocapture for this app. The product contains sensitive textareas, URL fields, and public/private boundary copy. Context7 docs for PostHog show `before_send` filtering and session-recording masking, but the safest S03 implementation is pageviews + manual event taxonomy, not DOM-level capture.

For accessibility, follow the installed **`accessibility` skill** rules directly:
- add a **skip link** and a focusable main target (`2.4.1 Skip links`)
- keep **consistent navigation semantics** (`3.2.3`), which already aligns with S02’s explicit `currentRoute` pattern
- ensure **all functionality is keyboard accessible** (`2.1`), especially `StyleSelector`
- implement **modal focus trapping + Escape support** for `GallerySaveModal`
- keep dynamic confirmations/errors on proper **live regions** (`role="status"` / `role="alert"`)
- prefer **native buttons** over ARIA-decorated generic containers when possible

## Implementation Landscape

### Existing seams to build on

- `src/app/layout.tsx`
  - Current root composition: fonts + `ThemeProvider` only.
  - Best insertion point for an env-gated observability/provider wrapper.

- `src/components/theme/ThemeProvider.tsx`
  - Existing client wrapper pattern. Good precedent for introducing something like `ObservabilityProvider` or a combined providers file.

- `src/hooks/useTextAnalysis.ts`
  - Pure client pipeline for text generation.
  - Natural place to emit `generation_started`, `generation_completed`, and timing/failure telemetry for text inputs.
  - No error state today; only success pipeline.

- `src/hooks/useUrlAnalysis.ts`
  - Highest-risk loop seam: client fetch to `/api/analyze-url`, rate-limit branch, network failure branch, URL-mode distinction.
  - Best source for safe analytics around URL generation success/failure and for surfacing route-handler failures into Sentry tags/categories.

- `src/hooks/useDataAnalysis.ts`
  - Client-only analysis flow with explicit parse/analyze failure handling.
  - Natural seam for data-generation success/failure telemetry.

- `src/app/page.tsx`
  - Orchestrates visitor mode, recent-work resume, fresh generation, and return-to-desk flow.
  - Best place to record browser-local continuity resume/save/start-fresh events because it already knows `visitorMode`, `resumedWork`, and active input family.

- `src/hooks/useRecentWorks.ts`
  - Single browser-local continuity helper seam from S01.
  - Best place for safe continuity instrumentation because it already centralizes save/reopen failure states.

- `src/components/results/ResultsView.tsx`
  - Product action hub for results, next-step routing, browser-local save, export/share/gallery entry.
  - Best place to instrument style changes, recent-local save CTA usage, and route-intent clicks if needed.
  - Also contains the keyboard gap via `StyleSelector` dependency.

- `src/components/results/ShareButton.tsx`
  - Client-side public-share flow with success and failure states.
  - Natural manual analytics seam: share requested, share created, copy attempted, share failed.

- `src/components/results/ExportControls.tsx`
  - Export action with success/failure branches and format/frame choices.
  - Natural analytics seam for export requested/succeeded/failed.

- `src/components/gallery/GallerySaveModal.tsx`
  - Public gallery save flow.
  - Natural analytics seam for gallery save opened/requested/succeeded/failed.
  - Biggest accessibility gap in touched M004 surfaces because dialog semantics stop at attributes only.

- `src/components/layout/Shell.tsx` + `src/components/layout/Header.tsx`
  - Shared route-family shell from S02.
  - Best place for skip link, focusable main region, and route-level navigation verification.

- `src/components/input/InputZone.tsx`
  - Adaptive onboarding surface from S02.
  - Current `InputTabs` semantics are incomplete; this is the right file family for tablist cleanup.

- `src/components/input/InputTabs.tsx`
  - Uses `role="tablist"` and `role="tab"` but no full APG behavior.
  - Planner should decide between (a) finishing real tab semantics with tabpanels/keyboard or (b) simplifying to button-group semantics that match actual behavior.

- `src/components/results/StyleSelector.tsx`
  - Most concrete accessibility defect in the slice scope.
  - Current implementation uses clickable divs with `role="tab"`; should become real buttons or a complete tab implementation.

- `src/app/gallery/page.tsx`, `src/app/share/[id]/page.tsx`, `src/components/viewers/BrandedViewerScaffold.tsx`
  - Existing truthful branded fallback/unavailable pattern.
  - S03 should instrument these states without changing the product language contract.

- `src/app/api/analyze-url/route.ts`, `src/app/api/share/route.ts`, `src/app/api/gallery/route.ts`, `src/app/api/render-export/route.ts`
  - Main route-handler seams for safe exception capture and structured failure tagging.
  - `analyze-url` is especially important because it crosses network + cache + analysis boundaries.

### What is missing today

- No `@posthog/next` or `@sentry/nextjs` dependencies in `package.json`
- No `instrumentation.ts`, `instrumentation-client.ts`, or Sentry config files
- No client/server telemetry helper module
- No shared event taxonomy constants
- No env-gated provider wrapper
- No accessibility regression tests for keyboard traversal, modal focus, skip link, or style selector keyboard use
- No browser-level a11y verification beyond prior slice manual proof notes

## Constraints and Failure Modes

### 1. Privacy filtering must be explicit, not implied

S01/S02 established a strong product contract: **no raw source text, no full URLs, no dataset bodies, no replay-grade local persistence**. S03 observability cannot punch through that.

Specific no-capture fields:
- `inputText` and the textareas that hold it
- canonical URLs from `useUrlAnalysis`
- raw CSV/JSON payloads
- gallery `inputPreview` text
- any DOM text capture from session recording/autocapture

Safe event fields already exist in code:
- `source.kind` from `src/lib/continuity/types.ts`
- `preferredStyle`
- `palette.familyId`
- `continuityMode`
- route family (`home|compare|gallery|detail`)
- URL mode (`snapshot|live`)
- response status / error class / rate-limited vs unavailable

### 2. Intentional no-DB local proof mode must not look like production breakage

`src/db/index.ts` still throws immediately when `DATABASE_URL` is missing. DB-backed pages and routes catch this and render truthful unavailable states. That is expected local behavior, not necessarily an incident.

Implication for S03:
- analytics may track `unavailable_state_viewed` for gallery/share/local-proof states
- Sentry should **not** spam exceptions for intentional local no-DB proof paths
- if instrumentation is added inside catch blocks, tag and filter `DATABASE_URL is not set` / local-proof-no-db distinctly

### 3. `/api/analyze-url` is the most failure-rich route

`src/app/api/analyze-url/route.ts` crosses:
- rate limiting
n- request JSON parsing
- URL canonicalization
- DB snapshot lookup/write (`src/lib/cache/db-cache.ts`)
- SSRF-protected fetch
- HTML analysis

If only one API route gets richer telemetry/failure tagging first, it should be this one.

### 4. Current accessibility gaps are concentrated in custom interaction widgets

The route-family shell and many form controls are already reasonably semantic. The main risk is not generic HTML; it is custom widgets:
- clickable `div` tabs in `StyleSelector`
- half-implemented tab semantics in `InputTabs`
- modal without focus management in `GallerySaveModal`
- lack of skip-link affordance in the shared shell
- global motion transitions not honoring reduced motion

### 5. Browser verification may need a non-3000 port again

S02 already recorded that local proof sometimes required port `3004` because of stale listeners/locks. Planner should keep verification commands flexible rather than hardcoding `3000`.

## Requirement Assessment

### R007 — owned by S03

To truly satisfy R007, this slice should prove:
- page/route usage is visible in analytics for the real Home → Results → Share/Gallery/Resume loop
- failures in URL analysis, share creation, gallery save, and export are inspectable in an error-monitoring tool or equivalent captured surface
- unavailable-state hits are measurable without collecting user source material
- local/no-env mode degrades cleanly instead of crashing build/runtime

Suggested minimum event set:
- `generation_started`
- `generation_completed`
- `generation_failed`
- `recent_local_saved`
- `recent_local_resumed`
- `recent_local_save_failed`
- `share_link_created`
- `share_link_failed`
- `share_link_copied`
- `gallery_save_created`
- `gallery_save_failed`
- `export_requested`
- `export_succeeded`
- `export_failed`
- `unavailable_state_viewed`

### R010 — owned by S03

To truly satisfy R010, this slice should prove:
- keyboard users can bypass header/nav and land in main content quickly
- results style selection is keyboard-operable, not mouse-only
- modal open/close/focus restoration works without a pointer
- active tabs/input surfaces remain semantically coherent for assistive tech
- reduced-motion preference is respected beyond canvas animation alone

### Supports R004 and R008

S03 can regress prior work if telemetry or accessibility fixes blur the product contract. The planner should keep the S01/S02 language boundary executable:
- local continuity remains private/browser-local
- share/gallery remain public routes
- telemetry payloads reflect this distinction instead of flattening it

## Technology Notes

### PostHog

Context7 docs for `/posthog/posthog-js` confirm:
- App Router pageviews require `PostHogPageView`
- `PostHogProvider` can live in root layout composition
- `before_send` can filter or drop events
- session recording supports masking/blocking, but that is still riskier than needed here

Recommendation for this app:
- use `@posthog/next`
- enable App Router pageviews
- keep `autocapture` off or extremely constrained
- manual `capture()` for product-loop events only
- use `before_send` to strip any unsafe properties defensively
- skip session recording in S03

### Sentry

Context7 docs for `/getsentry/sentry-docs` confirm:
- Next.js supports client/server/edge setup via `@sentry/nextjs`
- traces can be sampled conservatively
- Replay defaults can mask text/block media, but Replay is optional
- filtering hooks (`allowUrls`, `denyUrls`, `beforeSend`) exist for noise/privacy control

Recommendation for this app:
- start with errors + traces only
- keep Replay disabled for S03
- add narrow filtering around intentional no-DB local-proof states
- capture route-handler failures with tags like `surface`, `route_family`, `failure_kind`, `source_kind`, `is_local_proof_mode`

## Accessibility Findings

These are concrete code findings the planner can convert directly into tasks/tests.

1. **Shared shell skip-link gap**
   - File: `src/components/layout/Shell.tsx`
   - Current state: semantic `<main>` exists, but no skip link and no focusable target id.
   - Fix direction: add a visually hidden/focusable skip link before header, give main a stable id, and optionally `tabIndex={-1}` for programmatic focus.

2. **Results style selector is mouse-only**
   - File: `src/components/results/StyleSelector.tsx`
   - Current state: each style tile is a `div role="tab"` with `onClick` only.
   - Fix direction: switch to native buttons at minimum; if retaining tab semantics, add roving tabindex, ArrowLeft/ArrowRight/Home/End, and panel relationships. The accessibility skill explicitly prefers native elements over ARIA-decorated divs.

3. **Input tabs need either full APG compliance or simpler semantics**
   - File: `src/components/input/InputTabs.tsx`
   - Current state: buttons use `role="tab"`, but there are no `tabpanel` ids/controls and no keyboard navigation.
   - Fix direction: either complete real tab semantics in `InputZone.tsx` or simplify to a segmented button group using `aria-pressed` / current-state styling.

4. **Gallery modal focus lifecycle is incomplete**
   - File: `src/components/gallery/GallerySaveModal.tsx`
   - Current state: dialog attributes only.
   - Missing: initial focus, focus trap, Escape close, focus return.
   - Fix direction: add a small reusable focus-trap helper or local effect; preserve the button that opened the modal so focus returns correctly.

5. **Reduced-motion is only partially respected**
   - Files: `src/components/results/ResultsView.tsx`, renderer canvas components, `src/app/globals.css`
   - Current state: renderers check `window.matchMedia('(prefers-reduced-motion: reduce)')`, but global transitions/hover transforms remain active.
   - Fix direction: add `@media (prefers-reduced-motion: reduce)` override in `globals.css` for transition-heavy editorial surfaces.

## Skill Discovery

Installed skills directly relevant to this slice:
- **`accessibility`** — directly applicable; its skip-link, keyboard accessibility, native-element preference, modal focus-trap, and live-region rules should shape the a11y task breakdown.
- **`agent-browser`** — useful for final browser-level keyboard/UAT verification after implementation.

Promising non-installed skills for the core technologies in this slice:
- **PostHog analytics**
  - `npx skills add alinaqi/claude-bootstrap@posthog-analytics`
  - Highest install count from `npx skills find "PostHog analytics"`
- **Sentry Next.js SDK**
  - `npx skills add getsentry/sentry-for-ai@sentry-nextjs-sdk`
  - Highest install count and direct framework match from `npx skills find "Sentry Next.js"`

## Planner Guidance

Recommended task order:

### 1. Establish the observability foundation first

Create the env-gated provider/helper seams before touching individual actions.

Likely files:
- `package.json`
- `src/app/layout.tsx`
- new provider/helper files such as:
  - `src/components/observability/ObservabilityProvider.tsx`
  - `src/lib/observability/events.ts`
  - `src/lib/observability/client.ts`
  - `src/lib/observability/server.ts`
- Sentry/Next instrumentation files if chosen

Done when:
- app still runs with no env vars set
- analytics/error tooling activates only when configured
- safe event names + payload helpers exist in one place so privacy rules cannot drift

### 2. Instrument the real product loop and failure seams

Wire the helpers into the high-signal flows only.

Priority files:
- `src/hooks/useTextAnalysis.ts`
- `src/hooks/useUrlAnalysis.ts`
- `src/hooks/useDataAnalysis.ts`
- `src/app/page.tsx`
- `src/hooks/useRecentWorks.ts`
- `src/components/results/ResultsView.tsx`
- `src/components/results/ShareButton.tsx`
- `src/components/results/ExportControls.tsx`
- `src/components/gallery/GallerySaveModal.tsx`
- `src/app/api/analyze-url/route.ts`
- `src/app/api/share/route.ts`
- `src/app/api/gallery/route.ts`
- `src/app/api/render-export/route.ts`
- optionally `src/app/gallery/page.tsx` and `src/app/share/[id]/page.tsx` for branded-unavailable instrumentation

Done when:
- the real repeat-use flow produces inspectable safe events
- expected failures produce categorized observability signals
- intentional local no-DB mode is tagged/filtered truthfully rather than treated like a production incident

### 3. Close the accessibility breadth gaps

This can be parallelized somewhat, but the natural cluster is shell + tabs/selectors + modal.

Priority files:
- `src/components/layout/Shell.tsx`
- `src/components/layout/Header.tsx` (only if skip-link/nav text needs minor adjustment)
- `src/components/input/InputZone.tsx`
- `src/components/input/InputTabs.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/components/gallery/GallerySaveModal.tsx`
- `src/app/globals.css`

Done when:
- keyboard traversal and focus management work end-to-end on Home/Results/modal surfaces
- reduced motion is respected globally enough for the editorial shell
- semantics remain aligned with S01/S02’s product-family wording

### 4. Add regression + browser proof last

Automated proof should lock both the privacy-filtered observability contract and the a11y breadth fixes.

Most likely tests to extend/add:
- `src/__tests__/app/home-editorial-flow.test.tsx`
- `src/__tests__/app/anonymous-continuity.test.tsx`
- `src/__tests__/app/shared-brand-surfaces.test.tsx`
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `src/__tests__/components/StyleSelector.test.tsx`
- `src/__tests__/gallery/save-modal.test.tsx`
- new focused tests for shell skip link / tab semantics / telemetry helpers

## Verification Strategy

### Automated

Run the existing M004 regression bundle plus new focused tests:

```bash
npm test -- --run src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/gallery/save-modal.test.tsx
```

Add any new telemetry/helper tests to the command once created.

### Manual / browser

Start local dev on an open port (3000 or 3004), then verify:
1. keyboard can skip to main content from the shell
2. tabs/selectors work without a mouse
3. opening Gallery save modal moves focus inside, traps Tab, closes on Escape, and returns focus to opener
4. generate text, URL, and data flows while watching configured analytics/error tooling for safe event payloads only
5. exercise failure paths (rate limit / no DB / network failure where practical) and confirm branded fallback behavior remains truthful

### Proof expectations

The slice is genuinely done when the planner/executor can show both:
- **observability evidence**: safe events and categorized failures are visible in the chosen tools
- **accessibility evidence**: keyboard traversal, focus handling, and motion semantics are verified on the new continuity/onboarding/product-family surfaces

## Sources

- Context7 `/posthog/posthog-js`: Next App Router provider/pageview docs and `before_send` filtering support
- Context7 `/getsentry/sentry-docs`: Next.js setup, traces, replay privacy/masking, and filtering options
- Installed `accessibility` skill: skip-link, keyboard accessibility, modal focus trap, native-element preference, live-region guidance
