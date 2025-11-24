/**
 * @file Utilities for creating and validating connections between ports
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { canConnectPorts } from "./connectionValidation";

/**
 * Create a connection object based on port types
 */
export function createConnection(
  fromPort: Port,
  toPort: Port,
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  // Check compatibility
  if (fromPort.type === toPort.type) {
    return null;
  }
  if (fromPort.nodeId === toPort.nodeId) {
    return null;
  }

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
 * Create a connection only if valid according to canConnectPorts
 */
export function createValidatedConnection(
  fromPort: Port,
  toPort: Port,
  nodes: Record<string, Node>,
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string } | null {
  const src = fromPort.type === "output" ? fromPort : toPort;
  const dst = fromPort.type === "output" ? toPort : fromPort;

  const fromNode = nodes[src.nodeId];
  const toNode = nodes[dst.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const toDef = toNode ? getNodeDefinition(toNode.type) : undefined;

  if (!canConnectPorts(src, dst, fromDef, toDef, connections, { nodes })) {
    return null;
  }

  return {
    fromNodeId: src.nodeId,
    fromPortId: src.id,
    toNodeId: dst.nodeId,
    toPortId: dst.id,
  };
}
