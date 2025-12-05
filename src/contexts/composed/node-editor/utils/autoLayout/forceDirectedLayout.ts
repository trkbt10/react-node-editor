/**
 * @file Improved force-directed layout algorithm
 * Features: size-aware repulsion, Barnes-Hut approximation, adaptive parameters
 */
import type { NodeId, Position, Size, Node, Connection, NodeEditorData } from "../../../../../types/core";
import type { ForceLayoutOptions, LayoutResult } from "./types";
import { DEFAULT_FORCE_OPTIONS } from "./types";
import { getNodeSizeWithOverride } from "../../../../../utils/boundingBoxUtils";
import { QuadTree, calculateBounds } from "./quadTree";
import { buildOutgoingMap, detectCycles, calculateDensity } from "./graphAnalysis";

/**
 * Internal position and velocity state
 */
type SimulationState = {
  positions: Map<NodeId, Position>;
  velocities: Map<NodeId, Position>;
  sizes: Map<NodeId, Size>;
};

/**
 * Adapt layout parameters based on graph characteristics
 */
function adaptParameters(
  nodeCount: number,
  edgeCount: number,
  baseOptions: ForceLayoutOptions,
): ForceLayoutOptions {
  if (nodeCount <= 1) {
    return baseOptions;
  }

  const density = calculateDensity(nodeCount, edgeCount);

  // Scale spring length based on node count to spread out larger graphs
  const springLengthScale = Math.max(1, Math.sqrt(nodeCount / 10));

  // Increase repulsion for dense graphs to prevent overlap
  const repulsionScale = 1 + density * 2;

  // More iterations for larger graphs
  const iterationScale = Math.min(2, 1 + nodeCount / 200);

  return {
    ...baseOptions,
    springLength: baseOptions.springLength * springLengthScale,
    repulsionStrength: baseOptions.repulsionStrength * repulsionScale,
    iterations: Math.ceil(baseOptions.iterations * iterationScale),
    // Auto-enable Barnes-Hut for larger graphs
    useBarnesHut: baseOptions.useBarnesHut && nodeCount > 50,
  };
}

/**
 * Initialize simulation state from nodes
 */
function initializeState(nodes: Node[], nodeSizes?: Record<NodeId, Size>): SimulationState {
  const positions = new Map<NodeId, Position>();
  const velocities = new Map<NodeId, Position>();
  const sizes = new Map<NodeId, Size>();

  nodes.forEach((node, index) => {
    // Use existing positions or circular layout
    if (node.position) {
      positions.set(node.id, { ...node.position });
    } else {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.sqrt(nodes.length) * 50;
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    velocities.set(node.id, { x: 0, y: 0 });
    sizes.set(node.id, getNodeSizeWithOverride(node, nodeSizes));
  });

  return { positions, velocities, sizes };
}

/**
 * Calculate pairwise repulsion forces (O(n²))
 */
function calculatePairwiseRepulsion(
  nodes: Node[],
  state: SimulationState,
  forces: Map<NodeId, Position>,
  options: ForceLayoutOptions,
): void {
  const { positions, sizes } = state;
  const { repulsionStrength, sizeAwareRepulsion } = options;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      const posA = positions.get(nodeA.id)!;
      const posB = positions.get(nodeB.id)!;
      const sizeA = sizes.get(nodeA.id)!;
      const sizeB = sizes.get(nodeB.id)!;

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      if (centerDist < 0.01) {
        // Random jitter for overlapping nodes
        const jitter = 10;
        const forceA = forces.get(nodeA.id)!;
        const forceB = forces.get(nodeB.id)!;
        forceA.x += (Math.random() - 0.5) * jitter;
        forceA.y += (Math.random() - 0.5) * jitter;
        forceB.x += (Math.random() - 0.5) * jitter;
        forceB.y += (Math.random() - 0.5) * jitter;
        continue;
      }

      let effectiveDistance: number;

      if (sizeAwareRepulsion) {
        // Calculate edge-to-edge distance
        const halfWidthA = sizeA.width / 2;
        const halfHeightA = sizeA.height / 2;
        const halfWidthB = sizeB.width / 2;
        const halfHeightB = sizeB.height / 2;

        const edgeDistX = Math.max(0, Math.abs(dx) - halfWidthA - halfWidthB);
        const edgeDistY = Math.max(0, Math.abs(dy) - halfHeightA - halfHeightB);
        const edgeDistance = Math.sqrt(edgeDistX * edgeDistX + edgeDistY * edgeDistY);

        effectiveDistance = Math.max(edgeDistance, 10);
      } else {
        effectiveDistance = centerDist;
      }

      const repulsionForce = repulsionStrength / (effectiveDistance * effectiveDistance);
      const fx = (dx / centerDist) * repulsionForce;
      const fy = (dy / centerDist) * repulsionForce;

      const forceA = forces.get(nodeA.id)!;
      const forceB = forces.get(nodeB.id)!;
      forceA.x -= fx;
      forceA.y -= fy;
      forceB.x += fx;
      forceB.y += fy;
    }
  }
}

/**
 * Calculate repulsion forces using Barnes-Hut approximation (O(n log n))
 */
function calculateBarnesHutRepulsion(
  nodes: Node[],
  state: SimulationState,
  forces: Map<NodeId, Position>,
  options: ForceLayoutOptions,
): void {
  const { positions, sizes } = state;
  const { repulsionStrength, sizeAwareRepulsion, barnesHutTheta } = options;

  // Build quadtree
  const bounds = calculateBounds(positions, sizes);
  const quadtree = new QuadTree(bounds, barnesHutTheta);

  nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const size = sizes.get(node.id)!;
    quadtree.insert(node.id, pos, size);
  });

  // Calculate forces for each node
  nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const size = sizes.get(node.id)!;
    const repulsion = quadtree.calculateRepulsionForce(node.id, pos, size, repulsionStrength, sizeAwareRepulsion);

    const force = forces.get(node.id)!;
    force.x += repulsion.x;
    force.y += repulsion.y;
  });
}

/**
 * Calculate spring forces between connected nodes
 */
function calculateSpringForces(
  connections: Connection[],
  state: SimulationState,
  forces: Map<NodeId, Position>,
  options: ForceLayoutOptions,
): void {
  const { positions, sizes } = state;
  const { springLength, springStrength, sizeAwareRepulsion } = options;

  connections.forEach((conn) => {
    const posFrom = positions.get(conn.fromNodeId);
    const posTo = positions.get(conn.toNodeId);

    if (!posFrom || !posTo) {
      return;
    }

    const dx = posTo.x - posFrom.x;
    const dy = posTo.y - posFrom.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.01) {
      return;
    }

    // Calculate ideal spring length based on node sizes
    let idealLength = springLength;
    if (sizeAwareRepulsion) {
      const sizeFrom = sizes.get(conn.fromNodeId);
      const sizeTo = sizes.get(conn.toNodeId);
      if (sizeFrom && sizeTo) {
        idealLength = springLength + (sizeFrom.width + sizeTo.width) / 4;
      }
    }

    const springForce = springStrength * (distance - idealLength);
    const fx = (dx / distance) * springForce;
    const fy = (dy / distance) * springForce;

    const forceFrom = forces.get(conn.fromNodeId);
    const forceTo = forces.get(conn.toNodeId);

    if (forceFrom) {
      forceFrom.x += fx;
      forceFrom.y += fy;
    }
    if (forceTo) {
      forceTo.x -= fx;
      forceTo.y -= fy;
    }
  });
}

/**
 * Apply directional bias for DAG layouts
 */
function applyDirectionalBias(
  connections: Connection[],
  state: SimulationState,
  forces: Map<NodeId, Position>,
  bias: { axis: "x" | "y"; strength: number },
): void {
  const { positions } = state;

  connections.forEach((conn) => {
    const posFrom = positions.get(conn.fromNodeId);
    const posTo = positions.get(conn.toNodeId);

    if (!posFrom || !posTo) {
      return;
    }

    const forceFrom = forces.get(conn.fromNodeId);
    const forceTo = forces.get(conn.toNodeId);

    if (!forceFrom || !forceTo) {
      return;
    }

    // Push downstream nodes in the positive direction of the bias axis
    if (bias.axis === "y") {
      // Target: toNode should be below fromNode (positive y)
      if (posTo.y < posFrom.y + 50) {
        forceTo.y += bias.strength;
        forceFrom.y -= bias.strength * 0.5;
      }
    } else {
      // Target: toNode should be right of fromNode (positive x)
      if (posTo.x < posFrom.x + 50) {
        forceTo.x += bias.strength;
        forceFrom.x -= bias.strength * 0.5;
      }
    }
  });
}

/**
 * Apply forces and update positions
 * Returns total movement for convergence check
 */
function applyForcesAndUpdatePositions(
  nodes: Node[],
  state: SimulationState,
  forces: Map<NodeId, Position>,
  options: ForceLayoutOptions,
): number {
  const { positions, velocities } = state;
  const { dampening, maxForce } = options;

  let totalMovement = 0;

  nodes.forEach((node) => {
    const force = forces.get(node.id)!;
    const velocity = velocities.get(node.id)!;
    const position = positions.get(node.id)!;

    // Limit force magnitude
    const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
    if (forceMagnitude > maxForce) {
      force.x = (force.x / forceMagnitude) * maxForce;
      force.y = (force.y / forceMagnitude) * maxForce;
    }

    // Update velocity with dampening
    velocity.x = velocity.x * dampening + force.x;
    velocity.y = velocity.y * dampening + force.y;

    // Store old position for movement calculation
    const oldX = position.x;
    const oldY = position.y;

    // Update position
    position.x += velocity.x;
    position.y += velocity.y;

    // Track total movement
    const movement = Math.sqrt(Math.pow(position.x - oldX, 2) + Math.pow(position.y - oldY, 2));
    totalMovement += movement;
  });

  return totalMovement;
}

/**
 * Normalize positions (center around origin with padding)
 */
function normalizePositions(
  nodes: Node[],
  state: SimulationState,
  padding: number,
): Record<NodeId, Position> {
  const { positions, sizes } = state;

  if (nodes.length === 0) {
    return {};
  }

  // Find bounding box including node sizes
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const size = sizes.get(node.id)!;

    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + size.width);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + size.height);
  });

  // Center and add padding
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const result: Record<NodeId, Position> = {};
  nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    result[node.id] = {
      x: pos.x - centerX + padding,
      y: pos.y - centerY + padding,
    };
  });

  return result;
}

/**
 * Calculate bounding box size from final positions
 */
function calculateBoundingBoxSize(
  nodes: Node[],
  positions: Record<NodeId, Position>,
  sizes: Map<NodeId, Size>,
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

    const size = sizes.get(node.id) ?? { width: 100, height: 50 };
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
 * Calculate improved force-directed layout
 */
export function calculateForceDirectedLayout(
  data: NodeEditorData,
  options: Partial<ForceLayoutOptions> = {},
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
      algorithm: "force",
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
      iterations: 0,
      algorithm: "force",
      metrics: {
        executionTimeMs: performance.now() - startTime,
        boundingBox: getNodeSizeWithOverride(nodes[0], nodeSizes),
      },
    };
  }

  // Merge options with defaults and adapt based on graph
  const mergedOptions: ForceLayoutOptions = { ...DEFAULT_FORCE_OPTIONS, ...options };
  const adaptedOptions = adaptParameters(nodes.length, connections.length, mergedOptions);

  // Check if we should add directional bias for DAGs
  let effectiveOptions = adaptedOptions;
  if (!adaptedOptions.directionalBias && connections.length > 0) {
    const outgoing = buildOutgoingMap(nodes, connections);
    const hasCycles = detectCycles(nodes, outgoing);
    if (!hasCycles) {
      // Add vertical bias for DAGs
      effectiveOptions = {
        ...adaptedOptions,
        directionalBias: { axis: "y", strength: 5 },
      };
    }
  }

  // Initialize state
  const state = initializeState(nodes, nodeSizes);

  // Main simulation loop
  let actualIterations = 0;
  for (let iteration = 0; iteration < effectiveOptions.iterations; iteration++) {
    actualIterations++;

    // Initialize forces
    const forces = new Map<NodeId, Position>();
    nodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    // Calculate repulsion forces
    if (effectiveOptions.useBarnesHut && nodes.length > 50) {
      calculateBarnesHutRepulsion(nodes, state, forces, effectiveOptions);
    } else {
      calculatePairwiseRepulsion(nodes, state, forces, effectiveOptions);
    }

    // Calculate spring forces
    calculateSpringForces(connections, state, forces, effectiveOptions);

    // Apply directional bias if configured
    if (effectiveOptions.directionalBias) {
      applyDirectionalBias(connections, state, forces, effectiveOptions.directionalBias);
    }

    // Apply forces and update positions
    const totalMovement = applyForcesAndUpdatePositions(nodes, state, forces, effectiveOptions);

    // Check for convergence
    const averageMovement = totalMovement / nodes.length;
    if (averageMovement < 0.1) {
      break;
    }
  }

  // Normalize positions
  const padding = mergedOptions.springLength ? mergedOptions.springLength / 2 : 100;
  const nodePositions = normalizePositions(nodes, state, padding);

  return {
    nodePositions,
    iterations: actualIterations,
    algorithm: "force",
    metrics: {
      executionTimeMs: performance.now() - startTime,
      boundingBox: calculateBoundingBoxSize(nodes, nodePositions, state.sizes),
    },
  };
}
