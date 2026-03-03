/**
 * Geometric renderer module - barrel exports.
 *
 * Provides the complete geometric composition engine:
 * - Recursive subdivision algorithm
 * - Shape assignment with curvature/density control
 * - Scene graph builder combining all components
 * - Canvas 2D drawing functions
 * - All render type definitions
 */

// Core algorithms
export { subdivide } from './subdivide';
export { assignShape } from './shapes';

// Scene graph builder
export { buildSceneGraph } from './scene';

// Canvas drawing
export { drawElement, drawSceneComplete } from './draw';

// Types (re-export from parent types module)
export type {
  Cell,
  ShapeType,
  SceneElement,
  SceneGraph,
  RenderConfig,
} from '../types';
export { createRenderConfig } from '../types';
