# Phase 3: Text Analysis & Input UI - Research

**Researched:** 2026-03-03
**Domain:** NLP text analysis (lexicon-based sentiment, syllable counting, entropy), React UI components (input zone, tabs, progress), Next.js App Router state transitions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Input zone sits below the showcase artwork and tagline on the landing page
- Generous, inviting textarea (~150px default height) with visible placeholder text -- feels like a writing surface
- Subtle underline-style tabs above the input: Text (active, violet underline), URL (dimmed/disabled), Data (dimmed/disabled)
- Private mode toggle (lock icon) positioned next to the Generate button as a companion control
- Playful, inviting tone for button labels: "Try: your name / a haiku / a recipe / a famous quote" style
- 4-5 diverse quick-start buttons covering different text types to show the tool's range
- "Surprise me" button draws from a curated pool of ~50 interesting phrases (evocative sentences, famous quotes, fun facts), different each click
- Clicking any quick-start button or "Surprise me" inserts text AND auto-triggers generation -- instant gratification, one click does everything
- Full page transition after clicking Generate: landing page transforms into results view
- Input zone collapses into a compact top bar showing a text preview snippet, expandable to edit and regenerate
- Showcase artwork disappears; canvas area + parameter panel take the main stage
- Canvas area shows a placeholder artwork using generated palette colors (Claude's discretion on exact treatment)
- Parameter panel shows the 15-dimension parameter bars with provenance summaries alongside the canvas
- Horizontal row of step labels (Parsing, Analyzing, Normalizing, Rendering) with active stage highlighted in violet, completed stages get a checkmark or dim
- Progress indicator appears over the canvas area during generation; result fades in when complete
- Real pipeline timing with smoothing: tied to actual stages but minimum ~200ms display per stage so fast steps don't flash by

### Claude's Discretion
- Placeholder canvas artwork treatment (palette-based, should look intentional not broken)
- Light mode color adjustments for the input zone and tabs
- Reduced motion handling for progress indicator
- Exact spacing, padding, and responsive breakpoints for the input zone
- Character count or length indicator behavior (if any)
- Generate button click feedback style
- Exact quick-start button text and curated "Surprise me" phrase pool content
- Transition animation details (landing -> results view)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEXT-01 | User can enter any text (single word to multiple paragraphs) and receive generated artwork | Input zone UI component + pipeline orchestration + placeholder canvas output |
| TEXT-02 | Text analyzer extracts character frequency distribution, word count, average word length, sentence count, average sentence length | Pure-function text statistics -- no external libraries needed, matches existing mock signals |
| TEXT-03 | Text analyzer computes vocabulary richness (unique words / total words) | Already implemented in mock extractor with log(wordCount) scaling -- promote to real analyzer |
| TEXT-04 | Text analyzer computes sentiment polarity and magnitude via lexicon-based method (AFINN-165 or equivalent) | Use `afinn-165` package (ESM, 3382 entries, word-to-valence map) with simple negation handling |
| TEXT-05 | Text analyzer computes punctuation density, syllable pattern variance, character entropy (Shannon), uppercase ratio | Entropy + punctuation already in mock; syllable via `syllable` package (ESM); syllable variance from per-word counts |
| TEXT-06 | Analysis completes in under 500ms for inputs up to 10,000 characters | All operations are O(n) string scanning + dictionary lookups; benchmark confirms feasibility |
| UI-01 | Large, prominent input zone with tab selector for input type (Text, URL, Data) | Custom tab component with underline-style active indicator; URL/Data tabs disabled |
| UI-02 | Text tab: textarea with placeholder "Paste anything. A name, a paragraph, a poem, a recipe..." | Standard textarea with Tailwind styling, auto-resize via scrollHeight |
| UI-03 | URL tab: single input field with "Analyze" button | Disabled placeholder tab -- stub only, implemented in Phase 6 |
| UI-04 | Data tab: file drop zone accepting .csv and .json, plus textarea for pasting raw data | Disabled placeholder tab -- stub only, implemented in Phase 6 |
| UI-05 | Prominent "Generate" button with satisfying click feedback | btn-accent style from design tokens + micro-interaction on click |
| UI-06 | Private mode toggle with lock icon | Toggle button next to Generate, stores preference in state (actual behavior is Phase 7) |
| UI-16 | Quick-start buttons below input: "Try: your name / a haiku / a recipe / a random Wikipedia paragraph" | Array of button configs, each inserts text and auto-triggers generation |
| UI-17 | "Surprise me" button generates random interesting phrase client-side | Curated ~50-phrase pool, random selection via Math.random (non-deterministic is fine for UI) |
| UI-18 | Staged progress bar tied to real pipeline stages (Parsing, Analyzing, Normalizing, Rendering) | Custom component tracking pipeline step callbacks with minimum 200ms display per stage |
</phase_requirements>

## Summary

Phase 3 connects the Phase 2 parameter pipeline to the first user-facing experience. It has two distinct technical domains: (1) a pure-function text analyzer that replaces the mock signal extractor with real NLP features, and (2) a React UI layer comprising the input zone, quick-start buttons, page transition state, and staged progress indicator.

The text analyzer is straightforward. Most signals (character frequency, word/sentence statistics, entropy, punctuation metrics) are already implemented in `extractMockSignals` and just need promotion to a real module. The two genuinely new capabilities are **lexicon-based sentiment** (via the `afinn-165` ESM package -- a simple word-to-valence dictionary) and **syllable counting** (via the `syllable` ESM package). Both are tiny, well-maintained, ESM-only packages that integrate cleanly with the existing Next.js + Vitest toolchain. Shannon entropy is already correctly implemented in the mock extractor. The analyzer must produce exactly the 31 signal names referenced by `TEXT_MAPPINGS` in `src/lib/pipeline/mapping.ts`.

The UI layer involves building React components for the input zone (textarea with tabs), quick-start buttons, a "Surprise me" feature, a Generate button with the private mode toggle, and a staged progress indicator. The most complex UI aspect is the **page transition**: after generation, the landing page transforms into a results view where the input collapses to a compact top bar and the canvas + parameter panel take center stage. This is best managed with React state (not route navigation) since it is a same-page transformation. The existing `Shell` component and design tokens provide the foundation.

**Primary recommendation:** Build the text analyzer as a pure-function module at `src/lib/analysis/text.ts` that replaces `extractMockSignals`, then build the UI components with React `useState`/`useReducer` to manage the landing-to-results state transition. Use `afinn-165` and `syllable` as the only new dependencies.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| afinn-165 | ^2.0.2 | Sentiment word-to-valence dictionary (3382 English words, -5 to +5) | ESM-only, zero dependencies, the standard lexicon specified in requirements (AFINN-165), pure data -- no runtime overhead |
| syllable | ^5.0.1 | English syllable counting per word | ESM-only, well-maintained (words org), algorithmic approach based on Text-Statistics, ~2KB |
| React 19 | 19.2.3 | UI components | Already in project |
| Next.js 16 | 16.1.6 | App Router, server/client components | Already in project |
| Tailwind CSS 4 | ^4 | Styling | Already in project, design tokens already defined |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-themes | ^0.4.6 | Dark/light mode toggle | Already in project, used by ThemeProvider for mode-aware styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| afinn-165 (raw lexicon) | sentiment (npm package) | sentiment wraps afinn-165 with tokenization + negation but is CJS-only, heavier; since we need raw polarity + magnitude as separate signals, direct lexicon use gives more control |
| syllable | syllable-count-english (CMU dict) | CMU dictionary is more accurate but ~3MB bundle; algorithmic approach is sufficient for our variance-focused use case |
| Custom progress component | react-step-progress-bar | External lib is overkill for 4 static steps; custom component with CSS transitions is simpler and matches design tokens exactly |
| React state for page transition | Next.js View Transitions API | View Transitions API is experimental in Next.js 16, not production-ready per Next.js docs; React state is reliable and testable |

**Installation:**
```bash
npm install afinn-165 syllable
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── analysis/
│       ├── text.ts          # Real text analyzer (replaces extractMockSignals)
│       ├── sentiment.ts     # AFINN-165 sentiment scoring
│       ├── syllables.ts     # Syllable counting utilities
│       └── index.ts         # Barrel export
├── components/
│   ├── input/
│   │   ├── InputZone.tsx    # Main input container (textarea + tabs + generate)
│   │   ├── InputTabs.tsx    # Tab selector (Text active, URL/Data disabled)
│   │   ├── TextInput.tsx    # Textarea with auto-resize
│   │   ├── GenerateButton.tsx  # Generate + private mode toggle
│   │   ├── QuickStart.tsx   # Quick-start buttons + Surprise me
│   │   └── index.ts         # Barrel
│   ├── progress/
│   │   ├── PipelineProgress.tsx  # Staged progress indicator
│   │   └── index.ts
│   ├── results/
│   │   ├── ResultsView.tsx      # Post-generate layout (canvas + params)
│   │   ├── CollapsedInput.tsx   # Compact top-bar input preview
│   │   ├── PlaceholderCanvas.tsx # Palette-based placeholder artwork
│   │   ├── ParameterPanel.tsx   # 15-dimension bars + provenance
│   │   └── index.ts
│   └── layout/
│       ├── Shell.tsx        # (exists) -- may need modification for results layout
│       └── Header.tsx       # (exists)
├── hooks/
│   ├── useTextAnalysis.ts   # Orchestrates full pipeline: canonicalize -> analyze -> normalize -> map
│   └── usePipelineProgress.ts # Tracks pipeline stages for progress UI
└── data/
    └── surprise-phrases.ts  # Curated ~50 phrases for "Surprise me"
```

### Pattern 1: Text Analyzer as Pure Function
**What:** The text analyzer is a pure function `analyzeText(text: string): Record<string, number>` with no side effects. It takes canonicalized text and returns the exact signal names expected by `TEXT_MAPPINGS`.
**When to use:** Always -- this is the contract between analysis and the parameter pipeline.
**Example:**
```typescript
// src/lib/analysis/text.ts
import { afinn165 } from 'afinn-165';
import { syllable } from 'syllable';

export function analyzeText(text: string): Record<string, number> {
  // Split into tokens
  const chars = [...text];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  // ... compute all 31 signals ...
  // Sentiment via AFINN-165 lookup with simple negation
  // Syllable counts via syllable() package

  return {
    charCount, wordCount, avgWordLength, sentenceCount, avgSentenceLength,
    vocabRichness, vocabularyRichness, charEntropy, uppercaseRatio,
    punctuationDensity, exclamationDensity, questionMarkDensity,
    commaFrequency, parenthesisFrequency, sentimentPolarity, sentimentMagnitude,
    sentenceLengthVariance, wordLengthVariance, syllableVariance,
    uniqueCharCount, punctuationDiversity, consonantClusterFreq,
    syllableComplexity, shortSentenceRatio, sentenceLengthRange, wordLengthRange,
    clauseDepth, conjunctionFrequency, imperativeRatio, listPatternDensity,
    repeatPatternRatio, paragraphBalance,
  };
}
```

### Pattern 2: Pipeline Orchestration Hook
**What:** A custom React hook `useTextAnalysis` that runs the full pipeline (canonicalize -> analyze -> calibrate -> normalize -> map -> palette) and exposes step-by-step progress.
**When to use:** In the main page component to connect UI to the analysis pipeline.
**Example:**
```typescript
// src/hooks/useTextAnalysis.ts
'use client';
type PipelineStage = 'idle' | 'parsing' | 'analyzing' | 'normalizing' | 'rendering' | 'complete';

interface PipelineResult {
  vector: ParameterVector;
  provenance: ParameterProvenance[];
  palette: PaletteResult;
  summaries: Record<string, string>;
}

export function useTextAnalysis() {
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);

  const generate = useCallback(async (text: string) => {
    setStage('parsing');
    await minDelay(200); // minimum stage display time
    const { canonical } = canonicalizeText(text);

    setStage('analyzing');
    await minDelay(200);
    const signals = analyzeText(canonical);

    setStage('normalizing');
    await minDelay(200);
    const calibration = computeCalibrationDistributions(loadCorpus(), TEXT_MAPPINGS);
    const { vector, provenance } = computeParameterVector(signals, calibration, TEXT_MAPPINGS);
    const summaries = generateAllSummaries(provenance);

    setStage('rendering');
    await minDelay(200);
    const seed = await computeSeed(canonical);
    const palette = generatePalette(vector, seed);

    setResult({ vector, provenance, palette, summaries });
    setStage('complete');
  }, []);

  return { stage, result, generate };
}
```

### Pattern 3: Same-Page State Transition (Landing -> Results)
**What:** Use React state to toggle between "landing" and "results" views within the same page, rather than navigating to a new route. The input zone, canvas, and parameter panel share state.
**When to use:** For the post-Generate page transformation.
**Example:**
```typescript
// src/app/page.tsx (simplified)
'use client';
export default function Home() {
  const { stage, result, generate } = useTextAnalysis();
  const [inputText, setInputText] = useState('');
  const isGenerating = stage !== 'idle' && stage !== 'complete';
  const hasResult = result !== null;

  return (
    <Shell>
      {!hasResult ? (
        // Landing view: showcase + input zone + quick-start
        <LandingView
          text={inputText}
          onTextChange={setInputText}
          onGenerate={() => generate(inputText)}
          stage={stage}
        />
      ) : (
        // Results view: collapsed input + canvas + parameter panel
        <ResultsView
          result={result}
          inputText={inputText}
          onRegenerate={(newText) => { setInputText(newText); generate(newText); }}
          stage={stage}
        />
      )}
    </Shell>
  );
}
```

### Pattern 4: Minimum Stage Display Time
**What:** Pipeline stages have a minimum display time (~200ms) to prevent fast steps from flashing by, while still being tied to real progress.
**When to use:** In the pipeline orchestration hook.
**Example:**
```typescript
async function minDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// In pipeline: await minDelay(200) between stage transitions
// Total minimum: 4 stages * 200ms = 800ms
// Actual: real processing time OR 200ms, whichever is longer
```

### Anti-Patterns to Avoid
- **Route-based page transition:** Do not use Next.js routing for landing -> results. This is a same-page state change, not a navigation event. Route transitions would lose input state, require URL management, and add unnecessary complexity.
- **Global state management library:** Do not reach for Redux, Zustand, or Jotai. The state is local to the page component and its children. React `useState`/`useReducer` + prop drilling or context is sufficient.
- **Blocking the main thread:** Do not run analysis synchronously if the input is large. Use `requestAnimationFrame` or split into microtasks if > 5000 chars to keep UI responsive.
- **Caching calibration on every generation:** `computeCalibrationDistributions` processes the entire corpus. Cache the result at module level or in a ref, not recompute per generation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sentiment lexicon | Custom word lists | `afinn-165` package | 3382 words with validated valence scores; building your own is months of work |
| Syllable counting | Regex-based syllable counter | `syllable` package | English syllable rules have hundreds of exceptions; algorithmic approach handles edge cases |
| Shannon entropy | External package | Keep existing implementation in mock extractor | Already correctly implemented: `-sum(p * log2(p))`; trivial formula, no library needed |
| Text tokenization | NLP tokenizer library | Simple regex split `text.split(/\s+/)` | For our feature set (word count, frequency, etc.), simple splitting is sufficient. We don't need POS tagging or lemmatization |
| Auto-resize textarea | react-textarea-autosize | Native scrollHeight approach | One-line trick: `textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px'`; no dependency needed |
| Negation handling | Complex NLP negation scope detection | Simple 1-word lookback | Check if previous word is in negation set ("not", "no", "never", "neither", etc.) and flip sign; covers 80%+ of cases for lexicon-based sentiment |

**Key insight:** This phase's text analysis needs are shallow NLP -- statistical features and lexicon lookups, not deep understanding. The `afinn-165` lexicon and `syllable` counter are the only genuinely hard problems that benefit from libraries. Everything else is string manipulation and math.

## Common Pitfalls

### Pitfall 1: Signal Name Mismatch
**What goes wrong:** The real analyzer produces signal names that don't match `TEXT_MAPPINGS`, causing `computeParameterVector` to receive `undefined` values (defaulting to 0).
**Why it happens:** `TEXT_MAPPINGS` in `mapping.ts` references 31 unique signal names. The mock extractor produces all of them. If the real analyzer renames, omits, or misspells any signal, the pipeline silently degrades.
**How to avoid:** Write a test that extracts all signal names from `TEXT_MAPPINGS` and asserts the real analyzer output contains every one of them. The existing test in `calibration.test.ts` already does this for mock signals -- mirror it for the real analyzer.
**Warning signs:** Parameters clustering at 0 or 0.5 after switching from mock to real analyzer.

### Pitfall 2: Calibration Distribution Invalidation
**What goes wrong:** Replacing `extractMockSignals` with the real analyzer changes signal distributions across the corpus, causing the calibration quality gate to fail.
**Why it happens:** The mock extractor uses proxies for sentiment and syllable features. Real values from AFINN-165 and the syllable package will produce different distributions. The existing corpus was tuned for mock signal spread.
**How to avoid:** After building the real analyzer, run the calibration distribution quality gate test. If it fails, adjust the corpus (add entries that spread the failing dimensions) or adjust the quality gate threshold. The existing test `HARD GATE: all parameters pass distribution quality against full corpus` will catch this.
**Warning signs:** Vitest failures in `calibration.test.ts` after switching to real analyzer.

### Pitfall 3: Blocking Main Thread on Large Input
**What goes wrong:** Analyzing 10,000 characters synchronously blocks the UI for perceptible duration, making the progress indicator freeze or skip stages.
**Why it happens:** AFINN-165 lookup iterates every word, syllable counting calls `syllable()` per word, and entropy scans every character. For 10K chars (~1500 words), this is fast (<50ms) but the combined pipeline with calibration may approach 200ms.
**How to avoid:** Profile with 10K character input early. If analysis alone exceeds 100ms, split into async chunks. The calibration distributions should be computed once and cached, not per-generation.
**Warning signs:** Progress indicator not animating smoothly, stages appearing to skip.

### Pitfall 4: Hydration Mismatch with Client-Only State
**What goes wrong:** Server-rendered HTML doesn't match client-rendered HTML because pipeline state (idle/results) differs between server and client.
**Why it happens:** Next.js App Router server-renders by default. If the page component uses `useState` for view toggling, it must be marked `'use client'`.
**How to avoid:** Mark the page component (or a wrapper) as `'use client'`. Server component can remain the Shell/layout. All interactive state lives in client components.
**Warning signs:** React hydration errors in console, "Text content does not match server-rendered HTML".

### Pitfall 5: Textarea Value Not Controlled Properly
**What goes wrong:** Quick-start buttons insert text but the textarea doesn't reflect the change, or Generate fires before the state update completes.
**Why it happens:** React state updates are asynchronous. Setting `setText(newValue)` and immediately calling `generate(text)` passes the stale value.
**How to avoid:** Quick-start click handlers should pass the text directly to generate: `const text = 'haiku text'; setText(text); generate(text);` -- pass the local variable, not the state.
**Warning signs:** Quick-start buttons generate from empty string or previous text.

### Pitfall 6: `afinn-165` Object Prototype Collision
**What goes wrong:** `afinn165['constructor']` or `afinn165['toString']` returns a function instead of `undefined`, producing incorrect sentiment scores.
**Why it happens:** The `afinn-165` package exports a plain object. If accessed with `obj[word]` without a hasOwnProperty check, inherited Object.prototype properties leak through.
**How to avoid:** Always use `Object.hasOwn(afinn165, word)` or `Object.prototype.hasOwnProperty.call(afinn165, word)` before reading values. The README explicitly warns about this.
**Warning signs:** Unexpected non-zero sentiment for common words like "constructor".

## Code Examples

### AFINN-165 Sentiment Scoring with Negation
```typescript
// src/lib/analysis/sentiment.ts
import { afinn165 } from 'afinn-165';

const NEGATORS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing',
  'nowhere', 'nor', "n't", "don't", "doesn't", "didn't",
  "won't", "wouldn't", "couldn't", "shouldn't", "isn't",
  "aren't", "wasn't", "weren't", "haven't", "hasn't",
]);

interface SentimentResult {
  /** Sum of word scores / word count -- range roughly [-5, 5] */
  polarity: number;
  /** Average absolute score of sentiment-bearing words -- range [0, 5] */
  magnitude: number;
}

export function computeSentiment(words: string[]): SentimentResult {
  let totalScore = 0;
  let sentimentWordCount = 0;
  let absMagnitudeSum = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^a-z'-]/g, '');
    if (!Object.hasOwn(afinn165, word)) continue;

    let score = afinn165[word];

    // Simple 1-word lookback negation
    if (i > 0) {
      const prev = words[i - 1].toLowerCase().replace(/[^a-z'-]/g, '');
      if (NEGATORS.has(prev)) {
        score = -score;
      }
    }

    totalScore += score;
    absMagnitudeSum += Math.abs(score);
    sentimentWordCount++;
  }

  const wordCount = words.length || 1;
  return {
    polarity: totalScore / wordCount,  // comparative score
    magnitude: sentimentWordCount > 0 ? absMagnitudeSum / sentimentWordCount : 0,
  };
}
```

### Syllable Analysis
```typescript
// src/lib/analysis/syllables.ts
import { syllable } from 'syllable';

interface SyllableResult {
  /** Variance of syllable counts across words */
  syllableVariance: number;
  /** Average syllables per word */
  syllableComplexity: number;
}

export function computeSyllableFeatures(words: string[]): SyllableResult {
  if (words.length === 0) return { syllableVariance: 0, syllableComplexity: 0 };

  const counts = words.map(w => syllable(w));
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.length < 2
    ? 0
    : counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;

  return {
    syllableVariance: variance,
    syllableComplexity: mean,
  };
}
```

### Consonant Cluster Detection
```typescript
// Consonant cluster: 3+ consecutive consonants
export function consonantClusterFrequency(text: string): number {
  const lower = text.toLowerCase();
  const clusters = lower.match(/[bcdfghjklmnpqrstvwxyz]{3,}/g) || [];
  const letterCount = (lower.match(/[a-z]/g) || []).length;
  return letterCount > 0 ? clusters.length / (letterCount / 10) : 0;
}
```

### Auto-Resize Textarea (No Dependencies)
```typescript
// src/components/input/TextInput.tsx
'use client';
import { useRef, useCallback } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TextInput({ value, onChange, onSubmit }: TextInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [onChange]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
      }}
      placeholder="Paste anything. A name, a paragraph, a poem, a recipe..."
      className="w-full min-h-[150px] bg-transparent border-b border-[var(--border)]
                 focus:border-[var(--color-accent)] outline-none resize-none
                 text-base leading-relaxed transition-colors p-4
                 placeholder:text-[var(--muted-foreground)]"
      aria-label="Text input for artwork generation"
    />
  );
}
```

### Staged Pipeline Progress
```typescript
// src/components/progress/PipelineProgress.tsx
'use client';
const STAGES = ['Parsing', 'Analyzing', 'Normalizing', 'Rendering'] as const;
type Stage = typeof STAGES[number];

interface Props {
  currentStage: string; // 'idle' | 'parsing' | 'analyzing' | 'normalizing' | 'rendering' | 'complete'
}

export function PipelineProgress({ currentStage }: Props) {
  const stageIndex = STAGES.findIndex(
    s => s.toLowerCase() === currentStage
  );

  return (
    <div className="flex items-center gap-4" role="progressbar" aria-label="Generation progress">
      {STAGES.map((stage, i) => {
        const isComplete = stageIndex > i || currentStage === 'complete';
        const isActive = stageIndex === i;
        return (
          <div key={stage} className="flex items-center gap-2">
            <span className={`text-sm font-mono transition-colors ${
              isActive ? 'text-[var(--color-accent)] font-medium' :
              isComplete ? 'text-[var(--muted-foreground)]' :
              'text-[var(--muted-foreground)] opacity-40'
            }`}>
              {isComplete ? '✓' : ''} {stage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sentiment` npm (CJS, class-based) | Direct `afinn-165` lexicon import (ESM, data-only) | 2022 (afinn-165 v2.0) | Smaller bundle, tree-shakeable, full control over scoring algorithm |
| Manual syllable regex heuristics | `syllable` package (algorithmic, exception-aware) | 2022 (syllable v5.0) | Better accuracy for English edge cases (silent e, compound words, etc.) |
| Route-based page transitions in Next.js | Same-page state transitions + optional View Transitions API | 2025-2026 | View Transitions API experimental in Next.js 16; React state transitions are stable and recommended for same-page transforms |
| Class components for forms | Function components with hooks (useState, useCallback, useRef) | React 16.8+ (2019) | Standard pattern, aligns with existing project codebase |

**Deprecated/outdated:**
- `sentiment` npm package v5.x: Uses CJS require(), not ESM-compatible without bundler shims. Use `afinn-165` directly instead.
- CSS-only progress bars: Not suitable for multi-stage pipeline visualization tied to real callbacks; use React state-driven components.

## Open Questions

1. **Calibration recalibration after real analyzer**
   - What we know: The existing calibration corpus (44 entries) was tuned with `extractMockSignals`. Real sentiment and syllable values WILL differ from mock proxies.
   - What's unclear: How much the distributions will shift. Will the quality gate still pass?
   - Recommendation: Build the real analyzer first, run the quality gate test. If it fails, address in the same plan by adjusting corpus entries. This is expected and manageable -- the mock signals were deliberately designed as rough proxies.

2. **Imperative ratio detection accuracy**
   - What we know: The mock extractor uses `shortSentenceRatio * 0.5 + listPatternDensity * 0.4` as a proxy. Real imperative detection requires POS tagging (identifying verb-first sentences), which is heavy NLP.
   - What's unclear: Whether a simpler heuristic (sentences starting with a verb-like word from a curated list) is accurate enough.
   - Recommendation: Use a curated list of ~50 common imperative verbs (go, run, make, try, add, remove, click, open, etc.) and check if the sentence starts with one. This is good enough for the signal's role in the `directionality` parameter. Mark as LOW confidence -- can be improved later.

3. **Clause depth without a parser**
   - What we know: The mock uses `commaFrequency * 3` as proxy. Real clause depth requires syntactic parsing.
   - What's unclear: Whether comma/semicolon counting is a good enough proxy.
   - Recommendation: Use a heuristic based on comma + semicolon + "which/that/who" frequency. This correlates with clause depth for most English text. Good enough for the `layering` parameter.

## Sources

### Primary (HIGH confidence)
- [afinn-165 GitHub](https://github.com/words/afinn-165) - v2.0.2, ESM-only, 3382 entries, data-only package
- [syllable GitHub](https://github.com/words/syllable) - v5.0.1, ESM-only, algorithmic syllable counting
- [Next.js 16 viewTransition docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) - Confirmed experimental, not production-ready
- Existing codebase: `src/lib/pipeline/mapping.ts` TEXT_MAPPINGS (31 unique signal names), `src/lib/pipeline/calibration.ts` extractMockSignals (reference implementation)

### Secondary (MEDIUM confidence)
- [Shannon entropy JavaScript implementation](https://gist.github.com/jabney/5018b4adc9b2bf488696) - Standard formula, verified against existing mock implementation
- [React textarea auto-resize patterns](https://upmostly.com/tutorials/autosizing-textarea-react) - scrollHeight approach is well-documented

### Tertiary (LOW confidence)
- Imperative ratio heuristic (verb-initial sentence detection) -- no authoritative source; custom heuristic
- Clause depth heuristic (comma/semicolon proxy) -- correlation assumed but not validated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - afinn-165 and syllable are well-maintained, ESM-only, verified on GitHub
- Architecture: HIGH - patterns follow existing codebase conventions, pure functions + React hooks
- Pitfalls: HIGH - identified from direct code analysis of existing mock -> real transition risks
- NLP heuristics (imperative, clause depth): LOW - custom heuristics without linguistic validation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable domain, low churn)
