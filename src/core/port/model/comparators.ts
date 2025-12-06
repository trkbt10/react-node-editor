/**
 * @file Port comparison utilities
 * Pure functions for comparing Port state in memo functions
 */
import type { Port } from "../../../types/core";
import { areStringArraysEqual } from "../../common/comparators";
import { arePortDataTypesEqual } from "./dataType";
import { arePlacementsEqual } from "../appearance/comparators";

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
