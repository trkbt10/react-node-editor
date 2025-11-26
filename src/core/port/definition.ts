/**
 * @file Port definition resolution utilities
 * Functions for resolving port instances to their definitions
 */
import type { Port } from "../../types/core";
import type { NodeDefinition, PortDefinition } from "../../types/NodeDefinition";

/**
 * Get port definition from node definition by resolving port ID candidates
 *
 * Resolution order:
 * 1. port.definitionId (explicit reference)
 * 2. port.id (direct match)
 * 3. Base ID from numeric suffix pattern (e.g., "input-1" → "input")
 */
export const getPortDefinition = (port: Port, nodeDefinition?: NodeDefinition): PortDefinition | undefined => {
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
 * Create a port definition resolver bound to a registry
 * This allows efficient resolution without repeatedly looking up node definitions
 */
export type PortDefinitionResolver = (port: Port, nodeType: string) => PortDefinition | undefined;

export const createPortDefinitionResolver = (
  getNodeDefinition: (nodeType: string) => NodeDefinition | undefined,
): PortDefinitionResolver => {
  return (port: Port, nodeType: string): PortDefinition | undefined => {
    const nodeDefinition = getNodeDefinition(nodeType);
    return getPortDefinition(port, nodeDefinition);
  };
};
