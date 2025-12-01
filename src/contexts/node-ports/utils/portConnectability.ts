/**
 * @file Utilities for determining which ports can connect to a given source port
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition, PortDefinition } from "../../../types/NodeDefinition";
import type { ConnectablePortsResult } from "./connectablePortPlanner";
import { createPortFromDefinition } from "../../../core/port/factory";
import { normalizePlacement } from "./portResolution";
import { canConnectPorts } from "../../../core/connection/validation";

/**
 * Compute connectable port IDs for a given source port.
 * Uses actual resolved ports per node (via getNodePorts) and NodeDefinitions for validation.
 */
export function getConnectablePortIds(
  fromPort: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[],
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined,
): Set<string> {
  const result = new Set<string>();
  const fromNode = nodes[fromPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;

  Object.values(nodes).forEach((n) => {
    const toDef = getNodeDefinition(n.type);
    const ports = getNodePorts(n.id) || [];
    ports.forEach((p) => {
      // Only opposite type and not same port
      if (p.type === fromPort.type) {
        return;
      }
      if (p.nodeId === fromPort.nodeId && p.id === fromPort.id) {
        return;
      }
      if (canConnectPorts(fromPort, p, fromDef, toDef, connections, { nodes })) {
        result.add(`${n.id}:${p.id}`);
      }
    });
  });

  return result;
}

/**
 * Check if a given port is connectable based on precomputed connectable port descriptors.
 * Only considers ports whose descriptor indicates they are valid destinations.
 */
export function isPortConnectable(
  port: Port,
  connectablePorts?: ConnectablePortsResult | { ids: Set<string> },
): boolean {
  if (!connectablePorts) {
    return false;
  }

  const compositeId = `${port.nodeId}:${port.id}`;

  if ("descriptors" in connectablePorts) {
    const descriptor = connectablePorts.descriptors.get(compositeId);
    if (!descriptor) {
      return false;
    }
    // Only treat opposite IO as connectable safety net
    return descriptor.portType !== descriptor.source.portType;
  }

  const ids: Set<string> = "ids" in connectablePorts ? connectablePorts.ids : connectablePorts;
  if (!ids || ids.size === 0) {
    return false;
  }
  return ids.has(compositeId);
}

/**
 * Check if a PortDefinition has any port that can connect to the given source port.
 */
const canDefinitionConnectToPort = (
  portDefinition: PortDefinition,
  fromPort: Port,
  fromDef: NodeDefinition | undefined,
  targetDef: NodeDefinition,
  connections: Record<string, Connection>,
  nodes: Record<string, Node>,
): boolean => {
  // Skip ports of the same type (both input or both output)
  if (portDefinition.type === fromPort.type) {
    return false;
  }

  const placement = normalizePlacement(portDefinition.position);
  const tempPort = createPortFromDefinition(portDefinition, "new", placement);

  // Order ports correctly based on type
  const [sourcePort, targetPort] =
    fromPort.type === "output" ? [fromPort, tempPort] : [tempPort, fromPort];
  const [sourceDef, destDef] =
    fromPort.type === "output" ? [fromDef, targetDef] : [targetDef, fromDef];

  return canConnectPorts(sourcePort, targetPort, sourceDef, destDef, connections, { nodes });
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
}

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
}
