import type { Position } from "../../../types/core";
import { getDistance } from "../../../utils/vectorUtils";

/**
 * Get the opposite port position for connection drawing
 * Used when dragging to predict where the connection will end
 */
export const getOppositePortPosition = (
  portPosition: "left" | "right" | "top" | "bottom"
): "left" | "right" | "top" | "bottom" => {
  const oppositeMap: Record<string, "left" | "right" | "top" | "bottom"> = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  };
  return oppositeMap[portPosition] || "left";
};

/**
 * Calculate a bezier curve path between two points
 * Creates a smooth curve that enters/exits ports horizontally or vertically based on port position
 */
export const calculateBezierPath = (
  from: Position,
  to: Position,
  fromPortPosition?: "left" | "right" | "top" | "bottom",
  toPortPosition?: "left" | "right" | "top" | "bottom"
): string => {
  // Calculate control point offset based on distance and port positions
  const distance = getDistance(from, to);

  // Dynamic offset based on distance and port configuration
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

  // Determine control points based on port positions
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
      // Default to right if not specified
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
      // Default to left if not specified
      cp2x = to.x - offset;
  }

  // Create SVG path
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
};

/**
 * Calculate cubic bezier control points using the same logic as calculateBezierPath
 */
export const calculateBezierControlPoints = (
  from: Position,
  to: Position,
  fromPortPosition?: "left" | "right" | "top" | "bottom",
  toPortPosition?: "left" | "right" | "top" | "bottom"
): { cp1: Position; cp2: Position } => {
  const distance = getDistance(from, to);
  const minOffset = 40;
  const maxOffset = 120;
  let offset = Math.max(minOffset, Math.min(maxOffset, distance * 0.5));

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
 * Evaluate cubic bezier point at t
 */
export const cubicBezierPoint = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number
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
 * Evaluate cubic bezier tangent (first derivative) at t
 */
export const cubicBezierTangent = (
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number
): Position => {
  const mt = 1 - t;
  const a = 3 * mt * mt; // 3(1-t)^2
  const b = 6 * mt * t;  // 6(1-t)t
  const c = 3 * t * t;   // 3t^2
  return {
    x: a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x),
    y: a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y),
  };
};

/**
 * Calculate the midpoint of a bezier curve (approximation)
 */
export const getConnectionMidpoint = (from: Position, to: Position): Position => {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
};

/**
 * Check if a point is near a connection line
 * Used for connection selection and interaction
 */
export const isPointNearConnection = (point: Position, from: Position, to: Position, threshold: number = 10): boolean => {
  // Simple distance from line segment calculation
  const A = point.x - from.x;
  const B = point.y - from.y;
  const C = to.x - from.x;
  const D = to.y - from.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = from.x;
    yy = from.y;
  } else if (param > 1) {
    xx = to.x;
    yy = to.y;
  } else {
    xx = from.x + param * C;
    yy = from.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= threshold;
};

/**
 * Interpolate between two colors based on a factor (0-1)
 * Used for visual feedback during connection editing
 */
export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  // Simple hex color interpolation
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
