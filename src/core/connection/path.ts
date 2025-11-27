/**
 * @file Connection path utilities
 * Functions for calculating connection paths based on port positions
 */
import type { Position, PortPosition } from "../../types/core";
import { getDistance } from "../geometry/position";
import { cubicBezierPoint, cubicBezierTangent } from "../geometry/curve";

/**
 * Opposite positions for detecting opposite-facing ports
 */
const OPPOSITE_POSITIONS: Record<PortPosition, PortPosition> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

/**
 * Offset direction for each port position
 * dx/dy represent unit vector direction for the control point offset
 */
const PORT_OFFSET_DELTA: Record<PortPosition, { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  top: { dx: 0, dy: -1 },
  bottom: { dx: 0, dy: 1 },
};

/**
 * Check if two port positions are facing opposite directions
 */
const isOppositeFacing = (from?: PortPosition, to?: PortPosition): boolean => {
  if (!from || !to) {
    return false;
  }
  return OPPOSITE_POSITIONS[from] === to;
};

/**
 * Calculate control point position based on port position and offset
 */
const calculateControlPoint = (
  origin: Position,
  portPosition: PortPosition | undefined,
  offset: number,
  defaultDelta: { dx: -1 | 0 | 1; dy: -1 | 0 | 1 },
): Position => {
  const delta = portPosition ? PORT_OFFSET_DELTA[portPosition] : defaultDelta;
  return {
    x: origin.x + delta.dx * offset,
    y: origin.y + delta.dy * offset,
  };
};

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
 * Calculate control points for a bezier curve connecting two ports
 * Takes port positions into account to ensure smooth curves that exit/enter correctly
 */
export const calculateConnectionControlPoints = (
  from: Position,
  to: Position,
  fromPortPosition?: PortPosition,
  toPortPosition?: PortPosition,
): { cp1: Position; cp2: Position } => {
  const distance = getDistance(from, to);
  const offset = calculateOffset(distance, isOppositeFacing(fromPortPosition, toPortPosition));

  const cp1 = calculateControlPoint(from, fromPortPosition, offset, { dx: 1, dy: 0 });
  const cp2 = calculateControlPoint(to, toPortPosition, offset, { dx: -1, dy: 0 });

  return { cp1, cp2 };
};

/**
 * Calculate SVG bezier path string for a connection
 */
export const calculateConnectionPath = (
  from: Position,
  to: Position,
  fromPortPosition?: PortPosition,
  toPortPosition?: PortPosition,
): string => {
  const { cp1, cp2 } = calculateConnectionControlPoints(from, to, fromPortPosition, toPortPosition);
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
 * Calculate the midpoint position and tangent angle at t=0.5 along the connection bezier
 * Useful for placing direction markers or labels
 */
export const calculateConnectionMidpoint = (
  from: Position,
  to: Position,
  fromPortPosition?: PortPosition,
  toPortPosition?: PortPosition,
): ConnectionMidpointInfo => {
  const { cp1, cp2 } = calculateConnectionControlPoints(from, to, fromPortPosition, toPortPosition);
  const t = 0.5;
  const pt = cubicBezierPoint(from, cp1, cp2, to, t);
  const tan = cubicBezierTangent(from, cp1, cp2, to, t);
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
  return { x: pt.x, y: pt.y, angle };
};
