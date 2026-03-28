---
estimated_steps: 14
estimated_files: 3
skills_used: []
---

# T01: Define the anonymous recent-work storage contract and prove its privacy boundaries

## Why
The highest-risk part of this slice is the persistence contract itself. Executors need a stable, privacy-safe browser-local model before UI wiring begins, otherwise later resume work can accidentally persist raw source text or over-promise full session restoration.

## Steps
1. Add a dedicated recent-work storage module for browser-local continuity, with typed records for edition-family recall, preferred style, timestamps, and lightweight source labels that do not contain raw source content.
2. Cap and order the recent list deterministically, and make corrupt/missing storage recover to an empty state instead of throwing.
3. Encode the explicit continuity posture in the contract/comments: this restores a recent edition family in the same browser, not an exact pixel-identical session snapshot.
4. Add focused unit tests for save/list/read/remove behavior, redaction guarantees, storage cap behavior, and corrupt JSON fallback.

## Must-Haves
- No raw text input, raw URL, raw dataset body, or secret-bearing source material is written to browser storage.
- Stored records contain enough parameter-safe data to reopen a recent edition family from the homepage continuity surface.
- Corrupt or unavailable storage never crashes callers; it degrades to a safe empty state.

## Done when
- A single browser-local helper module is the only supported read/write seam for recent local work.
- Unit tests demonstrate ordering, cap, fallback, and privacy guarantees clearly enough that later tasks can build UI on top without redefining the contract.

## Inputs

- ``src/components/results/ResultsView.tsx``
- ``src/app/page.tsx``
- ``src/lib/gallery/creator-token.ts``

## Expected Output

- ``src/lib/continuity/recent-work.ts``
- ``src/lib/continuity/types.ts``
- ``src/__tests__/continuity/recent-work.test.ts``

## Verification

npm test -- --run src/__tests__/continuity/recent-work.test.ts

## Observability Impact

- Signals added/changed: explicit savedAt/lastOpenedAt continuity metadata and safe-empty fallback for invalid storage.
- How a future agent inspects this: run `npm test -- --run src/__tests__/continuity/recent-work.test.ts` and inspect the recent-work localStorage key in devtools.
- Failure state exposed: corrupt JSON or unsupported storage yields an empty recent-work result instead of an exception.
