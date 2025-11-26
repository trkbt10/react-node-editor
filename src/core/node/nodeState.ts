/**
 * @file Node derived state computations
 * Pure functions for deriving node state from definitions and contexts
 */
import type { Node, Position, Size, ResizeHandle } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { hasGroupBehavior, hasAppearanceBehavior } from "../../types/behaviors";
import { computeNodeAppearance, type NodeAppearance } from "./nodeAppearance";
import { DEFAULT_NODE_SIZE } from "./comparators";

export type NodeBehaviorState = {
  isGroup: boolean;
  isAppearance: boolean;
};

/**
 * Compute behavior state from node definition
 */
export const computeNodeBehaviorState = (nodeDefinition: NodeDefinition | undefined): NodeBehaviorState => ({
  isGroup: hasGroupBehavior(nodeDefinition),
  isAppearance: hasAppearanceBehavior(nodeDefinition),
});

/**
 * Check if two behavior states are equal
 */
export const areNodeBehaviorStatesEqual = (
  prev: NodeBehaviorState,
  next: NodeBehaviorState,
): boolean => prev.isGroup === next.isGroup && prev.isAppearance === next.isAppearance;

export type NodeResizeState = {
  isResizing: boolean;
  currentHandle: ResizeHandle | null;
  currentSize: Size | null;
  currentPosition: Position | null;
};

/**
 * Compute resize state for a specific node
 */
export const computeNodeResizeState = (
  nodeId: string,
  resizeState: {
    nodeId: string;
    handle: ResizeHandle;
    currentSize: Size;
    currentPosition: Position;
  } | null,
): NodeResizeState => {
  if (!resizeState || resizeState.nodeId !== nodeId) {
    return {
      isResizing: false,
      currentHandle: null,
      currentSize: null,
      currentPosition: null,
    };
  }
  return {
    isResizing: true,
    currentHandle: resizeState.handle,
    currentSize: resizeState.currentSize,
    currentPosition: resizeState.currentPosition,
  };
};

/**
 * Check if two resize states are equal
 */
export const areNodeResizeStatesEqual = (
  prev: NodeResizeState,
  next: NodeResizeState,
): boolean => {
  if (prev.isResizing !== next.isResizing) {
    return false;
  }
  if (prev.currentHandle !== next.currentHandle) {
    return false;
  }
  if (prev.currentSize?.width !== next.currentSize?.width) {
    return false;
  }
  if (prev.currentSize?.height !== next.currentSize?.height) {
    return false;
  }
  if (prev.currentPosition?.x !== next.currentPosition?.x) {
    return false;
  }
  if (prev.currentPosition?.y !== next.currentPosition?.y) {
    return false;
  }
  return true;
};

export type NodeDisplayGeometry = {
  displaySize: Size;
  displayPosition: Position;
};

/**
 * Compute display geometry including drag and resize transformations
 */
export const computeNodeDisplayGeometry = (
  node: Node,
  resizeState: NodeResizeState,
  dragOffset: Position | undefined,
): NodeDisplayGeometry => {
  const baseSize = node.size ?? DEFAULT_NODE_SIZE;
  const basePosition = node.position;

  if (resizeState.isResizing && resizeState.currentSize && resizeState.currentPosition) {
    return {
      displaySize: resizeState.currentSize,
      displayPosition: resizeState.currentPosition,
    };
  }

  const displayPosition: Position = dragOffset
    ? { x: basePosition.x + dragOffset.x, y: basePosition.y + dragOffset.y }
    : basePosition;

  return {
    displaySize: baseSize,
    displayPosition,
  };
};

/**
 * Compute visual dragging state
 */
export const computeIsVisuallyDragging = (
  isDragging: boolean,
  dragOffset: Position | undefined,
): boolean => isDragging || dragOffset !== undefined;

export type NodeDerivedState = {
  behaviorState: NodeBehaviorState;
  appearance: NodeAppearance;
  resizeState: NodeResizeState;
  displayGeometry: NodeDisplayGeometry;
  isVisuallyDragging: boolean;
  hasChildren: boolean;
};

/**
 * Compute all derived state for a node
 */
export const computeNodeDerivedState = (
  node: Node,
  nodeDefinition: NodeDefinition | undefined,
  resizeContextState: {
    nodeId: string;
    handle: ResizeHandle;
    currentSize: Size;
    currentPosition: Position;
  } | null,
  dragOffset: Position | undefined,
  isDragging: boolean,
  groupChildrenCount: number,
): NodeDerivedState => {
  const behaviorState = computeNodeBehaviorState(nodeDefinition);
  const appearance = computeNodeAppearance(node, behaviorState.isGroup);
  const resizeState = computeNodeResizeState(node.id, resizeContextState);
  const displayGeometry = computeNodeDisplayGeometry(node, resizeState, dragOffset);
  const isVisuallyDragging = computeIsVisuallyDragging(isDragging, dragOffset);

  return {
    behaviorState,
    appearance,
    resizeState,
    displayGeometry,
    isVisuallyDragging,
    hasChildren: groupChildrenCount > 0,
  };
};

/**
 * Check if two derived states are equal (for memoization)
 */
export const areNodeDerivedStatesEqual = (
  prev: NodeDerivedState,
  next: NodeDerivedState,
): boolean => {
  if (!areNodeBehaviorStatesEqual(prev.behaviorState, next.behaviorState)) {
    return false;
  }
  if (
    prev.appearance.groupBackground !== next.appearance.groupBackground ||
    prev.appearance.groupOpacity !== next.appearance.groupOpacity ||
    prev.appearance.groupTextColor !== next.appearance.groupTextColor ||
    prev.appearance.backgroundWithOpacity !== next.appearance.backgroundWithOpacity
  ) {
    return false;
  }
  if (!areNodeResizeStatesEqual(prev.resizeState, next.resizeState)) {
    return false;
  }
  if (
    prev.displayGeometry.displaySize.width !== next.displayGeometry.displaySize.width ||
    prev.displayGeometry.displaySize.height !== next.displayGeometry.displaySize.height ||
    prev.displayGeometry.displayPosition.x !== next.displayGeometry.displayPosition.x ||
    prev.displayGeometry.displayPosition.y !== next.displayGeometry.displayPosition.y
  ) {
    return false;
  }
  if (prev.isVisuallyDragging !== next.isVisuallyDragging) {
    return false;
  }
  if (prev.hasChildren !== next.hasChildren) {
    return false;
  }
  return true;
};
