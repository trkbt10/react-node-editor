/**
 * @file Port resolution utilities with default port inference
 */
import type { Node, Port, PortPlacement } from "../../../types/core";
import type {
  NodeDefinition,
  PortDefinition,
  PortInstanceContext,
  PortInstanceFactoryContext,
} from "../../../types/NodeDefinition";
import { createPortInstance } from "../../../core/port/factory";
import { mergePortDataTypes, toPortDataTypeValue } from "../../../utils/portDataTypeUtils";

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

export const normalizePlacement = (position?: PortDefinition["position"] | PortPlacement): PortPlacement => {
  if (!position) {
    return { side: "right" };
  }
  if (typeof position === "string") {
    return { side: position };
  }
  return {
    side: position.side,
    segment: position.segment,
    segmentOrder: position.segmentOrder,
    segmentSpan: position.segmentSpan,
    align: position.align,
  };
};

const resolveInstanceCount = (definition: PortDefinition, context: PortInstanceContext): number => {
  const raw = typeof definition.instances === "function" ? definition.instances(context) : definition.instances;
  if (raw === undefined) {
    return 1;
  }
  const count = Math.floor(raw);
  if (Number.isNaN(count) || count < 0) {
    return 0;
  }
  return count;
};

const createPortInstances = (definition: PortDefinition, node: Node): Port[] => {
  const instanceContext: PortInstanceContext = { node };
  const total = resolveInstanceCount(definition, instanceContext);
  if (total === 0) {
    return [];
  }

  const placement = normalizePlacement(definition.position);
  const mergedDataTypes = mergePortDataTypes(definition.dataType, definition.dataTypes);
  const resolvedDataType = toPortDataTypeValue(mergedDataTypes);

  return Array.from({ length: total }, (_unused, index) => {
    const factoryContext: PortInstanceFactoryContext = {
      node,
      definition,
      index,
      total,
    };
    const id =
      definition.createPortId?.(factoryContext) ??
      (total > 1 ? `${definition.id}-${index + 1}` : definition.id);
    const label =
      definition.createPortLabel?.(factoryContext) ??
      (total > 1 ? `${definition.label} ${index + 1}` : definition.label);

    return createPortInstance(definition, {
      id,
      label,
      nodeId: node.id,
      placement,
      instanceIndex: index,
      instanceTotal: total,
    }, resolvedDataType);
  });
};

/**
 * Infer default port definitions when ports are not explicitly defined
 * Rules:
 * - input ports are positioned on the left
 * - output ports are positioned on the right
 * - ports are centered vertically
 */
export function inferDefaultPortDefinitions(_node: Node): PortDefinition[] {
  // Default inference: create one input (left) and one output (right) port
  return [
    {
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
    },
  ];
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

  const resolvedPorts: Port[] = [];

  basePorts.forEach((portDef) => {
    const portsFromDefinition = createPortInstances(portDef, node);
    portsFromDefinition.forEach((port) => {
      const override = nodeWithOverrides.portOverrides?.find(
        (candidate) => candidate.portId === port.id || candidate.portId === port.definitionId,
      );

      if (override?.disabled) {
        return;
      }

      if (override?.maxConnections !== undefined) {
        port.maxConnections = override.maxConnections;
      }
      if (override?.allowedNodeTypes) {
        port.allowedNodeTypes = override.allowedNodeTypes;
      }
      if (override?.allowedPortTypes) {
        port.allowedPortTypes = override.allowedPortTypes;
      }

      resolvedPorts.push(port);
    });
  });

  return resolvedPorts;
}
