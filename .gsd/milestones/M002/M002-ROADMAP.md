# M002: Chromatic Synesthesia Overhaul

**Vision:** Transform Synesthesia Machine from a technically complete generative art app into a visually compelling art engine whose palettes, renderer behavior, and overall synesthetic expressiveness feel premium, varied, and emotionally intentional.

## Success Criteria

- Repeated real-user generations no longer cluster around the same narrow purple/orange/green-feeling palette family; multiple clearly distinct curated palette families are observable in real outputs.
- At least two rendering styles show materially stronger visual expressiveness and art direction in the live results experience, not just in isolated unit tests.
- The upgraded color/synesthesia system remains deterministic, contrast-safe, and wired through the existing generation flow for text, URL, and data inputs.
- A browser-level end-to-end verification demonstrates the improved artwork quality in the actual app interface.

## Key Risks / Unknowns

- Palette-family expansion may increase range but reduce coherence or contrast quality — broader output is not enough if the art becomes muddy or inconsistent.
- Stronger synesthesia logic may become arbitrary rather than principled if palette/renderer changes are not anchored to parameter behavior.
- Renderer-level expressiveness work may diverge by style and create an incoherent cross-style art system.
- Existing automated tests prove correctness well, but they do not fully prove artistic quality; this milestone needs real visual verification.

## Proof Strategy

- Palette-family repetition risk -> retire in S01 by proving multiple deterministic curated families exist, are selected by parameter behavior, and pass test-level coherence/contrast checks.
- Arbitrary synesthesia risk -> retire in S02 by proving upgraded mapping logic changes real outputs in a parameter-principled way across styles.
- Cross-style incoherence risk -> retire in S03 by proving at least two styles visibly benefit from the same upgraded art system while preserving style identity.
- Visual-proof gap -> retire in S04 by proving the assembled system in the live browser with explicit before/after or multi-input visual verification.

## Verification Classes

- Contract verification: unit tests for palette families, mapping logic, deterministic output, contrast safety, and style-specific scene behavior; artifact checks on substantive implementation files.
- Integration verification: real generation flow exercised through existing hooks and result surfaces for text, URL, and data input paths.
- Operational verification: `npm test`, `npm run build`, and a running local app used for browser verification.
- UAT / human verification: visual quality judgment on the live app — specifically that outputs feel materially more premium and less repetitive.

## Milestone Definition of Done

This milestone is complete only when all are true:

- all slices are complete with substantive implementation and verification
- the upgraded palette and synesthesia logic is actually wired into the real generation/results flow
- at least two styles have visibly stronger expression in the live product
- success criteria are re-checked against browser-visible outputs, not only tests
- final integrated acceptance scenarios pass in the actual app

## Requirement Coverage

- Covers: R001, R002
- Partially covers: R003, R005
- Leaves for later: R004, R006, R007, R008, R009, R010
- Orphan risks: none

## Slices

- [ ] **S01: Palette Family System** `risk:high` `depends:[]`
  > After this: deterministic generations can produce multiple clearly different curated palette families with test-level proof that repetition has materially dropped.
- [ ] **S02: Synesthetic Mapping Upgrade** `risk:high` `depends:[S01]`
  > After this: parameter behavior drives palette-family and mood selection more intentionally, with observable changes in real generated outputs.
- [ ] **S03: Renderer Expressiveness Pass** `risk:medium` `depends:[S01,S02]`
  > After this: at least two styles render noticeably richer, more premium compositions in the live results surface while preserving determinism.
- [ ] **S04: Live Art Quality Integration Proof** `risk:medium` `depends:[S01,S02,S03]`
  > After this: the improved art system is verified in the actual browser experience across existing product flows, with evidence suitable for milestone closeout.

## Boundary Map

### S01 -> S02

Produces:
- palette-family selection contract in `src/lib/color/*` with deterministic family identity and richer family metadata
- updated palette-generation invariants covering range, contrast, and family diversity
- test fixtures that prove the new family system spans materially different outputs

Consumes:
- existing deterministic palette primitives, parameter vector schema, and color-module architecture from M001

### S02 -> S03

Produces:
- upgraded parameter-to-aesthetic mapping rules that translate vector behavior into mood/family/composition intent
- stable interfaces consumed by scene builders and results surfaces without breaking existing hooks
- deterministic integration of synesthetic state into render/build paths

Consumes from S01:
- palette-family system, family metadata, and contrast/coherence guarantees

### S03 -> S04

Produces:
- richer scene-builder behavior and/or renderer-specific expression upgrades for at least two styles
- updated thumbnails/results rendering that expose the improved art quality in the live app
- verification-ready visual outputs and fixtures for browser-level proof

Consumes from S01 and S02:
- palette-family outputs and upgraded synesthetic mapping state
