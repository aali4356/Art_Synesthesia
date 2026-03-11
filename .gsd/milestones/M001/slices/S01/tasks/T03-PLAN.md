# T03: 01-foundation-determinism-infrastructure 03

**Slice:** S01 — **Milestone:** M001

## Description

Implement the input canonicalization suite for all four input types: text, JSON, CSV, and URL. Each canonicalizer normalizes input into a stable, deterministic form and tracks what changes were applied (for display in the translation panel).

Purpose: Canonicalization is the first step in the determinism pipeline. Without stable input normalization, the same visual text could produce different hashes and different artwork. This suite ensures all four input types produce consistent canonical forms.
Output: Four canonicalization modules with comprehensive edge-case tests, plus a router that detects input type and dispatches to the correct canonicalizer.

## Must-Haves

- [ ] "Text canonicalization applies NFC, normalizes newlines, trims trailing whitespace"
- [ ] "JSON canonicalization sorts keys alphabetically (recursively) and normalizes numbers"
- [ ] "CSV canonicalization uses PapaParse, trims cells, normalizes empty cells to null"
- [ ] "URL canonicalization lowercases scheme/host, removes default ports, sorts query params, removes fragments"
- [ ] "All canonicalizers return a changes array describing what was modified"
- [ ] "All canonicalizers produce stable output for edge cases: Unicode, empty, whitespace-only, special characters"
- [ ] "Same input always produces identical canonical output across multiple calls"

## Files

- `src/lib/canonicalize/text.ts`
- `src/lib/canonicalize/json.ts`
- `src/lib/canonicalize/csv.ts`
- `src/lib/canonicalize/url.ts`
- `src/lib/canonicalize/index.ts`
- `src/__tests__/canonicalize/text.test.ts`
- `src/__tests__/canonicalize/json.test.ts`
- `src/__tests__/canonicalize/csv.test.ts`
- `src/__tests__/canonicalize/url.test.ts`
