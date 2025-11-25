/**
 * @file Position-related utilities
 * Pure functions for position calculations
 */
import type { Position } from "../../types/core";

/**
 * Apply offset to a position
 */
export const applyOffset = (position: Position, offset: Position): Position => ({
  x: position.x + offset.x,
  y: position.y + offset.y,
});

/**
 * Subtract offset from a position
 */
export const subtractOffset = (position: Position, offset: Position): Position => ({
  x: position.x - offset.x,
  y: position.y - offset.y,
});

/**
 * Calculate preview position by applying offset
 * Returns null if offset is null
 */
export const getPreviewPosition = (position: Position, offset: Position | null): Position | null => {
  if (!offset) {
    return null;
  }
  return applyOffset(position, offset);
};

/**
 * Calculate midpoint between two positions
 */
export const getMidpoint = (from: Position, to: Position): Position => ({
  x: (from.x + to.x) / 2,
  y: (from.y + to.y) / 2,
});

/**
 * Calculate distance between two positions
 */
export const getDistance = (from: Position, to: Position): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Check if a point is within a threshold distance from a line segment
 */
export const isPointNearLineSegment = (
  point: Position,
  lineStart: Position,
  lineEnd: Position,
  threshold: number = 10,
): boolean => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= threshold;
};
