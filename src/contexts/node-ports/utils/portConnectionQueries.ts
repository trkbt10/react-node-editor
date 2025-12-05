/**
 * @file Query utilities for inspecting port connections and validating reconnections
 * Contains functions that require context callbacks (getNodePorts, getNodeDefinition)
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { canConnectPorts } from "../../../core/connection/validation";

/**
 * Get the other port information for a connection
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

/**
 * Check if a reconnection is valid.
 * canConnectPorts handles all validation including type/node checks and normalization.
 */
export function isValidReconnection(
  fixedPort: Port,
  targetPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): boolean {
  const fixedNode = nodes[fixedPort.nodeId];
  const targetNode = nodes[targetPort.nodeId];
  const fixedDef = fixedNode ? getNodeDefinition(fixedNode.type) : undefined;
  const targetDef = targetNode ? getNodeDefinition(targetNode.type) : undefined;

  // canConnectPorts handles all validation:
  // - same type check
  // - same node check
  // - port normalization
  // - validateConnection callbacks
  // - data type compatibility
  // - capacity limits
  return canConnectPorts(fixedPort, targetPort, fixedDef, targetDef, connections, { nodes });
}
