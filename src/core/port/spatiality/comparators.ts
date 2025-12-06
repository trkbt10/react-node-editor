/**
 * @file Placement comparison utilities
 * Pure functions for comparing port placement in memo functions
 */
import type { Port, PortPlacement, AbsolutePortPlacement } from "../../../types/core";
import { isAbsolutePlacement } from "./placement";

/**
 * Check if two placements are equal (full comparison including all fields)
 */
export const arePlacementsEqual = (
  prev: PortPlacement | AbsolutePortPlacement | undefined | null,
  next: PortPlacement | AbsolutePortPlacement | undefined | null,
): boolean => {
  if (prev === next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }

  // Both must be same type
  const prevIsAbsolute = isAbsolutePlacement(prev);
  const nextIsAbsolute = isAbsolutePlacement(next);
  if (prevIsAbsolute !== nextIsAbsolute) {
    return false;
  }

  // Compare absolute placements
  if (prevIsAbsolute && nextIsAbsolute) {
    return prev.x === next.x && prev.y === next.y;
  }

  // Compare side-based placements
  const prevSide = prev as PortPlacement;
  const nextSide = next as PortPlacement;
  return (
    prevSide.side === nextSide.side &&
    prevSide.segment === nextSide.segment &&
    prevSide.segmentOrder === nextSide.segmentOrder &&
    prevSide.segmentSpan === nextSide.segmentSpan &&
    prevSide.align === nextSide.align &&
    prevSide.inset === nextSide.inset
  );
};

/**
 * Check if port placement has changed
 */
export const hasPortPlacementChanged = (
  prev: Port | undefined | null,
  next: Port | undefined | null,
): boolean => !arePlacementsEqual(prev?.placement, next?.placement);
