/**
 * URL content analyzer using cheerio for HTML extraction.
 *
 * Extracts structural signals from HTML pages including link density,
 * content-to-HTML ratio, image count, color count, heading count, and
 * text-prefixed signals from the reused text analyzer.
 *
 * Signal names are prefixed with 'text' (e.g., textWordCount) to avoid
 * collision with TEXT_MAPPINGS signals.
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { analyzeText } from '@/lib/analysis/text';

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

/**
 * Analyzes HTML content from a URL and extracts art generation signals.
 *
 * @param html - Raw HTML string from the fetched page
 * @param url - The canonical URL (used for future extensions)
 * @returns UrlAnalysisResult with signals, extracted text, title, and metadata
 */
export function analyzeUrlContent(html: string, _url: string): UrlAnalysisResult {
  const $ = cheerio.load(html);

  // Extract title: prefer <title> element, fall back to og:title meta
  const title = $('title').text().trim()
    || $('meta[property="og:title"]').attr('content')
    || '';

  // Remove noise elements before extracting main text
  $('script, style, nav, footer, header, aside, [role="navigation"]').remove();
  const mainText = $('body').text().replace(/\s+/g, ' ').trim();

  // Link density: ratio of link text to total text
  const links = $('a[href]');
  const linkCount = links.length;
  const totalTextLength = mainText.length || 1;
  const linkTextLength = links
    .map((_: number, el: AnyNode) => $(el).text().length)
    .get()
    .reduce((a: number, b: number) => a + b, 0);
  const linkDensity = linkTextLength / totalTextLength;

  // Content-to-HTML ratio: how much of the raw HTML is actual text content
  const htmlLength = html.length || 1;
  const contentToHtmlRatio = mainText.length / htmlLength;

  // Image count
  const imageCount = $('img').length;

  // Dominant colors from theme-color meta and inline styles
  const colors: string[] = [];
  $('meta[name="theme-color"]').each((_: number, el: AnyNode) => {
    const c = $(el).attr('content');
    if (c) colors.push(c);
  });
  $('[style]').each((_: number, el: AnyNode) => {
    const style = $(el).attr('style') || '';
    const colorMatches = style.match(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)/g);
    if (colorMatches) colors.push(...colorMatches.slice(0, 5));
  });

  // Reuse text analyzer on extracted text; prefix all signals with 'text'
  const textSignals = analyzeText(mainText);

  // Build URL signals with text-prefixed namespace to avoid collision
  const urlSignals: Record<string, number> = {
    // Text-derived signals (prefixed)
    textWordCount: textSignals['wordCount'] ?? 0,
    textVocabRichness: textSignals['vocabRichness'] ?? 0,
    textSentimentPolarity: textSignals['sentimentPolarity'] ?? 0,
    textSentimentMagnitude: textSignals['sentimentMagnitude'] ?? 0,
    textCharEntropy: textSignals['charEntropy'] ?? 0,
    textAvgSentenceLength: textSignals['avgSentenceLength'] ?? 0,
    textComplexity: textSignals['clauseDepth'] ?? 0,
    textPunctuationDensity: textSignals['punctuationDensity'] ?? 0,
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
    mediaRichness:
      ($('img').length + $('video').length + $('audio').length) /
      Math.max(1, mainText.split(/\s+/).length) *
      100,
  };

  return {
    signals: urlSignals,
    extractedText: mainText,
    title,
    metadata: {
      linkCount,
      imageCount,
      dominantColors: [...new Set(colors)].slice(0, 10),
    },
  };
}
