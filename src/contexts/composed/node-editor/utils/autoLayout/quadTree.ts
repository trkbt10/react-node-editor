/**
 * @file Quadtree implementation for Barnes-Hut force calculation
 * Provides O(n log n) approximation for repulsion forces
 */
import type { NodeId, Position, Size, Bounds } from "../../../../../types/core";

/**
 * Data stored in quadtree leaf nodes
 */
export type QuadTreeNodeData = {
  id: NodeId;
  position: Position;
  size: Size;
  mass: number;
};

/**
 * Quadtree node structure for Barnes-Hut algorithm
 */
export type QuadTreeNode = {
  bounds: Bounds;
  centerOfMass: Position;
  totalMass: number;
  children: [QuadTreeNode | null, QuadTreeNode | null, QuadTreeNode | null, QuadTreeNode | null] | null;
  data: QuadTreeNodeData | null;
  nodeCount: number;
};

/**
 * Quadtree indices for children
 */
const enum Quadrant {
  NW = 0,
  NE = 1,
  SW = 2,
  SE = 3,
}

/**
 * Create an empty quadtree node
 */
function createEmptyNode(bounds: Bounds): QuadTreeNode {
  return {
    bounds,
    centerOfMass: { x: 0, y: 0 },
    totalMass: 0,
    children: null,
    data: null,
    nodeCount: 0,
  };
}

/**
 * Determine which quadrant a position belongs to
 */
function getQuadrant(bounds: Bounds, position: Position): Quadrant {
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;

  if (position.y < midY) {
    return position.x < midX ? Quadrant.NW : Quadrant.NE;
  } else {
    return position.x < midX ? Quadrant.SW : Quadrant.SE;
  }
}

/**
 * Get bounds for a specific quadrant
 */
function getQuadrantBounds(bounds: Bounds, quadrant: Quadrant): Bounds {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;

  switch (quadrant) {
    case Quadrant.NW:
      return { x: bounds.x, y: bounds.y, width: halfWidth, height: halfHeight };
    case Quadrant.NE:
      return { x: bounds.x + halfWidth, y: bounds.y, width: halfWidth, height: halfHeight };
    case Quadrant.SW:
      return { x: bounds.x, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight };
    case Quadrant.SE:
      return { x: bounds.x + halfWidth, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight };
  }
}

/**
 * QuadTree class for Barnes-Hut force calculation
 */
export class QuadTree {
  private root: QuadTreeNode;
  private theta: number;

  /**
   * Create a new QuadTree
   * @param bounds - Initial bounds of the tree
   * @param theta - Barnes-Hut accuracy parameter (0.5-1.0, lower = more accurate)
   */
  constructor(bounds: Bounds, theta: number = 0.7) {
    this.root = createEmptyNode(bounds);
    this.theta = theta;
  }

  /**
   * Insert a node into the quadtree
   */
  insert(id: NodeId, position: Position, size: Size): void {
    const mass = Math.max(1, (size.width * size.height) / 1000);
    const data: QuadTreeNodeData = { id, position, size, mass };
    this.insertIntoNode(this.root, data);
  }

  /**
   * Recursively insert data into a node
   */
  private insertIntoNode(node: QuadTreeNode, data: QuadTreeNodeData): void {
    // Update center of mass
    const newTotalMass = node.totalMass + data.mass;
    node.centerOfMass = {
      x: (node.centerOfMass.x * node.totalMass + data.position.x * data.mass) / newTotalMass,
      y: (node.centerOfMass.y * node.totalMass + data.position.y * data.mass) / newTotalMass,
    };
    node.totalMass = newTotalMass;
    node.nodeCount++;

    // If this is an empty external node, store the data here
    if (node.data === null && node.children === null) {
      node.data = data;
      return;
    }

    // If this is an external node with data, subdivide
    if (node.children === null) {
      node.children = [null, null, null, null];

      // Re-insert existing data
      if (node.data !== null) {
        const existingQuadrant = getQuadrant(node.bounds, node.data.position);
        if (node.children[existingQuadrant] === null) {
          node.children[existingQuadrant] = createEmptyNode(getQuadrantBounds(node.bounds, existingQuadrant));
        }
        this.insertIntoNode(node.children[existingQuadrant]!, node.data);
        node.data = null;
      }
    }

    // Insert new data into appropriate quadrant
    const quadrant = getQuadrant(node.bounds, data.position);
    if (node.children![quadrant] === null) {
      node.children![quadrant] = createEmptyNode(getQuadrantBounds(node.bounds, quadrant));
    }
    this.insertIntoNode(node.children![quadrant]!, data);
  }

  /**
   * Calculate repulsion force on a target node from all other nodes
   * Uses Barnes-Hut approximation for distant node clusters
   */
  calculateRepulsionForce(
    targetId: NodeId,
    targetPos: Position,
    targetSize: Size,
    repulsionStrength: number,
    sizeAware: boolean,
  ): Position {
    return this.calculateForceRecursive(this.root, targetId, targetPos, targetSize, repulsionStrength, sizeAware);
  }

  /**
   * Recursively calculate force from a quadtree node
   */
  private calculateForceRecursive(
    node: QuadTreeNode,
    targetId: NodeId,
    targetPos: Position,
    targetSize: Size,
    strength: number,
    sizeAware: boolean,
  ): Position {
    if (node.totalMass === 0 || node.nodeCount === 0) {
      return { x: 0, y: 0 };
    }

    // Skip self
    if (node.data !== null && node.data.id === targetId) {
      return { x: 0, y: 0 };
    }

    const dx = node.centerOfMass.x - targetPos.x;
    const dy = node.centerOfMass.y - targetPos.y;
    const distSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distSquared);

    // Prevent division by zero
    if (distance < 1) {
      // Random jitter for overlapping nodes
      return {
        x: (Math.random() - 0.5) * strength * 0.01,
        y: (Math.random() - 0.5) * strength * 0.01,
      };
    }

    // Barnes-Hut criterion: s/d < theta, where s is node width and d is distance
    const ratio = node.bounds.width / distance;

    // If node is far enough or is a leaf, treat as single body
    if (node.children === null || ratio < this.theta) {
      return this.calculateSingleBodyForce(
        targetPos,
        targetSize,
        node.centerOfMass,
        node.data?.size ?? { width: 100, height: 50 },
        node.totalMass,
        strength,
        sizeAware,
      );
    }

    // Otherwise, recurse into children
    const totalForce = { x: 0, y: 0 };
    for (const child of node.children) {
      if (child !== null) {
        const childForce = this.calculateForceRecursive(
          child,
          targetId,
          targetPos,
          targetSize,
          strength,
          sizeAware,
        );
        totalForce.x += childForce.x;
        totalForce.y += childForce.y;
      }
    }
    return totalForce;
  }

  /**
   * Calculate repulsion force between two bodies
   */
  private calculateSingleBodyForce(
    posA: Position,
    sizeA: Size,
    posB: Position,
    sizeB: Size,
    massB: number,
    strength: number,
    sizeAware: boolean,
  ): Position {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const centerDist = Math.sqrt(dx * dx + dy * dy);

    if (centerDist < 0.01) {
      return { x: 0, y: 0 };
    }

    let effectiveDistance: number;

    if (sizeAware) {
      // Calculate edge-to-edge distance
      const halfWidthA = sizeA.width / 2;
      const halfHeightA = sizeA.height / 2;
      const halfWidthB = sizeB.width / 2;
      const halfHeightB = sizeB.height / 2;

      const edgeDistX = Math.max(0, Math.abs(dx) - halfWidthA - halfWidthB);
      const edgeDistY = Math.max(0, Math.abs(dy) - halfHeightA - halfHeightB);
      const edgeDistance = Math.sqrt(edgeDistX * edgeDistX + edgeDistY * edgeDistY);

      // Use minimum distance to ensure strong repulsion when overlapping
      effectiveDistance = Math.max(edgeDistance, 10);
    } else {
      effectiveDistance = centerDist;
    }

    // Repulsion force inversely proportional to distance squared
    const repulsionForce = (strength * massB) / (effectiveDistance * effectiveDistance);

    // Force direction: away from the other body
    return {
      x: -(dx / centerDist) * repulsionForce,
      y: -(dy / centerDist) * repulsionForce,
    };
  }
}

/**
 * Calculate bounds that encompass all nodes with padding
 */
export function calculateBounds(
  positions: Map<NodeId, Position>,
  sizes: Map<NodeId, Size>,
  padding: number = 100,
): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  positions.forEach((pos, nodeId) => {
    const size = sizes.get(nodeId) ?? { width: 100, height: 50 };
    minX = Math.min(minX, pos.x - size.width / 2);
    minY = Math.min(minY, pos.y - size.height / 2);
    maxX = Math.max(maxX, pos.x + size.width / 2);
    maxY = Math.max(maxY, pos.y + size.height / 2);
  });

  // Handle empty or single node case
  if (!isFinite(minX)) {
    return { x: -500, y: -500, width: 1000, height: 1000 };
  }

  // Make it square for better quadtree behavior
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const size = Math.max(width, height);

  return {
    x: minX - padding - (size - width) / 2,
    y: minY - padding - (size - height) / 2,
    width: size,
    height: size,
  };
}
