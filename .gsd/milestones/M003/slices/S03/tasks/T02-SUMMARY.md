---
id: T02
parent: S03
milestone: M003
provides:
  - Gallery browse cards now use the collector/editorial card system while preserving reveal, upvote, report, delete, and detail-link behavior.
key_files:
  - src/components/gallery/GalleryCard.tsx
  - src/app/globals.css
  - src/__tests__/gallery/gallery-card.test.tsx
  - src/__tests__/app/product-family-coherence.test.tsx
key_decisions:
  - Rebuilt gallery browse cards on dedicated `gallery-collector-card` editorial tokens instead of ad hoc utility styling so browse can stay visually aligned with compare/share/detail surfaces without changing card behavior contracts.
patterns_established:
  - Route-family coherence is enforced at both the component level and proof level by testing branded collector copy plus accessible action labels/states on gallery browse cards.
observability_surfaces:
  - src/__tests__/gallery/gallery-card.test.tsx
  - src/__tests__/app/product-family-coherence.test.tsx
  - localhost /gallery card states for reveal/report/upvote/delete/detail actions
duration: 1h
verification_result: passed
completed_at: 2026-03-13
blocker_discovered: false
---

# T02: Rebuild gallery cards as editorial collector objects without breaking browse behavior

**Shipped an editorialized collector gallery card system that keeps browse interactions and accessibility intact while aligning `/gallery` with the rest of the product family.**

## What Happened

`src/components/gallery/GalleryCard.tsx` was rebuilt around a premium collector-card hierarchy with explicit editorial framing for title, style, publication date, optional hint reveal, action row, and browse-contract copy. The card keeps the existing browse behaviors intact: optional hint text stays concealed until revealed, upvotes remain one-time and locally remembered, reports still post through moderation, owner-only delete still removes the card on success, and both media/detail links continue routing to `/gallery/[id]`.

`src/app/globals.css` now carries reusable `gallery-collector-card*` tokens so the browse surface uses the same collector/editorial design language as the compare, share, results, and detail views instead of drifting into one-off utility styling.

The gallery card tests were expanded to cover both the branded contract and the preserved behaviors. The route-family coherence proof was also extended so slice-level assertions now verify that gallery browse cards visibly belong to the same collector/editorial family as compare, share, and export-adjacent surfaces.

## Verification

- Passed: `npm test -- src/__tests__/gallery/gallery-card.test.tsx src/__tests__/app/product-family-coherence.test.tsx`
- Passed: `npm run build`
- Verified in tests that gallery cards expose accessible labels and stable states for reveal, upvote, report, delete, and detail-link behaviors.
- Verified in proof tests that gallery browse now includes collector-family cues in both component copy and shared styling tokens.

## Diagnostics

- Inspect `src/__tests__/gallery/gallery-card.test.tsx` for interaction-state coverage of reveal/report/upvote/delete/detail-link flows.
- Inspect `src/__tests__/app/product-family-coherence.test.tsx` for route-family proof strings and shared collector-token assertions.
- Inspect `src/components/gallery/GalleryCard.tsx` plus `src/app/globals.css` for the shipped collector-card structure and reusable styling contract.
- In localhost `/gallery`, card-level runtime signals are visible through the optional hint reveal state, upvote disabled state, report confirmation state, owner-only delete control, and detail-link routing.

## Deviations

None.

## Known Issues

- Slice-level browser verification across homepage results, `/gallery`, `/compare`, and DB-backed detail/share routes remains part of T03 final-assembly proof; T02 completed its targeted tests/build verification only.

## Files Created/Modified

- `src/components/gallery/GalleryCard.tsx` — rebuilt the browse card as an editorial collector object while preserving all existing interactions.
- `src/app/globals.css` — added reusable collector-card tokens and interaction styling for gallery browse cards.
- `src/__tests__/gallery/gallery-card.test.tsx` — expanded card-level behavior and branded-contract coverage.
- `src/__tests__/app/product-family-coherence.test.tsx` — extended route-family proof to include gallery browse collector-card coherence.
