---
id: S01
parent: M003
milestone: M003
provides:
  - A runtime-proven editorial landing→generation→results journey on the real homepage entrypoint, with branded continuity and privacy-safe proof/action surfaces
key_files:
  - src/app/page.tsx
  - src/components/input/InputZone.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Shell.tsx
  - src/components/results/ResultsView.tsx
  - src/components/results/ExportControls.tsx
  - src/components/results/ShareButton.tsx
  - src/components/gallery/GallerySaveModal.tsx
  - src/app/globals.css
  - src/__tests__/app/home-editorial-flow.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
key_decisions:
  - Define slice completion with failing-then-passing homepage proof, preserved results diagnostics contract, passing production build, and real browser verification including honest URL failure-path inspection
  - Express the editorial redesign through shared shell/panel/action tokens so landing and results participate in one reusable branded system
  - Extend the same editorial token layer to results action cards, modal shells, chips, and form fields instead of relying on undefined semantic utility classes
patterns_established:
  - Use the real homepage route plus mocked analysis hooks to prove branded landing/results continuity without weakening privacy-safe diagnostics requirements
  - Keep generation progress, proof diagnostics, and export/share/save states as browser-visible first inspection seams inside the same editorial panel system
observability_surfaces:
  - src/__tests__/app/home-editorial-flow.test.tsx
  - src/__tests__/components/results/ResultsView.live-proof.test.tsx
  - homepage progress state and ResultsView proof diagnostics at src/app/page.tsx
  - visible export/share/save state copy and GallerySaveModal privacy messaging
  - browser network evidence for POST /api/analyze-url 500 in local no-DB mode
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T04-SUMMARY.md
duration: 4h 20m
verification_result: passed
completed_at: 2026-03-11
---

# S01: Editorial landing, generation, and results journey

**Shipped a real homepage editorial journey that explains Synesthesia Machine clearly, carries the same gallery-luxe system from intake through results, and stays honest about both privacy-safe proofing and the remaining local URL failure path.**

## What Happened

S01 started by turning the milestone intent into an executable contract instead of informal design taste. A new homepage flow test now exercises the real `src/app/page.tsx` route with mocked analysis hooks and asserts the empty-state narrative, branded continuity cues, results-stage framing, visible action surfaces, and privacy-safe diagnostics posture. The existing `ResultsView` live-proof test stayed focused on derived diagnostics and raw-input redaction so redesign work could not silently erode the privacy boundary.

With that proof in place, the real homepage was rebuilt into an editorial gallery-luxe entry surface. `src/app/page.tsx`, `Shell`, `Header`, `InputZone`, `layout.tsx`, and `globals.css` were recomposed around a dark branded launch composition that explains what Synesthesia Machine is, why it is distinct, and how to begin. The real text, URL, and data controls stayed intact and keyboard-usable, but they now live inside one visible control desk with explicit private-first framing, curated prompt context, and branded support copy instead of a sparse utility form.

The landing/results seam was then closed by restructuring `ResultsView` into the same editorial system. Results now present the canvas, diagnostics, active style, and action cluster inside branded panels and chips that visually match the landing state. `ExportControls`, `ShareButton`, and `GallerySaveModal` were moved off brittle undefined semantic utility classes and onto explicit shared editorial tokens, which also clarified public-preview and privacy messaging for save/share flows. The route now reads as one continuous product surface instead of a decorative hero followed by a fallback tool UI.

Finally, the slice was closed with operational proof rather than test-only confidence. The targeted homepage/results tests passed, the production build passed, and the localhost app was exercised in a browser from landing to successful text generation to results. That live verification confirmed the editorial continuity, visible proof diagnostics, and branded action desk in the real app. The remaining local URL limitation was also tested directly: URL mode surfaces a visible `Unknown error`, and browser network logs show the real failing request as `POST /api/analyze-url -> 500`, so the limit is exposed rather than hidden even though the copy is still too weak for launch quality.

## Verification

- Passed `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- Passed `npm run build`
- Browser-verified at `http://localhost:3000`:
  - landing narrative and controls: `Synesthesia Machine`, `Private-first proofing`, `Compose from language`, `Text, URL, and data enter the same gallery desk.`
  - successful text generation continuity: `From source to proof`, `The artwork, proof, and controls stay on the same editorial stage.`, `proof diagnostics`, `renderer expressiveness`, `Collect, export, or share this edition.`
  - inspected URL failure path: visible `Unknown error` plus browser network evidence `POST http://127.0.0.1:3000/api/analyze-url -> 500`

## Requirements Advanced

- R003 — The real homepage and results route now share an editorial gallery-luxe visual system instead of a decorative landing shell followed by utilitarian results UI.
- R009 — The entry flow now explains what Synesthesia Machine is, why it is distinct, and how to start through launch-facing copy, metadata, curated prompts, and private-first framing.
- R004 — The highest-risk continuity seam between landing, generation, and results now works as one branded product journey in the real browser, creating the baseline downstream surfaces must match.
- R010 — The slice preserved keyboard-usable generation controls and explicit privacy-safe proof surfaces while increasing visual ambition, advancing accessibility quality without fully closing it.
- R005 — The live entrypoint is now materially stronger for public portfolio demos because the homepage journey can be shown end-to-end in a branded, browser-verified state.

## Requirements Validated

- none

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

none

## Known Limitations

- URL analysis still fails in local no-DB proof mode because `POST /api/analyze-url` reaches a DB-backed path and returns 500.
- The visible URL failure copy is still `Unknown error`, which is inspectable but not yet launch-quality diagnostic messaging.
- S02 still needs to propagate the branded shell/action/viewer language across downstream route-level seams so the editorial system is not homepage/results-only.

## Follow-ups

- Improve the user-facing URL failure copy so local no-DB behavior is explained truthfully at the control surface instead of collapsing to `Unknown error`.
- Reuse the S01 editorial token layer across shared viewer, shell, and action primitives in S02 rather than creating route-specific restyles.
- Preserve the homepage/results proof diagnostics seam as downstream routes adopt the same branded system so future redesign work does not hide operational truth.

## Files Created/Modified

- `src/__tests__/app/home-editorial-flow.test.tsx` — added executable proof for branded landing/results continuity and privacy-safe homepage behavior.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — preserved the privacy-safe live-proof diagnostics contract while allowing the visual restructure.
- `src/app/page.tsx` — rebuilt the homepage into a branded editorial landing and continuity-aware results composition.
- `src/components/input/InputZone.tsx` — reframed the real text/URL/data controls as a branded control desk without changing underlying behavior.
- `src/components/layout/Header.tsx` — aligned top-level chrome to the editorial/private-first brand narrative.
- `src/components/layout/Shell.tsx` — added ambient shell framing that supports the gallery-luxe direction across the route.
- `src/app/layout.tsx` — updated root metadata to carry the launch-facing editorial positioning.
- `src/components/results/ResultsView.tsx` — restructured results into editorial panels while keeping diagnostics, style switching, and action clarity visible.
- `src/components/results/ExportControls.tsx` — moved export states onto explicit editorial action-card semantics.
- `src/components/results/ShareButton.tsx` — rebuilt share states as branded editorial surfaces with privacy-safe copy.
- `src/components/gallery/GallerySaveModal.tsx` — restyled the save modal and clarified public-preview/privacy posture.
- `src/app/globals.css` — added reusable editorial shell, panel, action, modal, chip, and form tokens used by the redesigned journey.
- `.gsd/DECISIONS.md` — recorded the shared-token decisions that anchor landing and results in one branded system.
- `.gsd/milestones/M003/M003-ROADMAP.md` — marked S01 complete.
- `.gsd/PROJECT.md` — refreshed current project state to include the completed homepage/results editorial journey.
- `.gsd/STATE.md` — advanced active state from S01 completion to S02 ready-to-plan.

## Forward Intelligence

### What the next slice should know
- The strongest reusable asset from S01 is not just the homepage visuals; it is the shared editorial token layer in `src/app/globals.css`. S02 should extend those primitives across route shells and viewer surfaces instead of introducing another parallel styling system.
- The existing homepage integration test and ResultsView live-proof test are the safest guardrails for downstream redesign work. Keep them green while expanding coherence elsewhere.

### What's fragile
- URL-mode failure UX — the underlying failure is visible and inspectable, but the current `Unknown error` copy is too generic and could be mistaken for unfinished polish instead of an intentional truthful limitation.
- Shared semantics still depend on incremental token accretion in `globals.css` — without deliberate consolidation in S02, the branded system could drift into route-by-route utility sprawl.

### Authoritative diagnostics
- `src/__tests__/app/home-editorial-flow.test.tsx` — this is the clearest executable contract for landing/results continuity and branded narrative expectations.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — this remains the authoritative privacy-safe diagnostics contract and catches raw-input leakage regressions.
- Browser network logs for `POST /api/analyze-url` — this is the most trustworthy signal for the remaining local URL limitation because it proves the visible failure is backed by a real runtime dependency issue.

### What assumptions changed
- "A strong hero plus existing results screen might be enough for S01" — false; the slice only became coherent once the results surface, export/share/save actions, and modal flows were pulled into the same editorial system.
- "Visible failure is probably sufficient for URL mode" — only partially true; visibility is now honest, but the current copy quality is still below the product bar and should be addressed in later work.
