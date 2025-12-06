/**
 * @file Connection normalization utilities
 * Pure functions for normalizing port pairs into source/target form
 */
import type { Port } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { InputPort, OutputPort } from "../port/identity/guards";
import { isInputPort, isOutputPort } from "../port/identity/guards";

/**
 * Normalized connection parameters with proper port typing.
 * Ensures sourcePort is always output and targetPort is always input.
 */
export type NormalizedConnectionPorts = {
  /** The output port (source of the connection / data flow origin) */
  sourcePort: OutputPort;
  /** The input port (destination of the connection / data flow target) */
  targetPort: InputPort;
};

/**
 * Extended normalized connection with node definitions.
 * Used internally by validation functions.
 */
export type NormalizedConnectionContext = NormalizedConnectionPorts & {
  /** Node definition for the source port's node */
  sourceDefinition?: NodeDefinition;
  /** Node definition for the target port's node */
  targetDefinition?: NodeDefinition;
};

/**
 * Normalizes a pair of ports into source (output) and target (input) form.
 * Handles both connection directions:
 * - output -> input: Returns as-is
 * - input -> output: Swaps the ports
 * - Same type: Returns null (invalid pairing)
 * - Same node: Returns null (invalid pairing)
 *
 * @param fromPort - First port in the connection attempt
 * @param toPort - Second port in the connection attempt
 * @returns Normalized ports with proper types, or null if invalid
 */
export const normalizeConnectionPorts = (
  fromPort: Port,
  toPort: Port,
): NormalizedConnectionPorts | null => {
  // Reject same-type connections
  if (fromPort.type === toPort.type) {
    return null;
  }

  // Reject same-node connections
  if (fromPort.nodeId === toPort.nodeId) {
    return null;
  }

  // Normalize to source (output) -> target (input)
  if (isOutputPort(fromPort) && isInputPort(toPort)) {
    return {
      sourcePort: fromPort,
      targetPort: toPort,
    };
  }

  if (isInputPort(fromPort) && isOutputPort(toPort)) {
    return {
      sourcePort: toPort,
      targetPort: fromPort,
    };
  }

  // Should be unreachable if port types are valid
  return null;
};

/**
 * Normalizes ports with their associated node definitions.
 * Swaps definitions along with ports to maintain correct associations.
 *
 * @param fromPort - First port in the connection attempt
 * @param toPort - Second port in the connection attempt
 * @param fromDef - Node definition for fromPort's node
 * @param toDef - Node definition for toPort's node
 * @returns Normalized context with proper types, or null if invalid
 */
export const normalizeConnectionContext = (
  fromPort: Port,
  toPort: Port,
  fromDef?: NodeDefinition,
  toDef?: NodeDefinition,
): NormalizedConnectionContext | null => {
  const normalized = normalizeConnectionPorts(fromPort, toPort);

  if (!normalized) {
    return null;
  }

  // Determine which definition goes with which port after normalization
  const sourceIsFrom = normalized.sourcePort.nodeId === fromPort.nodeId;

  return {
    ...normalized,
    sourceDefinition: sourceIsFrom ? fromDef : toDef,
    targetDefinition: sourceIsFrom ? toDef : fromDef,
  };
};
