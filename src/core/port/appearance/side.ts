/**
 * @file Port side utilities
 * Functions for port side (edge) calculations
 */
import type { PortSide } from "../../../types/core";

/**
 * Get the opposite port side
 * Used when dragging to predict where the connection will end
 */
export const getOppositeSide = (side: PortSide): PortSide => {
  const oppositeMap: Record<PortSide, PortSide> = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  };
  return oppositeMap[side];
};

/**
 * Check if two port sides are opposite to each other
 */
export const areSidesOpposite = (a: PortSide, b: PortSide): boolean => {
  return getOppositeSide(a) === b;
};

/**
 * Check if a port side is horizontal (left or right)
 */
export const isHorizontalSide = (side: PortSide): boolean => {
  return side === "left" || side === "right";
};

/**
 * Check if a port side is vertical (top or bottom)
 */
export const isVerticalSide = (side: PortSide): boolean => {
  return side === "top" || side === "bottom";
};
