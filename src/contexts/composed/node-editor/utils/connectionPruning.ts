/**
 * @file Utility functions for finding and pruning invalid connections
 */
import type { Connection, ConnectionId, Node, NodeEditorData, Port } from "../../../../types/core";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import { canConnectPorts } from "../../../../core/connection/validation";
import { deriveNodePorts } from "../../../../core/node/portDerivation";

/**
 * Result of connection validation
 */
export type InvalidConnection = {
  connectionId: ConnectionId;
  connection: Connection;
  reason: string;
};

/**
 * Find all invalid connections in the editor data
 */
export function findInvalidConnections(
  data: NodeEditorData,
  nodeDefinitions: NodeDefinition[],
): InvalidConnection[] {
  const invalidConnections: InvalidConnection[] = [];
  const definitionMap = new Map(nodeDefinitions.map((def) => [def.type, def]));

  const getDefinition = (type: string): NodeDefinition | undefined => definitionMap.get(type);

  const getPortsForNode = (node: Node): Port[] => {
    const def = getDefinition(node.type);
    if (!def) {
      return [];
    }
    return deriveNodePorts(node, def);
  };

  for (const [connectionId, connection] of Object.entries(data.connections)) {
    const fromNode = data.nodes[connection.fromNodeId];
    const toNode = data.nodes[connection.toNodeId];

    // Check if nodes exist
    if (!fromNode) {
      invalidConnections.push({
        connectionId,
        connection,
        reason: `Source node "${connection.fromNodeId}" not found`,
      });
      continue;
    }

    if (!toNode) {
      invalidConnections.push({
        connectionId,
        connection,
        reason: `Target node "${connection.toNodeId}" not found`,
      });
      continue;
    }

    // Get ports
    const fromPorts = getPortsForNode(fromNode);
    const toPorts = getPortsForNode(toNode);

    const fromPort = fromPorts.find((p) => p.id === connection.fromPortId);
    const toPort = toPorts.find((p) => p.id === connection.toPortId);

    // Check if ports exist
    if (!fromPort) {
      invalidConnections.push({
        connectionId,
        connection,
        reason: `Source port "${connection.fromPortId}" not found on node "${fromNode.type}"`,
      });
      continue;
    }

    if (!toPort) {
      invalidConnections.push({
        connectionId,
        connection,
        reason: `Target port "${connection.toPortId}" not found on node "${toNode.type}"`,
      });
      continue;
    }

    // Create a connections object without the current connection for validation
    // This is needed because capacity checks should not count the connection being validated
    const otherConnections = { ...data.connections };
    delete otherConnections[connectionId];

    // Validate the connection
    const fromDef = getDefinition(fromNode.type);
    const toDef = getDefinition(toNode.type);

    const isValid = canConnectPorts(fromPort, toPort, fromDef, toDef, otherConnections, {
      nodes: data.nodes,
    });

    if (!isValid) {
      // Determine the reason
      let reason = "Connection rule violation";

      // Check specific violations
      if (fromPort.type === toPort.type) {
        reason = "Same port type (both input or both output)";
      } else if (fromNode.id === toNode.id) {
        reason = "Self-connection not allowed";
      } else {
        // Check dataType
        const fromTypes = Array.isArray(fromPort.dataType)
          ? fromPort.dataType
          : fromPort.dataType
            ? [fromPort.dataType]
            : [];
        const toTypes = Array.isArray(toPort.dataType)
          ? toPort.dataType
          : toPort.dataType
            ? [toPort.dataType]
            : [];

        if (fromTypes.length > 0 && toTypes.length > 0) {
          const hasOverlap = fromTypes.some((t) => toTypes.includes(t));
          if (!hasOverlap) {
            reason = `Type mismatch: ${fromTypes.join("|")} → ${toTypes.join("|")}`;
          }
        }
      }

      invalidConnections.push({
        connectionId,
        connection,
        reason,
      });
    }
  }

  return invalidConnections;
}

/**
 * Remove all invalid connections from the editor data
 * Returns the new data and the list of removed connections
 */
export function pruneInvalidConnections(
  data: NodeEditorData,
  nodeDefinitions: NodeDefinition[],
): { data: NodeEditorData; removed: InvalidConnection[] } {
  const invalidConnections = findInvalidConnections(data, nodeDefinitions);

  if (invalidConnections.length === 0) {
    return { data, removed: [] };
  }

  const invalidIds = new Set(invalidConnections.map((ic) => ic.connectionId));
  const prunedConnections: Record<ConnectionId, Connection> = {};

  for (const [id, connection] of Object.entries(data.connections)) {
    if (!invalidIds.has(id)) {
      prunedConnections[id] = connection;
    }
  }

  return {
    data: { ...data, connections: prunedConnections },
    removed: invalidConnections,
  };
}
