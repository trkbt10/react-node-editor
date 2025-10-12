import type { Node, Port } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";

/**
 * Port override configuration for node-specific customizations
 */
export type PortOverride = {
  /** References port from definition */
  portId: string;
  /** Override max connections */
  maxConnections?: number | "unlimited";
  /** Override allowed node types */
  allowedNodeTypes?: string[];
  /** Override allowed port types */
  allowedPortTypes?: string[];
  /** Disable this port */
  disabled?: boolean;
};

/**
 * Extended Node interface with port overrides
 */
export type NodeWithPortOverrides = {
  /** Optional port-specific overrides */
  portOverrides?: PortOverride[];
} & Omit<Node, "ports">;

/**
 * Resolve ports from node definition, applying any node-specific overrides
 */
export function getNodePorts(node: Node, definition: NodeDefinition): Port[] {
  const basePorts = definition.ports || [];
  const nodeWithOverrides = node as NodeWithPortOverrides;

  return basePorts
    .map((portDef) => {
      const port: Port = {
        id: portDef.id,
        type: portDef.type,
        label: portDef.label,
        nodeId: node.id,
        position: portDef.position,
        dataType: portDef.dataType,
        maxConnections: portDef.maxConnections,
      };

      // Apply any node-specific overrides
      const override = nodeWithOverrides.portOverrides?.find((o) => o.portId === portDef.id);

      if (override) {
        // Skip disabled ports
        if (override.disabled) {
          return null;
        }

        if (override.maxConnections !== undefined) {
          port.maxConnections = override.maxConnections;
        }
        if (override.allowedNodeTypes) {
          port.allowedNodeTypes = override.allowedNodeTypes;
        }
        if (override.allowedPortTypes) {
          port.allowedPortTypes = override.allowedPortTypes;
        }
      }

      return port;
    })
    .filter((port): port is Port => port !== null);
}
