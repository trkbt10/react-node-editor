/**
 * @file Port resolution utilities with default port inference
 */
import type { Node, Port } from "../../../types/core";
import type { NodeDefinition, PortDefinition } from "../../../types/NodeDefinition";

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
 * Infer default port definitions when ports are not explicitly defined
 * Rules:
 * - input ports are positioned on the left
 * - output ports are positioned on the right
 * - ports are centered vertically
 */
export function inferDefaultPortDefinitions(node: Node): PortDefinition[] {
  // Check if node has _ports (legacy) defined
  if (node._ports) {
    // If _ports is explicitly set, respect it even if it's empty
    if (node._ports.length === 0) {
      return [];
    }

    return node._ports.map((port) => ({
      id: port.id,
      type: port.type,
      label: port.label,
      position: port.position,
      dataType: port.dataType,
      maxConnections: port.maxConnections,
    }));
  }

  // Default inference: create one input (left) and one output (right) port
  const defaultPorts: PortDefinition[] = [];

  defaultPorts.push({
    id: "input",
    type: "input",
    label: "Input",
    position: "left",
  });

  defaultPorts.push({
    id: "output",
    type: "output",
    label: "Output",
    position: "right",
  });

  return defaultPorts;
}

/**
 * Extended Node interface with port overrides
 */
export type NodeWithPortOverrides = {
  /** Optional port-specific overrides */
  portOverrides?: PortOverride[];
} & Omit<Node, "ports">;

/**
 * Resolve ports from node definition, applying any node-specific overrides
 * If no ports are defined in the definition, infers default ports based on:
 * - input ports positioned on the left
 * - output ports positioned on the right
 * - vertically centered
 */
export function getNodePorts(node: Node, definition: NodeDefinition): Port[] {
  // Use defined ports or infer default ports
  const basePorts = definition.ports || inferDefaultPortDefinitions(node);
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
