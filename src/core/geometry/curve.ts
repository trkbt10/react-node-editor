/**
 * @file Curve utilities
 * Pure mathematical functions for bezier curve calculations
 */
import type { Position } from "../../types/core";

/**
 * Evaluate cubic bezier point at parameter t
 * @param p0 Start point
 * @param p1 First control point
 * @param p2 Second control point
 * @param p3 End point
 * @param t Parameter (0 to 1)
 */
export const cubicBezierPoint = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number,
): Position => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt; // (1-t)^3
  const b = 3 * mt2 * t; // 3(1-t)^2 t
  const c = 3 * mt * t2; // 3(1-t) t^2
  const d = t * t2; // t^3
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/**
 * Evaluate cubic bezier tangent (first derivative) at parameter t
 * @param p0 Start point
 * @param p1 First control point
 * @param p2 Second control point
 * @param p3 End point
 * @param t Parameter (0 to 1)
 */
export const cubicBezierTangent = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number,
): Position => {
  const mt = 1 - t;
  const a = 3 * mt * mt; // 3(1-t)^2
  const b = 6 * mt * t; // 6(1-t)t
  const c = 3 * t * t; // 3t^2
  return {
    x: a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x),
    y: a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y),
  };
};

/**
 * Calculate the length of a cubic bezier curve (approximation using subdivision)
 */
export const cubicBezierLength = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  segments: number = 10,
): number => {
  let length = 0;
  let prev = p0;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const current = cubicBezierPoint(p0, p1, p2, p3, t);
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    length += Math.sqrt(dx * dx + dy * dy);
    prev = current;
  }

  return length;
};
