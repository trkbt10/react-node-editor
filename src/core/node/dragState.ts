/**
 * @file Node drag state utilities
 * Functions for querying node drag state
 */
import type { DragState, NodeId, Position } from "../../types/core";

/**
 * Check if a node is being dragged (directly or as a child of a group)
 */
export const isNodeInDragState = (dragState: DragState | null, nodeId: NodeId): boolean => {
  if (!dragState) {
    return false;
  }
  if (dragState.nodeIds.includes(nodeId)) {
    return true;
  }
  return Object.values(dragState.affectedChildNodes).some((childIds) => childIds.includes(nodeId));
};

/**
 * Check if a node is being dragged directly (not as a child)
 */
export const isNodeDirectlyDragged = (dragState: DragState | null, nodeId: NodeId): boolean => {
  if (!dragState) {
    return false;
  }
  return dragState.nodeIds.includes(nodeId);
};

/**
 * Check if a node is being dragged as a child of a group (not directly)
 */
export const isNodeChildDragged = (dragState: DragState | null, nodeId: NodeId): boolean => {
  if (!dragState) {
    return false;
  }
  if (dragState.nodeIds.includes(nodeId)) {
    return false;
  }
  return Object.values(dragState.affectedChildNodes).some((childIds) => childIds.includes(nodeId));
};

/**
 * Get the drag offset for a node if it's being dragged (directly or as a child)
 * Returns null if the node is not being dragged
 */
export const getNodeDragOffset = (dragState: DragState | null, nodeId: NodeId): Position | null => {
  if (!dragState) {
    return null;
  }
  if (!isNodeInDragState(dragState, nodeId)) {
    return null;
  }
  return dragState.offset;
};
