---
estimated_steps: 14
estimated_files: 5
skills_used: []
---

# T03: Make the return-user seam legible across header and action copy

## Why
The slice is not complete if continuity exists technically but still reads like public publishing. This task ensures the shell and action family tell the truth: browser-local continuity is private/local, while share links and gallery saves remain explicit public surfaces.

## Steps
1. Add a lightweight continuity cue in the shared header or shell so returning users have a predictable way to rediscover recent local work.
2. Tighten results/share/gallery copy so the new local-save action, share link action, and gallery action clearly describe their different persistence and privacy scopes.
3. Extend product-family coherence tests to lock the distinction in place and prevent later regressions that blur local continuity with public archive behavior.
4. Keep branded empty-state and editorial language consistent with the existing collector/product family work from M003.

## Must-Haves
- Local continuity wording always says browser-local/private-first and never implies public visibility.
- Share/gallery wording remains explicitly public and parameter-safe/public-opt-in as appropriate.
- The return-user seam is discoverable from the shared shell, not only after generating a new piece.

## Done when
- A returning user can identify where recent local work lives and understand, from copy alone, how it differs from Share and Gallery.
- Coherence tests fail if future edits blur the local/public continuity boundary.

## Inputs

- ``src/components/layout/Header.tsx``
- ``src/components/results/ShareButton.tsx``
- ``src/components/gallery/GallerySaveModal.tsx``
- ``src/components/continuity/RecentLocalWorkPanel.tsx``
- ``src/__tests__/app/product-family-coherence.test.tsx``

## Expected Output

- ``src/components/layout/Header.tsx``
- ``src/components/results/ShareButton.tsx``
- ``src/components/gallery/GallerySaveModal.tsx``
- ``src/components/continuity/RecentLocalWorkPanel.tsx``
- ``src/__tests__/app/product-family-coherence.test.tsx``

## Verification

npm test -- --run src/__tests__/app/product-family-coherence.test.tsx
