import type { Position } from "../types/core";

/**
 * Calculate the distance between two points
 */
export function getDistance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get vector components and distance between two points
 */
export function getVector(
  from: Position,
  to: Position,
): {
  dx: number;
  dy: number;
  distance: number;
} {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return { dx, dy, distance };
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(dx: number, dy: number): Position {
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 0.001) {
    return { x: 0, y: 0 };
  }
  return { x: dx / distance, y: dy / distance };
}

/**
 * Add two positions/vectors
 */
export function addVectors(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract two positions/vectors
 */
export function subtractVectors(a: Position, b: Position): Position {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply a vector by a scalar
 */
export function scaleVector(vector: Position, scale: number): Position {
  return { x: vector.x * scale, y: vector.y * scale };
}

/**
 * Calculate dot product of two vectors
 */
export function dotProduct(a: Position, b: Position): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate the angle between two vectors in radians
 */
export function getAngleBetween(a: Position, b: Position): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Rotate a vector by angle in radians
 */
export function rotateVector(vector: Position, angle: number): Position {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/**
 * Linearly interpolate between two positions
 */
export function lerp(a: Position, b: Position, t: number): Position {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Clamp a position within bounds
 */
export function clampPosition(position: Position, min: Position, max: Position): Position {
  return {
    x: Math.max(min.x, Math.min(max.x, position.x)),
    y: Math.max(min.y, Math.min(max.y, position.y)),
  };
}

/**
 * Calculate perpendicular vector (90 degrees counter-clockwise)
 */
export function getPerpendicularVector(vector: Position): Position {
  return { x: -vector.y, y: vector.x };
}

/**
 * Calculate the closest point on a line segment to a given point
 */
export function getClosestPointOnSegment(point: Position, lineStart: Position, lineEnd: Position): Position {
  const line = subtractVectors(lineEnd, lineStart);
  const pointToStart = subtractVectors(point, lineStart);

  const lineLengthSquared = line.x * line.x + line.y * line.y;
  if (lineLengthSquared === 0) {
    return lineStart;
  }

  const t = Math.max(0, Math.min(1, dotProduct(pointToStart, line) / lineLengthSquared));

  return addVectors(lineStart, scaleVector(line, t));
}
