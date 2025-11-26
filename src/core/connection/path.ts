/**
 * @file Connection path utilities
 * Functions for calculating connection paths based on port positions
 */
import type { Position, PortPosition } from "../../types/core";
import { getDistance } from "../geometry/position";
import { cubicBezierPoint, cubicBezierTangent } from "../geometry/curve";

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
  const minOffset = 40;
  const maxOffset = 120;
  let offset = Math.max(minOffset, Math.min(maxOffset, distance * 0.5));

  // Increase offset for opposite-facing ports for smoother curves
  const isOppositeFacing =
    (fromPortPosition === "right" && toPortPosition === "left") ||
    (fromPortPosition === "left" && toPortPosition === "right") ||
    (fromPortPosition === "top" && toPortPosition === "bottom") ||
    (fromPortPosition === "bottom" && toPortPosition === "top");

  if (isOppositeFacing) {
    offset = Math.max(offset, distance * 0.4);
  }

  let cp1x = from.x;
  let cp1y = from.y;
  let cp2x = to.x;
  let cp2y = to.y;

  // From port control point
  switch (fromPortPosition) {
    case "left":
      cp1x = from.x - offset;
      break;
    case "right":
      cp1x = from.x + offset;
      break;
    case "top":
      cp1y = from.y - offset;
      break;
    case "bottom":
      cp1y = from.y + offset;
      break;
    default:
      cp1x = from.x + offset;
  }

  // To port control point
  switch (toPortPosition) {
    case "left":
      cp2x = to.x - offset;
      break;
    case "right":
      cp2x = to.x + offset;
      break;
    case "top":
      cp2y = to.y - offset;
      break;
    case "bottom":
      cp2y = to.y + offset;
      break;
    default:
      cp2x = to.x - offset;
  }

  return { cp1: { x: cp1x, y: cp1y }, cp2: { x: cp2x, y: cp2y } };
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
