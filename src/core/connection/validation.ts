/**
 * @file Connection validation helpers for node port compatibility checks.
 * Pure domain functions for validating connections between ports.
 */
import type { Node, Port, Connection, NodeId } from "../../types/core";
import type { NodeDefinition, PortConnectionContext } from "../../types/NodeDefinition";
import { arePortDataTypesCompatible, mergePortDataTypes } from "../../utils/portDataTypeUtils";

export type ConnectionValidationOptions = {
  nodes?: Record<NodeId, Node>;
};

/**
 * Get port definition from node definition
 */
export const getPortDefinition = (port: Port, nodeDefinition?: NodeDefinition) => {
  if (!nodeDefinition?.ports) {
    return undefined;
  }
  const candidateIds = new Set<string>();
  if (port.definitionId) {
    candidateIds.add(port.definitionId);
  }
  candidateIds.add(port.id);

  const numericSuffixMatch = port.id.match(/^(.*?)-\d+$/);
  if (numericSuffixMatch?.[1]) {
    candidateIds.add(numericSuffixMatch[1]);
  }

  for (const candidate of candidateIds) {
    const match = nodeDefinition.ports.find((p) => p.id === candidate);
    if (match) {
      return match;
    }
  }

  return undefined;
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
  // Helper to normalize max: number | "unlimited" | undefined -> number | undefined
  const normalizeMax = (value: number | "unlimited" | undefined, defaultValue: number): number | undefined => {
    if (value === "unlimited") {
      return undefined;
    } // no limit
    if (typeof value === "number") {
      return value;
    }
    return defaultValue;
  };

  // Basic connection rules
  if (fromPort.type === toPort.type) {
    return false;
  } // Same type cannot connect
  if (fromPort.nodeId === toPort.nodeId) {
    return false;
  } // Same node cannot connect
  // Same-node connections are already blocked above; allow identical port ids on different nodes

  // Ensure proper input/output pairing
  if (fromPort.type === "output" && toPort.type !== "input") {
    return false;
  }
  if (fromPort.type === "input" && toPort.type !== "output") {
    return false;
  }

  // Check if identical connection already exists (match both node and port ids)
  if (connections) {
    const exists = Object.values(connections).some(
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
    if (exists) {
      return false;
    }
  }

  const fromPortDef = getPortDefinition(fromPort, fromNodeDef);
  const toPortDef = getPortDefinition(toPort, toNodeDef);

  // Check custom validation functions (both must allow)
  if (fromNodeDef?.validateConnection) {
    if (!fromNodeDef.validateConnection(fromPort, toPort)) {
      return false;
    }
  }
  if (toNodeDef?.validateConnection) {
    if (!toNodeDef.validateConnection(fromPort, toPort)) {
      return false;
    }
  }

  // Check data type compatibility if specified
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

  const portContext: PortConnectionContext = {
    fromPort,
    toPort,
    fromNode: options?.nodes?.[fromPort.nodeId],
    toNode: options?.nodes?.[toPort.nodeId],
    fromDefinition: fromNodeDef,
    toDefinition: toNodeDef,
    allConnections: connections,
  };

  if (fromPortDef?.canConnect && !fromPortDef.canConnect(portContext)) {
    return false;
  }
  if (toPortDef?.canConnect && !toPortDef.canConnect(portContext)) {
    return false;
  }

  // Check max connections limit (default for all ports is 1; "unlimited" removes the limit)
  if (connections) {
    const toMax = normalizeMax(toPortDef?.maxConnections, 1);
    if (toMax !== undefined) {
      const toPortConnections = Object.values(connections).filter(
        (conn) => conn.toNodeId === toPort.nodeId && conn.toPortId === toPort.id,
      );
      if (toPortConnections.length >= toMax) {
        return false;
      }
    }
    const fromMax = normalizeMax(fromPortDef?.maxConnections, 1);
    if (fromMax !== undefined) {
      const fromPortConnections = Object.values(connections).filter(
        (conn) => conn.fromNodeId === fromPort.nodeId && conn.fromPortId === fromPort.id,
      );
      if (fromPortConnections.length >= fromMax) {
        return false;
      }
    }
  }

  return true;
};
