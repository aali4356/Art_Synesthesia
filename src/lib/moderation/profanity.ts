import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

/**
 * Profanity filter singleton (SEC-05).
 *
 * Uses the obscenity library which handles:
 * - Unicode evasion (l33tspeak, homoglyphs)
 * - Variant spelling
 * - False positive reduction via whitelist
 *
 * The matcher is initialized once at module load (singleton pattern).
 */
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Returns true if the text contains profanity.
 * Used for gallery titles and visible input previews (SEC-05).
 */
export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text);
}

/**
 * Returns all profanity matches with position information.
 * Used for moderation logging when rejecting content.
 */
export function getProfanityMatches(
  text: string
): ReturnType<typeof matcher.getAllMatches> {
  return matcher.getAllMatches(text);
}
