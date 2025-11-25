/**
 * @file Node resize state utilities
 * Functions for querying node resize state
 */
import type { ResizeState, NodeId, Size, Position } from "../../types/core";

/**
 * Check if a node is being resized
 */
export const isNodeInResizeState = (resizeState: ResizeState | null, nodeId: NodeId): boolean => {
  return resizeState !== null && resizeState.nodeId === nodeId;
};

/**
 * Get the current size for a node if it's being resized
 * Returns null if the node is not being resized
 */
export const getNodeResizeSize = (resizeState: ResizeState | null, nodeId: NodeId): Size | null => {
  if (!resizeState || resizeState.nodeId !== nodeId) {
    return null;
  }
  return resizeState.currentSize;
};

/**
 * Get the current position for a node if it's being resized
 * Returns null if the node is not being resized
 */
export const getNodeResizePosition = (resizeState: ResizeState | null, nodeId: NodeId): Position | null => {
  if (!resizeState || resizeState.nodeId !== nodeId) {
    return null;
  }
  return resizeState.currentPosition;
};
