/**
 * @file Node comparison utilities
 * Pure functions for comparing Node state in memo functions
 */
import type { Node, Size } from "../../types/core";
import { hasPositionChanged, hasSizeChanged, arePositionsEqual, areSizesEqual } from "../geometry/comparators";
import { areStringArraysEqual, areRecordValuesShallowEqual } from "../common/comparators";
import { arePortArraysEqual } from "../port/comparators";

/**
 * Check if node's geometric properties (position, size) have changed
 */
export const hasNodeGeometryChanged = (prev: Node, next: Node): boolean =>
  hasPositionChanged(prev.position, next.position) || hasSizeChanged(prev.size, next.size);

/**
 * Check if node's core identifiable properties have changed
 */
export const hasNodeIdentityChanged = (prev: Node, next: Node): boolean =>
  prev.id !== next.id || prev.type !== next.type;

/**
 * Check if node's state flags have changed
 */
export const hasNodeStateChanged = (prev: Node, next: Node): boolean => prev.locked !== next.locked;

/**
 * Derive display size from node with optional resize state
 */
export const getNodeDisplaySize = (
  node: Node,
  resizeSize: Size | null | undefined,
  isResizing: boolean,
  defaultSize: Size = { width: 150, height: 50 },
): Size => {
  if (isResizing && resizeSize) {
    return resizeSize;
  }
  return node.size ?? defaultSize;
};

/**
 * Default node size constants
 */
export const DEFAULT_NODE_SIZE: Size = { width: 150, height: 50 };

/**
 * Check if two nodes are structurally equal (full comparison of all fields)
 * Used for controlled data stabilization
 */
export const areNodesStructurallyEqual = (prev: Node, next: Node): boolean => {
  if (prev === next) {
    return true;
  }
  return (
    prev.id === next.id &&
    prev.type === next.type &&
    prev.order === next.order &&
    arePositionsEqual(prev.position, next.position) &&
    areSizesEqual(prev.size, next.size) &&
    areSizesEqual(prev.minSize, next.minSize) &&
    areSizesEqual(prev.maxSize, next.maxSize) &&
    prev.parentId === next.parentId &&
    areStringArraysEqual(prev.children, next.children) &&
    prev.expanded === next.expanded &&
    prev.visible === next.visible &&
    prev.locked === next.locked &&
    prev.resizable === next.resizable &&
    areRecordValuesShallowEqual(prev.data, next.data) &&
    arePortArraysEqual(prev._ports, next._ports)
  );
};
