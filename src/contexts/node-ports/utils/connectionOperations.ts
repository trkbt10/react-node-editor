/**
 * @file Utilities for creating and validating connections between ports
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { canConnectPorts } from "../../../core/connection/validation";
import { normalizeConnectionPorts } from "../../../core/connection/normalization";

/**
 * Create a connection object based on port types.
 * Normalizes port order so that the connection is always from output to input.
 *
 * @param fromPort - First port (can be input or output)
 * @param toPort - Second port (can be input or output)
 * @returns Connection data with normalized from/to, or null if invalid pairing
 */
export function createConnection(
  fromPort: Port,
  toPort: Port,
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  const normalized = normalizeConnectionPorts(fromPort, toPort);
  if (!normalized) {
    return null;
  }

  const { sourcePort, targetPort } = normalized;
  return {
    fromNodeId: sourcePort.nodeId,
    fromPortId: sourcePort.id,
    toNodeId: targetPort.nodeId,
    toPortId: targetPort.id,
  };
}

/**
 * Create a connection only if valid according to canConnectPorts.
 * Normalizes port order so that the connection is always from output to input.
 *
 * @param fromPort - First port (can be input or output)
 * @param toPort - Second port (can be input or output)
 * @param nodes - All nodes in the editor
 * @param connections - All existing connections
 * @param getNodeDefinition - Function to get node definition by type
 * @returns Connection data with normalized from/to, or null if invalid
 */
export function createValidatedConnection(
  fromPort: Port,
  toPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  const normalized = normalizeConnectionPorts(fromPort, toPort);
  if (!normalized) {
    return null;
  }

  const { sourcePort, targetPort } = normalized;
  const fromNode = nodes[sourcePort.nodeId];
  const toNode = nodes[targetPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const toDef = toNode ? getNodeDefinition(toNode.type) : undefined;

  // canConnectPorts also normalizes internally, but we've already done it
  // This is redundant but harmless since normalized ports stay in the same order
  if (!canConnectPorts(sourcePort, targetPort, fromDef, toDef, connections, { nodes })) {
    return null;
  }

  return {
    fromNodeId: sourcePort.nodeId,
    fromPortId: sourcePort.id,
    toNodeId: targetPort.nodeId,
    toPortId: targetPort.id,
  };
}
