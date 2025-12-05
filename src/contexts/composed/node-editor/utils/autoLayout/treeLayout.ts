/**
 * @file Tree layout algorithm based on Reingold-Tilford
 * Optimized for tree structures with clean, balanced layouts
 */
import type { NodeId, Position, Size, Node, Connection, NodeEditorData } from "../../../../../types/core";
import type { TreeLayoutOptions, LayoutResult, LayoutDirection } from "./types";
import { DEFAULT_TREE_OPTIONS } from "./types";
import { getNodeSizeWithOverride } from "../../../../../utils/boundingBoxUtils";
import { buildIncomingMap } from "./graphAnalysis";

/**
 * Tree node information for layout calculation
 */
type TreeNodeInfo = {
  id: NodeId;
  children: NodeId[];
  parent: NodeId | null;
  depth: number;
  x: number;
  y: number;
  mod: number; // Modification for subtree positioning
  width: number;
  height: number;
};

/**
 * Build tree structure from nodes and connections
 * Returns root nodes and tree info map
 */
function buildTreeStructure(
  nodes: Node[],
  connections: Connection[],
  nodeSizes?: Record<NodeId, Size>,
): { roots: NodeId[]; treeInfo: Map<NodeId, TreeNodeInfo> } {
  const incoming = buildIncomingMap(nodes, connections);
  const treeInfo = new Map<NodeId, TreeNodeInfo>();

  // Initialize tree info for all nodes
  nodes.forEach((node) => {
    const size = getNodeSizeWithOverride(node, nodeSizes);
    treeInfo.set(node.id, {
      id: node.id,
      children: [],
      parent: null,
      depth: 0,
      x: 0,
      y: 0,
      mod: 0,
      width: size.width,
      height: size.height,
    });
  });

  // Build parent-child relationships
  connections.forEach((conn) => {
    const parentInfo = treeInfo.get(conn.fromNodeId);
    const childInfo = treeInfo.get(conn.toNodeId);

    if (parentInfo && childInfo && childInfo.parent === null) {
      parentInfo.children.push(conn.toNodeId);
      childInfo.parent = conn.fromNodeId;
    }
  });

  // Find roots (nodes with no parent)
  const roots: NodeId[] = [];
  nodes.forEach((node) => {
    const info = treeInfo.get(node.id)!;
    if (info.parent === null) {
      roots.push(node.id);
    }
  });

  // If no roots found (cyclic graph), select nodes with minimum incoming
  if (roots.length === 0 && nodes.length > 0) {
    const minIncoming = Math.min(...nodes.map((n) => incoming.get(n.id)?.size ?? 0));
    nodes.forEach((node) => {
      if ((incoming.get(node.id)?.size ?? 0) === minIncoming) {
        roots.push(node.id);
        const info = treeInfo.get(node.id)!;
        info.parent = null;
      }
    });
  }

  // Calculate depths using BFS
  function calculateDepths(rootId: NodeId): void {
    const queue: Array<{ nodeId: NodeId; depth: number }> = [{ nodeId: rootId, depth: 0 }];
    const visited = new Set<NodeId>();

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);

      const info = treeInfo.get(nodeId)!;
      info.depth = depth;

      info.children.forEach((childId) => {
        queue.push({ nodeId: childId, depth: depth + 1 });
      });
    }
  }

  roots.forEach((rootId) => {
    calculateDepths(rootId);
  });

  return { roots, treeInfo };
}

/**
 * First pass: calculate preliminary x-coordinates (post-order traversal)
 */
function firstPass(
  nodeId: NodeId,
  treeInfo: Map<NodeId, TreeNodeInfo>,
  options: TreeLayoutOptions,
): void {
  const info = treeInfo.get(nodeId)!;

  // Process children first (post-order)
  info.children.forEach((childId) => {
    firstPass(childId, treeInfo, options);
  });

  // Calculate x position based on children
  if (info.children.length === 0) {
    // Leaf node
    info.x = 0;
  } else if (info.children.length === 1) {
    // Single child - center above it
    const childInfo = treeInfo.get(info.children[0])!;
    info.x = childInfo.x;
  } else {
    // Multiple children - center above leftmost and rightmost
    const firstChild = treeInfo.get(info.children[0])!;
    const lastChild = treeInfo.get(info.children[info.children.length - 1])!;
    info.x = (firstChild.x + lastChild.x) / 2;
  }
}

/**
 * Calculate minimum separation needed between two subtrees
 */
function getLeftContour(
  nodeId: NodeId,
  treeInfo: Map<NodeId, TreeNodeInfo>,
  depth: number,
  contour: Map<number, number>,
  modSum: number,
): void {
  const info = treeInfo.get(nodeId)!;
  const actualX = info.x + modSum;
  const nodeDepth = info.depth;

  const currentMin = contour.get(nodeDepth);
  if (currentMin === undefined || actualX < currentMin) {
    contour.set(nodeDepth, actualX);
  }

  info.children.forEach((childId) => {
    getLeftContour(childId, treeInfo, depth + 1, contour, modSum + info.mod);
  });
}

function getRightContour(
  nodeId: NodeId,
  treeInfo: Map<NodeId, TreeNodeInfo>,
  depth: number,
  contour: Map<number, number>,
  modSum: number,
): void {
  const info = treeInfo.get(nodeId)!;
  const actualX = info.x + info.width + modSum;
  const nodeDepth = info.depth;

  const currentMax = contour.get(nodeDepth);
  if (currentMax === undefined || actualX > currentMax) {
    contour.set(nodeDepth, actualX);
  }

  info.children.forEach((childId) => {
    getRightContour(childId, treeInfo, depth + 1, contour, modSum + info.mod);
  });
}

/**
 * Position children to avoid overlap
 */
function positionChildren(
  nodeId: NodeId,
  treeInfo: Map<NodeId, TreeNodeInfo>,
  options: TreeLayoutOptions,
): void {
  const info = treeInfo.get(nodeId)!;

  if (info.children.length === 0) {
    return;
  }

  // First, recursively position children
  info.children.forEach((childId) => {
    positionChildren(childId, treeInfo, options);
  });

  // Then, space siblings apart
  let prevChildId: NodeId | null = null;
  let totalShift = 0;

  info.children.forEach((childId) => {
    const childInfo = treeInfo.get(childId)!;

    if (prevChildId !== null) {
      // Get contours of previous and current subtrees
      const prevRightContour = new Map<number, number>();
      const currLeftContour = new Map<number, number>();

      getRightContour(prevChildId, treeInfo, 0, prevRightContour, 0);
      getLeftContour(childId, treeInfo, 0, currLeftContour, 0);

      // Find minimum separation needed
      let minSep = options.siblingSpacing;
      const depths = new Set([...prevRightContour.keys(), ...currLeftContour.keys()]);

      depths.forEach((depth) => {
        const rightX = prevRightContour.get(depth);
        const leftX = currLeftContour.get(depth);

        if (rightX !== undefined && leftX !== undefined) {
          const overlap = rightX + options.siblingSpacing - leftX;
          if (overlap > minSep) {
            minSep = overlap;
          }
        }
      });

      // Apply shift
      if (minSep > 0) {
        childInfo.x += minSep + totalShift;
        childInfo.mod += minSep + totalShift;
        totalShift += minSep;
      }
    }

    prevChildId = childId;
  });

  // Center parent over children
  const firstChild = treeInfo.get(info.children[0])!;
  const lastChild = treeInfo.get(info.children[info.children.length - 1])!;
  const midpoint = (firstChild.x + lastChild.x + lastChild.width) / 2 - info.width / 2;
  info.x = midpoint;
}

/**
 * Second pass: apply mod values and calculate final positions (pre-order)
 */
function secondPass(
  nodeId: NodeId,
  treeInfo: Map<NodeId, TreeNodeInfo>,
  modSum: number,
  options: TreeLayoutOptions,
): void {
  const info = treeInfo.get(nodeId)!;

  // Apply accumulated mod
  info.x += modSum;
  info.y = info.depth * options.levelSpacing;

  // Process children
  info.children.forEach((childId) => {
    secondPass(childId, treeInfo, modSum + info.mod, options);
  });
}

/**
 * Center the tree around origin
 */
function centerTree(treeInfo: Map<NodeId, TreeNodeInfo>): void {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  treeInfo.forEach((info) => {
    minX = Math.min(minX, info.x);
    maxX = Math.max(maxX, info.x + info.width);
    minY = Math.min(minY, info.y);
    maxY = Math.max(maxY, info.y + info.height);
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  treeInfo.forEach((info) => {
    info.x -= centerX;
    info.y -= centerY;
  });
}

/**
 * Apply direction transformation
 */
function applyDirection(
  treeInfo: Map<NodeId, TreeNodeInfo>,
  direction: LayoutDirection,
): Record<NodeId, Position> {
  const result: Record<NodeId, Position> = {};

  treeInfo.forEach((info, nodeId) => {
    switch (direction) {
      case "TB": // Top to Bottom (default)
        result[nodeId] = { x: info.x, y: info.y };
        break;
      case "BT": // Bottom to Top
        result[nodeId] = { x: info.x, y: -info.y };
        break;
      case "LR": // Left to Right
        result[nodeId] = { x: info.y, y: info.x };
        break;
      case "RL": // Right to Left
        result[nodeId] = { x: -info.y, y: info.x };
        break;
    }
  });

  return result;
}

/**
 * Calculate bounding box size
 */
function calculateBoundingBoxSize(
  nodes: Node[],
  positions: Record<NodeId, Position>,
  nodeSizesOverride?: Record<NodeId, Size>,
): { width: number; height: number } {
  if (nodes.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) {
      return;
    }

    const size = getNodeSizeWithOverride(node, nodeSizesOverride);
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + size.width);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + size.height);
  });

  return {
    width: isFinite(maxX - minX) ? maxX - minX : 0,
    height: isFinite(maxY - minY) ? maxY - minY : 0,
  };
}

/**
 * Calculate tree layout using Reingold-Tilford style algorithm
 */
export function calculateTreeLayout(
  data: NodeEditorData,
  options: Partial<TreeLayoutOptions> = {},
  nodeSizes?: Record<NodeId, Size>,
): LayoutResult {
  const startTime = performance.now();
  const nodes = Object.values(data.nodes);
  const connections = Object.values(data.connections);

  // Handle empty case
  if (nodes.length === 0) {
    return {
      nodePositions: {},
      iterations: 0,
      algorithm: "tree",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        boundingBox: { width: 0, height: 0 },
      },
    };
  }

  // Handle single node
  if (nodes.length === 1) {
    return {
      nodePositions: { [nodes[0].id]: { x: 0, y: 0 } },
      iterations: 1,
      algorithm: "tree",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        boundingBox: getNodeSizeWithOverride(nodes[0], nodeSizes),
      },
    };
  }

  // Merge options with defaults
  const opts: TreeLayoutOptions = { ...DEFAULT_TREE_OPTIONS, ...options };

  // Build tree structure
  const { roots, treeInfo } = buildTreeStructure(nodes, connections, nodeSizes);

  // Process each tree (forest)
  let offsetX = 0;
  const allPositions: Record<NodeId, Position> = {};

  roots.forEach((rootId, index) => {
    // First pass: calculate preliminary positions
    firstPass(rootId, treeInfo, opts);

    // Position children to avoid overlap
    positionChildren(rootId, treeInfo, opts);

    // Second pass: apply mod values
    secondPass(rootId, treeInfo, 0, opts);

    // Apply offset for multiple trees
    if (index > 0) {
      // Find width of previous trees
      let maxX = -Infinity;
      treeInfo.forEach((info) => {
        if (allPositions[info.id]) {
          maxX = Math.max(maxX, allPositions[info.id].x + info.width);
        }
      });

      if (isFinite(maxX)) {
        offsetX = maxX + opts.siblingSpacing * 2;
      }
    }

    // Collect positions for this tree
    const collectSubtree = (nodeId: NodeId) => {
      const info = treeInfo.get(nodeId)!;
      // Apply direction transformation later, just store raw positions
      info.x += offsetX;
      info.children.forEach(collectSubtree);
    };

    collectSubtree(rootId);
  });

  // Center the entire forest
  centerTree(treeInfo);

  // Apply direction and get final positions
  const positions = applyDirection(treeInfo, opts.direction);

  return {
    nodePositions: positions,
    iterations: roots.length,
    algorithm: "tree",
    metrics: {
      executionTimeMs: performance.now() - startTime,
      boundingBox: calculateBoundingBoxSize(nodes, positions, nodeSizes),
    },
  };
}
