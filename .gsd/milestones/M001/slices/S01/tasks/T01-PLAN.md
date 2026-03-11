# T01: 01-foundation-determinism-infrastructure 01

**Slice:** S01 — **Milestone:** M001

## Description

Scaffold the Next.js project with TypeScript, Tailwind CSS v4, ESLint, Vitest, and Geist fonts. Establish the folder structure that all subsequent plans build upon.

Purpose: Every other plan in Phase 1 (and all subsequent phases) depends on this project skeleton existing. This is the foundation.
Output: A running Next.js 15 app with all toolchain configured and a sample test passing.

## Must-Haves

- [ ] "Next.js dev server starts without errors on localhost:3000"
- [ ] "TypeScript compilation succeeds with strict mode"
- [ ] "Vitest test runner executes and passes a sample test"
- [ ] "ESLint runs without configuration errors"
- [ ] "Geist Sans and Geist Mono fonts load in the browser"

## Files

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `vitest.config.mts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
