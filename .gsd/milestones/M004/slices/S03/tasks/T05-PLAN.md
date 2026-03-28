---
estimated_steps: 19
estimated_files: 7
skills_used:
  - accessibility
  - agent-browser
  - test
---

# T05: Complete gallery modal focus lifecycle, reduced-motion hygiene, and final integrated proof

Close the remaining accessibility breadth gaps in the modal and global motion layer, then run the full regression bundle and browser proof for the slice. This task is the slice closeout gate for both R007 and R010.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Gallery save modal focus lifecycle | Keep the modal closable and surface the existing error text while restoring focus to the opener whenever possible. | Preserve Escape/close behavior and avoid trapping the user permanently. | Keep the modal open with a truthful alert/status rather than losing focus context. |
| Local dev/browser verification | Use an open port (3000 or 3004) and keep the runtime proof focused on real keyboard/failure behavior. | Retry on another open port rather than hardcoding one failing listener. | Capture the failing surface with targeted assertions/debug output before closing the slice. |

## Negative Tests

- **Malformed inputs**: Escape, Tab, Shift+Tab, and close-button interactions all preserve focus restoration and alert/status messaging.
- **Error paths**: gallery save failure and unavailable-state messaging remain readable inside the modal and public-route surfaces.
- **Boundary conditions**: reduced-motion preference disables ornamental transitions/hover lifts without breaking branded styling.

## Steps

1. Add initial focus, focus trap, Escape close, and focus restoration to `GallerySaveModal`, keeping its alert/status states screen-reader readable.
2. Add global reduced-motion overrides in `src/app/globals.css` for transition-heavy editorial surfaces touched in M004.
3. Add/update focused tests for the modal focus lifecycle and any cross-surface assertions needed to preserve product-family wording while the modal/shell behaviors change.
4. Run the full slice regression bundle plus `npm run build`, then perform live browser verification on an open local dev port to confirm safe telemetry, skip-link flow, selector keyboard behavior, modal focus trap, and truthful unavailable-state behavior.

## Must-Haves

- [ ] Opening the gallery modal moves focus inside, traps focus, closes on Escape, and restores focus to the opener.
- [ ] Reduced-motion preference suppresses editorial motion flourishes without stripping the branded layout.
- [ ] The slice closes with one passing regression/build bundle and live browser proof across the real Home → Results → Gallery/Share continuity surfaces.

## Inputs

- ``src/components/gallery/GallerySaveModal.tsx` — current modal seam with missing focus lifecycle.`
- ``src/app/globals.css` — global transition/motion utilities used by the editorial shell.`
- ``src/__tests__/components/results/ResultsView.live-proof.test.tsx` — existing results proof seam to preserve.`
- ``src/__tests__/app/shared-brand-surfaces.test.tsx` — cross-surface wording/route seam.`
- ``src/__tests__/app/product-family-coherence.test.tsx` — privacy-boundary copy contract seam.`
- ``src/__tests__/observability/product-loop-events.test.tsx` — event regression seam from T02.`
- ``src/__tests__/accessibility/keyboard-navigation.test.tsx` — keyboard regression seam from T04.`

## Expected Output

- ``src/components/gallery/GallerySaveModal.tsx` — focus-managed, keyboard-complete gallery modal.`
- ``src/app/globals.css` — reduced-motion overrides for editorial transitions.`
- ``src/__tests__/gallery/save-modal.test.tsx` — modal focus/escape/restore regression coverage.`
- ``src/__tests__/app/shared-brand-surfaces.test.tsx` — preserved shared-surface contract after modal/motion updates.`
- ``src/__tests__/app/product-family-coherence.test.tsx` — preserved privacy/product-language contract after accessibility work.`
- ``src/__tests__/observability/product-loop-events.test.tsx` — integrated event coverage kept passing under final UI changes.`
- ``src/__tests__/accessibility/keyboard-navigation.test.tsx` — final keyboard proof kept passing under closeout changes.`

## Verification

npm test -- --run src/__tests__/gallery/save-modal.test.tsx src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/observability/privacy-filtering.test.ts src/__tests__/observability/product-loop-events.test.tsx src/__tests__/observability/public-route-failures.test.tsx src/__tests__/accessibility/keyboard-navigation.test.tsx && npm run build

## Observability Impact

- Signals added/changed: modal error/status and reduced-motion behavior become regression-visible; final browser proof confirms telemetry and fallback states on the real UI.
- How a future agent inspects this: run the full verification command, then reproduce the keyboard/modal flow in the browser on an open dev port.
- Failure state exposed: trapped focus, motion regressions, and end-to-end telemetry drift become slice-blocking rather than latent.
