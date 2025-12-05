/**
 * @file Port comparison utilities
 * Pure functions for comparing Port state in memo functions
 */
import type { Port, PortPlacement, AbsolutePortPlacement } from "../../types/core";
import { areStringArraysEqual } from "../common/comparators";
import { arePortDataTypesEqual } from "./dataType";
import { isAbsolutePlacement } from "./placement";

/**
 * Check if port ID has changed (handles optional ports)
 */
export const hasPortIdChanged = (
  prev: Port | undefined | null,
  next: Port | undefined | null,
): boolean => prev?.id !== next?.id;

/**
 * Check if port position has changed
 */
export const hasPortPositionChanged = (
  prev: Port | undefined | null,
  next: Port | undefined | null,
): boolean => prev?.position !== next?.position;

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

/**
 * Check if two ports are structurally equal (full comparison of all fields)
 */
export const arePortsEqual = (prev: Port, next: Port): boolean => {
  if (prev === next) {
    return true;
  }
  return (
    prev.id === next.id &&
    prev.definitionId === next.definitionId &&
    prev.type === next.type &&
    prev.label === next.label &&
    prev.nodeId === next.nodeId &&
    prev.position === next.position &&
    arePlacementsEqual(prev.placement, next.placement) &&
    arePortDataTypesEqual(prev.dataType, next.dataType) &&
    prev.maxConnections === next.maxConnections &&
    areStringArraysEqual(prev.allowedNodeTypes, next.allowedNodeTypes) &&
    areStringArraysEqual(prev.allowedPortTypes, next.allowedPortTypes) &&
    prev.instanceIndex === next.instanceIndex &&
    prev.instanceTotal === next.instanceTotal
  );
};

/**
 * Check if two port arrays are equal
 */
export const arePortArraysEqual = (prev?: Port[], next?: Port[]): boolean => {
  if (prev === next) {
    return true;
  }
  if (!prev && !next) {
    return true;
  }
  if (!prev || !next) {
    return false;
  }
  if (prev.length !== next.length) {
    return false;
  }
  return prev.every((port, index) => arePortsEqual(port, next[index]));
};
