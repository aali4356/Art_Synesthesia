# T03: 03-text-analysis-input-ui 03

**Slice:** S03 — **Milestone:** M001

## Description

Add quick-start buttons and the "Surprise me" feature to the landing page, then verify the complete end-to-end flow with a visual checkpoint.

Purpose: Quick-start buttons provide instant gratification -- one click inserts text AND triggers generation. This is critical for first-time user experience: the user sees art immediately without having to think of what to type. The "Surprise me" button adds delight and replayability.

Output: Quick-start buttons and Surprise me on the landing page, wired to auto-trigger generation. Human-verified end-to-end flow.

## Must-Haves

- [ ] "Quick-start buttons below input offer 4-5 diverse text type suggestions"
- [ ] "Clicking a quick-start button inserts text AND auto-triggers generation in one click"
- [ ] "Surprise me button picks from a curated pool of ~50 phrases, different each click"
- [ ] "Quick-start and Surprise me buttons are visible on the landing page below the input zone"

## Files

- `src/components/input/QuickStart.tsx`
- `src/components/input/index.ts`
- `src/data/surprise-phrases.ts`
- `src/app/page.tsx`
