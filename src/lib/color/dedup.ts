import {
  useMode,
  modeOklch,
  modeRgb,
  modeLab65,
  converter,
  differenceCiede2000,
} from 'culori/fn';

// Register color spaces at module scope (tree-shakeable)
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLab65);

const toLab = converter('lab65');

/**
 * OKLCH color representation.
 * Lightness is [0, 1] (culori v4), chroma is [0, ~0.4], hue is [0, 360).
 */
export interface OklchColor {
  mode: 'oklch';
  l: number;
  c: number;
  h: number;
}

/**
 * Reject near-duplicate colors by shifting hue of duplicates.
 *
 * For each candidate color, checks perceptual distance (CIEDE2000 deltaE in LAB space)
 * against all previously accepted colors. If too close (deltaE < threshold),
 * shifts hue by 10-degree increments until sufficiently distinct or gives up after 36 attempts.
 *
 * @param colors - Array of OKLCH colors to deduplicate
 * @param threshold - Minimum deltaE (CIEDE2000) between any two accepted colors. Default: 10
 * @returns Deduplicated array of OKLCH colors
 */
export function rejectNearDuplicates(
  colors: OklchColor[],
  threshold: number = 10,
): OklchColor[] {
  if (colors.length === 0) return [];

  const deltaE = differenceCiede2000();
  const accepted: OklchColor[] = [];

  for (const candidate of colors) {
    // Check if candidate is far enough from all accepted colors
    const isTooClose = (color: OklchColor): boolean => {
      return accepted.some((existing) => {
        const labExisting = toLab(existing);
        const labCandidate = toLab(color);
        if (!labExisting || !labCandidate) return false;
        return deltaE(labExisting, labCandidate) < threshold;
      });
    };

    if (!isTooClose(candidate)) {
      accepted.push(candidate);
    } else {
      // Try shifting hue in 10-degree increments
      let shifted = { ...candidate };
      let found = false;

      for (let attempt = 0; attempt < 36; attempt++) {
        shifted = {
          ...shifted,
          h: ((shifted.h + 10) % 360),
        };

        if (!isTooClose(shifted)) {
          accepted.push(shifted);
          found = true;
          break;
        }
      }

      // If 36 attempts failed, drop the color (can't find unique position)
      if (!found) {
        // Color dropped - could not find sufficiently distinct hue
      }
    }
  }

  return accepted;
}
