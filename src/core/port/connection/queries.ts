/**
 * @file Port query utilities
 * Pure functions for querying port-related data
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { PortDefinition } from "../../../types/NodeDefinition";

const DEFAULT_MAX_CONNECTIONS = 1;

/**
 * Get all connections for a specific port (both directions)
 */
export function getPortConnections(port: Port, connections: Record<string, Connection>): Connection[] {
  return Object.values(connections).filter(
    (conn) =>
      (conn.fromPortId === port.id && conn.fromNodeId === port.nodeId) ||
      (conn.toPortId === port.id && conn.toNodeId === port.nodeId),
  );
}

/**
 * Get connections for a port in a specific direction
 */
export function getPortConnectionsByDirection(
  port: Port,
  connections: Record<string, Connection>,
  direction: "from" | "to",
): Connection[] {
  const nodeKey = direction === "from" ? "fromNodeId" : "toNodeId";
  const portKey = direction === "from" ? "fromPortId" : "toPortId";
  return Object.values(connections).filter(
    (conn) => conn[nodeKey] === port.nodeId && conn[portKey] === port.id,
  );
}

/**
 * Check if a port has any connections
 */
export function hasPortConnections(port: Port, connections: Record<string, Connection>): boolean {
  return getPortConnections(port, connections).length > 0;
}

/**
 * Count the number of connections for a port (both directions)
 */
export function countPortConnections(port: Port, connections: Record<string, Connection>): number {
  return getPortConnections(port, connections).length;
}

/**
 * Normalize maxConnections value to a number or undefined (unlimited).
 * Internal function - used by getEffectiveMaxConnections.
 */
function normalizeMaxConnections(
  value: number | "unlimited" | undefined,
  defaultValue: number = DEFAULT_MAX_CONNECTIONS,
): number | undefined {
  if (value === "unlimited") {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  return defaultValue;
}

/**
 * Get effective maxConnections for a port.
 * Port object value takes priority over definition value.
 * Internal function - used by checkPortCapacity.
 */
function getEffectiveMaxConnections(
  port: Port,
  definition?: PortDefinition,
): number | undefined {
  const configuredMax = port.maxConnections ?? definition?.maxConnections;
  return normalizeMaxConnections(configuredMax);
}

/**
 * Result of checking port capacity
 */
export type PortCapacityResult = {
  /** Whether the port is at capacity */
  atCapacity: boolean;
  /** Existing connections for the port in the specified direction */
  existingConnections: Connection[];
  /** Normalized max connections (undefined = unlimited) */
  maxConnections: number | undefined;
};

/**
 * Check port capacity and return detailed information.
 * Single source of truth for capacity checking logic.
 *
 * @param port - The port to check
 * @param connections - All connections in the editor
 * @param direction - Direction to check ("from" for output, "to" for input)
 * @param portDefinition - Optional port definition for fallback maxConnections
 */
export function checkPortCapacity(
  port: Port,
  connections: Record<string, Connection>,
  direction: "from" | "to",
  portDefinition?: PortDefinition,
): PortCapacityResult {
  const max = getEffectiveMaxConnections(port, portDefinition);
  const existingConnections = getPortConnectionsByDirection(port, connections, direction);

  if (max === undefined) {
    return { atCapacity: false, existingConnections, maxConnections: max };
  }

  return {
    atCapacity: existingConnections.length >= max,
    existingConnections,
    maxConnections: max,
  };
}

/**
 * Get the other port information for a connection.
 * This function requires a context callback (getNodePorts) to resolve ports.
 */
export function getOtherPortInfo(
  connection: Connection,
  port: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[],
): { otherNode: Node; otherPort: Port; isFromPort: boolean } | null {
  const isFromPort = connection.fromPortId === port.id && connection.fromNodeId === port.nodeId;
  const otherNodeId = isFromPort ? connection.toNodeId : connection.fromNodeId;
  const otherPortId = isFromPort ? connection.toPortId : connection.fromPortId;
  const otherNode = nodes[otherNodeId];

  if (!otherNode) {
    return null;
  }

  const otherNodePorts = getNodePorts(otherNodeId);
  const otherPort = otherNodePorts.find((p) => p.id === otherPortId);

  if (!otherPort) {
    return null;
  }

  return { otherNode, otherPort, isFromPort };
}

