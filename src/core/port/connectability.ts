/**
 * @file Utilities for determining which ports can connect to a given source port
 * Pure functions for port connectability calculations
 */
import type { Port, Node, Connection } from "../../types/core";
import type { NodeDefinition, PortDefinition } from "../../types/NodeDefinition";
import { createPortFromDefinition } from "./factory";
import { normalizePlacement } from "./placement";
import { createPortKey } from "./portKey";
import type { PortKey } from "./portKey";
import { canConnectPorts } from "../connection/validation";

/**
 * Compute connectable port IDs for a given source port.
 * Uses actual resolved ports per node (via getNodePorts) and NodeDefinitions for validation.
 * canConnectPorts handles all validation including type/node checks internally.
 */
export function getConnectablePortIds(
  fromPort: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[],
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): Set<PortKey> {
  const result = new Set<PortKey>();
  const fromNode = nodes[fromPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;

  Object.values(nodes).forEach((n) => {
    const toDef = getNodeDefinition(n.type);
    const ports = getNodePorts(n.id) || [];
    ports.forEach((p) => {
      // canConnectPorts handles all validation:
      // - same type check
      // - same node check
      // - port normalization
      // - validateConnection callbacks
      // - data type compatibility
      // - capacity limits
      if (canConnectPorts(fromPort, p, fromDef, toDef, connections, { nodes })) {
        result.add(createPortKey(n.id, p.id));
      }
    });
  });

  return result;
}

/**
 * Check if a PortDefinition has any port that can connect to the given source port.
 * canConnectPorts handles all validation including type checks and normalization.
 */
const canDefinitionConnectToPort = (
  portDefinition: PortDefinition,
  fromPort: Port,
  fromDef: NodeDefinition | undefined,
  targetDef: NodeDefinition,
  connections: Record<string, Connection>,
  nodes: Record<string, Node>,
): boolean => {
  const placement = normalizePlacement(portDefinition.position);
  const tempPort = createPortFromDefinition(portDefinition, "new", placement);

  // canConnectPorts handles all validation:
  // - same type check
  // - same node check (tempPort has nodeId="new" so will never match)
  // - port normalization
  // - validateConnection callbacks
  // - data type compatibility
  // - capacity limits
  return canConnectPorts(fromPort, tempPort, fromDef, targetDef, connections, { nodes });
};

/**
 * Parameters for computing connectable node types
 */
export type GetConnectableNodeTypesParams = {
  /** The source port to check connections from */
  fromPort: Port;
  /** All nodes currently in the editor */
  nodes: Record<string, Node>;
  /** All connections currently in the editor */
  connections: Record<string, Connection>;
  /** Function to get a node definition by type */
  getNodeDefinition: (type: string) => NodeDefinition | undefined;
  /** Function to get all node definitions */
  getAllNodeDefinitions: () => NodeDefinition[];
};

/**
 * Get all node types that have at least one port capable of connecting to the source port.
 * Used for filtering the node search menu when dragging a connection to empty space.
 */
export const getConnectableNodeTypes = ({
  fromPort,
  nodes,
  connections,
  getNodeDefinition,
  getAllNodeDefinitions,
}: GetConnectableNodeTypesParams): string[] => {
  const fromNode = nodes[fromPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;
  const allDefinitions = getAllNodeDefinitions();

  const connectableTypes: string[] = [];

  for (const def of allDefinitions) {
    const ports = def.ports || [];
    const hasConnectablePort = ports.some((portDef) =>
      canDefinitionConnectToPort(portDef, fromPort, fromDef, def, connections, nodes),
    );

    if (hasConnectablePort) {
      connectableTypes.push(def.type);
    }
  }

  return connectableTypes;
};

/**
 * Parameters for finding a connectable port definition
 */
export type FindConnectablePortDefinitionParams = {
  /** The source port to connect from */
  fromPort: Port;
  /** Definition of the source port's node (optional) */
  fromNodeDefinition?: NodeDefinition;
  /** Definition of the target node */
  targetNodeDefinition: NodeDefinition;
  /** ID of the new target node */
  targetNodeId: string;
  /** All connections currently in the editor */
  connections: Record<string, Connection>;
  /** All nodes currently in the editor */
  nodes: Record<string, Node>;
};

/**
 * Result of finding a connectable port definition
 */
export type ConnectablePortDefinitionResult = {
  /** The port definition that can connect */
  portDefinition: PortDefinition;
  /** The resolved Port instance for the connection */
  port: Port;
} | null;

/**
 * Find the first port definition on a target node that can connect to the source port.
 * Returns both the definition and a properly constructed Port instance.
 * Used when creating a new node and auto-connecting to an existing port.
 */
export const findConnectablePortDefinition = ({
  fromPort,
  fromNodeDefinition,
  targetNodeDefinition,
  targetNodeId,
  connections,
  nodes,
}: FindConnectablePortDefinitionParams): ConnectablePortDefinitionResult => {
  const targetPorts = targetNodeDefinition.ports || [];

  for (const portDef of targetPorts) {
    if (canDefinitionConnectToPort(portDef, fromPort, fromNodeDefinition, targetNodeDefinition, connections, nodes)) {
      const placement = normalizePlacement(portDef.position);
      const port = createPortFromDefinition(portDef, targetNodeId, placement);
      return { portDefinition: portDef, port };
    }
  }

  return null;
};
