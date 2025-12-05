/**
 * @file Type definitions for the improved auto-layout system
 */
import type { NodeId, Position, Size, Node, Connection } from "../../../../../types/core";

/**
 * Layout algorithm types
 * - force: Force-directed layout using physics simulation
 * - hierarchical: Layer-based layout for DAGs
 * - tree: Tree-specific layout using Reingold-Tilford
 * - grid: Simple grid arrangement
 * - auto: Automatically selects based on graph characteristics
 */
export type LayoutAlgorithm = "force" | "hierarchical" | "tree" | "grid" | "auto";

/**
 * Layout direction for hierarchical and tree layouts
 * - TB: Top to Bottom
 * - BT: Bottom to Top
 * - LR: Left to Right
 * - RL: Right to Left
 */
export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

/**
 * Graph characteristics for algorithm selection
 */
export type GraphCharacteristics = {
  nodeCount: number;
  edgeCount: number;
  isTree: boolean;
  isDAG: boolean;
  hasCycles: boolean;
  maxDegree: number;
  avgDegree: number;
  connectedComponents: number;
  density: number;
};

/**
 * Force-directed layout specific options
 */
export type ForceLayoutOptions = {
  /** Maximum number of simulation iterations */
  iterations: number;
  /** Ideal distance between connected nodes */
  springLength: number;
  /** Attraction force strength between connected nodes */
  springStrength: number;
  /** Repulsion force strength between all nodes */
  repulsionStrength: number;
  /** Velocity dampening factor (0-1) */
  dampening: number;
  /** Maximum force per iteration */
  maxForce: number;
  /** Consider node sizes in repulsion calculation */
  sizeAwareRepulsion: boolean;
  /** Use Barnes-Hut approximation for O(n log n) performance */
  useBarnesHut: boolean;
  /** Barnes-Hut accuracy parameter (0.5-1.0, lower = more accurate) */
  barnesHutTheta: number;
  /** Optional directional bias for DAGs */
  directionalBias?: {
    axis: "x" | "y";
    strength: number;
  };
};

/**
 * Hierarchical layout specific options
 */
export type HierarchicalLayoutOptions = {
  /** Layout direction */
  direction: LayoutDirection;
  /** Spacing between layers */
  layerSpacing: number;
  /** Spacing between nodes in the same layer */
  nodeSpacing: number;
  /** Edge crossing reduction method */
  crossReduction: "barycentric" | "median" | "none";
  /** Number of crossing reduction iterations */
  crossReductionIterations: number;
  /** Consider node sizes in positioning */
  sizeAware: boolean;
};

/**
 * Tree layout specific options
 */
export type TreeLayoutOptions = {
  /** Layout direction */
  direction: LayoutDirection;
  /** Spacing between sibling nodes */
  siblingSpacing: number;
  /** Spacing between levels */
  levelSpacing: number;
};

/**
 * Grid layout specific options
 */
export type GridLayoutOptions = {
  /** Spacing between nodes */
  spacing: number;
  /** Number of columns (auto-calculated if not specified) */
  columns?: number;
};

/**
 * Combined layout options
 */
export type LayoutOptions = {
  algorithm: LayoutAlgorithm;
  padding: number;
  /**
   * Pre-computed node sizes. When provided, these sizes take precedence
   * over node.size for layout calculations. Use this to provide accurate
   * DOM-measured sizes or NodeDefinition.defaultSize values.
   */
  nodeSizes?: Record<NodeId, Size>;
  force?: Partial<ForceLayoutOptions>;
  hierarchical?: Partial<HierarchicalLayoutOptions>;
  tree?: Partial<TreeLayoutOptions>;
  grid?: Partial<GridLayoutOptions>;
};

/**
 * Layout result with metrics
 */
export type LayoutResult = {
  nodePositions: Record<NodeId, Position>;
  iterations: number;
  algorithm: LayoutAlgorithm;
  metrics: {
    executionTimeMs: number;
    edgeCrossings?: number;
    boundingBox: { width: number; height: number };
  };
};

/**
 * Internal node representation for layout algorithms
 */
export type LayoutNode = {
  id: NodeId;
  position: Position;
  size: Size;
  originalNode: Node;
};

/**
 * Internal edge representation for layout algorithms
 */
export type LayoutEdge = {
  from: NodeId;
  to: NodeId;
  originalConnection: Connection;
};

/**
 * Adjacency map type for graph operations
 */
export type AdjacencyMap = Map<NodeId, Set<NodeId>>;

/**
 * Default options for force-directed layout
 */
export const DEFAULT_FORCE_OPTIONS: ForceLayoutOptions = {
  iterations: 100,
  springLength: 200,
  springStrength: 0.4,
  repulsionStrength: 2000,
  dampening: 0.85,
  maxForce: 50,
  sizeAwareRepulsion: true,
  useBarnesHut: true,
  barnesHutTheta: 0.7,
};

/**
 * Default options for hierarchical layout
 */
export const DEFAULT_HIERARCHICAL_OPTIONS: HierarchicalLayoutOptions = {
  direction: "TB",
  layerSpacing: 150,
  nodeSpacing: 50,
  crossReduction: "barycentric",
  crossReductionIterations: 4,
  sizeAware: true,
};

/**
 * Default options for tree layout
 */
export const DEFAULT_TREE_OPTIONS: TreeLayoutOptions = {
  direction: "TB",
  siblingSpacing: 30,
  levelSpacing: 100,
};

/**
 * Default options for grid layout
 */
export const DEFAULT_GRID_OPTIONS: GridLayoutOptions = {
  spacing: 200,
};

/**
 * Default combined layout options
 */
export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  algorithm: "auto",
  padding: 100,
};
