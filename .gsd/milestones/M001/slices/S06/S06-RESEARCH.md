# Phase 6: URL & Data Input - Research

**Researched:** 2026-03-04
**Domain:** SSRF-safe URL fetching, HTML content extraction, CSV/JSON statistical analysis, rate limiting, pipeline integration
**Confidence:** HIGH

## Summary

Phase 6 adds two new input types (URL and structured data) to the existing art generation pipeline. The core challenge is threefold: (1) securely fetching external URLs with SSRF protection (DNS resolution before connecting, private IP blocking, redirect validation), (2) extracting meaningful signals from HTML pages and structured data (CSV/JSON) that map to the existing 15-dimension parameter vector, and (3) integrating these new analyzers into the existing pipeline hook and UI tab system with snapshot caching and rate limiting.

The project already has strong infrastructure in place. URL canonicalization (`src/lib/canonicalize/url.ts`) handles scheme/host normalization, query param sorting, and fragment removal. CSV canonicalization (`src/lib/canonicalize/csv.ts`) uses PapaParse for parsing. The pipeline architecture (`computeParameterVector` with `MappingTable` and `CalibrationData`) is designed to accept any mapping table and raw signal record. The calibration harness currently has 53 text entries and explicitly notes that URL/data corpus entries are deferred to this phase (PARAM-03).

**Primary recommendation:** Build SSRF protection as a standalone server-side utility module (not a library dependency). Use cheerio for HTML parsing, reuse the existing text analyzer on extracted page text, and use simple-statistics for data analysis. URL fetching must happen server-side via a Next.js API route. Rate limiting uses in-memory Map (Redis deferred to Phase 7 infrastructure).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| URL-01 | User can enter a URL and receive generated artwork based on page content | URL analyzer signals -> URL_MAPPINGS -> computeParameterVector; new useUrlAnalysis hook; InputTabs enables URL tab |
| URL-02 | URL analyzer extracts page title, main text content, dominant colors from CSS/styles, link density, content-to-HTML ratio | cheerio for HTML parsing; CSS color extraction via style/meta tags; text analyzer reuse on extracted content |
| URL-03 | URL snapshot mode (default) stores parameters and content fingerprint | In-memory Map keyed by canonicalizedUrl; store analysis result + content hash |
| URL-04 | URL live mode (opt-in) always fetches fresh content with warning | UI toggle in URL input; bypasses snapshot cache; warning text when toggled |
| URL-05 | User can explicitly re-fetch a snapshot to create a new one | Re-fetch button in URL results view; clears snapshot entry, re-runs pipeline |
| URL-06 | URL analysis completes in under 5 seconds including fetch | 10s fetch timeout + fast cheerio parsing; total budget well within 5s for normal pages |
| DATA-01 | User can upload CSV/JSON files or paste raw data | File input (accept .csv,.json) + textarea; detect format from content/extension |
| DATA-02 | Data analyzer computes column/key count, row count, numeric distributions | PapaParse for CSV, JSON.parse for JSON; simple-statistics for mean/variance/skew/kurtosis |
| DATA-03 | Data analyzer computes null/missing ratio, correlation strength, categorical cardinality | simple-statistics sampleCorrelation; null counting from parsed data; Set.size for cardinality |
| DATA-04 | Data analyzer identifies data type mix (numeric vs string vs date) | Type detection heuristic: isNaN check, date regex, remaining = string; compute proportions |
| DATA-05 | Data analysis completes in under 2 seconds for 10,000 rows | PapaParse + simple-statistics are fast; 10k rows is well within budget client-side |
| SEC-01 | SSRF protection: block private IP ranges, internal hostnames, restrict to http/https, resolve DNS before connecting | Custom isPrivateIp() + dns.resolve4/resolve6 before fetch; protocol allowlist |
| SEC-02 | URL fetch limits: 10-second timeout, 5MB max response, max 3 redirects | AbortController timeout; Content-Length check + streaming byte count; manual redirect following with validation |
| SEC-03 | Rate limiting: max 10 URL analyses per IP per hour with remaining quota shown in UI | In-memory sliding window Map; API route returns X-RateLimit-Remaining header; UI displays quota |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | ^1.2.0 | HTML parsing and content extraction | Fast, lightweight, jQuery-like API, native TypeScript types, no browser emulation overhead. Standard for server-side HTML scraping in Node.js |
| simple-statistics | ^7.8.8 | Statistical analysis (mean, variance, skew, kurtosis, correlation) | Zero dependencies, TypeScript types via index.d.ts, battle-tested, covers all required statistical functions |
| papaparse | ^5.5.3 | CSV parsing | Already in project dependencies; used by CSV canonicalizer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none -- built-in Node.js dns) | Node.js built-in | DNS resolution for SSRF protection | dns.resolve4/resolve6 to get IPs before fetch |
| (none -- built-in Node.js fetch) | Node.js 18+ built-in | HTTP fetching in API routes | native fetch with AbortController for timeouts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cheerio | @mozilla/readability + jsdom | Readability is great for article extraction but requires jsdom (heavy, 10x slower). Cheerio handles our case -- we want title, links, colors, density, not just article text |
| cheerio | linkedom | Faster than jsdom but less mature; cheerio is more widely used and better documented |
| simple-statistics | mathjs | mathjs is much larger (1.4MB vs 80KB); simple-statistics covers exactly what we need |
| custom SSRF | ssrf-req-filter | ssrf-req-filter last published 2 years ago, limited maintenance. Custom approach is ~80 lines and fully understood |
| custom SSRF | request-filtering-agent v3.2.0 | Works via http.Agent -- not compatible with Node.js native fetch. Would require node-fetch dependency. Custom is simpler for our use case |
| in-memory rate limit | @upstash/ratelimit + Redis | Redis not yet in the project (deferred to Phase 7). In-memory Map is sufficient for single-instance deployment |

**Installation:**
```bash
npm install cheerio simple-statistics
npm install --save-dev @types/simple-statistics
```

Note: `simple-statistics` ships its own `index.d.ts` so `@types/simple-statistics` may not be needed. Verify after install.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    api/
      analyze-url/
        route.ts           # POST handler: SSRF check -> fetch -> extract -> return signals
  lib/
    analysis/
      url.ts               # URL content analyzer (extract signals from HTML)
      data.ts              # Data analyzer (CSV/JSON statistical signals)
      index.ts             # Updated barrel export
    fetch/
      ssrf.ts              # SSRF protection: isPrivateIp, resolveAndValidate
      safe-fetch.ts        # safeFetch: DNS check -> fetch with limits
    pipeline/
      mapping.ts           # Add URL_MAPPINGS, DATA_MAPPINGS alongside TEXT_MAPPINGS
      calibration.ts       # Expand to support URL/data corpus entries
  data/
    calibration-corpus.json # Expanded with URL + data reference entries
  hooks/
    useTextAnalysis.ts     # Existing (unchanged)
    useUrlAnalysis.ts      # New: URL pipeline hook (calls API route)
    useDataAnalysis.ts     # New: data pipeline hook (client-side analysis)
  components/
    input/
      InputTabs.tsx        # Enable URL and Data tabs
      InputZone.tsx        # Route to active tab's input component
      UrlInput.tsx          # URL input field + mode toggle + rate limit display
      DataInput.tsx         # File drop zone + textarea + format detection
```

### Pattern 1: Server-Side URL Analysis via API Route
**What:** URL fetching MUST happen server-side because: (a) CORS blocks most cross-origin fetches from the browser, (b) SSRF protection requires DNS resolution only available in Node.js, (c) rate limiting must be server-enforced.
**When to use:** Always for URL input type.
**Example:**
```typescript
// src/app/api/analyze-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { safeFetch } from '@/lib/fetch/safe-fetch';
import { analyzeUrlContent } from '@/lib/analysis/url';
import { canonicalizeUrl } from '@/lib/canonicalize/url';

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1';

  const { allowed, remaining } = getRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const { url, mode } = await request.json();
  const { canonical } = canonicalizeUrl(url);

  // Check snapshot cache (if mode !== 'live')
  // ... snapshot logic ...

  const html = await safeFetch(canonical); // throws on SSRF/timeout/size
  const signals = analyzeUrlContent(html, canonical);

  return NextResponse.json(
    { signals, canonical },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
```

### Pattern 2: Client-Side Data Analysis
**What:** CSV/JSON data analysis runs entirely client-side because: (a) no external fetch needed, (b) data may be sensitive, (c) PapaParse and simple-statistics work in the browser.
**When to use:** Always for data input type.
**Example:**
```typescript
// src/lib/analysis/data.ts
import Papa from 'papaparse';
import {
  mean, variance, sampleSkewness, sampleKurtosis,
  sampleCorrelation, standardDeviation,
} from 'simple-statistics';

export interface DataSignals extends Record<string, number> {
  columnCount: number;
  rowCount: number;
  numericColumnRatio: number;
  stringColumnRatio: number;
  dateColumnRatio: number;
  nullRatio: number;
  avgMean: number;
  avgVariance: number;
  avgSkewness: number;
  avgKurtosis: number;
  maxCorrelation: number;
  avgCardinality: number;
  // ... remaining signals
}

export function analyzeData(
  raw: string,
  format: 'csv' | 'json'
): DataSignals {
  const rows = format === 'csv'
    ? parseCsvToRows(raw)
    : parseJsonToRows(raw);

  // ... statistical analysis using simple-statistics
}
```

### Pattern 3: Mapping Table Architecture (Existing -- Extend)
**What:** Each input type gets its own MappingTable (TEXT_MAPPINGS, URL_MAPPINGS, DATA_MAPPINGS) that maps raw analyzer signals to the same 15-dimension ParameterVector via computeParameterVector.
**When to use:** When adding new input types.
**Example:**
```typescript
// Added to src/lib/pipeline/mapping.ts
export const URL_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'contentToHtmlRatio', weight: 0.3, explanation: 'How much content vs markup' },
      { signal: 'textVocabRichness', weight: 0.4, explanation: 'Vocabulary diversity of page text' },
      { signal: 'linkDensity', weight: 0.3, explanation: 'Density of hyperlinks on the page' },
    ],
  },
  // ... 14 more parameters
];

export const DATA_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'columnCount', weight: 0.3, explanation: 'Number of data dimensions' },
      { signal: 'avgSkewness', weight: 0.3, explanation: 'Asymmetry in numeric distributions' },
      { signal: 'numericColumnRatio', weight: 0.4, explanation: 'Proportion of numeric data' },
    ],
  },
  // ... 14 more parameters
];
```

### Pattern 4: SSRF Protection -- Resolve-Then-Validate
**What:** DNS resolution happens BEFORE any HTTP connection. Resolved IPs are checked against a comprehensive blocklist of private/reserved ranges. Redirects are followed manually with re-validation at each hop.
**When to use:** Always before any server-side URL fetch.
**Example:**
```typescript
// src/lib/fetch/ssrf.ts
import { resolve4, resolve6 } from 'node:dns/promises';

const PRIVATE_RANGES_V4 = [
  { prefix: [10], mask: 8 },           // 10.0.0.0/8
  { prefix: [172, 16], mask: 12 },     // 172.16.0.0/12
  { prefix: [192, 168], mask: 16 },    // 192.168.0.0/16
  { prefix: [127], mask: 8 },          // 127.0.0.0/8
  { prefix: [0], mask: 8 },            // 0.0.0.0/8
  { prefix: [169, 254], mask: 16 },    // 169.254.0.0/16 (link-local + cloud metadata)
  { prefix: [224], mask: 4 },          // 224.0.0.0/4 (multicast)
  { prefix: [240], mask: 4 },          // 240.0.0.0/4 (reserved)
];

export function isPrivateIpV4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) return true; // invalid = block
  for (const range of PRIVATE_RANGES_V4) {
    if (matchesRange(octets, range.prefix, range.mask)) return true;
  }
  return false;
}

export async function resolveAndValidate(hostname: string): Promise<void> {
  // Block known internal hostnames
  const blocked = ['localhost', 'metadata.google.internal', 'metadata.amazonaws.com'];
  if (blocked.includes(hostname.toLowerCase())) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  let ips: string[] = [];
  try { ips = await resolve4(hostname); } catch { /* no A records */ }
  try { ips = ips.concat(await resolve6(hostname)); } catch { /* no AAAA records */ }

  if (ips.length === 0) throw new Error(`DNS resolution failed for ${hostname}`);

  for (const ip of ips) {
    if (isPrivateIpV4(ip) || isPrivateIpV6(ip)) {
      throw new Error(`Blocked: ${hostname} resolves to private IP ${ip}`);
    }
  }
}
```

### Anti-Patterns to Avoid
- **Client-side URL fetching:** CORS will block it. Even if it worked, there is no SSRF protection client-side. Always use a server-side API route.
- **String-based IP validation:** Never check hostname strings like "localhost" without also checking resolved IPs. DNS rebinding attacks use domains like `localtest.me` that resolve to `127.0.0.1`.
- **Following redirects blindly:** Each redirect target must be re-validated against the SSRF blocklist. A safe domain can redirect to `http://169.254.169.254/`.
- **Using Math.random() in analysis code:** The project has an ESLint ban on Math.random() in lib/render/ and lib/pipeline/. Data/URL analyzers in lib/analysis/ are exempt (they produce signals, not rendering decisions), but stay consistent.
- **Large file processing without limits:** CSV/JSON parsing must enforce a size cap (e.g., 5MB file, 10,000 rows) to prevent browser tab crashes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom CSV tokenizer | PapaParse (already in project) | CSV edge cases (quoted fields, embedded newlines, BOM) are notoriously tricky |
| Statistical functions | Custom mean/variance/skew/kurtosis | simple-statistics | Numerical stability matters; Bessel's correction, Fisher-Pearson standardized moment |
| HTML parsing | Regex-based tag extraction | cheerio | "You can't parse HTML with regex" -- cheerio handles malformed HTML, self-closing tags, encoding |
| Color extraction from CSS | Custom CSS parser | cheerio + simple regex on computed values | CSS parsing is complex; we only need hex/rgb colors from inline styles and meta tags |
| URL parsing | Custom URL normalization | Built-in URL API (already used in canonicalizer) | URL spec is enormous; the URL API handles edge cases correctly |

**Key insight:** The hard problems in this phase are (1) SSRF protection (which must be custom because existing npm packages have known bypasses or don't work with native fetch) and (2) designing signal-to-parameter mappings that produce varied, interesting art from URL and data inputs. The statistical computation and HTML parsing are solved problems -- use libraries.

## Common Pitfalls

### Pitfall 1: SSRF via DNS Rebinding
**What goes wrong:** Attacker provides a URL like `http://evil.rebind.example.com/` which initially resolves to a public IP, then on a subsequent DNS lookup resolves to `127.0.0.1` or `169.254.169.254` (AWS metadata).
**Why it happens:** Validating the hostname string instead of the resolved IP; or resolving DNS twice (once for validation, once for connection).
**How to avoid:** Resolve DNS once, validate the IP, then make the HTTP request using the resolved IP directly (or at minimum, resolve-then-immediately-fetch in a tight sequence).
**Warning signs:** Using hostname-based blocklists without IP resolution; following redirects to hosts that haven't been DNS-validated.

### Pitfall 2: Redirect Chain SSRF
**What goes wrong:** Initial URL passes SSRF validation but redirects to `http://169.254.169.254/latest/meta-data/`.
**Why it happens:** Following redirects automatically without re-validating each hop.
**How to avoid:** Set `redirect: 'manual'` on fetch, check each `Location` header against the SSRF validator before following, cap at 3 redirects.
**Warning signs:** Using `redirect: 'follow'` in server-side fetch.

### Pitfall 3: Content-Length Bomb
**What goes wrong:** Server claims small Content-Length but sends a massive body, or sends no Content-Length at all with an infinite stream.
**Why it happens:** Trusting Content-Length header without verifying actual bytes received.
**How to avoid:** Stream the response body, counting bytes. Abort when accumulated bytes exceed 5MB regardless of Content-Length header.
**Warning signs:** Using `response.text()` without size checking.

### Pitfall 4: Calibration Corpus Hash Coupling
**What goes wrong:** Adding URL/data corpus entries changes the calibration-corpus.json, but the CORPUS_HASH constant in calibration.ts is not updated, causing test failures.
**Why it happens:** The project enforces a test that the CORPUS_HASH matches the file's SHA-256. This is by design (PARAM-05).
**How to avoid:** After expanding the corpus, recompute the hash and update CORPUS_HASH. Also bump normalizerVersion in version.ts.
**Warning signs:** Test failures in calibration.test.ts after corpus changes.

### Pitfall 5: Signal Name Collision Between Input Types
**What goes wrong:** URL analyzer and text analyzer both produce a signal named `wordCount`, but they have different semantics (total page words vs user-input words).
**Why it happens:** Signal names are string keys in a flat Record.
**How to avoid:** Prefix URL-specific signals (e.g., `textWordCount` for URL page text) or use entirely distinct signal names per input type. Each input type uses its own MappingTable so signal names only need to be unique within their type.
**Warning signs:** Reusing TEXT_MAPPINGS for URL input without verifying signal names.

### Pitfall 6: PapaParse dynamicTyping Inconsistency
**What goes wrong:** PapaParse with `dynamicTyping: true` converts "123" to number 123, but the canonicalizer uses `dynamicTyping: false` for string consistency (per 01-03 decision).
**Why it happens:** Different PapaParse configurations for canonicalization vs analysis.
**How to avoid:** The data analyzer should do its own type detection after parsing. Parse with `dynamicTyping: false` (consistent with canonicalizer), then detect numeric columns manually with `!isNaN(parseFloat(value))`.
**Warning signs:** Using different PapaParse configs in the canonicalizer vs the analyzer.

## Code Examples

Verified patterns from official sources and project conventions:

### Safe URL Fetch with SSRF Protection and Limits
```typescript
// src/lib/fetch/safe-fetch.ts
import { resolveAndValidate } from './ssrf';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_REDIRECTS = 3;

export async function safeFetch(url: string): Promise<string> {
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= MAX_REDIRECTS) {
    const parsed = new URL(currentUrl);

    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Blocked protocol: ${parsed.protocol}`);
    }

    // DNS resolution + private IP check
    await resolveAndValidate(parsed.hostname);

    // Fetch with timeout and manual redirects
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'SynesthesiaMachine/1.0 (art-generator)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      // Handle redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error('Redirect without Location header');
        currentUrl = new URL(location, currentUrl).toString();
        redirects++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Stream body with size limit
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes > MAX_BYTES) {
          reader.cancel();
          throw new Error(`Response exceeds ${MAX_BYTES} byte limit`);
        }
        chunks.push(value);
      }

      const decoder = new TextDecoder();
      return chunks.map(c => decoder.decode(c, { stream: true })).join('') + decoder.decode();
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}
```

### URL Content Analyzer
```typescript
// src/lib/analysis/url.ts
import * as cheerio from 'cheerio';
import { analyzeText } from './text';

export interface UrlAnalysisResult {
  signals: Record<string, number>;
  extractedText: string;
  title: string;
  metadata: {
    linkCount: number;
    imageCount: number;
    dominantColors: string[];
  };
}

export function analyzeUrlContent(html: string, url: string): UrlAnalysisResult {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';

  // Extract main text (remove scripts, styles, nav, footer)
  $('script, style, nav, footer, header, aside, [role="navigation"]').remove();
  const mainText = $('body').text().replace(/\s+/g, ' ').trim();

  // Link density
  const links = $('a[href]');
  const linkCount = links.length;
  const totalTextLength = mainText.length || 1;
  const linkTextLength = links.map((_, el) => $(el).text().length).get()
    .reduce((a: number, b: number) => a + b, 0);
  const linkDensity = linkTextLength / totalTextLength;

  // Content-to-HTML ratio
  const htmlLength = html.length || 1;
  const contentToHtmlRatio = mainText.length / htmlLength;

  // Image count
  const imageCount = $('img').length;

  // Dominant colors from CSS/meta
  const colors: string[] = [];
  $('meta[name="theme-color"]').each((_, el) => {
    const c = $(el).attr('content');
    if (c) colors.push(c);
  });
  // Extract from inline styles (background-color, color)
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const colorMatches = style.match(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)/g);
    if (colorMatches) colors.push(...colorMatches.slice(0, 5));
  });

  // Reuse text analyzer on extracted page text
  const textSignals = analyzeText(mainText);

  // URL-specific signals (prefix with namespace to avoid collision)
  const urlSignals: Record<string, number> = {
    // Text-derived (reuse text analyzer output)
    textWordCount: textSignals.wordCount,
    textVocabRichness: textSignals.vocabRichness,
    textSentimentPolarity: textSignals.sentimentPolarity,
    textSentimentMagnitude: textSignals.sentimentMagnitude,
    textCharEntropy: textSignals.charEntropy,
    textAvgSentenceLength: textSignals.avgSentenceLength,
    textComplexity: textSignals.clauseDepth,
    // URL-specific structural signals
    linkDensity,
    contentToHtmlRatio,
    imageCount,
    linkCount,
    titleLength: title.length,
    colorCount: new Set(colors).size,
    headingCount: $('h1, h2, h3, h4, h5, h6').length,
    formCount: $('form').length,
    listCount: $('ul, ol').length,
    tableCount: $('table').length,
    mediaRichness: ($('img').length + $('video').length + $('audio').length) / Math.max(1, mainText.split(/\s+/).length) * 100,
  };

  return {
    signals: urlSignals,
    extractedText: mainText,
    title,
    metadata: { linkCount, imageCount, dominantColors: [...new Set(colors)].slice(0, 10) },
  };
}
```

### Data Analyzer with simple-statistics
```typescript
// src/lib/analysis/data.ts
import Papa from 'papaparse';
import {
  mean, variance, sampleSkewness, sampleKurtosis,
  sampleCorrelation,
} from 'simple-statistics';

export function analyzeData(raw: string, format: 'csv' | 'json'): Record<string, number> {
  const { columns, rows } = format === 'csv' ? parseCsv(raw) : parseJson(raw);

  const columnCount = columns.length;
  const rowCount = rows.length;

  // Classify columns
  const numericCols: { name: string; values: number[] }[] = [];
  const stringCols: { name: string; values: string[] }[] = [];
  let nullCount = 0;
  let totalCells = 0;

  for (const col of columns) {
    const values = rows.map(r => r[col]);
    totalCells += values.length;
    const nulls = values.filter(v => v === null || v === undefined || v === '').length;
    nullCount += nulls;

    const numericValues = values
      .filter(v => v !== null && v !== '' && !isNaN(parseFloat(String(v))))
      .map(v => parseFloat(String(v)));

    if (numericValues.length > values.length * 0.5) {
      numericCols.push({ name: col, values: numericValues });
    } else {
      stringCols.push({ name: col, values: values.map(String) });
    }
  }

  // Numeric distribution statistics
  const means = numericCols.map(c => mean(c.values));
  const variances = numericCols.map(c => variance(c.values));
  const skewnesses = numericCols.filter(c => c.values.length >= 3)
    .map(c => Math.abs(sampleSkewness(c.values)));
  const kurtoses = numericCols.filter(c => c.values.length >= 4)
    .map(c => sampleKurtosis(c.values));

  // Correlation between numeric columns
  const correlations: number[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const minLen = Math.min(numericCols[i].values.length, numericCols[j].values.length);
      if (minLen >= 3) {
        const corr = sampleCorrelation(
          numericCols[i].values.slice(0, minLen),
          numericCols[j].values.slice(0, minLen)
        );
        if (!isNaN(corr)) correlations.push(Math.abs(corr));
      }
    }
  }

  // Categorical cardinality
  const cardinalities = stringCols.map(c => new Set(c.values).size / Math.max(1, c.values.length));

  return {
    columnCount,
    rowCount,
    numericColumnRatio: numericCols.length / Math.max(1, columnCount),
    stringColumnRatio: stringCols.length / Math.max(1, columnCount),
    dateColumnRatio: 0, // detect dates separately if needed
    nullRatio: totalCells > 0 ? nullCount / totalCells : 0,
    avgMean: means.length > 0 ? mean(means.map(Math.abs)) : 0,
    avgVariance: variances.length > 0 ? mean(variances) : 0,
    avgSkewness: skewnesses.length > 0 ? mean(skewnesses) : 0,
    avgKurtosis: kurtoses.length > 0 ? mean(kurtoses) : 0,
    maxCorrelation: correlations.length > 0 ? Math.max(...correlations) : 0,
    avgCorrelation: correlations.length > 0 ? mean(correlations) : 0,
    avgCardinality: cardinalities.length > 0 ? mean(cardinalities) : 0,
    varianceSpread: variances.length > 1 ? variance(variances) : 0,
    dataUniformity: cardinalities.length > 0 ? 1 - mean(cardinalities) : 0.5,
  };
}
```

### Expanded InputTabs (Enable URL + Data)
```typescript
// Updated src/components/input/InputTabs.tsx
'use client';

type TabKey = 'text' | 'url' | 'data';

const TABS: { key: TabKey; label: string; disabled: boolean }[] = [
  { key: 'text', label: 'Text', disabled: false },
  { key: 'url', label: 'URL', disabled: false },   // Enabled!
  { key: 'data', label: 'Data', disabled: false },  // Enabled!
];

interface InputTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;  // New prop
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ssrf-req-filter npm | Custom SSRF with dns.resolve | 2024-2025 | ssrf-req-filter had known bypasses; custom approach is more robust and auditable |
| node-fetch for server requests | Native Node.js fetch | Node 18+ (2023) | No extra dependency; AbortController for timeouts built-in |
| @types/cheerio | cheerio native TypeScript | cheerio 1.x (2023) | cheerio ported to TypeScript; no need for separate @types package |
| jsdom for HTML scraping | cheerio for static extraction | Long-standing | jsdom is 10x slower and unnecessary when JavaScript execution is not needed |
| express-rate-limit | In-memory Map or Upstash Redis | 2024+ | Next.js App Router has no Express middleware; API route handlers use different patterns |

**Deprecated/outdated:**
- `@types/cheerio`: No longer needed. Cheerio 1.x has native TypeScript.
- `ssrf-req-filter v1.1.1`: Last published 2+ years ago, known DNS rebinding bypasses documented.
- `request` npm package: Deprecated since 2020. Use native fetch.

## Open Questions

1. **URL Snapshot Persistence**
   - What we know: SEC requirements say snapshot mode caches by default (URL-03). INFRA-04 specifies "permanent until re-fetch" with DB storage.
   - What's unclear: Phase 7 adds the database. In Phase 6, snapshot cache must be in-memory (lost on server restart).
   - Recommendation: Use in-memory Map for Phase 6. Phase 7 migrates to PostgreSQL. Document that snapshots are ephemeral until Phase 7.

2. **URL Analyzer Signal Design**
   - What we know: URL signals must map to the same 15-dimension ParameterVector. The signals need to produce varied, interesting art across different types of websites.
   - What's unclear: Exact signal weights will need calibration tuning.
   - Recommendation: Start with reasonable weights, add 15+ URL reference entries to calibration corpus, run distribution quality gate, and iterate.

3. **Data Format Detection**
   - What we know: Users can upload files or paste raw data. Need to detect CSV vs JSON.
   - What's unclear: Edge cases like TSV, semicolon-delimited, JSONL.
   - Recommendation: Try JSON.parse first; if it fails, try PapaParse. File extension provides a hint. TSV/semicolons are out of scope for v1.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| URL-01 | URL input produces artwork | integration | `npx vitest run src/__tests__/analysis/url.test.ts -x` | No -- Wave 0 |
| URL-02 | Extract title, text, colors, links, ratio | unit | `npx vitest run src/__tests__/analysis/url.test.ts -x` | No -- Wave 0 |
| URL-03 | Snapshot caching returns stored result | unit | `npx vitest run src/__tests__/api/analyze-url.test.ts -x` | No -- Wave 0 |
| URL-04 | Live mode bypasses cache | unit | `npx vitest run src/__tests__/api/analyze-url.test.ts -x` | No -- Wave 0 |
| URL-05 | Re-fetch replaces snapshot | unit | `npx vitest run src/__tests__/api/analyze-url.test.ts -x` | No -- Wave 0 |
| URL-06 | Analysis under 5 seconds | perf | `npx vitest run src/__tests__/analysis/url.test.ts -x` | No -- Wave 0 |
| DATA-01 | CSV/JSON input produces artwork | integration | `npx vitest run src/__tests__/analysis/data.test.ts -x` | No -- Wave 0 |
| DATA-02 | Statistical distributions computed | unit | `npx vitest run src/__tests__/analysis/data.test.ts -x` | No -- Wave 0 |
| DATA-03 | Null ratio, correlation, cardinality | unit | `npx vitest run src/__tests__/analysis/data.test.ts -x` | No -- Wave 0 |
| DATA-04 | Type mix detection | unit | `npx vitest run src/__tests__/analysis/data.test.ts -x` | No -- Wave 0 |
| DATA-05 | Analysis under 2 seconds for 10k rows | perf | `npx vitest run src/__tests__/analysis/data.test.ts -x` | No -- Wave 0 |
| SEC-01 | SSRF blocks private IPs, internal hosts | unit | `npx vitest run src/__tests__/fetch/ssrf.test.ts -x` | No -- Wave 0 |
| SEC-02 | Timeout, size limit, redirect cap | unit | `npx vitest run src/__tests__/fetch/safe-fetch.test.ts -x` | No -- Wave 0 |
| SEC-03 | Rate limiting 10/IP/hour | unit | `npx vitest run src/__tests__/api/analyze-url.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/fetch/ssrf.test.ts` -- covers SEC-01 (private IP blocking, DNS resolution validation, hostname blocklist)
- [ ] `src/__tests__/fetch/safe-fetch.test.ts` -- covers SEC-02 (timeout, size limit, redirect following with validation)
- [ ] `src/__tests__/analysis/url.test.ts` -- covers URL-01, URL-02, URL-06 (HTML extraction, signal computation, performance)
- [ ] `src/__tests__/analysis/data.test.ts` -- covers DATA-01 through DATA-05 (CSV/JSON parsing, statistics, type detection, performance)
- [ ] `src/__tests__/api/analyze-url.test.ts` -- covers URL-03, URL-04, URL-05, SEC-03 (snapshot mode, live mode, re-fetch, rate limiting)
- [ ] `src/__tests__/pipeline/url-mapping.test.ts` -- covers URL_MAPPINGS signal-to-parameter computation
- [ ] `src/__tests__/pipeline/data-mapping.test.ts` -- covers DATA_MAPPINGS signal-to-parameter computation
- [ ] Install: `npm install cheerio simple-statistics`

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/pipeline/mapping.ts`, `src/lib/analysis/text.ts`, `src/lib/canonicalize/url.ts`, `src/lib/canonicalize/csv.ts` -- existing architecture patterns
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) -- comprehensive SSRF protection guidance
- [simple-statistics API docs](https://simple-statistics.github.io/docs/) -- function signatures for mean, variance, skewness, kurtosis, correlation
- [cheerio GitHub](https://github.com/cheeriojs/cheerio) -- v1.2.0, native TypeScript, jQuery-like API
- [request-filtering-agent v3.2.0](https://github.com/azu/request-filtering-agent) -- DNS-aware SSRF protection (evaluated but not adopted due to fetch incompatibility)

### Secondary (MEDIUM confidence)
- [OWASP SSRF Prevention in Node.js](https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs) -- six-step defense approach
- [Next.js IP address discussion](https://github.com/vercel/next.js/discussions/55037) -- x-forwarded-for header extraction in App Router
- [ZenRows: jsdom vs cheerio comparison](https://www.zenrows.com/blog/jsdom-vs-cheerio) -- performance and feature comparison

### Tertiary (LOW confidence)
- Various Medium/blog rate limiting articles -- patterns verified against Next.js App Router docs
- npm download statistics for library selection -- verified with official repos

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- cheerio and simple-statistics are well-documented, mature, TypeScript-native libraries with clear APIs
- Architecture: HIGH -- extends proven patterns already in the codebase (MappingTable, computeParameterVector, calibration harness). Server-side API route for URL is the only correct approach
- SSRF protection: HIGH -- based on OWASP guidelines; custom implementation is more reliable than unmaintained npm packages
- Pitfalls: HIGH -- SSRF pitfalls well-documented in security literature; calibration hash coupling verified from project codebase
- Rate limiting: MEDIUM -- in-memory approach is correct for Phase 6 but will need migration to Redis in Phase 7

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable domain, mature libraries)