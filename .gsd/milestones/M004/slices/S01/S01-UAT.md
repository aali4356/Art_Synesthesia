# S01: Anonymous-first continuity and return-user seam — UAT

**Milestone:** M004
**Written:** 2026-03-26T04:47:41.942Z

# S01 UAT — Anonymous-first continuity and return-user seam

## Preconditions
- Run the app locally with `npm run dev`.
- Use a clean browser profile or clear local storage for `http://localhost:3000` before Test Case 1.
- Stay in the same browser/device for continuity tests; this slice is intentionally same-browser only.

## Test Case 1 — First-time visitor sees truthful empty continuity state
1. Open `http://localhost:3000`.
   - Expected: The homepage shows the continuity surface near the top/right of the editorial shell.
2. Observe the recent local work panel before generating anything.
   - Expected: Empty-state copy explains that recent local work is browser-local/private-first and that nothing has been saved in this browser yet.
   - Expected: The panel does not imply public persistence, account sync, or gallery publication.
3. Inspect surrounding continuity copy in the shell/header.
   - Expected: The shell offers a discoverable “Recent local work” cue without forcing the user to discover another route.

## Test Case 2 — Save a generated edition into browser-local recent work
1. On the homepage, enter a text prompt such as `A midnight garden humming with static and amber rain.`
2. Generate an edition.
   - Expected: Results render successfully and the results desk appears.
3. In the action desk, locate the continuity action.
   - Expected: There is a dedicated browser-local save action distinct from Share and Save to Gallery.
   - Expected: The surrounding copy states that this save is private, same-browser, and does not store the raw source.
4. Click the browser-local save action.
   - Expected: A visible saved-state confirmation appears (for example, saved to recent local work).
   - Expected: No raw prompt text is surfaced as stored content.

## Test Case 3 — Return to homepage and intentionally reopen saved local work
1. From the results surface, go back to the homepage/editorial desk.
   - Expected: The recent local work panel now shows a saved card instead of the empty state.
2. Inspect the saved card.
   - Expected: It shows lightweight context such as source type/style/palette/freshness labels.
   - Expected: Copy makes clear this is same-browser continuity only and that the original raw source was not stored or published.
3. Click the resume/reopen action for the saved item.
   - Expected: The app reopens into the results surface without requiring the original raw source.
   - Expected: The reopened results identify continuity-safe restoration language (for example, browser-local reopen / proof-safe continuity maintained).
   - Expected: Preferred style and edition-family details remain usable on the restored results view.

## Test Case 4 — Local continuity remains clearly separate from public Share and Gallery flows
1. On the restored results surface, inspect the action desk.
   - Expected: Browser-local save, Share, and Save to Gallery are visually separate actions.
2. Read the Share action copy.
   - Expected: It describes a public, parameter-only route and does not imply private local storage.
3. Open the Gallery save modal.
   - Expected: The modal describes Gallery as a public opt-in edition/archive path.
   - Expected: It does not describe Gallery as private browser-local continuity.
4. Compare all three action descriptions.
   - Expected: A user can tell at a glance which path is private/browser-local and which paths are public.

## Test Case 5 — Reload/return behavior uses saved local metadata instead of raw source replay
1. After saving recent local work, reload the page or revisit `http://localhost:3000` in the same browser.
   - Expected: The homepage continuity surface still shows the saved recent item.
2. Reopen the saved item again.
   - Expected: Results can be reconstructed from stored edition metadata alone.
   - Expected: The product does not ask for the original prompt, full URL, or dataset body.
   - Expected: The continuity messaging stays truthful that this is same-browser edition-family recall, not exact session replay.

## Edge Cases

### Edge Case A — Empty storage / no prior saves
1. Clear local storage and revisit the homepage.
   - Expected: The continuity panel degrades to the branded empty state without crashes or broken layout.

### Edge Case B — Corrupt browser-local continuity payload
1. Manually replace the recent-work local storage value with invalid JSON using devtools.
2. Reload the homepage.
   - Expected: The app does not crash.
   - Expected: The continuity panel falls back to the safe empty state.

### Edge Case C — Privacy boundary check
1. Save recent local work from a text, URL, or data-driven edition.
2. Inspect the recent-work card and continuity messaging.
   - Expected: Only derived labels/context are shown.
   - Expected: Raw prompt text, full URL paths/query strings, and dataset bodies are not exposed as persisted continuity content.

## Verification References
- `npm test -- --run src/__tests__/continuity/recent-work.test.ts`
- `npm test -- --run src/__tests__/app/anonymous-continuity.test.tsx`
- `npm test -- --run src/__tests__/app/product-family-coherence.test.tsx`
