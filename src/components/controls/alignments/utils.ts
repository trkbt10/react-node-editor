/**
 * @file Alignment utilities
 */
import type { Node, Position } from "../../../types/core";

/**
 * Calculate bounding box for a node
 */
function getNodeBounds(node: Node) {
  const width = node.size?.width || 100;
  const height = node.size?.height || 100;
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
    width,
    height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
  };
}

/**
 * Calculate the overall bounding box for multiple nodes
 */
function getOverallBounds(nodes: Node[]) {
  if (nodes.length === 0) {
    return null;
  }

  const bounds = nodes.map(getNodeBounds);
  const left = Math.min(...bounds.map((b) => b.left));
  const top = Math.min(...bounds.map((b) => b.top));
  const right = Math.max(...bounds.map((b) => b.right));
  const bottom = Math.max(...bounds.map((b) => b.bottom));

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
  };
}

/**
 * Calculate new positions for alignment operations
 */
export function calculateAlignmentPositions(nodes: Node[], alignmentType: string): Record<string, Position> {
  if (nodes.length < 2) {
    return {};
  }

  const nodeUpdates: Record<string, Position> = {};
  const bounds = nodes.map((node) => ({ node, bounds: getNodeBounds(node) }));
  const overallBounds = getOverallBounds(nodes);

  if (!overallBounds) {
    return {};
  }

  switch (alignmentType) {
    case "align-left": {
      const leftmostX = Math.min(...bounds.map((b) => b.bounds.left));
      bounds.forEach(({ node }) => {
        nodeUpdates[node.id] = { x: leftmostX, y: node.position.y };
      });
      break;
    }

    case "align-center-horizontal": {
      bounds.forEach(({ node, bounds: nodeBounds }) => {
        const newX = overallBounds.centerX - nodeBounds.width / 2;
        nodeUpdates[node.id] = { x: newX, y: node.position.y };
      });
      break;
    }

    case "align-right": {
      const rightmostX = Math.max(...bounds.map((b) => b.bounds.right));
      bounds.forEach(({ node, bounds: nodeBounds }) => {
        const newX = rightmostX - nodeBounds.width;
        nodeUpdates[node.id] = { x: newX, y: node.position.y };
      });
      break;
    }

    case "align-top": {
      const topmostY = Math.min(...bounds.map((b) => b.bounds.top));
      bounds.forEach(({ node }) => {
        nodeUpdates[node.id] = { x: node.position.x, y: topmostY };
      });
      break;
    }

    case "align-center-vertical": {
      bounds.forEach(({ node, bounds: nodeBounds }) => {
        const newY = overallBounds.centerY - nodeBounds.height / 2;
        nodeUpdates[node.id] = { x: node.position.x, y: newY };
      });
      break;
    }

    case "align-bottom": {
      const bottommostY = Math.max(...bounds.map((b) => b.bounds.bottom));
      bounds.forEach(({ node, bounds: nodeBounds }) => {
        const newY = bottommostY - nodeBounds.height;
        nodeUpdates[node.id] = { x: node.position.x, y: newY };
      });
      break;
    }

    case "distribute-horizontal": {
      if (nodes.length < 3) {
        break;
      }

      // Sort nodes by X position
      const sortedBounds = bounds.sort((a, b) => a.bounds.left - b.bounds.left);
      const leftmost = sortedBounds[0];
      const rightmost = sortedBounds[sortedBounds.length - 1];

      // Calculate spacing between centers
      const totalWidth = rightmost.bounds.left - leftmost.bounds.left;
      const spacing = totalWidth / (sortedBounds.length - 1);

      // Distribute nodes evenly
      sortedBounds.forEach(({ node }, index) => {
        if (index === 0 || index === sortedBounds.length - 1) {
          // Keep first and last nodes in place
          nodeUpdates[node.id] = { x: node.position.x, y: node.position.y };
        } else {
          const newX = leftmost.bounds.left + spacing * index;
          nodeUpdates[node.id] = { x: newX, y: node.position.y };
        }
      });
      break;
    }

    case "distribute-vertical": {
      if (nodes.length < 3) {
        break;
      }

      // Sort nodes by Y position
      const sortedBounds = bounds.sort((a, b) => a.bounds.top - b.bounds.top);
      const topmost = sortedBounds[0];
      const bottommost = sortedBounds[sortedBounds.length - 1];

      // Calculate spacing between centers
      const totalHeight = bottommost.bounds.top - topmost.bounds.top;
      const spacing = totalHeight / (sortedBounds.length - 1);

      // Distribute nodes evenly
      sortedBounds.forEach(({ node }, index) => {
        if (index === 0 || index === sortedBounds.length - 1) {
          // Keep first and last nodes in place
          nodeUpdates[node.id] = { x: node.position.x, y: node.position.y };
        } else {
          const newY = topmost.bounds.top + spacing * index;
          nodeUpdates[node.id] = { x: node.position.x, y: newY };
        }
      });
      break;
    }
  }

  return nodeUpdates;
}
