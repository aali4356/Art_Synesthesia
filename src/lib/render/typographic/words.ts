const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'as', 'up', 'out',
  'and', 'or', 'but', 'so', 'yet', 'nor', 'with', 'from', 'into',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'not', 'no', 'if', 'then', 'when', 'where',
]);

export interface WeightedWord {
  text: string;
  /** Normalized display text (original case preserved for display) */
  displayText: string;
  /** Semantic importance score 0-1 */
  weight: number;
}

/**
 * Extracts words from text, scores by semantic weight, and returns
 * a sorted list (highest weight first) with duplicates collapsed.
 *
 * @param text - Raw input text
 * @param maxWords - Maximum words to return (prevents overcrowding)
 */
export function extractWeightedWords(text: string, maxWords: number = 60): WeightedWord[] {
  if (!text || text.trim().length === 0) {
    return [{ text: 'empty', displayText: 'empty', weight: 1 }];
  }

  const tokens = text.match(/[a-zA-Z']+/g) ?? [];

  const counts = new Map<string, number>();
  for (const token of tokens) {
    const lower = token.toLowerCase().replace(/^'+|'+$/g, '');
    if (lower.length === 0) continue;
    counts.set(lower, (counts.get(lower) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return [{ text: 'text', displayText: text.slice(0, 20), weight: 1 }];
  }

  const displayMap = new Map<string, string>();
  for (const token of tokens) {
    const lower = token.toLowerCase().replace(/^'+|'+$/g, '');
    if (lower.length > 0 && !displayMap.has(lower)) {
      displayMap.set(lower, token.replace(/^'+|'+$/g, ''));
    }
  }

  const totalWords = tokens.length;

  const scored: WeightedWord[] = [];
  for (const [lower, count] of counts) {
    if (lower.length === 0) continue;

    const display = displayMap.get(lower) ?? lower;
    let score = 0;

    if (STOP_WORDS.has(lower)) {
      score -= 0.5;
    }

    const lengthBonus = Math.min(0.4, (lower.length - 3) * 0.05);
    score += lengthBonus;

    if (count === 1) score += 0.2;

    if (count > 1) score += Math.min(0.3, (count / totalWords) * 2);

    if (display === display.toUpperCase() && display.length > 1) score += 0.3;
    else if (display[0] === display[0].toUpperCase() && display.length > 2) score += 0.1;

    scored.push({ text: lower, displayText: display, weight: Math.max(0, score) });
  }

  const maxScore = Math.max(...scored.map((w) => w.weight), 0.001);
  for (const w of scored) {
    w.weight = w.weight / maxScore;
  }

  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, maxWords);
}
