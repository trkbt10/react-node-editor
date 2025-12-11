/**
 * @file Utilities for determining which ports can connect to a given source port
 * Pure functions for port connectability calculations
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { createPortKey } from "../identity/key";
import type { PortKey } from "../identity/key";
import { canConnectPorts } from "../../connection/validation";
import { deriveNodePorts } from "../../node/portDerivation";

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
 * Create a temporary node for port derivation.
 * Uses default data from definition to properly resolve dynamic ports.
 */
const createTempNodeForDefinition = (definition: NodeDefinition, nodeId: string): Node => {
  const defaultData =
    definition.defaultData !== undefined ? { ...(definition.defaultData as Record<string, unknown>) } : {};

  return {
    id: nodeId,
    type: definition.type,
    position: { x: 0, y: 0 },
    size: definition.defaultSize ?? { width: 150, height: 50 },
    data: {
      ...defaultData,
      title: "",
    },
  };
};

/**
 * Get all node types that have at least one port capable of connecting to the source port.
 * Used for filtering the node search menu when dragging a connection to empty space.
 * Supports dynamic ports by deriving actual ports from a temporary node instance.
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
    // Create a temporary node to derive actual ports (handles dynamic ports)
    const tempNode = createTempNodeForDefinition(def, "__temp_connectable_check__");
    const derivedPorts = deriveNodePorts(tempNode, def);

    const hasConnectablePort = derivedPorts.some((port) =>
      canConnectPorts(fromPort, port, fromDef, def, connections, { nodes }),
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
 * Result of finding a connectable port
 */
export type ConnectablePortResult = {
  /** The resolved Port instance for the connection */
  port: Port;
} | null;

/**
 * Find the first port on a target node that can connect to the source port.
 * Supports dynamic ports by deriving actual ports from the target node definition.
 * Used when creating a new node and auto-connecting to an existing port.
 */
export const findConnectablePortDefinition = ({
  fromPort,
  fromNodeDefinition,
  targetNodeDefinition,
  targetNodeId,
  connections,
  nodes,
}: FindConnectablePortDefinitionParams): ConnectablePortResult => {
  // Create a temporary node to derive actual ports (handles dynamic ports)
  const tempNode = createTempNodeForDefinition(targetNodeDefinition, targetNodeId);
  const derivedPorts = deriveNodePorts(tempNode, targetNodeDefinition);

  for (const port of derivedPorts) {
    if (canConnectPorts(fromPort, port, fromNodeDefinition, targetNodeDefinition, connections, { nodes })) {
      return { port };
    }
  }

  return null;
};
