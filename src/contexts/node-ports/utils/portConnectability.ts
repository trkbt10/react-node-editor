import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import type { ConnectablePortsResult } from "./connectablePortPlanner";
import { canConnectPorts } from "./connectionValidation";

/**
 * Compute connectable port IDs for a given source port.
 * Uses actual resolved ports per node (via getNodePorts) and NodeDefinitions for validation.
 */
export function getConnectablePortIds(
  fromPort: Port,
  nodes: Record<string, Node>,
  getNodePorts: (nodeId: string) => Port[],
  connections: Record<string, Connection>,
  getNodeDefinition: (type: string) => NodeDefinition | undefined
): Set<string> {
  const result = new Set<string>();
  const fromNode = nodes[fromPort.nodeId];
  const fromDef = fromNode ? getNodeDefinition(fromNode.type) : undefined;

  Object.values(nodes).forEach((n) => {
    const toDef = getNodeDefinition(n.type);
    const ports = getNodePorts(n.id) || [];
    ports.forEach((p) => {
      // Only opposite type and not same port
      if (p.type === fromPort.type) {return;}
      if (p.nodeId === fromPort.nodeId && p.id === fromPort.id) {return;}
      if (canConnectPorts(fromPort, p, fromDef, toDef, connections)) {
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
  connectablePorts?: ConnectablePortsResult | { ids: Set<string> }
): boolean {
  if (!connectablePorts) {return false;}

  const compositeId = `${port.nodeId}:${port.id}`;

  if ("descriptors" in connectablePorts) {
    const descriptor = connectablePorts.descriptors.get(compositeId);
    if (!descriptor) {return false;}
    // Only treat opposite IO as connectable safety net
    return descriptor.portType !== descriptor.source.portType;
  }

  const ids: Set<string> = "ids" in connectablePorts ? connectablePorts.ids : connectablePorts;
  if (!ids || ids.size === 0) {return false;}
  return ids.has(compositeId);
}
