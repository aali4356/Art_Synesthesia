---
id: M004
title: "M004: Product Coherence and Continuity - Context"
status: complete
completed_at: 2026-03-28T04:32:05.347Z
key_decisions:
  - Use privacy-filtered, env-optional PostHog and Sentry seams so observability is inspectable without blocking local proof mode.
  - Treat returning-user continuity as edition-family recall reconstructed from parameter-safe metadata, not exact raw-session replay.
  - Keep recent local work browser-local, privacy-safe, and explicitly distinct from public Share and Gallery persistence.
  - Derive adaptive onboarding and navigation state from existing continuity state and explicit route/continuity props instead of adding a second persisted onboarding system.
  - Single-source continuity telemetry in the recent-work hook and route all client/server observability payloads through shared redaction-owned adapters.
  - Use native control semantics, a real skip-link/main target, and explicit modal focus restoration to close accessibility gaps across the repeat-use loop.
key_files:
  - src/lib/continuity/types.ts
  - src/lib/continuity/recent-work.ts
  - src/hooks/useRecentWorks.ts
  - src/app/page.tsx
  - src/components/continuity/RecentLocalWorkPanel.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Shell.tsx
  - src/components/results/ResultsView.tsx
  - src/components/results/ShareButton.tsx
  - src/components/gallery/GallerySaveModal.tsx
  - src/app/layout.tsx
  - src/lib/observability/privacy.ts
  - src/lib/observability/events.ts
  - src/lib/observability/client.ts
  - src/lib/observability/server.ts
  - src/components/viewers/BrandedViewerScaffold.tsx
lessons_learned:
  - The safest repeat-use seam was browser-local edition-family recall built from parameter-safe metadata rather than exact session replay.
  - Cross-surface privacy language needs executable tests; copy review alone is too weak for continuity/share/gallery truth boundaries.
  - Adaptive onboarding stayed simpler and more truthful when derived from existing continuity state instead of introducing a second onboarding persistence system.
  - Env-optional observability lets launch-oriented diagnostics ship now without breaking local proof mode or no-DB verification flows.
  - Accessibility fixes on custom product surfaces become more robust when real button semantics and opener-targeted modal focus restoration replace generic ARIA-only containers.
  - Local browser proof is only trustworthy after confirming the active localhost port is actually serving this repository's Next app.
---

# M004: M004: Product Coherence and Continuity - Context

**M004 turned Synesthesia Machine into a truthful repeat-use product by adding anonymous-first continuity, adaptive onboarding/navigation, and privacy-filtered observability/accessibility coverage across the real product loop.**

## What Happened

M004 closed the product-coherence gap that remained after the M003 redesign. S01 established an anonymous-first browser-local recent-work seam that stores only privacy-safe edition-family metadata, lets users save from the real Results UI, and intentionally reopen recent work from Home/Header without persisting raw source text, full URLs, dataset bodies, or replay-grade session state. S02 then turned that seam into a repeat-use product layer by deriving first-visit versus returning/resumed guidance from continuity state, adding a shared navigation landmark with truthful active-route semantics across Home, Compare, and Gallery, and extending Results with explicit next-step cues that preserve the local-versus-public boundary. S03 completed the milestone by adding env-optional privacy-filtered PostHog/Sentry observability seams, safe product-loop and public-route event capture, keyboard/focus and reduced-motion coverage across the redesigned surfaces, and branded unavailable-state diagnostics for local no-DB proof mode. Milestone verification confirmed real non-.gsd code changes exist, all slice summaries and task summaries are present, the assembled Home/Header/Results/Compare/Gallery contract is coherent, and the milestone regression bundle passed end-to-end with 12 files / 69 tests.

## Success Criteria Results

- **SC1 — Anonymous-first continuity is real, intentional, and truthful:** Met. S01 delivered browser-local recent work with deterministic ordering, cap behavior, safe fallback, and explicit privacy redaction. Evidence: `src/__tests__/continuity/recent-work.test.ts`, `src/__tests__/app/anonymous-continuity.test.tsx`, `src/__tests__/app/product-family-coherence.test.tsx`, and S01 live browser proof of save → return → reopen without raw-source persistence.
- **SC2 — First-time and returning visitors receive adaptive guidance without route-discovery guesswork:** Met. S02 derived homepage/editorial guidance from continuity state, added shared navigation with active-route semantics, and added results next-step cues. Evidence: `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/app/shared-brand-surfaces.test.tsx`, `src/__tests__/components/results/ResultsView.live-proof.test.tsx`, plus S02 browser verification.
- **SC3 — Product-family copy stays coherent across local continuity, Share, Gallery, and route surfaces:** Met. S01 and S02 enforced one cross-surface privacy/copy contract separating browser-local recall from public Share/Gallery persistence. Evidence: `src/__tests__/app/product-family-coherence.test.tsx`, `src/__tests__/app/anonymous-continuity.test.tsx`, and slice-level browser proof.
- **SC4 — Privacy-filtered observability and branded fallback behavior were delivered:** Met. S03 added shared privacy redaction helpers, product-loop/public-route event capture, and truthful unavailable-state handling. Evidence: `src/__tests__/observability/privacy-filtering.test.ts`, `src/__tests__/observability/product-loop-events.test.tsx`, `src/__tests__/observability/public-route-failures.test.tsx`, plus S03 live browser proof of visible `/api/gallery` 503 and `/share/missing-link` unavailable states.
- **SC5 — Accessibility breadth across the new continuity/onboarding surfaces was covered:** Met. S03 completed skip-link/main-target semantics, keyboard-operable selectors, gallery modal focus lifecycle, and reduced-motion behavior. Evidence: `src/__tests__/accessibility/keyboard-navigation.test.tsx`, `src/__tests__/components/StyleSelector.test.tsx`, `src/__tests__/gallery/save-modal.test.tsx`, plus live browser proof.
- **Code-change verification:** Met. `git diff --stat HEAD $(git merge-base HEAD master) -- ':!.gsd/'` showed extensive non-`.gsd/` changes across `src/`, `package.json`, and related runtime/test files, confirming the milestone produced real product code rather than planning-only artifacts.
- **Milestone regression bundle:** Met. `npm test -- --run src/__tests__/continuity/recent-work.test.ts src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/observability/privacy-filtering.test.ts src/__tests__/observability/product-loop-events.test.tsx src/__tests__/observability/public-route-failures.test.tsx src/__tests__/accessibility/keyboard-navigation.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/gallery/save-modal.test.tsx` passed with **12 files / 69 tests**.

## Definition of Done Results

- **All roadmap slices complete:** Met. S01, S02, and S03 are all marked complete in the milestone context and their summary files exist under `.gsd/milestones/M004/slices/`.
- **All slice summaries exist:** Met. Verified `S01-SUMMARY.md`, `S02-SUMMARY.md`, and `S03-SUMMARY.md` are present.
- **Task summaries exist for completed work:** Met. Verified task summaries exist for S01/T01-T03, S02/T01-T03, and S03/T01-T05.
- **Cross-slice integration works correctly:** Met. S02 successfully consumed S01's browser-local continuity seam and privacy boundary; S03 successfully instrumented and accessibility-hardened the S01/S02 product loop without reopening storage contracts. Evidence includes the milestone regression bundle and slice/browser proof across Home, Header, Results, Compare, Gallery, and public-route fallbacks.
- **Horizontal checklist:** No separate horizontal checklist items were surfaced in the milestone validation packet beyond the explicit success criteria and verification classes above.
- **Decision re-evaluation:**

| Decision | Re-evaluation |
|---|---|
| D042 / D044 — Use privacy-filtered PostHog + Sentry for M004 observability | Still valid. S03 delivered env-optional shared observability seams and passing privacy/product-loop/public-route tests without blocking boot or local proof mode. |
| D043 — Treat continuity as edition-family recall, not exact replay | Still valid. S01 proved truthful reopen behavior from parameter-safe metadata and copy explicitly preserves the recall-not-replay contract. |
| D045 / D046 / D047 — Store only privacy-safe browser-local recent-work metadata and reconstruct reopened work from parameter-safe snapshots | Still valid. Save/resume functionality worked in tests and browser proof while excluding raw source content and replay-grade state. |
| D048 — Keep local continuity clearly distinct from public Share/Gallery persistence language | Still valid. Product-family coherence tests and browser proof showed the local-vs-public boundary remained truthful across surfaces. |
| D050 / D051 / D052 / D053 — Derive onboarding/navigation state from continuity state and explicit route/continuity props | Still valid. S02 delivered adaptive homepage/header/results guidance without adding a second persistence system, and route-family semantics stayed stable. |
| D054 — Use native button semantics plus explicit skip-link/focus lifecycle management for accessibility fixes | Still valid. Keyboard-navigation, StyleSelector, and gallery save-modal suites passed, and live proof confirmed usable focus behavior. |
| D055 / D056 — Single-source continuity telemetry in hooks and emit sanitized server-side route events through shared adapters | Still valid. S03's observability suites passed and the no-DB unavailable-state diagnostics stayed inspectable without privacy regressions. |
| D049 / D057 / D058 / D059 — Requirement validations recorded during milestone execution | Still valid. The evidence bundle supports R008, R010, and R007 as validated outcomes. |


## Requirement Outcomes

- **R008 → Validated:** Supported by S01 plus milestone regression proof. Evidence: browser-local recent-work contract tests, anonymous continuity tests, product-family coherence tests, and live save/return/resume verification show same-browser reopen without persisting raw source content.
- **R007 → Validated:** Supported by S03. Evidence: privacy-filtering, product-loop-events, and public-route-failures suites passed, and the live proof showed branded, inspectable unavailable states without raw-source leakage.
- **R010 → Validated:** Supported by S03. Evidence: keyboard-navigation, StyleSelector, and gallery save-modal suites passed, with live proof covering skip-link navigation, selector semantics, modal focus restoration, and reduced-motion behavior.
- **R004 → Remains Active but materially advanced:** S01 and S02 reduced cross-surface drift by aligning Home, Header, Results, Compare, Gallery, Share, and continuity language into one truthful product-family contract. The milestone advanced the requirement but did not fully reclassify ownership or status beyond the existing active state.
- **Requirement register alignment:** `REQUIREMENTS.md` already reflects the milestone-era validated states for R007, R008, and R010 and keeps R004 active with M004/S01 and M004/S02 as supporting slices.

## Deviations

No plan-invalidating deviations were found. Minor milestone caveats were preserved as follow-up items: dev-only textarea hydration warnings observed during local proof, and local no-DB verification still exercises branded Gallery unavailable states instead of a provisioned backend.

## Follow-ups

M005 should focus on launch hardening: production environment/deploy guidance, deeper runtime/build reliability, and any remaining operational gaps around local no-DB proof versus provisioned environments. Also investigate the dev-only textarea hydration-mismatch warning further if it persists outside local proof mode.
