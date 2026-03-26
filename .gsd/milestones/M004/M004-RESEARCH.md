# M004 — Research

**Date:** 2026-03-25

## Summary

M003 left the product in a strong visual and cross-route state, but M004 is not starting from a continuity system that already exists. The current product has only a few isolated persistence seams: theme choice is stored via `next-themes` (`src/components/theme/ThemeProvider.tsx`), gallery ownership uses a browser-local creator token (`src/lib/gallery/creator-token.ts`), gallery likes are tracked in `localStorage` (`src/components/gallery/GalleryCard.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`), and DB-backed share/gallery records store parameter-safe artifacts rather than any notion of a user session (`src/db/schema/share-links.ts`, `src/db/schema/gallery-items.ts`). There is no account system, no visitor/session abstraction, no recent-work history, no onboarding state, no telemetry provider, and no route-level instrumentation.

The most important constraint is that existing “continuity” surfaces are continuity of public artifacts, not continuity of a private working session. `ResultsView` rebuilds scenes from the canonical input using deterministic derived seeds, but share/gallery viewers rebuild from synthetic placeholder seeds (`src/components/results/ResultsView.tsx`, `src/app/share/[id]/ShareViewer.tsx`, `src/app/gallery/[id]/GalleryViewer.tsx`). That means current share/gallery reopening is intentionally privacy-safe but may not be pixel-identical to the original generation session. If M004 promises “return to prior work,” the planner must decide whether that means family-level recall or exact edition restoration. That decision affects schema design, onboarding copy, and what analytics should identify as a “return.”

The second major constraint is operational: URL analysis still depends on the DB snapshot cache boundary. `/api/analyze-url` calls `getUrlSnapshot()` and `setUrlSnapshot()` in `src/lib/cache/db-cache.ts`, which lazily import `@/db`; `src/db/index.ts` still throws immediately when `DATABASE_URL` is missing. So the URL path is still not truly DB-optional in local proof mode. M004 continuity work that leans on URL revisit history or saved URL sessions will hit this seam fast unless the boundary is fixed or consciously bypassed.

## Recommendation

Take an **anonymous-first continuity strategy with optional future identity**, not a full auth-first productization push.

The existing codebase already has a privacy-preserving no-auth pattern that works: theme persistence in browser storage, creator ownership tokens for gallery edits, parameter-only share/gallery persistence, and branded unavailable states that keep backend truth visible instead of faking completeness. That pattern fits the milestone context and requirement R008 much better than jumping straight to Auth.js/Clerk. For a public portfolio launch, the right first proof is: a returning browser can recover recent editions, route back into saved artifacts, and understand what is persistent vs local — without requiring signup. Cross-device identity can remain optional and deferred unless the user explicitly wants it.

Plan the milestone around three boundaries:

1. **Continuity contract first**: define what a “returning user” gets back, what is stored locally vs in DB, and whether continuity means exact rerender or “same edition family.”
2. **Onboarding + empty-state guidance second**: once continuity artifacts exist, use them to populate the homepage, results, and gallery with better first-visit and return-visit states.
3. **Observability + accessibility closure third**: once the real user loop exists, instrument it, capture failures truthfully, and finish keyboard/accessibility breadth across newly changed surfaces.

A practical M004 default should be:
- browser-local recent-editions/workbench history
- optional explicit “save this locally” / “pin recent work” behavior
- continued parameter-only public share/gallery behavior
- no mandatory sign-in
- product analytics + error monitoring that exclude raw source text and user-entered hints by default

## Implementation Landscape

### Key Files

- `src/app/page.tsx` — the real landing → results seam. It already owns the first-visit and return-to-desk behavior, but all state is in-memory React state. This is the primary place for onboarding state, recent-work recovery, and return-user entry cues.
- `src/components/input/InputZone.tsx` — current onboarding copy lives here. It explains modes and privacy posture, but it is static instructional copy, not adaptive onboarding or empty-state guidance.
- `src/components/results/ResultsView.tsx` — current product action hub. This is where continuity actions should plug in first because it already centralizes export/share/gallery-save and exposes proof diagnostics.
- `src/components/layout/Header.tsx` — currently only brand + theme toggle. There is still no durable navigation for repeat-use behavior, recent work, or route discovery.
- `src/components/viewers/BrandedViewerScaffold.tsx` — the established branded route scaffold and truthful unavailable-state pattern. Reuse this instead of inventing new continuity-specific shells.
- `src/components/gallery/GallerySaveModal.tsx` — existing privacy-safe save contract. Useful model for any future local-save or continuity copy because it already explains what is and is not persisted.
- `src/lib/gallery/creator-token.ts` — important precedent: browser-local anonymous identity already exists and is explicitly accepted as a portfolio-grade compromise.
- `src/db/schema/gallery-items.ts` / `src/db/schema/share-links.ts` — current durable artifacts are public/public-ish records, not private session continuity records. Any M004 persistence layer likely needs a new schema instead of overloading these tables.
- `src/lib/cache/db-cache.ts` / `src/app/api/analyze-url/route.ts` / `src/db/index.ts` — current URL analysis persistence seam and a major risk. URL continuity or analytics around URL flows will inherit this DB requirement unless the boundary changes.
- `src/app/share/[id]/ShareViewer.tsx` / `src/app/gallery/[id]/GalleryViewer.tsx` — both reconstruct from synthetic seeds, proving that current reopening is not exact-session restore.
- `src/__tests__/app/home-editorial-flow.test.tsx` — existing acceptance seam for landing/results continuity. Extend this pattern for onboarding/return-user assertions.
- `src/__tests__/app/product-family-coherence.test.tsx` and `src/__tests__/app/shared-brand-surfaces.test.tsx` — current regression seams for copy continuity and branded unavailable states. Good anchors for M004 route-family and failure-state tests.

### Existing Patterns to Reuse

- **Lazy DB boundaries for build safety**: gallery/cache routes import DB-backed modules lazily rather than inline. Any new persistence or analytics server boundary should follow the same pattern to avoid regressing build health.
- **Truthful unavailable states**: M003 already established a product principle that backend gaps should stay branded and explicit. Reuse `BrandedUnavailableState` for continuity and observability failures.
- **Privacy-safe storage contracts**: gallery/share intentionally avoid raw input storage. M004 should extend that posture rather than punching through it for convenience.
- **Executable route-family proof**: M003 used app-level tests to prove cross-route coherence. M004 should keep this style for onboarding and continuity behaviors rather than relying on copy review alone.
- **Anonymous browser identity**: creator token and theme storage prove that lightweight anonymous persistence is already culturally accepted in this codebase.

### Build Order

**1. Prove the continuity contract before UI polish.**

First define and test a single continuity artifact that the product can recover on return. The natural lowest-risk version is a browser-local recent-editions/workbench record containing only safe derived metadata: input type, canonical hash or stable edition id, active style, palette family/mapping summary, timestamps, and links to gallery/share ids when they exist. This should be proven first because onboarding, empty states, “recent work,” and analytics event naming all depend on what the product actually considers a restorable unit.

**2. Decide exact restore vs edition-family restore early.**

This is the biggest hidden product decision in the code. Right now share/gallery routes do not guarantee pixel-identical restoration because they do not persist the original deterministic seed inputs used by `ResultsView`. If exact restoration matters, prove that with a dedicated persistence contract before building return-user UI. If it does not, make that explicit in product language and avoid overbuilding.

**3. Add onboarding/empty-state/return cues after continuity data exists.**

Once recent-work or saved-session artifacts exist, wire them into `src/app/page.tsx`, `src/components/input/InputZone.tsx`, and potentially `src/components/layout/Header.tsx`. The planner should prefer real adaptive states (“resume recent edition,” “nothing saved yet,” “gallery/detail/share available”) over more static explanatory copy.

**4. Add analytics/error visibility only after the loop exists.**

Instrument events around generate success/failure, save/share/export, route entry, and unavailable-state hits only after the continuity loop is stable enough to avoid churn. This prevents noisy taxonomy rewrites and lets instrumentation reflect the real product loop.

**5. Finish accessibility breadth last across touched surfaces.**

There is already solid baseline semantic work (`role="alert"`, `aria-label`, focus-visible styling, dialogs, keyboard submission), but M004 will touch new banners, nav, recent-work cards, and possibly drawers/modals. Do the broad keyboard/a11y sweep after the continuity/onboarding UI settles.

## Constraints and Failure Modes

### 1. URL continuity is coupled to DB availability today

`src/app/api/analyze-url/route.ts` calls the DB snapshot cache path on snapshot reads and after live fetches. Because `src/db/index.ts` throws when `DATABASE_URL` is absent, URL analysis remains operationally coupled to DB presence. This is still one of the most important M004 planning constraints.

### 2. Current durable records are not private workspace records

`share_links` and `gallery_items` are designed for public/public-safe artifacts. They are not a safe fit for “my recent workbench history” without awkward semantics and privacy risk. A separate continuity store — local first, or a new private DB table later — is the cleaner boundary.

### 3. No identity/session abstraction exists yet

There is no middleware, cookie session layer, `auth()` usage, user profile model, or anonymous visitor model. Introducing one would be net-new architecture, not incremental polish.

### 4. Current nav/discovery is still thin for repeat-use behavior

The header has brand + theme toggle only. Route discovery currently depends on landing actions, back links, and in-context buttons. For repeat-use product behavior, some form of durable navigation or resume-entry affordance likely belongs in M004.

### 5. Operational signals are effectively absent

There is no analytics SDK, no error monitoring, and no explicit telemetry/event taxonomy. The only “visibility” in the code today is user-visible diagnostics copy, local API error returns, and existing proof metadata in `ResultsView`. That is a good design foundation, but not sufficient for R007.

## Requirement Assessment

### Active requirements that look like table stakes for M004

- **R008 continuity/account strategy** — the key milestone decision. Needs an explicit contract, not implied localStorage sprawl.
- **R007 analytics and observability** — currently missing in implementation, not just incomplete.
- **R010 accessibility breadth** — current baseline is decent, but M004 will add new interactive surfaces, so this should stay a closing slice not a footnote.
- **R004 coherent product surfaces** — already advanced by M003, but M004 can easily regress it if continuity/onboarding are added as bolted-on widgets.

### Behaviors users may expect but are not yet explicit enough in requirements

These should be treated as **candidate requirements**, not automatic scope expansion:

- **Candidate:** a returning browser can see recent local editions and reopen them intentionally without requiring an account.
- **Candidate:** product analytics and diagnostics must not capture raw source text, raw URLs, or optional public hint text by default.
- **Candidate:** continuity messaging must explicitly distinguish local-only persistence from public share/gallery persistence.
- **Candidate:** unavailable backend states for continuity/analytics must remain branded and inspectable, following the M003 truth boundary.
- **Candidate:** if exact edition restoration is promised, the system must persist the seed inputs required for pixel-stable rerendering; otherwise product copy must avoid implying exact restoration.

### Overbuild risks

- Full SaaS auth/accounts before proving anonymous continuity.
- Cross-device sync before proving local recent-work value.
- Heavy admin/analytics backoffice instead of a slim launch-grade telemetry layer.
- Overloading gallery/share/public tables for private workspace continuity.

## Technology Notes

### Analytics / telemetry

**PostHog looks like the best fit for portfolio-grade product analytics with privacy controls.** Current docs support an App Router provider pattern and pageview capture in layout-level composition, plus selective autocapture filtering/masking. The privacy knobs are especially relevant here because this app renders sensitive source text and explanatory `aria-label`s that should not be ingested casually.

Relevant doc findings:
- App Router provider + pageview component can live in layout/provider composition.
- Autocapture can be constrained by element/URL allowlists.
- Attributes like `aria-label` can be excluded, and sensitive elements can be marked no-capture.

### Error monitoring / operational visibility

**Sentry is the strongest fit for error/failure visibility.** It has a clear Next.js App Router setup, can capture browser/server errors, and can add performance traces. Replay is available but should be treated cautiously because of privacy posture.

Relevant doc findings:
- App Router is supported.
- Tracing can be added globally from layout metadata.
- Session Replay is optional and should likely be off or extremely sampled until privacy boundaries are explicitly decided.

### Identity / auth

**Auth.js is technically viable, but it looks like a second-phase option, not the default M004 entry point.** App Router integration is straightforward and session strategy is flexible, but introducing it now would create a much larger system than the current portfolio-launch target requires. Clerk is similarly possible if the user later wants a hosted auth experience, but anonymous-first continuity fits the current codebase better.

## Skill Discovery

Installed skills already directly relevant to this milestone:

- `accessibility` — useful for the final keyboard/semantics sweep
- `agent-browser` — useful for browser-level onboarding/return-flow verification
- `react-best-practices` / `vercel-react-best-practices` — useful if continuity state gets threaded through React-heavy surfaces

Promising non-installed skills discovered for technologies that may matter in M004:

- **PostHog analytics**
  - Suggestion: `npx skills add alinaqi/claude-bootstrap@posthog-analytics`
  - Why: strongest direct match for privacy-aware Next.js product analytics work
- **Sentry Next.js SDK**
  - Suggestion: `npx skills add getsentry/sentry-for-ai@sentry-nextjs-sdk`
  - Why: strongest direct match for App Router error monitoring / traces
- **Auth.js**
  - Suggestion: `npx skills add jackspace/claudeskillz@auth-js`
  - Why: only if the user chooses an auth-backed identity path instead of anonymous-first continuity
- **Clerk auth**
  - Suggestion: `npx skills add jezweb/claude-skills@clerk-auth`
  - Why: only if the user decides hosted auth UX is worth the extra product scope

## Planner Guidance

Natural milestone slices look like:

1. **S01 — Continuity contract and return-user seam**
   - define local-first recent-edition/session model
   - settle exact restore vs edition-family restore
   - prove no-raw-input persistence and truthful no-DB behavior

2. **S02 — Onboarding, empty states, and repeat-use navigation**
   - upgrade homepage/header/results/gallery entry states using real continuity data
   - add resume/recent affordances
   - keep copy aligned with the persistence contract from S01

3. **S03 — Observability, analytics, and accessibility breadth**
   - add telemetry + error visibility with privacy filters
   - instrument unavailable-state hits and core product loop events
   - close keyboard/semantic gaps across all newly added M004 surfaces

That ordering retires the biggest unknowns first and keeps M004 from degenerating into “copy polish plus a tracking SDK.”