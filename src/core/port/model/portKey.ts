/**
 * @file PortKey utilities for consistent composite port identification
 * Provides standardized format: `${nodeId}:${portId}`
 */
import type { Port, NodeId, PortId } from "../../../types/core";

/**
 * Brand symbol for PortKey type safety
 */
declare const PortKeyBrand: unique symbol;

/**
 * Composite key for uniquely identifying a port within an editor
 * Format: `${nodeId}:${portId}`
 * Branded type to prevent accidental assignment of arbitrary strings
 */
export type PortKey = `${string}:${string}` & { readonly [PortKeyBrand]: never };

/**
 * Create a composite port key from node and port IDs
 */
export const createPortKey = (nodeId: NodeId, portId: PortId): PortKey =>
  `${nodeId}:${portId}` as PortKey;

/**
 * Create a composite port key from a Port instance
 */
export const getPortKey = (port: Port): PortKey => createPortKey(port.nodeId, port.id);

/**
 * Parse a composite port key into node and port IDs
 * Returns null if the key format is invalid
 */
export const parsePortKey = (key: PortKey | string): { nodeId: NodeId; portId: PortId } | null => {
  const colonIndex = key.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }
  const nodeId = key.slice(0, colonIndex);
  const portId = key.slice(colonIndex + 1);
  if (!nodeId || !portId) {
    return null;
  }
  return { nodeId, portId };
};
