/**
 * @file Port position utilities
 * Functions for port position calculations
 */
import type { PortPosition } from "../../types/core";

/**
 * Get the opposite port position
 * Used when dragging to predict where the connection will end
 */
export const getOppositePortPosition = (position: PortPosition): PortPosition => {
  const oppositeMap: Record<PortPosition, PortPosition> = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  };
  return oppositeMap[position];
};

/**
 * Check if two port positions are opposite to each other
 */
export const arePortPositionsOpposite = (a: PortPosition, b: PortPosition): boolean => {
  return getOppositePortPosition(a) === b;
};

/**
 * Check if a port position is horizontal (left or right)
 */
export const isHorizontalPortPosition = (position: PortPosition): boolean => {
  return position === "left" || position === "right";
};

/**
 * Check if a port position is vertical (top or bottom)
 */
export const isVerticalPortPosition = (position: PortPosition): boolean => {
  return position === "top" || position === "bottom";
};
