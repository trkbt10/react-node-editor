import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import type { ConnectablePortsResult } from "./connectablePortPlanner";
import { canConnectPorts } from "./connectionValidation";

/**
 * Check if a port has any connections
 */
export function getPortConnections(
  port: Port,
  connections: Record<string, Connection>
): Connection[] {
  return Object.values(connections).filter(
    (conn) =>
      (conn.fromPortId === port.id && conn.fromNodeId === port.nodeId) ||
      (conn.toPortId === port.id && conn.toNodeId === port.nodeId)
  );
}

/**
 * Create a connection object based on port types
 */
export function createConnection(
  fromPort: Port,
  toPort: Port
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  // Check compatibility
  if (fromPort.type === toPort.type) {return null;}
  if (fromPort.nodeId === toPort.nodeId) {return null;}

  if (fromPort.type === "output") {
    return {
      fromNodeId: fromPort.nodeId,
      fromPortId: fromPort.id,
      toNodeId: toPort.nodeId,
      toPortId: toPort.id,
    };
  } else {
    return {
      fromNodeId: toPort.nodeId,
      fromPortId: toPort.id,
      toNodeId: fromPort.nodeId,
      toPortId: fromPort.id,
    };
  }
}

/**
 * Check if a reconnection is valid
 */
export function isValidReconnection(
  fixedPort: Port,
  targetPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): boolean {
  if (fixedPort.type === targetPort.type) {return false;}
  if (fixedPort.nodeId === targetPort.nodeId) {return false;}

  const fromPort = fixedPort.type === "output" ? fixedPort : targetPort;
  const toPort = fixedPort.type === "output" ? targetPort : fixedPort;

  const fromNode = nodes[fromPort.nodeId];
  const toNode = nodes[toPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const toDef = toNode ? getNodeDefinition(toNode.type) : undefined;

  return canConnectPorts(fromPort, toPort, fromDef, toDef, connections);
}

/**
 * Compute connectable port IDs for a given source port.
 * Uses actual resolved ports per node (via getNodePorts) and NodeDefinitions for validation.
 */
export function getConnectablePortIds(
  fromPort: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[],
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): Set<string> {
  const result = new Set<string>();
  const fromNode = nodes[fromPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;

  Object.values(nodes).forEach((n) => {
    const toDef = getNodeDefinition(n.type);
    const ports = getNodePorts(n.id) || [];
    ports.forEach((p) => {
      // Only opposite type and not same port
      if (p.type === fromPort.type) {return;}
      if (p.nodeId === fromPort.nodeId && p.id === fromPort.id) {return;}
      if (canConnectPorts(fromPort, p, fromDef, toDef, connections)) {
        result.add(`${n.id}:${p.id}`);
      }
    });
  });

  return result;
}

/**
 * Create a connection only if valid according to canConnectPorts
 */
export function createValidatedConnection(
  fromPort: Port,
  toPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  const src = fromPort.type === "output" ? fromPort : toPort;
  const dst = fromPort.type === "output" ? toPort : fromPort;

  const fromNode = nodes[src.nodeId];
  const toNode = nodes[dst.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const toDef = toNode ? getNodeDefinition(toNode.type) : undefined;

  if (!canConnectPorts(src, dst, fromDef, toDef, connections)) {return null;}

  return {
    fromNodeId: src.nodeId,
    fromPortId: src.id,
    toNodeId: dst.nodeId,
    toPortId: dst.id,
  };
}

/**
 * Check if a given port is connectable based on precomputed connectable port descriptors.
 * Only considers ports whose descriptor indicates they are valid destinations.
 */
export function isPortConnectable(
  port: Port,
  connectablePorts?: ConnectablePortsResult | { ids: Set<string> }
): boolean {
  if (!connectablePorts) {return false;}

  const compositeId = `${port.nodeId}:${port.id}`;

  if ("descriptors" in connectablePorts) {
    const descriptor = connectablePorts.descriptors.get(compositeId);
    if (!descriptor) {return false;}
    // Only treat opposite IO as connectable safety net
    return descriptor.portType !== descriptor.source.portType;
  }

  const ids = connectablePorts.ids ?? connectablePorts;
  if (!ids || ids.size === 0) {return false;}
  return ids.has(compositeId);
}

/**
 * Get the other port information for a connection
 */
export function getOtherPortInfo(
  connection: Connection,
  port: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[]
): { otherNode: Node; otherPort: Port; isFromPort: boolean } | null {
  const isFromPort = connection.fromPortId === port.id && connection.fromNodeId === port.nodeId;
  const otherNodeId = isFromPort ? connection.toNodeId : connection.fromNodeId;
  const otherPortId = isFromPort ? connection.toPortId : connection.fromPortId;
  const otherNode = nodes[otherNodeId];

  if (!otherNode) {return null;}

  const otherNodePorts = getNodePorts(otherNodeId);
  const otherPort = otherNodePorts.find((p) => p.id === otherPortId);

  if (!otherPort) {return null;}

  return { otherNode, otherPort, isFromPort };
}
