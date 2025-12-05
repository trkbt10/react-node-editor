/**
 * @file Placement utility functions for port positioning
 * Centralized helpers for working with PortPlacement and AbsolutePortPlacement
 */
import type {
  Port,
  PortPlacement,
  AbsolutePortPlacement,
  PortPosition,
  AbsolutePositionUnit,
} from "../../../types/core";

/**
 * Type guard to check if placement is absolute positioning
 */
export const isAbsolutePlacement = (
  placement: PortPlacement | AbsolutePortPlacement | undefined,
): placement is AbsolutePortPlacement => {
  return placement !== undefined && "mode" in placement && placement.mode === "absolute";
};

/**
 * Get side from placement, with fallback for absolute placements.
 * Note: For absolute placements, returns the fallback since direction is computed dynamically.
 */
export const getPlacementSide = (
  placement: PortPlacement | AbsolutePortPlacement,
  fallback: PortPosition = "right",
): PortPosition => {
  if (isAbsolutePlacement(placement)) {
    return fallback;
  }
  return placement.side;
};

/**
 * Get side from port's placement or position field.
 * Note: For absolute placements, returns port.position as fallback since direction is computed dynamically.
 */
export const getPortSide = (port: Port): PortPosition => {
  const placement = port.placement;
  if (!placement) {
    return port.position;
  }
  if (isAbsolutePlacement(placement)) {
    return port.position;
  }
  return placement.side;
};

/**
 * Safely get align value from placement (returns undefined for absolute placements)
 */
export const getPlacementAlign = (
  placement: PortPlacement | AbsolutePortPlacement | undefined,
): number | undefined => {
  if (!placement || isAbsolutePlacement(placement)) {
    return undefined;
  }
  return placement.align;
};

/**
 * Safely get inset value from placement (returns false for absolute placements)
 */
export const getPlacementInset = (
  placement: PortPlacement | AbsolutePortPlacement | undefined,
): boolean => {
  if (!placement || isAbsolutePlacement(placement)) {
    return false;
  }
  return placement.inset === true;
};

/**
 * Safely get segment value from placement (returns undefined for absolute placements)
 */
export const getPlacementSegment = (
  placement: PortPlacement | AbsolutePortPlacement | undefined,
): string | undefined => {
  if (!placement || isAbsolutePlacement(placement)) {
    return undefined;
  }
  return placement.segment;
};

/**
 * Get the unit from an absolute placement (defaults to "px")
 */
export const getAbsoluteUnit = (
  placement: AbsolutePortPlacement,
): AbsolutePositionUnit => {
  return placement.unit ?? "px";
};

/**
 * Check if absolute placement uses percentage units
 */
export const isPercentPlacement = (
  placement: AbsolutePortPlacement,
): boolean => {
  return placement.unit === "percent";
};

/**
 * Create an absolute placement with pixel units
 */
export const absolutePx = (x: number, y: number): AbsolutePortPlacement => ({
  mode: "absolute",
  x,
  y,
  unit: "px",
});

/**
 * Create an absolute placement with percentage units
 */
export const absolutePercent = (x: number, y: number): AbsolutePortPlacement => ({
  mode: "absolute",
  x,
  y,
  unit: "percent",
});
