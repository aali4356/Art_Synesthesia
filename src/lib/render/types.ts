/**
 * Render type definitions for the geometric composition engine.
 *
 * These types define the data structures for the deterministic
 * scene graph: cells from subdivision, shape elements, the complete
 * scene graph, and the render configuration derived from ParameterVector.
 */

/** Shape types that can be drawn on the canvas. */
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'line' | 'empty';

/**
 * A rectangular region produced by recursive subdivision.
 * Cells tile the canvas with optional gaps between them.
 */
export interface Cell {
  /** X position (left edge) */
  x: number;
  /** Y position (top edge) */
  y: number;
  /** Cell width in pixels */
  width: number;
  /** Cell height in pixels */
  height: number;
  /** Subdivision depth at which this cell was created */
  depth: number;
}

/**
 * A single drawing instruction in the scene graph.
 * Contains everything needed to draw one shape on canvas.
 */
export interface SceneElement {
  /** Shape type to render */
  type: ShapeType;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Element width */
  width: number;
  /** Element height */
  height: number;
  /** Fill color as hex string */
  fill: string;
  /** Optional stroke color */
  stroke?: string;
  /** Optional stroke width (at most 2 distinct values per scene) */
  strokeWidth?: number;
  /** Element opacity (0-1) */
  opacity: number;
  /** Area of the element (width * height) for sorting/coloring */
  area: number;
  /** Subdivision depth this element originated from */
  depth: number;
}

/**
 * Complete scene graph: all drawing instructions for one artwork.
 * Elements are sorted by area descending (largest first) for progressive animation.
 */
export interface SceneGraph {
  /** Drawing instructions, sorted by area descending */
  elements: SceneElement[];
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Background fill color as hex string */
  background: string;
}

/**
 * Render configuration derived from ParameterVector.
 * Maps abstract parameters to concrete composition values.
 */
export interface RenderConfig {
  // -- Composition parameters (0-1) --
  /** Controls subdivision depth: 0 = few large cells, 1 = many small cells */
  complexity: number;
  /** Controls split ratio balance: 1 = balanced/equal, 0 = asymmetric */
  symmetry: number;
  /** Controls filled vs empty cell ratio */
  density: number;
  /** Controls shape distribution: 1 = more circles, 0 = more rects/triangles */
  curvature: number;
  /** Controls stroke presence/weight */
  texture: number;
  /** Widens allowed split ratio range */
  scaleVariation: number;
  /** Alternating pattern regularity */
  rhythm: number;
  /** Grid alignment tendency */
  regularity: number;
  /** Dominant split direction bias */
  directionality: number;
  /** Overlapping elements at high values */
  layering: number;
  /** Color distribution vibrancy */
  energy: number;

  // -- Derived constants --
  /** Minimum cell dimension in pixels (always 4) */
  minCellSize: number;
  /** Gap between adjacent cells: 2 + texture * 2, range [2, 4] */
  cellGap: number;
  /** Canvas edge padding: canvasSize * 0.02 */
  framePadding: number;

  // -- Stroke config --
  /** Primary stroke width for large shapes: 1 + texture * 2, range [1, 3] */
  primaryStrokeWidth: number;
  /** Secondary stroke width for small shapes: 0.5 + texture * 1, range [0.5, 1.5] */
  secondaryStrokeWidth: number;
  /** Whether strokes are visible (texture > 0.3) */
  strokeVisible: boolean;
}

/**
 * A single particle in the particle scene.
 * Large particles (radius >= 6) have glowRadius > 0 and represent "stars".
 * Small particles (radius < 6) have glowRadius = 0 and stay crisp.
 */
export interface Particle {
  x: number;
  y: number;
  /** Radius in CSS pixels, range 1-12 */
  radius: number;
  color: string;
  /** Glow radius for pre-rendered sprite. 0 means no glow (crisp small particle). */
  glowRadius: number;
  opacity: number;
  /** Index of the cluster this particle belongs to */
  clusterId: number;
  /** For idle animation: distance from cluster center */
  orbitRadius: number;
  /** For idle animation: initial angle in radians */
  orbitAngle: number;
  /** For idle animation: angular speed in radians/second (slow) */
  orbitSpeed: number;
}

/**
 * A faint line connecting two nearby particles (constellation effect).
 */
export interface ParticleConnection {
  /** Index into ParticleSceneGraph.particles */
  from: number;
  /** Index into ParticleSceneGraph.particles */
  to: number;
  opacity: number;
}

/**
 * A cluster center with bounding radius used for layout and animation.
 */
export interface ParticleCluster {
  cx: number;
  cy: number;
  /** Radius of the cluster's particle distribution */
  radius: number;
}

/**
 * Complete scene graph for the particle (cosmic starfield) renderer.
 * buildParticleSceneGraph() produces this; drawParticleScene() consumes it.
 */
export interface ParticleSceneGraph {
  style: 'particle';
  width: number;
  height: number;
  background: string;
  particles: Particle[];
  connections: ParticleConnection[];
  clusters: ParticleCluster[];
}

/**
 * Create a RenderConfig from a ParameterVector and canvas size.
 *
 * @param params - The parameter vector to derive config from
 * @param canvasSize - Canvas dimension in pixels (default 800)
 * @returns Fully populated RenderConfig
 */
export function createRenderConfig(
  params: {
    complexity: number;
    symmetry: number;
    density: number;
    curvature: number;
    texture: number;
    scaleVariation: number;
    rhythm: number;
    regularity: number;
    directionality: number;
    layering: number;
    energy: number;
  },
  canvasSize: number = 800,
): RenderConfig {
  return {
    complexity: params.complexity,
    symmetry: params.symmetry,
    density: params.density,
    curvature: params.curvature,
    texture: params.texture,
    scaleVariation: params.scaleVariation,
    rhythm: params.rhythm,
    regularity: params.regularity,
    directionality: params.directionality,
    layering: params.layering,
    energy: params.energy,
    minCellSize: 4,
    cellGap: 2 + params.texture * 2,
    framePadding: canvasSize * 0.02,
    primaryStrokeWidth: 1 + params.texture * 2,
    secondaryStrokeWidth: 0.5 + params.texture * 1,
    strokeVisible: params.texture > 0.3,
  };
}
