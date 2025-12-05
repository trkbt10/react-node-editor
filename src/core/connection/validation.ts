/**
 * @file Connection validation helpers for node port compatibility checks.
 * Pure domain functions for validating connections between ports.
 */
import type { Node, Port, Connection, NodeId } from "../../types/core";
import type { NodeDefinition, PortConnectionContext } from "../../types/NodeDefinition";
import { arePortDataTypesCompatible, mergePortDataTypes } from "../../utils/portDataTypeUtils";
import { getPortDefinition } from "../port/definition";
import { checkPortCapacity } from "../port/queries";
import { normalizeConnectionContext } from "./normalization";

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

  const { sourcePort, targetPort, sourceDefinition, targetDefinition } = normalized;

  // Check if identical connection already exists
  // Use original ports for connection lookup to handle both directions
  if (connections && connectionExists(fromPort, toPort, connections)) {
    return false;
  }

  // Check custom validation functions (both must allow)
  // validateConnection now always receives (outputPort, inputPort) regardless of drag direction
  const nodeDefValidators = [sourceDefinition, targetDefinition].filter(Boolean) as NodeDefinition[];
  if (nodeDefValidators.some((def) => def.validateConnection && !def.validateConnection(sourcePort, targetPort))) {
    return false;
  }

  // Check data type compatibility using normalized ports
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

  // Check port-level canConnect predicates with normalized context
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
