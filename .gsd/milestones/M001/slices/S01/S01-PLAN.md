# S01: Foundation Determinism Infrastructure

**Goal:** Scaffold the Next.
**Demo:** Scaffold the Next.

## Must-Haves


## Tasks

- [x] **T01: 01-foundation-determinism-infrastructure 01** `est:15min`
  - Scaffold the Next.js project with TypeScript, Tailwind CSS v4, ESLint, Vitest, and Geist fonts. Establish the folder structure that all subsequent plans build upon.

Purpose: Every other plan in Phase 1 (and all subsequent phases) depends on this project skeleton existing. This is the foundation.
Output: A running Next.js 15 app with all toolchain configured and a sample test passing.
- [x] **T02: 01-foundation-determinism-infrastructure 02** `est:12min`
  - Implement the determinism infrastructure: seeded PRNG, SHA-256 hashing, engine versioning, cache key generation, and ESLint Math.random() ban. This establishes the determinism contract that all rendering and analysis code must follow.

Purpose: Determinism is the core product promise. Every subsequent phase inherits these guarantees. PRNG + hashing + versioning = reproducible artwork.
Output: Engine modules (version, hash, prng, cache keys) with full test coverage and ESLint enforcement.
- [x] **T03: 01-foundation-determinism-infrastructure 03** `est:15min`
  - Implement the input canonicalization suite for all four input types: text, JSON, CSV, and URL. Each canonicalizer normalizes input into a stable, deterministic form and tracks what changes were applied (for display in the translation panel).

Purpose: Canonicalization is the first step in the determinism pipeline. Without stable input normalization, the same visual text could produce different hashes and different artwork. This suite ensures all four input types produce consistent canonical forms.
Output: Four canonicalization modules with comprehensive edge-case tests, plus a router that detects input type and dispatches to the correct canonicalizer.
- [x] **T04: 01-foundation-determinism-infrastructure 04** `est:10min`
  - Implement the design system foundation: dark/light mode with next-themes, responsive layout shell, OKLCH color tokens, and the gallery-inspired visual aesthetic. This plan establishes the visual language that all subsequent UI work builds upon.

Purpose: The design system defines how the app looks and feels. User locked decisions require a gallery/museum aesthetic with near-black dark mode, Geist fonts, violet accent, and minimal chrome. This plan implements all of those decisions.
Output: ThemeProvider, ThemeToggle, responsive Shell, and CSS custom properties with OKLCH color palette.

## Files Likely Touched

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `vitest.config.mts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/lib/engine/version.ts`
- `src/lib/engine/hash.ts`
- `src/lib/engine/prng.ts`
- `src/lib/cache/keys.ts`
- `eslint.config.mjs`
- `src/__tests__/engine/version.test.ts`
- `src/__tests__/engine/hash.test.ts`
- `src/__tests__/engine/prng.test.ts`
- `src/__tests__/cache/keys.test.ts`
- `src/lib/canonicalize/text.ts`
- `src/lib/canonicalize/json.ts`
- `src/lib/canonicalize/csv.ts`
- `src/lib/canonicalize/url.ts`
- `src/lib/canonicalize/index.ts`
- `src/__tests__/canonicalize/text.test.ts`
- `src/__tests__/canonicalize/json.test.ts`
- `src/__tests__/canonicalize/csv.test.ts`
- `src/__tests__/canonicalize/url.test.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/theme/ThemeProvider.tsx`
- `src/components/theme/ThemeToggle.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Shell.tsx`
- `src/__tests__/components/ThemeToggle.test.tsx`
