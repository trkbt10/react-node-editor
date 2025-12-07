/**
 * @file Connection path utilities
 * Functions for calculating bezier curves between two points.
 */
import type { Position } from "../../types/core";
import { getDistance } from "../geometry/position";
import { cubicBezierPoint, cubicBezierTangent } from "../geometry/curve";

const OFFSET_MIN = 40;
const OFFSET_MAX = 120;

/**
 * Calculate control points for a bezier curve connecting two points.
 * Control points are offset along the dominant axis to create smooth curves.
 */
export const calculateConnectionControlPoints = (
  from: Position,
  to: Position,
): { cp1: Position; cp2: Position } => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = getDistance(from, to);
  const offset = Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, distance * 0.5));

  // Offset along dominant axis
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sign = dx >= 0 ? 1 : -1;
    return {
      cp1: { x: from.x + sign * offset, y: from.y },
      cp2: { x: to.x - sign * offset, y: to.y },
    };
  }
  const sign = dy >= 0 ? 1 : -1;
  return {
    cp1: { x: from.x, y: from.y + sign * offset },
    cp2: { x: to.x, y: to.y - sign * offset },
  };
};

/**
 * Calculate SVG bezier path string for a connection
 */
export const calculateConnectionPath = (from: Position, to: Position): string => {
  const { cp1, cp2 } = calculateConnectionControlPoints(from, to);
  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
};

/**
 * Midpoint and angle along a connection path
 */
export type ConnectionMidpointInfo = {
  x: number;
  y: number;
  angle: number;
};

/**
 * Calculate the midpoint position and tangent angle at t=0.5 along the connection bezier.
 */
export const calculateConnectionMidpoint = (from: Position, to: Position): ConnectionMidpointInfo => {
  const { cp1, cp2 } = calculateConnectionControlPoints(from, to);
  const pt = cubicBezierPoint(from, cp1, cp2, to, 0.5);
  const tan = cubicBezierTangent(from, cp1, cp2, to, 0.5);
  return { x: pt.x, y: pt.y, angle: (Math.atan2(tan.y, tan.x) * 180) / Math.PI };
};
