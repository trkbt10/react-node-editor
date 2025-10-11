import type { NodeEditorData, NodeId, Position, Node, Connection } from "../types/core";

export type LayoutOptions = {
  iterations?: number;
  springLength?: number;
  springStrength?: number;
  repulsionStrength?: number;
  dampening?: number;
  maxForce?: number;
  padding?: number;
}

export type LayoutResult = {
  nodePositions: Record<NodeId, Position>;
  iterations: number;
}

const defaultOptions: Required<LayoutOptions> = {
  iterations: 100,
  springLength: 150,
  springStrength: 0.3,
  repulsionStrength: 1000,
  dampening: 0.9,
  maxForce: 50,
  padding: 100,
};

/**
 * Force-directed graph layout algorithm
 * Based on Fruchterman-Reingold algorithm with improvements
 */
export function calculateAutoLayout(data: NodeEditorData, options: LayoutOptions = {}): LayoutResult {
  const opts = { ...defaultOptions, ...options };
  const nodes = Object.values(data.nodes);
  const connections = Object.values(data.connections);

  if (nodes.length === 0) {
    return { nodePositions: {}, iterations: 0 };
  }

  if (nodes.length === 1) {
    // Single node - place at origin
    return {
      nodePositions: { [nodes[0].id]: { x: 0, y: 0 } },
      iterations: 0,
    };
  }

  // Initialize positions
  const positions: Record<string, Position> = {};
  const velocities: Record<string, Position> = {};

  nodes.forEach((node, index) => {
    // Start with current positions if available, otherwise use circular layout
    if (node.position) {
      positions[node.id] = { ...node.position };
    } else {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.sqrt(nodes.length) * 50;
      positions[node.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    }
    velocities[node.id] = { x: 0, y: 0 };
  });

  // Build adjacency list for connected nodes
  const adjacencyList: Record<string, Set<string>> = {};
  nodes.forEach((node) => {
    adjacencyList[node.id] = new Set<string>();
  });

  connections.forEach((conn) => {
    if (adjacencyList[conn.fromNodeId] && adjacencyList[conn.toNodeId]) {
      adjacencyList[conn.fromNodeId].add(conn.toNodeId);
      adjacencyList[conn.toNodeId].add(conn.fromNodeId);
    }
  });

  // Main simulation loop
  let actualIterations = 0;
  for (let iteration = 0; iteration < opts.iterations; iteration++) {
    actualIterations++;

    // Calculate forces for each node
    const forces: Record<string, Position> = {};
    nodes.forEach((node) => {
      forces[node.id] = { x: 0, y: 0 };
    });

    // Repulsion forces between all pairs of nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const posA = positions[nodeA.id];
        const posB = positions[nodeB.id];

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.01) {continue;} // Avoid division by zero

        const repulsionForce = opts.repulsionStrength / (distance * distance);
        const fx = (dx / distance) * repulsionForce;
        const fy = (dy / distance) * repulsionForce;

        forces[nodeA.id].x -= fx;
        forces[nodeA.id].y -= fy;
        forces[nodeB.id].x += fx;
        forces[nodeB.id].y += fy;
      }
    }

    // Spring forces between connected nodes
    connections.forEach((conn) => {
      const posFrom = positions[conn.fromNodeId];
      const posTo = positions[conn.toNodeId];

      if (!posFrom || !posTo) {return;}

      const dx = posTo.x - posFrom.x;
      const dy = posTo.y - posFrom.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 0.01) {return;}

      const springForce = opts.springStrength * (distance - opts.springLength);
      const fx = (dx / distance) * springForce;
      const fy = (dy / distance) * springForce;

      forces[conn.fromNodeId].x += fx;
      forces[conn.fromNodeId].y += fy;
      forces[conn.toNodeId].x -= fx;
      forces[conn.toNodeId].y -= fy;
    });

    // Apply forces and update positions
    let totalMovement = 0;
    nodes.forEach((node) => {
      const force = forces[node.id];

      // Limit force magnitude
      const forceMagnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      if (forceMagnitude > opts.maxForce) {
        force.x = (force.x / forceMagnitude) * opts.maxForce;
        force.y = (force.y / forceMagnitude) * opts.maxForce;
      }

      // Update velocity with dampening
      velocities[node.id].x = velocities[node.id].x * opts.dampening + force.x;
      velocities[node.id].y = velocities[node.id].y * opts.dampening + force.y;

      // Update position
      const oldPos = { ...positions[node.id] };
      positions[node.id].x += velocities[node.id].x;
      positions[node.id].y += velocities[node.id].y;

      // Track total movement for convergence check
      const movement = Math.sqrt(
        Math.pow(positions[node.id].x - oldPos.x, 2) + Math.pow(positions[node.id].y - oldPos.y, 2),
      );
      totalMovement += movement;
    });

    // Check for convergence
    const averageMovement = totalMovement / nodes.length;
    if (averageMovement < 0.1) {
      break;
    }
  }

  // Normalize positions (center around origin and add padding)
  const nodeIds = Object.keys(positions);
  if (nodeIds.length > 0) {
    // Find bounding box
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    nodeIds.forEach((nodeId) => {
      const pos = positions[nodeId];
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });

    // Center and add padding
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    nodeIds.forEach((nodeId) => {
      positions[nodeId].x = positions[nodeId].x - centerX + opts.padding;
      positions[nodeId].y = positions[nodeId].y - centerY + opts.padding;
    });
  }

  return {
    nodePositions: positions as Record<NodeId, Position>,
    iterations: actualIterations,
  };
}

/**
 * Hierarchical layout for directed graphs
 * Places nodes in layers based on their connectivity
 */
export function calculateHierarchicalLayout(
  data: NodeEditorData,
  options: { spacing?: number; layerHeight?: number } = {},
): LayoutResult {
  const { spacing = 200, layerHeight = 150 } = options;
  const nodes = Object.values(data.nodes);
  const connections = Object.values(data.connections);

  if (nodes.length === 0) {
    return { nodePositions: {}, iterations: 0 };
  }

  // Build directed graph
  const outgoing: Record<string, Set<string>> = {};
  const incoming: Record<string, Set<string>> = {};

  nodes.forEach((node) => {
    outgoing[node.id] = new Set();
    incoming[node.id] = new Set();
  });

  connections.forEach((conn) => {
    if (outgoing[conn.fromNodeId] && incoming[conn.toNodeId]) {
      outgoing[conn.fromNodeId].add(conn.toNodeId);
      incoming[conn.toNodeId].add(conn.fromNodeId);
    }
  });

  // Find root nodes (no incoming connections)
  const rootNodes = nodes.filter((node) => incoming[node.id].size === 0);

  // If no root nodes, find nodes with minimum incoming connections
  if (rootNodes.length === 0) {
    const minIncoming = Math.min(...nodes.map((node) => incoming[node.id].size));
    rootNodes.push(...nodes.filter((node) => incoming[node.id].size === minIncoming));
  }

  // Assign layers using BFS
  const layers: NodeId[][] = [];
  const nodeLayer: Record<NodeId, number> = {};
  const visited = new Set<NodeId>();

  // Start with root nodes in layer 0
  layers[0] = rootNodes.map((node) => node.id);
  rootNodes.forEach((node) => {
    nodeLayer[node.id] = 0;
    visited.add(node.id);
  });

  // Process subsequent layers
  let currentLayer = 0;
  while (layers[currentLayer] && layers[currentLayer].length > 0) {
    const nextLayer: NodeId[] = [];

    layers[currentLayer].forEach((nodeId) => {
      outgoing[nodeId].forEach((targetNodeId) => {
        if (!visited.has(targetNodeId)) {
          nextLayer.push(targetNodeId);
          nodeLayer[targetNodeId] = currentLayer + 1;
          visited.add(targetNodeId);
        }
      });
    });

    if (nextLayer.length > 0) {
      layers[currentLayer + 1] = nextLayer;
      currentLayer++;
    } else {
      break;
    }
  }

  // Add any remaining unvisited nodes to the last layer
  const unvisited = nodes.filter((node) => !visited.has(node.id));
  if (unvisited.length > 0) {
    if (!layers[currentLayer + 1]) {
      layers[currentLayer + 1] = [];
    }
    layers[currentLayer + 1].push(...unvisited.map((node) => node.id));
    unvisited.forEach((node) => {
      nodeLayer[node.id] = currentLayer + 1;
    });
  }

  // Calculate positions
  const positions: Record<NodeId, Position> = {};

  layers.forEach((layer, layerIndex) => {
    const y = layerIndex * layerHeight;
    const layerWidth = (layer.length - 1) * spacing;
    const startX = -layerWidth / 2;

    layer.forEach((nodeId, nodeIndex) => {
      positions[nodeId] = {
        x: startX + nodeIndex * spacing,
        y: y,
      };
    });
  });

  return {
    nodePositions: positions,
    iterations: layers.length,
  };
}

/**
 * Grid layout - arranges nodes in a regular grid
 */
export function calculateGridLayout(
  data: NodeEditorData,
  options: { spacing?: number; columns?: number } = {},
): LayoutResult {
  const { spacing = 200, columns } = options;
  const nodes = Object.values(data.nodes);

  if (nodes.length === 0) {
    return { nodePositions: {}, iterations: 0 };
  }

  // Calculate optimal column count if not specified
  const cols = columns || Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);

  const positions: Record<NodeId, Position> = {};

  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Center the grid
    const gridWidth = (cols - 1) * spacing;
    const gridHeight = (rows - 1) * spacing;

    positions[node.id] = {
      x: col * spacing - gridWidth / 2,
      y: row * spacing - gridHeight / 2,
    };
  });

  return {
    nodePositions: positions,
    iterations: 0,
  };
}
