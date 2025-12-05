/**
 * @file Edge crossing reduction algorithms for hierarchical layout
 * Implements barycentric and median methods for ordering nodes within layers
 */
import type { NodeId, Connection } from "../../../../../types/core";
import type { AdjacencyMap } from "./types";

/**
 * Build bidirectional adjacency map from connections
 */
export function buildBidirectionalAdjacency(connections: Connection[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();

  connections.forEach((conn) => {
    if (!map.has(conn.fromNodeId)) {
      map.set(conn.fromNodeId, new Set());
    }
    if (!map.has(conn.toNodeId)) {
      map.set(conn.toNodeId, new Set());
    }
    map.get(conn.fromNodeId)!.add(conn.toNodeId);
    map.get(conn.toNodeId)!.add(conn.fromNodeId);
  });

  return map;
}

/**
 * Calculate barycenter (average position) of neighbors in fixed layer
 */
function calculateBarycenter(
  nodeId: NodeId,
  fixedLayerPositions: Map<NodeId, number>,
  adjacency: AdjacencyMap,
): number {
  const neighbors = adjacency.get(nodeId) ?? new Set();
  const fixedNeighbors: number[] = [];

  neighbors.forEach((neighborId) => {
    const position = fixedLayerPositions.get(neighborId);
    if (position !== undefined) {
      fixedNeighbors.push(position);
    }
  });

  if (fixedNeighbors.length === 0) {
    return Infinity; // Keep original position
  }

  return fixedNeighbors.reduce((sum, pos) => sum + pos, 0) / fixedNeighbors.length;
}

/**
 * Calculate median position of neighbors in fixed layer
 */
function calculateMedian(
  nodeId: NodeId,
  fixedLayerPositions: Map<NodeId, number>,
  adjacency: AdjacencyMap,
): number {
  const neighbors = adjacency.get(nodeId) ?? new Set();
  const fixedNeighbors: number[] = [];

  neighbors.forEach((neighborId) => {
    const position = fixedLayerPositions.get(neighborId);
    if (position !== undefined) {
      fixedNeighbors.push(position);
    }
  });

  if (fixedNeighbors.length === 0) {
    return Infinity; // Keep original position
  }

  fixedNeighbors.sort((a, b) => a - b);

  const mid = Math.floor(fixedNeighbors.length / 2);
  if (fixedNeighbors.length % 2 === 0) {
    return (fixedNeighbors[mid - 1] + fixedNeighbors[mid]) / 2;
  }
  return fixedNeighbors[mid];
}

/**
 * Order a layer based on positions in fixed layer using barycentric method
 */
export function orderLayerByBarycenter(
  layer: NodeId[],
  fixedLayer: NodeId[],
  adjacency: AdjacencyMap,
): NodeId[] {
  // Build position map for fixed layer
  const fixedPositions = new Map<NodeId, number>();
  fixedLayer.forEach((nodeId, index) => {
    fixedPositions.set(nodeId, index);
  });

  // Calculate barycenters
  const nodeWithBarycenters = layer.map((nodeId, originalIndex) => ({
    nodeId,
    barycenter: calculateBarycenter(nodeId, fixedPositions, adjacency),
    originalIndex,
  }));

  // Sort by barycenter, maintaining original order for ties (Infinity values)
  nodeWithBarycenters.sort((a, b) => {
    if (a.barycenter === Infinity && b.barycenter === Infinity) {
      return a.originalIndex - b.originalIndex;
    }
    if (a.barycenter === Infinity) {
      return 1;
    }
    if (b.barycenter === Infinity) {
      return -1;
    }
    return a.barycenter - b.barycenter;
  });

  return nodeWithBarycenters.map((item) => item.nodeId);
}

/**
 * Order a layer based on positions in fixed layer using median method
 */
export function orderLayerByMedian(
  layer: NodeId[],
  fixedLayer: NodeId[],
  adjacency: AdjacencyMap,
): NodeId[] {
  // Build position map for fixed layer
  const fixedPositions = new Map<NodeId, number>();
  fixedLayer.forEach((nodeId, index) => {
    fixedPositions.set(nodeId, index);
  });

  // Calculate medians
  const nodeWithMedians = layer.map((nodeId, originalIndex) => ({
    nodeId,
    median: calculateMedian(nodeId, fixedPositions, adjacency),
    originalIndex,
  }));

  // Sort by median, maintaining original order for ties (Infinity values)
  nodeWithMedians.sort((a, b) => {
    if (a.median === Infinity && b.median === Infinity) {
      return a.originalIndex - b.originalIndex;
    }
    if (a.median === Infinity) {
      return 1;
    }
    if (b.median === Infinity) {
      return -1;
    }
    return a.median - b.median;
  });

  return nodeWithMedians.map((item) => item.nodeId);
}

/**
 * Count edge crossings between two adjacent layers
 */
export function countCrossings(
  upperLayer: NodeId[],
  lowerLayer: NodeId[],
  adjacency: AdjacencyMap,
): number {
  // Build position maps
  const upperPositions = new Map<NodeId, number>();
  const lowerPositions = new Map<NodeId, number>();

  upperLayer.forEach((nodeId, index) => {
    upperPositions.set(nodeId, index);
  });
  lowerLayer.forEach((nodeId, index) => {
    lowerPositions.set(nodeId, index);
  });

  // Collect all edges between layers
  const edges: Array<{ upper: number; lower: number }> = [];

  upperLayer.forEach((upperNodeId) => {
    const upperPos = upperPositions.get(upperNodeId)!;
    const neighbors = adjacency.get(upperNodeId) ?? new Set();

    neighbors.forEach((neighborId) => {
      const lowerPos = lowerPositions.get(neighborId);
      if (lowerPos !== undefined) {
        edges.push({ upper: upperPos, lower: lowerPos });
      }
    });
  });

  // Count crossings using simple O(e²) comparison
  let crossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      // Edges cross if they have opposite ordering in upper vs lower
      if ((e1.upper < e2.upper && e1.lower > e2.lower) || (e1.upper > e2.upper && e1.lower < e2.lower)) {
        crossings++;
      }
    }
  }

  return crossings;
}

/**
 * Count total edge crossings in entire layered graph
 */
export function countTotalCrossings(layers: NodeId[][], adjacency: AdjacencyMap): number {
  let total = 0;

  for (let i = 0; i < layers.length - 1; i++) {
    total += countCrossings(layers[i], layers[i + 1], adjacency);
  }

  return total;
}

/**
 * Reduce edge crossings using barycentric method
 * Performs multiple forward and backward sweeps
 */
export function reduceCrossingsBarycentric(
  layers: NodeId[][],
  connections: Connection[],
  iterations: number,
): NodeId[][] {
  if (layers.length <= 1) {
    return layers.map((layer) => [...layer]);
  }

  const adjacency = buildBidirectionalAdjacency(connections);
  const result = layers.map((layer) => [...layer]);
  let bestCrossings = countTotalCrossings(result, adjacency);
  let bestResult = result.map((layer) => [...layer]);

  for (let iter = 0; iter < iterations; iter++) {
    // Forward sweep (layer 0 to n-1)
    for (let i = 1; i < result.length; i++) {
      result[i] = orderLayerByBarycenter(result[i], result[i - 1], adjacency);
    }

    // Backward sweep (layer n-1 to 0)
    for (let i = result.length - 2; i >= 0; i--) {
      result[i] = orderLayerByBarycenter(result[i], result[i + 1], adjacency);
    }

    // Check if we improved
    const currentCrossings = countTotalCrossings(result, adjacency);
    if (currentCrossings < bestCrossings) {
      bestCrossings = currentCrossings;
      bestResult = result.map((layer) => [...layer]);
    }

    // Early termination if no crossings
    if (bestCrossings === 0) {
      break;
    }
  }

  return bestResult;
}

/**
 * Reduce edge crossings using median method
 */
export function reduceCrossingsMedian(
  layers: NodeId[][],
  connections: Connection[],
  iterations: number,
): NodeId[][] {
  if (layers.length <= 1) {
    return layers.map((layer) => [...layer]);
  }

  const adjacency = buildBidirectionalAdjacency(connections);
  const result = layers.map((layer) => [...layer]);
  let bestCrossings = countTotalCrossings(result, adjacency);
  let bestResult = result.map((layer) => [...layer]);

  for (let iter = 0; iter < iterations; iter++) {
    // Forward sweep
    for (let i = 1; i < result.length; i++) {
      result[i] = orderLayerByMedian(result[i], result[i - 1], adjacency);
    }

    // Backward sweep
    for (let i = result.length - 2; i >= 0; i--) {
      result[i] = orderLayerByMedian(result[i], result[i + 1], adjacency);
    }

    // Check if we improved
    const currentCrossings = countTotalCrossings(result, adjacency);
    if (currentCrossings < bestCrossings) {
      bestCrossings = currentCrossings;
      bestResult = result.map((layer) => [...layer]);
    }

    if (bestCrossings === 0) {
      break;
    }
  }

  return bestResult;
}
