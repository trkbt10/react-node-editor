/**
 * @file Drag operation utilities for node movement
 * Provides functions for calculating drag offsets, bounds checking,
 * and clamping during node drag operations
 */
import type { NodeId, Position } from "../../../types/core";

export type DragState = {
  nodeIds: NodeId[];
  offset: Position;
  affectedChildNodes: Record<NodeId, NodeId[]>;
};

/**
 * Calculate drag offsets for all affected nodes (directly dragged + children)
 */
export function calculateNodeDragOffsets(dragState: DragState | null): Record<NodeId, Position> {
  if (!dragState) {
    return {};
  }

  const offsets: Record<NodeId, Position> = {};

  // Apply offset to directly dragged nodes
  dragState.nodeIds.forEach((nodeId) => {
    offsets[nodeId] = dragState.offset;
  });

  // Apply offset to affected child nodes
  Object.entries(dragState.affectedChildNodes).forEach(([_, childIds]) => {
    childIds.forEach((childId) => {
      offsets[childId] = dragState.offset;
    });
  });

  return offsets;
}

/**
 * Calculate the combined bounding box of all nodes being dragged
 */
export function getDraggedNodesBounds(
  nodeIds: NodeId[],
  nodes: Record<NodeId, { position: Position; size?: { width: number; height: number } }>,
  offset: Position = { x: 0, y: 0 },
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (nodeIds.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodeIds.forEach((nodeId) => {
    const node = nodes[nodeId];
    if (!node) {
      return;
    }

    const nodeX = node.position.x + offset.x;
    const nodeY = node.position.y + offset.y;
    const nodeWidth = node.size?.width || 150;
    const nodeHeight = node.size?.height || 50;

    minX = Math.min(minX, nodeX);
    minY = Math.min(minY, nodeY);
    maxX = Math.max(maxX, nodeX + nodeWidth);
    maxY = Math.max(maxY, nodeY + nodeHeight);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Check if a drag operation would move nodes outside canvas bounds
 */
export function isDragWithinBounds(
  nodeIds: NodeId[],
  nodes: Record<NodeId, { position: Position; size?: { width: number; height: number } }>,
  offset: Position,
  canvasBounds: { width: number; height: number; margin?: number },
): boolean {
  const bounds = getDraggedNodesBounds(nodeIds, nodes, offset);
  if (!bounds) {
    return true;
  }

  const margin = canvasBounds.margin || 0;

  return (
    bounds.minX >= -margin &&
    bounds.minY >= -margin &&
    bounds.maxX <= canvasBounds.width + margin &&
    bounds.maxY <= canvasBounds.height + margin
  );
}

/**
 * Clamp drag offset to keep nodes within bounds
 */
export function clampDragToBounds(
  nodeIds: NodeId[],
  nodes: Record<NodeId, { position: Position; size?: { width: number; height: number } }>,
  requestedOffset: Position,
  canvasBounds: { width: number; height: number; margin?: number },
): Position {
  const bounds = getDraggedNodesBounds(nodeIds, nodes, { x: 0, y: 0 });
  if (!bounds) {
    return requestedOffset;
  }

  const margin = canvasBounds.margin || 0;

  const clampedOffset = {
    x: Math.max(-bounds.minX - margin, Math.min(requestedOffset.x, canvasBounds.width - bounds.maxX + margin)),
    y: Math.max(-bounds.minY - margin, Math.min(requestedOffset.y, canvasBounds.height - bounds.maxY + margin)),
  };

  return clampedOffset;
}
