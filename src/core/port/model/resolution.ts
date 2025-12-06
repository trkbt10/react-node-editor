/**
 * @file Port resolution utilities with default port inference
 * Pure functions for resolving ports from node definitions
 */
import type { Node, Port } from "../../../types/core";
import type {
  NodeDefinition,
  PortDefinition,
  PortInstanceContext,
  PortInstanceFactoryContext,
} from "../../../types/NodeDefinition";
import { createPortInstance } from "./factory";
import { mergePortDataTypes, toPortDataTypeValue } from "./dataType";
import { normalizePlacement } from "../appearance/placement";

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

// ============================================================================
// Internal: Port Definition Normalization
// ============================================================================

/**
 * Normalized port definition where instances is always a function.
 * This is an internal type used during port resolution.
 */
type NormalizedPortDefinition = Omit<PortDefinition, "instances" | "createPortId" | "createPortLabel"> & {
  instances: (context: PortInstanceContext) => number;
  createPortId: (context: PortInstanceFactoryContext) => string;
  createPortLabel: (context: PortInstanceFactoryContext) => string;
};

/**
 * Default port ID generator
 */
function defaultCreatePortId(context: PortInstanceFactoryContext): string {
  const { definition, index, total } = context;
  return total > 1 ? `${definition.id}-${index + 1}` : definition.id;
}

/**
 * Default port label generator
 */
function defaultCreatePortLabel(context: PortInstanceFactoryContext): string {
  const { definition, index, total } = context;
  return total > 1 ? `${definition.label} ${index + 1}` : definition.label;
}

/**
 * Normalize instance count to a resolver function
 */
function normalizeInstances(
  instances: PortDefinition["instances"],
): (context: PortInstanceContext) => number {
  if (typeof instances === "function") {
    return instances;
  }
  const count = instances ?? 1;
  return () => count;
}

/**
 * Normalize a port definition to consistent dynamic port form
 */
function normalizePortDefinition(definition: PortDefinition): NormalizedPortDefinition {
  return {
    ...definition,
    instances: normalizeInstances(definition.instances),
    createPortId: definition.createPortId ?? defaultCreatePortId,
    createPortLabel: definition.createPortLabel ?? defaultCreatePortLabel,
  };
}

// ============================================================================
// Port Instance Creation
// ============================================================================

/**
 * Resolve instance count from normalized definition
 * Returns 0 for invalid counts (NaN, negative)
 */
const resolveInstanceCount = (normalized: NormalizedPortDefinition, node: Node): number => {
  const raw = normalized.instances({ node });
  const count = Math.floor(raw);
  if (Number.isNaN(count) || count < 0) {
    return 0;
  }
  return count;
};

/**
 * Create port instances from a port definition
 */
const createPortInstances = (definition: PortDefinition, node: Node): Port[] => {
  const normalized = normalizePortDefinition(definition);
  const total = resolveInstanceCount(normalized, node);
  if (total === 0) {
    return [];
  }

  const placement = normalizePlacement(normalized.position);
  const mergedDataTypes = mergePortDataTypes(normalized.dataType, normalized.dataTypes);
  const resolvedDataType = toPortDataTypeValue(mergedDataTypes);

  return Array.from({ length: total }, (_unused, index) => {
    const factoryContext: PortInstanceFactoryContext = {
      node,
      definition: normalized,
      index,
      total,
    };
    const id = normalized.createPortId(factoryContext);
    const label = normalized.createPortLabel(factoryContext);

    return createPortInstance(normalized, {
      id,
      label,
      nodeId: node.id,
      placement,
      instanceIndex: index,
      instanceTotal: total,
    }, resolvedDataType);
  });
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Infer default port definitions when ports are not explicitly defined
 * Rules:
 * - input ports are positioned on the left
 * - output ports are positioned on the right
 * - ports are centered vertically
 */
export function inferDefaultPortDefinitions(_node: Node): PortDefinition[] {
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
 * Resolve ports from node definition, applying any node-specific overrides
 * If no ports are defined in the definition, infers default ports based on:
 * - input ports positioned on the left
 * - output ports positioned on the right
 * - vertically centered
 */
export function getNodePorts(node: Node, definition: NodeDefinition): Port[] {
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
