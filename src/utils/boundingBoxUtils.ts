import type { Node, Position, Size } from "../types/core";

export type BoundingBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Default node dimensions
 */
export const DEFAULT_NODE_SIZE = {
  width: 150,
  height: 50,
} as const;

/**
 * Get the size of a node with fallback to defaults
 */
export function getNodeSize(node: Node): Size {
  return {
    width: node.size?.width || DEFAULT_NODE_SIZE.width,
    height: node.size?.height || DEFAULT_NODE_SIZE.height,
  };
}

/**
 * Calculate the bounding box for a node
 */
export function getNodeBoundingBox(node: Node): BoundingBox {
  const { width, height } = getNodeSize(node);
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
    width,
    height,
  };
}

/**
 * Create a bounding box from position and size
 */
export function createBoundingBox(position: Position, size: Size): BoundingBox {
  return {
    left: position.x,
    top: position.y,
    right: position.x + size.width,
    bottom: position.y + size.height,
    width: size.width,
    height: size.height,
  };
}

/**
 * Check if two rectangles intersect
 */
export function doRectanglesIntersect(rect1: BoundingBox, rect2: BoundingBox): boolean {
  return !(
    rect1.right < rect2.left ||
    rect2.right < rect1.left ||
    rect1.bottom < rect2.top ||
    rect2.bottom < rect1.top
  );
}

/**
 * Check if one rectangle is completely inside another
 */
export function isRectangleInsideAnother(inner: BoundingBox, outer: BoundingBox): boolean {
  return (
    inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.right <= outer.right &&
    inner.bottom <= outer.bottom
  );
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRectangle(point: Position, rect: BoundingBox): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

/**
 * Calculate the center point of a bounding box
 */
export function getBoundingBoxCenter(box: BoundingBox): Position {
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  };
}

/**
 * Create a bounding box from two corner points
 */
export function createBoundingBoxFromCorners(start: Position, end: Position): BoundingBox {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const right = Math.max(start.x, end.x);
  const bottom = Math.max(start.y, end.y);

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Expand a bounding box by a margin
 */
export function expandBoundingBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    left: box.left - margin,
    top: box.top - margin,
    right: box.right + margin,
    bottom: box.bottom + margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };
}