import { describe, it, expect, vi } from 'vitest';

// Mock analyzeText from @/lib/analysis/text before importing analyzeUrlContent
vi.mock('@/lib/analysis/text', () => ({
  analyzeText: vi.fn(() => ({
    wordCount: 100,
    vocabRichness: 0.7,
    sentimentPolarity: 0.5,
    sentimentMagnitude: 0.3,
    charEntropy: 4.2,
    avgSentenceLength: 12,
    clauseDepth: 0.8,
    punctuationDensity: 0.05,
  })),
}));

import { analyzeUrlContent } from '@/lib/analysis/url';

describe('analyzeUrlContent — title extraction', () => {
  it('extracts title from <title> element', () => {
    const html = '<html><head><title>My Page</title></head><body><p>Content</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.title).toBe('My Page');
  });

  it('falls back to og:title when no <title> element', () => {
    const html = '<html><head><meta property="og:title" content="OG Title"></head><body><p>Content</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.title).toBe('OG Title');
  });

  it('returns empty string when no title source is found', () => {
    const html = '<html><head></head><body><p>Content</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.title).toBe('');
  });
});

describe('analyzeUrlContent — main text extraction', () => {
  it('excludes script content from extracted text', () => {
    const html = '<html><body><script>var x = 1</script><p>Hello world</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.extractedText).toContain('Hello world');
    expect(result.extractedText).not.toContain('var x = 1');
  });

  it('excludes nav content from extracted text', () => {
    const html = '<html><body><nav>Menu</nav><p>Content</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.extractedText).toContain('Content');
    expect(result.extractedText).not.toContain('Menu');
  });
});

describe('analyzeUrlContent — signal computation', () => {
  it('linkDensity is greater than 0 for anchor-heavy content', () => {
    const html = '<html><body><a href="/1">Link One</a> <a href="/2">Link Two</a> <a href="/3">Link Three</a></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(typeof result.signals.linkDensity).toBe('number');
    expect(result.signals.linkDensity).toBeGreaterThan(0);
  });

  it('contentToHtmlRatio is between 0 and 1 for minimal HTML', () => {
    const html = '<html><body>Hello</body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.signals.contentToHtmlRatio).toBeGreaterThan(0);
    expect(result.signals.contentToHtmlRatio).toBeLessThan(1);
  });

  it('imageCount matches number of <img> tags', () => {
    const html = '<html><body><img src="a.jpg"><img src="b.jpg"><img src="c.jpg"><p>text</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.metadata.imageCount).toBe(3);
  });

  it('colorCount is at least 1 when theme-color meta is present', () => {
    const html = '<html><head><meta name="theme-color" content="#ff0000"></head><body><p>text</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.signals.colorCount).toBeGreaterThanOrEqual(1);
  });
});

describe('analyzeUrlContent — signal namespacing', () => {
  it('contains textWordCount key (not wordCount)', () => {
    const html = '<html><body><p>Hello world</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.signals).toHaveProperty('textWordCount');
  });

  it('contains textVocabRichness key', () => {
    const html = '<html><body><p>Hello world</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.signals).toHaveProperty('textVocabRichness');
  });

  it('does NOT contain wordCount key directly (no collision with TEXT_MAPPINGS)', () => {
    const html = '<html><body><p>Hello world</p></body></html>';
    const result = analyzeUrlContent(html, 'https://example.com');
    expect(result.signals).not.toHaveProperty('wordCount');
  });
});

describe('analyzeUrlContent — performance (URL-06)', () => {
  it('analyzes a 100KB HTML string in under 1000ms', () => {
    // Generate ~100KB of HTML content
    const repeatCount = 2000;
    const bodyContent = '<p>The quick brown fox jumps over the lazy dog. This is a test sentence with some content.</p>'.repeat(repeatCount);
    const html = `<html><head><title>Performance Test</title></head><body>${bodyContent}</body></html>`;

    const start = performance.now();
    analyzeUrlContent(html, 'https://example.com');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1000);
  });
});
