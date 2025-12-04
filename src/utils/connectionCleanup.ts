/**
 * @file Connection cleanup utilities for dynamic port systems
 * Handles orphaned connections when ports are removed
 */
import type { Connection, ConnectionId, NodeId, Port } from "../types/core";

/**
 * Result of connection cleanup operation
 */
export type ConnectionCleanupResult = {
  /** IDs of connections that were removed */
  removedConnectionIds: ConnectionId[];
  /** Updated connections map with orphaned connections removed */
  updatedConnections: Record<ConnectionId, Connection>;
};

/**
 * Detect and remove connections that reference non-existent ports
 *
 * This is useful when dynamic ports reduce their count and some
 * connected ports no longer exist.
 *
 * @param connections - Current connections map
 * @param nodeId - The node whose ports changed
 * @param validPortIds - Set of valid port IDs for the node
 * @returns Cleanup result with removed connection IDs and updated map
 */
export function cleanupOrphanedConnections(
  connections: Record<ConnectionId, Connection>,
  nodeId: NodeId,
  validPortIds: Set<string>,
): ConnectionCleanupResult {
  const removedConnectionIds: ConnectionId[] = [];
  const updatedConnections = { ...connections };

  for (const [connectionId, connection] of Object.entries(connections)) {
    const isFromThisNode = connection.fromNodeId === nodeId;
    const isToThisNode = connection.toNodeId === nodeId;

    // Check if this connection references the target node
    if (isFromThisNode && !validPortIds.has(connection.fromPortId)) {
      removedConnectionIds.push(connectionId);
      delete updatedConnections[connectionId];
    } else if (isToThisNode && !validPortIds.has(connection.toPortId)) {
      removedConnectionIds.push(connectionId);
      delete updatedConnections[connectionId];
    }
  }

  return { removedConnectionIds, updatedConnections };
}

/**
 * Detect orphaned connections for multiple nodes at once
 *
 * @param connections - Current connections map
 * @param nodePortMap - Map of nodeId to valid port IDs
 * @returns Cleanup result with removed connection IDs and updated map
 */
export function cleanupOrphanedConnectionsForNodes(
  connections: Record<ConnectionId, Connection>,
  nodePortMap: Map<NodeId, Set<string>>,
): ConnectionCleanupResult {
  const removedConnectionIds: ConnectionId[] = [];
  const updatedConnections = { ...connections };

  for (const [connectionId, connection] of Object.entries(connections)) {
    const fromPorts = nodePortMap.get(connection.fromNodeId);
    const toPorts = nodePortMap.get(connection.toNodeId);

    // Only validate ports for nodes in the map (nodes not in map are not checked)
    const fromPortInvalid = fromPorts !== undefined && !fromPorts.has(connection.fromPortId);
    const toPortInvalid = toPorts !== undefined && !toPorts.has(connection.toPortId);

    if (fromPortInvalid || toPortInvalid) {
      removedConnectionIds.push(connectionId);
      delete updatedConnections[connectionId];
    }
  }

  return { removedConnectionIds, updatedConnections };
}

/**
 * Find connections that would become orphaned if ports were removed
 *
 * This is a non-destructive check that returns which connections
 * would be affected without modifying the connections map.
 *
 * @param connections - Current connections map
 * @param nodeId - The node to check
 * @param portsToRemove - Set of port IDs that would be removed
 * @returns Array of connection IDs that would become orphaned
 */
export function findOrphanedConnections(
  connections: Record<ConnectionId, Connection>,
  nodeId: NodeId,
  portsToRemove: Set<string>,
): ConnectionId[] {
  const orphanedIds: ConnectionId[] = [];

  for (const [connectionId, connection] of Object.entries(connections)) {
    const isFromThisNode = connection.fromNodeId === nodeId;
    const isToThisNode = connection.toNodeId === nodeId;

    if (isFromThisNode && portsToRemove.has(connection.fromPortId)) {
      orphanedIds.push(connectionId);
    } else if (isToThisNode && portsToRemove.has(connection.toPortId)) {
      orphanedIds.push(connectionId);
    }
  }

  return orphanedIds;
}

/**
 * Create a set of valid port IDs from a ports array
 *
 * @param ports - Array of ports
 * @returns Set of port IDs
 */
export function createPortIdSet(ports: Port[]): Set<string> {
  return new Set(ports.map((port) => port.id));
}

/**
 * Detect which ports were removed between two port arrays
 *
 * @param previousPorts - Previous ports array
 * @param currentPorts - Current ports array
 * @returns Set of port IDs that were removed
 */
export function detectRemovedPorts(previousPorts: Port[], currentPorts: Port[]): Set<string> {
  const currentIds = createPortIdSet(currentPorts);
  const removedIds = new Set<string>();

  for (const port of previousPorts) {
    if (!currentIds.has(port.id)) {
      removedIds.add(port.id);
    }
  }

  return removedIds;
}
