/**
 * @file Query utilities for inspecting port connections
 * Contains functions that require context callbacks (getNodePorts, getNodeDefinition)
 */
import type { Port, Node, Connection } from "../../../types/core";

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
