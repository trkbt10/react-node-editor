/**
 * @file Connection comparison utilities
 * Pure functions for comparing Connection state
 */
import type { Connection } from "../../types/core";
import { areRecordValuesShallowEqual } from "../common/comparators";

/**
 * Check if two connections are structurally equal (full comparison of all fields)
 * Used for controlled data stabilization
 */
export const areConnectionsStructurallyEqual = (prev: Connection, next: Connection): boolean => {
  if (prev === next) return true;
  return (
    prev.id === next.id &&
    prev.fromNodeId === next.fromNodeId &&
    prev.fromPortId === next.fromPortId &&
    prev.toNodeId === next.toNodeId &&
    prev.toPortId === next.toPortId &&
    areRecordValuesShallowEqual(prev.data ?? {}, next.data ?? {})
  );
};
