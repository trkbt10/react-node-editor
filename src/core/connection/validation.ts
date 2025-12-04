/**
 * @file Connection validation helpers for node port compatibility checks.
 * Pure domain functions for validating connections between ports.
 */
import type { Node, Port, Connection, NodeId } from "../../types/core";
import type { NodeDefinition, PortConnectionContext } from "../../types/NodeDefinition";
import { arePortDataTypesCompatible, mergePortDataTypes } from "../../utils/portDataTypeUtils";
import { getPortDefinition } from "../port/definition";
import { checkPortCapacity } from "../port/queries";

// Re-export for backwards compatibility
export { getPortDefinition } from "../port/definition";

export type ConnectionValidationOptions = {
  nodes?: Record<NodeId, Node>;
};

/**
 * Check if a connection between two ports already exists
 */
const connectionExists = (
  fromPort: Port,
  toPort: Port,
  connections: Record<string, Connection>,
): boolean => {
  return Object.values(connections).some(
    (conn) =>
      (conn.fromNodeId === fromPort.nodeId &&
        conn.fromPortId === fromPort.id &&
        conn.toNodeId === toPort.nodeId &&
        conn.toPortId === toPort.id) ||
      (conn.fromNodeId === toPort.nodeId &&
        conn.fromPortId === toPort.id &&
        conn.toNodeId === fromPort.nodeId &&
        conn.toPortId === fromPort.id),
  );
};

/**
 * Check if two ports can be connected
 */
export const canConnectPorts = (
  fromPort: Port,
  toPort: Port,
  fromNodeDef?: NodeDefinition,
  toNodeDef?: NodeDefinition,
  connections?: Record<string, Connection>,
  options?: ConnectionValidationOptions,
): boolean => {
  // Basic connection rules: same type or same node cannot connect
  if (fromPort.type === toPort.type || fromPort.nodeId === toPort.nodeId) {
    return false;
  }

  // Ensure proper input/output pairing
  const validPairing =
    (fromPort.type === "output" && toPort.type === "input") ||
    (fromPort.type === "input" && toPort.type === "output");
  if (!validPairing) {
    return false;
  }

  // Check if identical connection already exists
  if (connections && connectionExists(fromPort, toPort, connections)) {
    return false;
  }

  // Check custom validation functions (both must allow)
  const nodeDefValidators = [fromNodeDef, toNodeDef].filter(Boolean) as NodeDefinition[];
  if (nodeDefValidators.some((def) => def.validateConnection && !def.validateConnection(fromPort, toPort))) {
    return false;
  }

  // Check data type compatibility
  const fromPortDef = getPortDefinition(fromPort, fromNodeDef);
  const toPortDef = getPortDefinition(toPort, toNodeDef);
  const fromTypes = mergePortDataTypes(
    fromPort.dataType,
    mergePortDataTypes(fromPortDef?.dataType, fromPortDef?.dataTypes),
  );
  const toTypes = mergePortDataTypes(
    toPort.dataType,
    mergePortDataTypes(toPortDef?.dataType, toPortDef?.dataTypes),
  );
  if (!arePortDataTypesCompatible(fromTypes, toTypes)) {
    return false;
  }

  // Check port-level canConnect predicates
  const portContext: PortConnectionContext = {
    fromPort,
    toPort,
    fromNode: options?.nodes?.[fromPort.nodeId],
    toNode: options?.nodes?.[toPort.nodeId],
    fromDefinition: fromNodeDef,
    toDefinition: toNodeDef,
    allConnections: connections,
  };
  const portDefs = [fromPortDef, toPortDef].filter(Boolean);
  if (portDefs.some((def) => def?.canConnect && !def.canConnect(portContext))) {
    return false;
  }

  // Check max connections limit (port object takes priority over definition)
  if (connections) {
    if (checkPortCapacity(toPort, connections, "to", toPortDef).atCapacity) {
      return false;
    }
    if (checkPortCapacity(fromPort, connections, "from", fromPortDef).atCapacity) {
      return false;
    }
  }

  return true;
};
