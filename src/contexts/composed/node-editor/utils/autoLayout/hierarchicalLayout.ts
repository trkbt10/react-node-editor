/**
 * @file Improved hierarchical (Sugiyama-style) layout algorithm
 * Features: longest-path layer assignment, edge crossing reduction, size-aware positioning
 */
import type { NodeId, Position, Size, Node, Connection, NodeEditorData } from "../../../../../types/core";
import type { HierarchicalLayoutOptions, LayoutResult, LayoutDirection } from "./types";
import { DEFAULT_HIERARCHICAL_OPTIONS } from "./types";
import { getNodeSizeWithOverride } from "../../../../../utils/boundingBoxUtils";
import { buildOutgoingMap, buildIncomingMap } from "./graphAnalysis";
import { reduceCrossingsBarycentric, reduceCrossingsMedian, countTotalCrossings, buildBidirectionalAdjacency } from "./crossingReduction";

/**
 * Assign layers using longest path method
 * Nodes are assigned to layers based on their longest path from sources
 */
function assignLayersLongestPath(
  nodes: Node[],
  connections: Connection[],
): Map<NodeId, number> {
  const outgoing = buildOutgoingMap(nodes, connections);
  const incoming = buildIncomingMap(nodes, connections);
  const nodeLayer = new Map<NodeId, number>();

  // Find source nodes (no incoming edges)
  const sourceNodes = nodes.filter((node) => (incoming.get(node.id)?.size ?? 0) === 0);

  // If no sources found, find nodes with minimum incoming
  if (sourceNodes.length === 0 && nodes.length > 0) {
    const minIncoming = Math.min(...nodes.map((n) => incoming.get(n.id)?.size ?? 0));
    sourceNodes.push(...nodes.filter((n) => (incoming.get(n.id)?.size ?? 0) === minIncoming));
  }

  // BFS to assign layers - ensures each node is at least 1 layer below all its predecessors
  const queue: Array<{ nodeId: NodeId; layer: number }> = [];
  sourceNodes.forEach((node) => {
    queue.push({ nodeId: node.id, layer: 0 });
    nodeLayer.set(node.id, 0);
  });

  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;
    const successors = outgoing.get(nodeId) ?? new Set();

    successors.forEach((successorId) => {
      const currentLayer = nodeLayer.get(successorId);
      const newLayer = layer + 1;

      // Update if this path gives a deeper layer
      if (currentLayer === undefined || newLayer > currentLayer) {
        nodeLayer.set(successorId, newLayer);
        queue.push({ nodeId: successorId, layer: newLayer });
      }
    });
  }

  // Handle disconnected nodes - place at the end
  nodes.forEach((node) => {
    if (!nodeLayer.has(node.id)) {
      const maxLayer = Math.max(0, ...Array.from(nodeLayer.values()));
      nodeLayer.set(node.id, maxLayer + 1);
    }
  });

  return nodeLayer;
}

/**
 * Group nodes by their layer assignment
 */
function groupNodesByLayer(nodeLayer: Map<NodeId, number>): NodeId[][] {
  const maxLayer = Math.max(0, ...Array.from(nodeLayer.values()));
  const layers: NodeId[][] = Array.from({ length: maxLayer + 1 }, () => []);

  nodeLayer.forEach((layer, nodeId) => {
    layers[layer].push(nodeId);
  });

  return layers;
}

/**
 * Calculate size-aware positions within layers
 */
function assignCoordinates(
  layers: NodeId[][],
  nodes: Node[],
  options: HierarchicalLayoutOptions,
  nodeSizesOverride?: Record<NodeId, Size>,
): Map<NodeId, Position> {
  const positions = new Map<NodeId, Position>();

  // Calculate node sizes
  const nodeSizes = new Map<NodeId, Size>();
  nodes.forEach((node) => {
    nodeSizes.set(node.id, getNodeSizeWithOverride(node, nodeSizesOverride));
  });

  layers.forEach((layer, layerIndex) => {
    if (layer.length === 0) {
      return;
    }

    // Calculate total width needed for this layer
    let totalWidth = 0;
    const layerSizes: Size[] = [];

    layer.forEach((nodeId) => {
      const size = nodeSizes.get(nodeId) ?? { width: 100, height: 50 };
      layerSizes.push(size);
      totalWidth += size.width;
    });

    // Add spacing between nodes
    totalWidth += (layer.length - 1) * options.nodeSpacing;

    // Calculate starting X to center the layer
    const startX = -totalWidth / 2;

    // Calculate Y based on layer index
    const y = layerIndex * options.layerSpacing;

    // Place nodes
    let currentX = startX;
    layer.forEach((nodeId, nodeIndex) => {
      positions.set(nodeId, { x: currentX, y });
      currentX += layerSizes[nodeIndex].width + options.nodeSpacing;
    });
  });

  return positions;
}

/**
 * Apply direction transformation to positions
 */
function applyDirection(
  positions: Map<NodeId, Position>,
  direction: LayoutDirection,
): Record<NodeId, Position> {
  const result: Record<NodeId, Position> = {};

  positions.forEach((pos, nodeId) => {
    switch (direction) {
      case "TB": // Top to Bottom (default)
        result[nodeId] = { x: pos.x, y: pos.y };
        break;
      case "BT": // Bottom to Top
        result[nodeId] = { x: pos.x, y: -pos.y };
        break;
      case "LR": // Left to Right
        result[nodeId] = { x: pos.y, y: pos.x };
        break;
      case "RL": // Right to Left
        result[nodeId] = { x: -pos.y, y: pos.x };
        break;
    }
  });

  return result;
}

/**
 * Calculate bounding box size from positions
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
 * Calculate improved hierarchical layout
 */
export function calculateHierarchicalLayout(
  data: NodeEditorData,
  options: Partial<HierarchicalLayoutOptions> = {},
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
      algorithm: "hierarchical",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        edgeCrossings: 0,
        boundingBox: { width: 0, height: 0 },
      },
    };
  }

  // Handle single node
  if (nodes.length === 1) {
    return {
      nodePositions: { [nodes[0].id]: { x: 0, y: 0 } },
      iterations: 1,
      algorithm: "hierarchical",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        edgeCrossings: 0,
        boundingBox: getNodeSizeWithOverride(nodes[0], nodeSizes),
      },
    };
  }

  // Merge options with defaults
  const opts: HierarchicalLayoutOptions = { ...DEFAULT_HIERARCHICAL_OPTIONS, ...options };

  // Step 1: Layer assignment using longest path
  const nodeLayer = assignLayersLongestPath(nodes, connections);

  // Step 2: Group nodes by layer
  let layers = groupNodesByLayer(nodeLayer);

  // Step 3: Edge crossing reduction
  if (opts.crossReduction !== "none" && layers.length > 1) {
    if (opts.crossReduction === "barycentric") {
      layers = reduceCrossingsBarycentric(layers, connections, opts.crossReductionIterations);
    } else if (opts.crossReduction === "median") {
      layers = reduceCrossingsMedian(layers, connections, opts.crossReductionIterations);
    }
  }

  // Step 4: Coordinate assignment
  const positions = assignCoordinates(layers, nodes, opts, nodeSizes);

  // Step 5: Apply direction transformation
  const directedPositions = applyDirection(positions, opts.direction);

  // Calculate metrics
  const adjacency = buildBidirectionalAdjacency(connections);
  const edgeCrossings = countTotalCrossings(layers, adjacency);

  return {
    nodePositions: directedPositions,
    iterations: layers.length,
    algorithm: "hierarchical",
    metrics: {
      executionTimeMs: performance.now() - startTime,
      edgeCrossings,
      boundingBox: calculateBoundingBoxSize(nodes, directedPositions, nodeSizes),
    },
  };
}
