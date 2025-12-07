/**
 * @file Connection path utilities
 * Functions for calculating connection paths based on port positions.
 * Direction is calculated purely from geometric positions.
 */
import type { Position } from "../../types/core";
import { getDistance } from "../geometry/position";
import { cubicBezierPoint, cubicBezierTangent } from "../geometry/curve";

type DirectionVector = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

/**
 * Calculate direction vector from one position toward another.
 * Returns unit vector along the dominant axis.
 */
const calculateDirectionVector = (from: Position, to: Position): DirectionVector => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return { dx: dx >= 0 ? 1 : -1, dy: 0 };
  }
  return { dx: 0, dy: dy >= 0 ? 1 : -1 };
};

/**
 * Check if two directions are opposite (facing each other)
 */
const isOppositeFacing = (from: DirectionVector, to: DirectionVector): boolean =>
  from.dx === -to.dx && from.dy === -to.dy;

const OFFSET_MIN = 40;
const OFFSET_MAX = 120;

/**
 * Calculate bezier control point offset based on distance and port orientation
 */
const calculateOffset = (distance: number, oppositeFacing: boolean): number => {
  const baseOffset = Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, distance * 0.5));
  return oppositeFacing ? Math.max(baseOffset, distance * 0.4) : baseOffset;
};

/**
 * Calculate control points for a bezier curve connecting two ports.
 * Direction is automatically calculated from the geometric relationship.
 */
export const calculateConnectionControlPoints = (
  from: Position,
  to: Position,
): { cp1: Position; cp2: Position } => {
  const fromDir = calculateDirectionVector(from, to);
  const toDir = { dx: -fromDir.dx, dy: -fromDir.dy } as DirectionVector;

  const distance = getDistance(from, to);
  const offset = calculateOffset(distance, isOppositeFacing(fromDir, toDir));

  return {
    cp1: { x: from.x + fromDir.dx * offset, y: from.y + fromDir.dy * offset },
    cp2: { x: to.x + toDir.dx * offset, y: to.y + toDir.dy * offset },
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
 * Useful for placing direction markers or labels.
 */
export const calculateConnectionMidpoint = (from: Position, to: Position): ConnectionMidpointInfo => {
  const { cp1, cp2 } = calculateConnectionControlPoints(from, to);
  const t = 0.5;
  const pt = cubicBezierPoint(from, cp1, cp2, to, t);
  const tan = cubicBezierTangent(from, cp1, cp2, to, t);
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
  return { x: pt.x, y: pt.y, angle };
};
