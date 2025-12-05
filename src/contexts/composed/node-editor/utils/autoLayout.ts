/**
 * @file Auto-layout algorithms for node positioning
 * Main entry point that integrates all layout algorithms
 */
import type { NodeEditorData, NodeId, Position, Node, Size } from "../../../../types/core";
import { getNodeSizeWithOverride } from "../../../../utils/boundingBoxUtils";

// Re-export types
export type {
  LayoutAlgorithm,
  LayoutDirection,
  LayoutOptions,
  LayoutResult,
  ForceLayoutOptions,
  HierarchicalLayoutOptions,
  TreeLayoutOptions,
  GridLayoutOptions,
  GraphCharacteristics,
} from "./autoLayout/types";

export {
  DEFAULT_FORCE_OPTIONS,
  DEFAULT_HIERARCHICAL_OPTIONS,
  DEFAULT_TREE_OPTIONS,
  DEFAULT_GRID_OPTIONS,
  DEFAULT_LAYOUT_OPTIONS,
} from "./autoLayout/types";

// Import internal modules
import type {
  LayoutAlgorithm,
  LayoutOptions,
  LayoutResult,
  GridLayoutOptions,
} from "./autoLayout/types";
import {
  DEFAULT_GRID_OPTIONS,
  DEFAULT_LAYOUT_OPTIONS,
} from "./autoLayout/types";
import { analyzeGraph, selectAlgorithm } from "./autoLayout/graphAnalysis";
import { calculateForceDirectedLayout } from "./autoLayout/forceDirectedLayout";
import { calculateHierarchicalLayout } from "./autoLayout/hierarchicalLayout";
import { calculateTreeLayout } from "./autoLayout/treeLayout";

// Re-export graph analysis
export { analyzeGraph, selectAlgorithm } from "./autoLayout/graphAnalysis";

/**
 * Calculate grid layout - arranges nodes in a regular grid
 */
export function calculateGridLayout(
  data: NodeEditorData,
  options: Partial<GridLayoutOptions> = {},
  nodeSizes?: Record<NodeId, Size>,
): LayoutResult {
  const startTime = performance.now();
  const { spacing = DEFAULT_GRID_OPTIONS.spacing, columns } = options;
  const nodes = Object.values(data.nodes);

  if (nodes.length === 0) {
    return {
      nodePositions: {},
      iterations: 0,
      algorithm: "grid",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        boundingBox: { width: 0, height: 0 },
      },
    };
  }

  // Calculate optimal column count if not specified
  const cols = columns ?? Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);

  const positions: Record<NodeId, Position> = {};

  // Calculate max node size for consistent spacing
  let maxWidth = 0;
  let maxHeight = 0;
  nodes.forEach((node) => {
    const size = getNodeSizeWithOverride(node, nodeSizes);
    maxWidth = Math.max(maxWidth, size.width);
    maxHeight = Math.max(maxHeight, size.height);
  });

  // Use spacing that accounts for node size
  const effectiveSpacingX = maxWidth + spacing;
  const effectiveSpacingY = maxHeight + spacing;

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Center the grid
    const gridWidth = (cols - 1) * effectiveSpacingX;
    const gridHeight = (rows - 1) * effectiveSpacingY;

    positions[node.id] = {
      x: col * effectiveSpacingX - gridWidth / 2,
      y: row * effectiveSpacingY - gridHeight / 2,
    };
  });

  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = positions[node.id];
    const size = getNodeSizeWithOverride(node, nodeSizes);
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + size.width);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + size.height);
  });

  return {
    nodePositions: positions,
    iterations: 0,
    algorithm: "grid",
    metrics: {
      executionTimeMs: performance.now() - startTime,
      boundingBox: {
        width: isFinite(maxX - minX) ? maxX - minX : 0,
        height: isFinite(maxY - minY) ? maxY - minY : 0,
      },
    },
  };
}

/**
 * Calculate auto layout with automatic algorithm selection
 */
export function calculateAutoLayout(
  data: NodeEditorData,
  options: Partial<LayoutOptions> = {},
): LayoutResult {
  const nodes = Object.values(data.nodes);
  const connections = Object.values(data.connections);

  // Merge with defaults
  const opts: LayoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  // Determine algorithm
  let algorithm: LayoutAlgorithm = opts.algorithm;

  if (algorithm === "auto") {
    const characteristics = analyzeGraph(nodes, connections);
    algorithm = selectAlgorithm(characteristics);
  }

  // Execute appropriate algorithm with nodeSizes
  switch (algorithm) {
    case "force":
      return calculateForceDirectedLayout(data, opts.force, opts.nodeSizes);

    case "hierarchical":
      return calculateHierarchicalLayout(data, opts.hierarchical, opts.nodeSizes);

    case "tree":
      return calculateTreeLayout(data, opts.tree, opts.nodeSizes);

    case "grid":
      return calculateGridLayout(data, opts.grid, opts.nodeSizes);

    default:
      // Fallback to force-directed
      return calculateForceDirectedLayout(data, opts.force, opts.nodeSizes);
  }
}

/**
 * Calculate force-directed layout
 * Wrapper for backward compatibility
 */
export { calculateForceDirectedLayout } from "./autoLayout/forceDirectedLayout";

/**
 * Calculate hierarchical layout
 * Wrapper for backward compatibility
 */
export { calculateHierarchicalLayout } from "./autoLayout/hierarchicalLayout";

/**
 * Calculate tree layout
 */
export { calculateTreeLayout } from "./autoLayout/treeLayout";

/**
 * Calculate the bounding box of all nodes including their sizes
 * Useful for viewport adjustments after layout
 */
export function calculateNodesBoundingBox(
  nodes: Node[],
  positions: Record<NodeId, Position>,
  nodeSizes?: Record<NodeId, Size>,
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) {
      return;
    }

    const size = getNodeSizeWithOverride(node, nodeSizes);

    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + size.width);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + size.height);
  });

  // Handle empty case
  if (!isFinite(minX)) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY,
  };
}
