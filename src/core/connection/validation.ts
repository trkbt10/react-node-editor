/**
 * @file Connection validation helpers for node port compatibility checks.
 * Pure domain functions for validating connections between ports.
 */
import type { Node, Port, Connection, NodeId } from "../../types/core";
import type { NodeDefinition, PortConnectionContext } from "../../types/NodeDefinition";
import { arePortDataTypesCompatible, mergePortDataTypes } from "../../utils/portDataTypeUtils";
import { getPortDefinition } from "../port/definition";

// Re-export for backwards compatibility
export { getPortDefinition } from "../port/definition";

export type ConnectionValidationOptions = {
  nodes?: Record<NodeId, Node>;
};

/**
 * Normalize maxConnections value to a number or undefined (unlimited)
 */
const normalizeMaxConnections = (value: number | "unlimited" | undefined, defaultValue: number): number | undefined => {
  if (value === "unlimited") {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  return defaultValue;
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
 * Count connections for a specific port
 */
const countPortConnections = (
  port: Port,
  connections: Record<string, Connection>,
  direction: "from" | "to",
): number => {
  const nodeKey = direction === "from" ? "fromNodeId" : "toNodeId";
  const portKey = direction === "from" ? "fromPortId" : "toPortId";
  return Object.values(connections).filter(
    (conn) => conn[nodeKey] === port.nodeId && conn[portKey] === port.id,
  ).length;
};

/**
 * Check if port exceeds max connections limit
 */
const exceedsMaxConnections = (
  port: Port,
  connections: Record<string, Connection>,
  maxConnections: number | "unlimited" | undefined,
  direction: "from" | "to",
): boolean => {
  const max = normalizeMaxConnections(maxConnections, 1);
  if (max === undefined) {
    return false;
  }
  return countPortConnections(port, connections, direction) >= max;
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

  // Check max connections limit
  if (connections) {
    if (exceedsMaxConnections(toPort, connections, toPortDef?.maxConnections, "to")) {
      return false;
    }
    if (exceedsMaxConnections(fromPort, connections, fromPortDef?.maxConnections, "from")) {
      return false;
    }
  }

  return true;
};
