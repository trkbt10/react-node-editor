/**
 * @file Port query utilities
 * Pure functions for querying port-related data
 */
import type { Port, Connection } from "../../types/core";

/**
 * Get all connections for a specific port
 */
export function getPortConnections(port: Port, connections: Record<string, Connection>): Connection[] {
  return Object.values(connections).filter(
    (conn) =>
      (conn.fromPortId === port.id && conn.fromNodeId === port.nodeId) ||
      (conn.toPortId === port.id && conn.toNodeId === port.nodeId),
  );
}

/**
 * Check if a port has any connections
 */
export function hasPortConnections(port: Port, connections: Record<string, Connection>): boolean {
  return getPortConnections(port, connections).length > 0;
}

/**
 * Count the number of connections for a port
 */
export function countPortConnections(port: Port, connections: Record<string, Connection>): number {
  return getPortConnections(port, connections).length;
}
