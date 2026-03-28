---
estimated_steps: 14
estimated_files: 7
skills_used:
  - accessibility
  - test
---

# T04: Make the shared shell and selector controls keyboard-complete

Repair the keyboard and semantic gaps that are currently concentrated in the shared shell, input mode switcher, and style selector. This task should make users able to skip past navigation, understand the active input surface semantically, and change styles without a mouse.

## Negative Tests

- **Malformed inputs**: Arrow/Home/End/Tab key sequences on the input switcher and style selector keep focus/selection stable instead of breaking state.
- **Error paths**: disabled typographic style for data inputs stays non-interactive but still understandable to assistive tech.
- **Boundary conditions**: first render, resumed results, and data-input mode all keep active/disabled semantics truthful.

## Steps

1. Add a real skip link and focusable main target in `src/components/layout/Shell.tsx` so keyboard users can bypass the header/nav quickly.
2. Replace the partial tab semantics in `src/components/input/InputTabs.tsx` with a truthful native-button or fully wired tab pattern that matches `InputZone` behavior and keyboard expectations.
3. Convert `StyleSelector` from clickable ARIA-decorated containers into keyboard-operable native controls with explicit active/disabled state, including arrow-key support if true tab semantics are retained.
4. Add focused accessibility/regression tests that prove skip-link behavior, selector semantics, and the data-input disabled-state contract.

## Must-Haves

- [ ] The shell exposes a visible-on-focus skip link that lands on the main content target.
- [ ] Input mode switching is keyboard-usable and semantically truthful to assistive tech.
- [ ] Style selection no longer depends on mouse-only clickable containers.

## Inputs

- ``src/components/layout/Shell.tsx` — shared shell main-region seam.`
- ``src/components/input/InputTabs.tsx` — partial tab semantics that need truth or simplification.`
- ``src/components/input/InputZone.tsx` — consumer of the input-switcher semantics.`
- ``src/components/results/StyleSelector.tsx` — current mouse-only style chooser.`
- ``src/__tests__/components/StyleSelector.test.tsx` — existing selector regression seam.`
- ``src/__tests__/app/home-editorial-flow.test.tsx` — homepage acceptance seam to preserve shell/input behavior.`

## Expected Output

- ``src/components/layout/Shell.tsx` — skip-link and focusable main-target wiring.`
- ``src/components/input/InputTabs.tsx` — keyboard-usable input selector semantics.`
- ``src/components/input/InputZone.tsx` — truthful panel/selection wiring for the input surface.`
- ``src/components/results/StyleSelector.tsx` — keyboard-operable style controls.`
- ``src/__tests__/accessibility/keyboard-navigation.test.tsx` — explicit keyboard/skip-link regression coverage.`
- ``src/__tests__/components/StyleSelector.test.tsx` — updated selector semantics coverage.`
- ``src/__tests__/app/home-editorial-flow.test.tsx` — preserved homepage behavior under the new keyboard semantics.`

## Verification

npm test -- --run src/__tests__/accessibility/keyboard-navigation.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/app/home-editorial-flow.test.tsx

## Observability Impact

- Signals added/changed: none at the telemetry layer, but keyboard and selected/disabled state become inspectable through explicit test assertions and DOM semantics.
- How a future agent inspects this: run the keyboard-navigation and style-selector suites, then inspect focus order/roles in the browser.
- Failure state exposed: skip-link absence, broken keyboard selection, and false disabled-state semantics become immediately visible in regression tests.
