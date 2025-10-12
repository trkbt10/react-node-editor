/**
 * @file Query utilities for inspecting port connections and validating reconnections
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { canConnectPorts } from "./connectionValidation";

/**
 * Check if a port has any connections
 */
export function getPortConnections(port: Port, connections: Record<string, Connection>): Connection[] {
  return Object.values(connections).filter(
    (conn) =>
      (conn.fromPortId === port.id && conn.fromNodeId === port.nodeId) ||
      (conn.toPortId === port.id && conn.toNodeId === port.nodeId),
  );
}

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
 * Check if a reconnection is valid
 */
export function isValidReconnection(
  fixedPort: Port,
  targetPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): boolean {
  if (fixedPort.type === targetPort.type) {
    return false;
  }
  if (fixedPort.nodeId === targetPort.nodeId) {
    return false;
  }

  const fromPort = fixedPort.type === "output" ? fixedPort : targetPort;
  const toPort = fixedPort.type === "output" ? targetPort : fixedPort;

  const fromNode = nodes[fromPort.nodeId];
  const toNode = nodes[toPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const toDef = toNode ? getNodeDefinition(toNode.type) : undefined;

  return canConnectPorts(fromPort, toPort, fromDef, toDef, connections);
}
