# S03: Privacy-filtered observability and accessibility breadth — UAT

**Milestone:** M004
**Written:** 2026-03-27T03:27:02.683Z

# S03: Privacy-filtered observability and accessibility breadth — UAT

**Milestone:** M004
**Written:** 2026-03-27

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S03 changes both invisible runtime contracts (privacy-filtered observability and categorized failures) and real interaction behavior (keyboard/focus/modal/reduced-motion), so completion requires automated proof, production build proof, and live browser confirmation on the real Home → Results → public-surface loop.

## Preconditions

- Dependencies are installed.
- `npm test -- --run src/__tests__/gallery/save-modal.test.tsx src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/observability/privacy-filtering.test.ts src/__tests__/observability/product-loop-events.test.tsx src/__tests__/observability/public-route-failures.test.tsx src/__tests__/accessibility/keyboard-navigation.test.tsx` passes.
- `npm run build` passes.
- Start a local app instance for this repo on a verified free port (for example `npm run dev -- --port 3010`).
- If localhost proof looks wrong, confirm the port is actually serving Art_Synesthesia before continuing.

## Smoke Test

1. Open the homepage.
2. Confirm the page title is **Synesthesia Machine — Editorial chromatic portraits**.
3. Confirm the page shows browser-local continuity framing and the input/editorial desk.
4. **Expected:** The app loads as Synesthesia Machine, not another local project, and the homepage clearly distinguishes browser-local continuity from public routes.

## Test Cases

### 1. Skip link lands on the real main content target

1. Load the homepage.
2. Press `Tab` once.
3. Confirm focus lands on **Skip to main content**.
4. Press `Enter`.
5. **Expected:** Focus moves to the main content region (`#shell-main-content`) and keyboard users bypass the header/nav immediately.

### 2. Generate a result and keep the product loop intact

1. In the text input, enter `A midnight city reflected in rain with cello overtones.`
2. Activate **Generate**.
3. Wait for the results surface to appear.
4. Confirm the results page still states that raw input is hidden and continuity is proof-safe.
5. **Expected:** A real result renders, the action desk appears, and diagnostics stay derived/proof-safe instead of exposing the original source.

### 3. Style selector is keyboard-usable and semantically truthful

1. On the results surface, focus the active style tabs.
2. Confirm only one style tab has `aria-selected="true"` and `tabindex="0"`.
3. Use `ArrowRight` to move from **Organic** or **Geometric** to another style (for example **Particle**).
4. **Expected:** Focus and selection move together, the newly active tab becomes selected, and the results surface updates without requiring a mouse.

### 4. Gallery modal focus enters, traps, and restores correctly

1. Activate **Save to Gallery** from the results action desk.
2. **Expected:** Focus moves into the dialog on the title field.
3. Press `Tab` and confirm focus stays inside the dialog controls.
4. Press `Escape`.
5. **Expected:** The dialog closes and focus returns to the same **Save to Gallery** opener button in the results action desk.

### 5. Public gallery save failures stay truthful and readable in local proof mode

1. Reopen **Save to Gallery**.
2. Enter a title such as `Rain Cello Proof`.
3. Activate **Save to Gallery** inside the modal.
4. **Expected:** In local no-DB proof mode, the modal remains readable and shows the alert `DATABASE_URL is not set` instead of crashing, hanging, or exposing raw payload details.
5. Close the dialog.
6. **Expected:** Focus returns to the opener again.

### 6. Branded unavailable states remain inspectable

1. Open `/share/missing-link` in the same local app.
2. Confirm the page heading reads **Share viewer unavailable**.
3. Confirm the diagnostics panel shows `DATABASE_URL is not set`.
4. **Expected:** The route renders a branded unavailable state with truthful diagnostics rather than a blank screen, generic error page, or hidden backend failure.

### 7. Continuity/public-route wording stays honest across surfaces

1. On the homepage, confirm recent local work is described as browser-local/private to this device.
2. On the results surface, confirm Compare/Gallery/Share are described as route-based or public surfaces rather than local recall.
3. In the gallery modal, confirm the privacy posture states this is a public opt-in gallery save and not a browser-local continuity action.
4. **Expected:** Home, Results, and Gallery modal preserve one truthful local-vs-public persistence contract.

## Edge Cases

### A. Missing telemetry env vars

1. Run the app without PostHog/Sentry env vars configured.
2. Load the homepage and generate a result.
3. **Expected:** The app remains fully usable; observability stays inert/no-op rather than blocking boot or user actions.

### B. No database in local proof mode

1. Run the app without `DATABASE_URL`.
2. Attempt gallery save and open `/share/missing-link`.
3. **Expected:** Failures are categorized and visibly truthful (`DATABASE_URL is not set`), while the rest of the product loop remains usable.

### C. Reduced-motion preference

1. Enable reduced motion in the OS/browser.
2. Revisit homepage, results, and modal flows.
3. **Expected:** Decorative motion flourishes are suppressed, but layout, readability, and control affordances remain intact.

## Failure Signals

- Skip link does not move focus to the main region.
- Style tabs require a mouse, lose selected state, or break on Arrow/Home/End navigation.
- Gallery modal opens without moving focus inside, allows focus to escape unexpectedly, or does not restore focus to the opener after close.
- Gallery save or share unavailable flows crash, hang, blank, or reveal raw request/source content.
- The app refuses to boot or interact when telemetry env vars are missing.
- Home/Results/Gallery surfaces blur browser-local continuity with public share/gallery persistence.

## Requirements Proved By This UAT

- R007 — failure visibility is now privacy-filtered, categorized, and inspectable across core product-loop and public-route failure surfaces.
- R010 — full keyboard navigation and accessible interaction semantics are complete across the redesigned repeat-use surfaces.
- R005 — launch-readiness is advanced through passing build proof, better degraded-state truthfulness, and live browser verification, though broader deployment hardening remains M005 work.

## Not Proven By This UAT

- Production dashboard setup or alert routing for deployed observability providers.
- Fully functional DB-backed gallery/share persistence in local no-DB proof mode.
- Broader launch/deploy hardening beyond the repeat-use observability/accessibility seam.

## Notes for Tester

The key judgment for this slice is not just whether a happy path works. The product should stay private-first, keyboard-usable, and diagnostically truthful at the same time — especially when telemetry env vars are missing or DB-backed public routes are intentionally unavailable locally.
