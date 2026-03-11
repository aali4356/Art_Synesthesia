# T02: 01-foundation-determinism-infrastructure 02

**Slice:** S01 — **Milestone:** M001

## Description

Implement the determinism infrastructure: seeded PRNG, SHA-256 hashing, engine versioning, cache key generation, and ESLint Math.random() ban. This establishes the determinism contract that all rendering and analysis code must follow.

Purpose: Determinism is the core product promise. Every subsequent phase inherits these guarantees. PRNG + hashing + versioning = reproducible artwork.
Output: Engine modules (version, hash, prng, cache keys) with full test coverage and ESLint enforcement.

## Must-Haves

- [ ] "Same input string always produces the same SHA-256 hash"
- [ ] "Seeded PRNG produces identical sequences for the same seed across invocations"
- [ ] "Different seeds produce different PRNG sequences"
- [ ] "PRNG seed correctly derives from SHA-256(canonicalizedInput + styleName + engineVersion)"
- [ ] "ESLint fails when Math.random() appears in lib/render/ or lib/pipeline/ directories"
- [ ] "Engine version object contains all four version components"
- [ ] "Cache keys incorporate correct version components"

## Files

- `src/lib/engine/version.ts`
- `src/lib/engine/hash.ts`
- `src/lib/engine/prng.ts`
- `src/lib/cache/keys.ts`
- `eslint.config.mjs`
- `src/__tests__/engine/version.test.ts`
- `src/__tests__/engine/hash.test.ts`
- `src/__tests__/engine/prng.test.ts`
- `src/__tests__/cache/keys.test.ts`
