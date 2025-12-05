/**
 * @file Connection validation helpers for node port compatibility checks.
 * Pure domain functions for validating connections between ports.
 */
import type { Node, Port, Connection, NodeId } from "../../types/core";
import type { NodeDefinition, PortConnectionContext } from "../../types/NodeDefinition";
import { arePortDataTypesCompatible, mergePortDataTypes } from "../../utils/portDataTypeUtils";
import { getPortDefinition } from "../port/definition";
import { checkPortCapacity } from "../port/queries";
import type { NormalizedConnectionContext } from "./normalization";
import { normalizeConnectionContext } from "./normalization";

// Re-export for backwards compatibility
export { getPortDefinition } from "../port/definition";

export type ConnectionValidationOptions = {
  nodes?: Record<NodeId, Node>;
};

/**
 * Check if a connection between two ports already exists.
 * Checks both directions since connections are stored as from(output)->to(input).
 */
const connectionExists = (
  portA: Port,
  portB: Port,
  connections: Record<string, Connection>,
): boolean => {
  return Object.values(connections).some(
    (conn) =>
      (conn.fromNodeId === portA.nodeId &&
        conn.fromPortId === portA.id &&
        conn.toNodeId === portB.nodeId &&
        conn.toPortId === portB.id) ||
      (conn.fromNodeId === portB.nodeId &&
        conn.fromPortId === portB.id &&
        conn.toNodeId === portA.nodeId &&
        conn.toPortId === portA.id),
  );
};

/**
 * Internal validation for already-normalized port pairs.
 * Use this when you've already called normalizeConnectionContext/normalizeConnectionPorts.
 *
 * @param normalized - Pre-normalized connection context with sourcePort (output) and targetPort (input)
 * @param connections - Existing connections to check for duplicates and capacity
 * @param options - Additional validation options
 * @returns true if connection is valid, false otherwise
 */
export const canConnectNormalizedPorts = (
  normalized: NormalizedConnectionContext,
  connections?: Record<string, Connection>,
  options?: ConnectionValidationOptions,
): boolean => {
  const { sourcePort, targetPort, sourceDefinition, targetDefinition } = normalized;

  // Check if identical connection already exists
  if (connections && connectionExists(sourcePort, targetPort, connections)) {
    return false;
  }

  // Check custom validation functions (both must allow)
  // validateConnection always receives (outputPort, inputPort)
  const nodeDefValidators = [sourceDefinition, targetDefinition].filter(Boolean) as NodeDefinition[];
  if (nodeDefValidators.some((def) => def.validateConnection && !def.validateConnection(sourcePort, targetPort))) {
    return false;
  }

  // Check data type compatibility
  const sourcePortDef = getPortDefinition(sourcePort, sourceDefinition);
  const targetPortDef = getPortDefinition(targetPort, targetDefinition);
  const sourceTypes = mergePortDataTypes(
    sourcePort.dataType,
    mergePortDataTypes(sourcePortDef?.dataType, sourcePortDef?.dataTypes),
  );
  const targetTypes = mergePortDataTypes(
    targetPort.dataType,
    mergePortDataTypes(targetPortDef?.dataType, targetPortDef?.dataTypes),
  );
  if (!arePortDataTypesCompatible(sourceTypes, targetTypes)) {
    return false;
  }

  // Check port-level canConnect predicates
  // PortConnectionContext.fromPort is always output, toPort is always input
  const portContext: PortConnectionContext = {
    fromPort: sourcePort,
    toPort: targetPort,
    fromNode: options?.nodes?.[sourcePort.nodeId],
    toNode: options?.nodes?.[targetPort.nodeId],
    fromDefinition: sourceDefinition,
    toDefinition: targetDefinition,
    allConnections: connections,
  };
  const portDefs = [sourcePortDef, targetPortDef].filter(Boolean);
  if (portDefs.some((def) => def?.canConnect && !def.canConnect(portContext))) {
    return false;
  }

  // Check max connections limit (port object takes priority over definition)
  if (connections) {
    // targetPort (input) receives connections, check "to" direction
    if (checkPortCapacity(targetPort, connections, "to", targetPortDef).atCapacity) {
      return false;
    }
    // sourcePort (output) sends connections, check "from" direction
    if (checkPortCapacity(sourcePort, connections, "from", sourcePortDef).atCapacity) {
      return false;
    }
  }

  return true;
};

/**
 * Check if two ports can be connected.
 * Accepts ports in either order - internally normalizes to source(output)/target(input).
 *
 * @param fromPort - First port in the connection attempt (can be input or output)
 * @param toPort - Second port in the connection attempt (can be input or output)
 * @param fromNodeDef - Node definition for fromPort's node
 * @param toNodeDef - Node definition for toPort's node
 * @param connections - Existing connections to check for duplicates and capacity
 * @param options - Additional validation options
 * @returns true if connection is valid, false otherwise
 */
export const canConnectPorts = (
  fromPort: Port,
  toPort: Port,
  fromNodeDef?: NodeDefinition,
  toNodeDef?: NodeDefinition,
  connections?: Record<string, Connection>,
  options?: ConnectionValidationOptions,
): boolean => {
  // Normalize to source(output)/target(input) form
  // This handles both directions: output->input and input->output
  const normalized = normalizeConnectionContext(fromPort, toPort, fromNodeDef, toNodeDef);
  if (!normalized) {
    // Invalid pairing: same type, same node, or other invalid combination
    return false;
  }

  return canConnectNormalizedPorts(normalized, connections, options);
};
