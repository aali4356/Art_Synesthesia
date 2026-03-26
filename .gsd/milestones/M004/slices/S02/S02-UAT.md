# S02: Adaptive onboarding, empty states, and repeat-use navigation — UAT

**Milestone:** M004
**Written:** 2026-03-26T17:20:23.289Z

# S02 UAT — Adaptive onboarding, empty states, and repeat-use navigation

## Preconditions
- Run the app locally and open it in a browser profile where you can clear or preserve local storage intentionally.
- Use one clean browser session for first-visit checks and the same session afterward for returning-user checks.
- For local proof mode, it is acceptable if `Gallery` renders its truthful unavailable state because `DATABASE_URL` is not configured.

## Test Case 1 — First-time visitor sees a clear start path
1. Open `/` in a clean browser session with no Synesthesia Machine recent local work saved.
   - Expected: The hero shows first-visit guidance, including a clear start path into the real input controls.
2. Confirm the page explains that recent local work is browser-local/private while Compare and Gallery are public route surfaces.
   - Expected: The privacy boundary is explicit before any generation happens.
3. Confirm the shared header exposes Home / Recent local work, Compare, and Gallery.
   - Expected: Navigation is visible immediately; no route-discovery guesswork is required.
4. Scroll to the input area.
   - Expected: The input guidance explains how to begin with Text, URL, or Data and does not rely on hidden onboarding state.

## Test Case 2 — Generate an edition and verify results next steps
1. On `/`, enter a text prompt and click **Generate**.
   - Expected: Results render on the same editorial surface.
2. In the results action area, locate the next-step guidance block.
   - Expected: It explains when to go back Home / Recent local work, when to use Compare, and that Gallery/Share are explicit public routes rather than browser-local recall.
3. Verify the next-step links are present.
   - Expected: Links to Home / Recent local work, Compare, and Gallery are visible and usable.

## Test Case 3 — Save browser-local work and verify returning-user mode
1. From generated results, click **Save this edition to recent local work**.
   - Expected: The save control confirms the edition is saved in this browser.
2. Return to the homepage using the built-in back/home route.
   - Expected: The homepage changes from first-visit language to returning-user guidance.
3. Inspect the recent local work panel.
   - Expected: It shows a saved edition card, labels the continuity as same-browser/private, and does not reveal raw source text.
4. Inspect the hero and input guidance.
   - Expected: They now emphasize resuming recent local work or starting fresh without losing the browser-local/private versus public-route distinction.
5. Click the resume action for the saved local work.
   - Expected: Results reopen from browser-local continuity and still show the same next-step guidance contract as fresh results.

## Test Case 4 — Shared navigation stays coherent across routes
1. On `/`, use the shared header navigation to open **Compare**.
   - Expected: Compare loads with `aria-current`/active-route semantics on Compare and route-intro copy that matches the shared product family.
2. Read the Compare intro copy.
   - Expected: It frames Compare as part of the same route-discovery language established on Home and Results.
3. Use the shared header navigation to open **Gallery**.
   - Expected: Gallery becomes the active route in the shared nav.
4. If Gallery is unavailable in local proof mode, inspect the screen.
   - Expected: The unavailable state is truthful, branded, and diagnostic rather than misleadingly empty; it should explain that the collector archive could not be loaded in local proof mode.

## Test Case 5 — Edge cases and regression-sensitive boundaries
1. Refresh `/` after saving browser-local work.
   - Expected: Returning-user guidance still appears because recent local work was loaded from browser-local continuity.
2. Confirm that saved local work messaging never claims to be public, shared, or account-backed.
   - Expected: The copy consistently says browser-local/private or same-browser continuity only.
3. Confirm Compare and Gallery are never described as browser-local recall.
   - Expected: They remain clearly framed as public/shared route surfaces.
4. Confirm no new onboarding route or wizard is required to use the product.
   - Expected: Home remains the real start/resume surface and the shared header remains the primary navigation seam.

