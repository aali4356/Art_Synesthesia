---
estimated_steps: 4
estimated_files: 5
---

# T02: Rebuild gallery cards as editorial collector objects without breaking browse behavior

**Slice:** S03 — Cohesive gallery, compare, share, and export product family
**Milestone:** M003

## Description

Bring gallery browse up to the same collector/editorial level as the rest of the route family by refactoring `GalleryCard` into a premium card object that still preserves every browse interaction and accessibility affordance already established.

## Steps

1. Redesign `GalleryCard` structure and class usage around the editorial collector grammar instead of legacy border/background utilities, using `globals.css` for any reusable card-level tokens needed.
2. Strengthen information hierarchy for title, style, date, optional hint reveal, and action row so the card feels consistent with results/detail surfaces rather than a leftover utility tile.
3. Preserve and, where needed, improve accessible labels and visible states for reveal, upvote, report, delete, and detail-link behaviors.
4. Expand card tests and route-family proof assertions so both interaction behavior and branded-card contract cues are covered.

## Must-Haves

- [ ] Gallery browse cards visibly match the editorial collector system used by the rest of the product family.
- [ ] Reveal, report, upvote, delete, and detail-link behaviors remain intact and test-covered with accessible labels.

## Verification

- `npm test -- src/__tests__/gallery/gallery-card.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- In localhost browser verification, `/gallery` shows cards that feel coherent with results/detail surfaces and still expose the expected interactive behaviors.

## Inputs

- `src/components/gallery/GalleryCard.tsx` — current browse-card behavior and the known coherence gap called out by S03 research
- `src/components/gallery/GalleryGrid.tsx` — gallery browse container that the rebuilt cards must continue to fit without route-shell regressions

## Expected Output

- `src/components/gallery/GalleryCard.tsx` — editorialized collector card with preserved browse interactions
- `src/app/globals.css` — reusable gallery-card tokens or refinements needed to avoid one-off styling drift
- `src/__tests__/gallery/gallery-card.test.tsx` — stronger behavior + branded-contract coverage for gallery cards
- `src/__tests__/app/product-family-coherence.test.tsx` — gallery browse proof extended to assert card-level family coherence
