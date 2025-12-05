/**
 * @file Graph analysis utilities for auto-layout algorithm selection
 * Provides cycle detection, tree/DAG detection, and connected component analysis
 */
import type { NodeId, Node, Connection } from "../../../../../types/core";
import type { GraphCharacteristics, LayoutAlgorithm, AdjacencyMap } from "./types";

/**
 * Build outgoing adjacency map from connections
 */
export function buildOutgoingMap(nodes: Node[], connections: Connection[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    map.set(node.id, new Set());
  });

  connections.forEach((conn) => {
    if (nodeIds.has(conn.fromNodeId) && nodeIds.has(conn.toNodeId)) {
      map.get(conn.fromNodeId)?.add(conn.toNodeId);
    }
  });

  return map;
}

/**
 * Build incoming adjacency map from connections
 */
export function buildIncomingMap(nodes: Node[], connections: Connection[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    map.set(node.id, new Set());
  });

  connections.forEach((conn) => {
    if (nodeIds.has(conn.fromNodeId) && nodeIds.has(conn.toNodeId)) {
      map.get(conn.toNodeId)?.add(conn.fromNodeId);
    }
  });

  return map;
}

/**
 * Build bidirectional adjacency map (treats graph as undirected)
 */
export function buildBidirectionalMap(nodes: Node[], connections: Connection[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    map.set(node.id, new Set());
  });

  connections.forEach((conn) => {
    if (nodeIds.has(conn.fromNodeId) && nodeIds.has(conn.toNodeId)) {
      map.get(conn.fromNodeId)?.add(conn.toNodeId);
      map.get(conn.toNodeId)?.add(conn.fromNodeId);
    }
  });

  return map;
}

/**
 * Node colors for DFS cycle detection
 */
const enum NodeColor {
  WHITE = 0, // Not visited
  GRAY = 1, // Currently in stack
  BLACK = 2, // Fully processed
}

/**
 * Detect cycles in directed graph using DFS coloring
 * Returns true if the graph contains at least one cycle
 */
export function detectCycles(nodes: Node[], outgoing: AdjacencyMap): boolean {
  const colors = new Map<NodeId, NodeColor>();

  nodes.forEach((node) => {
    colors.set(node.id, NodeColor.WHITE);
  });

  function dfs(nodeId: NodeId): boolean {
    colors.set(nodeId, NodeColor.GRAY);

    const neighbors = outgoing.get(nodeId) ?? new Set();
    for (const neighbor of neighbors) {
      const color = colors.get(neighbor);
      if (color === NodeColor.GRAY) {
        // Back edge found - cycle detected
        return true;
      }
      if (color === NodeColor.WHITE) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    colors.set(nodeId, NodeColor.BLACK);
    return false;
  }

  for (const node of nodes) {
    if (colors.get(node.id) === NodeColor.WHITE) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Count connected components using union-find approach
 */
export function countConnectedComponents(nodes: Node[], bidirectional: AdjacencyMap): number {
  if (nodes.length === 0) {
    return 0;
  }

  const visited = new Set<NodeId>();
  let components = 0;

  function bfs(startId: NodeId): void {
    const queue: NodeId[] = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = bidirectional.get(current) ?? new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      bfs(node.id);
      components++;
    }
  }

  return components;
}

/**
 * Check if the graph is a tree
 * A tree has exactly n-1 edges, no cycles, and is connected
 */
export function isTree(
  nodes: Node[],
  connections: Connection[],
  outgoing: AdjacencyMap,
  bidirectional: AdjacencyMap,
): boolean {
  if (nodes.length === 0) {
    return true;
  }
  if (nodes.length === 1) {
    return connections.length === 0;
  }

  // Check edge count: tree has exactly n-1 edges
  if (connections.length !== nodes.length - 1) {
    return false;
  }

  // Check connectivity
  const componentCount = countConnectedComponents(nodes, bidirectional);
  if (componentCount !== 1) {
    return false;
  }

  // Check for cycles
  return !detectCycles(nodes, outgoing);
}

/**
 * Calculate graph density
 * density = edges / (nodes * (nodes - 1)) for directed graph
 */
export function calculateDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount <= 1) {
    return 0;
  }
  return edgeCount / (nodeCount * (nodeCount - 1));
}

/**
 * Calculate degree statistics
 */
export function calculateDegreeStats(
  nodes: Node[],
  outgoing: AdjacencyMap,
  incoming: AdjacencyMap,
): { maxDegree: number; avgDegree: number } {
  if (nodes.length === 0) {
    return { maxDegree: 0, avgDegree: 0 };
  }

  let totalDegree = 0;
  let maxDegree = 0;

  nodes.forEach((node) => {
    const outDegree = outgoing.get(node.id)?.size ?? 0;
    const inDegree = incoming.get(node.id)?.size ?? 0;
    const degree = outDegree + inDegree;

    totalDegree += degree;
    maxDegree = Math.max(maxDegree, degree);
  });

  return {
    maxDegree,
    avgDegree: totalDegree / nodes.length,
  };
}

/**
 * Analyze graph characteristics for algorithm selection
 */
export function analyzeGraph(nodes: Node[], connections: Connection[]): GraphCharacteristics {
  if (nodes.length === 0) {
    return {
      nodeCount: 0,
      edgeCount: 0,
      isTree: true,
      isDAG: true,
      hasCycles: false,
      maxDegree: 0,
      avgDegree: 0,
      connectedComponents: 0,
      density: 0,
    };
  }

  const outgoing = buildOutgoingMap(nodes, connections);
  const incoming = buildIncomingMap(nodes, connections);
  const bidirectional = buildBidirectionalMap(nodes, connections);

  const hasCycles = detectCycles(nodes, outgoing);
  const componentCount = countConnectedComponents(nodes, bidirectional);
  const treeCheck = isTree(nodes, connections, outgoing, bidirectional);
  const { maxDegree, avgDegree } = calculateDegreeStats(nodes, outgoing, incoming);
  const density = calculateDensity(nodes.length, connections.length);

  return {
    nodeCount: nodes.length,
    edgeCount: connections.length,
    isTree: treeCheck,
    isDAG: !hasCycles,
    hasCycles,
    maxDegree,
    avgDegree,
    connectedComponents: componentCount,
    density,
  };
}

/**
 * Select optimal layout algorithm based on graph characteristics
 */
export function selectAlgorithm(characteristics: GraphCharacteristics): LayoutAlgorithm {
  const { nodeCount, edgeCount, isTree: isTreeGraph, isDAG, hasCycles, avgDegree, density } = characteristics;

  // No nodes or edges - grid is simplest
  if (nodeCount === 0 || edgeCount === 0) {
    return "grid";
  }

  // Tree structure - use specialized tree layout
  if (isTreeGraph) {
    return "tree";
  }

  // DAG with sparse connections - hierarchical layout works well
  if (isDAG && avgDegree < 3 && density < 0.2) {
    return "hierarchical";
  }

  // Dense DAG - still prefer hierarchical but with more iterations
  if (isDAG) {
    return "hierarchical";
  }

  // Graphs with cycles or high density - force-directed handles best
  if (hasCycles || density > 0.3) {
    return "force";
  }

  // Default to force-directed for general graphs
  return "force";
}
