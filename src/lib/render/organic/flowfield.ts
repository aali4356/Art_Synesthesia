/**
 * Flow field computation for the organic renderer.
 *
 * Converts fBm noise values into flow angles, then traces
 * continuous curves through the field. Dominant direction
 * is enforced via a bias angle derived from the directionality
 * parameter (ORGN-04).
 */

/**
 * Convert directionality parameter [0, 1] to a dominant flow angle in radians.
 *
 * Maps the full [0, 1] range to [0, 2*PI] so that:
 * - 0.0 → right (0 rad)
 * - 0.25 → down (PI/2 rad)
 * - 0.5 → left (PI rad)
 * - 0.75 → up (3*PI/2 rad)
 * - 1.0 → right again (2*PI = 0 rad)
 *
 * @param directionality - ParameterVector.directionality in [0, 1]
 * @returns Dominant angle in radians
 */
export function computeDominantDirection(directionality: number): number {
  return directionality * Math.PI * 2;
}

/**
 * Compute a flow field angle at (x, y) given fBm noise and a direction bias.
 *
 * @param noiseValue - fBm output in [-1, 1]
 * @param directionBias - Dominant angle in radians (from computeDominantDirection)
 * @param spread - How much the noise perturbs from the bias direction (0-1)
 * @returns Flow angle in radians
 */
export function computeFlowAngle(
  noiseValue: number,
  directionBias: number,
  spread: number,
): number {
  const s = Math.max(0, Math.min(1, spread));
  const perturbation = noiseValue * Math.PI * s;
  return directionBias + perturbation;
}

/** A single point in a curve path */
export interface TracePoint {
  x: number;
  y: number;
}

/**
 * Trace a single flow curve from a starting position.
 *
 * Follows the flow field vector field step-by-step. Stops when the
 * curve exits canvas bounds.
 *
 * @param startX - Starting X position in canvas pixels
 * @param startY - Starting Y position in canvas pixels
 * @param fbm - The fBm noise function
 * @param directionBias - Dominant angle in radians
 * @param spread - Noise spread factor (derived from 1 - directionality)
 * @param steps - Maximum number of steps to trace
 * @param stepSize - Pixels per step
 * @param canvasSize - Canvas dimension (assumed square)
 * @returns Array of trace points
 */
export function traceFlowCurve(
  startX: number,
  startY: number,
  fbm: (x: number, y: number) => number,
  directionBias: number,
  spread: number,
  steps: number,
  stepSize: number,
  canvasSize: number,
): TracePoint[] {
  const points: TracePoint[] = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;

  const noiseScale = 0.003;

  for (let i = 0; i < steps; i++) {
    const noiseValue = fbm(x * noiseScale, y * noiseScale);
    const angle = computeFlowAngle(noiseValue, directionBias, spread);

    x += Math.cos(angle) * stepSize;
    y += Math.sin(angle) * stepSize;

    if (x < -10 || x > canvasSize + 10 || y < -10 || y > canvasSize + 10) break;

    points.push({ x, y });
  }

  return points;
}

/**
 * Compute start positions for flow curves distributed across the canvas.
 *
 * When directionality is high, start points are perpendicular to dominant flow.
 * When directionality is low, start points are scattered across the canvas.
 *
 * @param count - Number of curves
 * @param canvasSize - Canvas dimension in pixels
 * @param directionality - ParameterVector.directionality in [0, 1]
 * @param prng - Seeded PRNG (use dedicated scene prng, NOT noise prng)
 * @returns Array of {x, y} start positions
 */
export function computeCurveStartPoints(
  count: number,
  canvasSize: number,
  directionality: number,
  prng: () => number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const padding = canvasSize * 0.05;

  for (let i = 0; i < count; i++) {
    if (directionality > 0.6) {
      const dominantAngle = computeDominantDirection(directionality);
      const perpAngle = dominantAngle + Math.PI / 2;
      const t = i / count + (prng() - 0.5) * 0.2;
      const centerX = canvasSize * 0.5;
      const centerY = canvasSize * 0.5;
      const spread = canvasSize * 0.45;
      points.push({
        x: centerX + Math.cos(perpAngle) * (t - 0.5) * spread * 2 - Math.cos(dominantAngle) * canvasSize * 0.4,
        y: centerY + Math.sin(perpAngle) * (t - 0.5) * spread * 2 - Math.sin(dominantAngle) * canvasSize * 0.4,
      });
    } else {
      points.push({
        x: padding + prng() * (canvasSize - 2 * padding),
        y: padding + prng() * (canvasSize - 2 * padding),
      });
    }
  }

  return points;
}
