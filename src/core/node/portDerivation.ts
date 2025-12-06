/**
 * @file Port derivation from node definitions
 * Derives port instances from NodeDefinition for a given Node.
 * This is a Node concern - nodes produce their ports from definitions.
 */
import type { Node, Port, PortPlacement, AbsolutePortPlacement } from "../../types/core";
import type {
  NodeDefinition,
  PortDefinition,
  PortInstanceContext,
  PortInstanceFactoryContext,
} from "../../types/NodeDefinition";
import { mergePortDataTypes, toPortDataTypeValue } from "../port/connectivity/dataType";
import { normalizePlacement, getPlacementSide } from "../port/spatiality/placement";

// ============================================================================
// Types
// ============================================================================

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
 * Context for creating dynamic port instances
 */
type PortInstanceCreationContext = {
  id: string;
  label: string;
  nodeId: string;
  placement: PortPlacement | AbsolutePortPlacement;
  instanceIndex: number;
  instanceTotal: number;
};

// ============================================================================
// Internal: Port Definition Normalization
// ============================================================================

/**
 * Normalized port definition where instances is always a function.
 */
type NormalizedPortDefinition = Omit<PortDefinition, "instances" | "createPortId" | "createPortLabel"> & {
  instances: (context: PortInstanceContext) => number;
  createPortId: (context: PortInstanceFactoryContext) => string;
  createPortLabel: (context: PortInstanceFactoryContext) => string;
};

function defaultCreatePortId(context: PortInstanceFactoryContext): string {
  const { definition, index, total } = context;
  return total > 1 ? `${definition.id}-${index + 1}` : definition.id;
}

function defaultCreatePortLabel(context: PortInstanceFactoryContext): string {
  const { definition, index, total } = context;
  return total > 1 ? `${definition.label} ${index + 1}` : definition.label;
}

function normalizeInstances(
  instances: PortDefinition["instances"],
): (context: PortInstanceContext) => number {
  if (typeof instances === "function") {
    return instances;
  }
  const count = instances ?? 1;
  return () => count;
}

function normalizePortDefinition(definition: PortDefinition): NormalizedPortDefinition {
  return {
    ...definition,
    instances: normalizeInstances(definition.instances),
    createPortId: definition.createPortId ?? defaultCreatePortId,
    createPortLabel: definition.createPortLabel ?? defaultCreatePortLabel,
  };
}

// ============================================================================
// Internal: Port Instance Creation
// ============================================================================

const resolveInstanceCount = (normalized: NormalizedPortDefinition, node: Node): number => {
  const raw = normalized.instances({ node });
  const count = Math.floor(raw);
  if (Number.isNaN(count) || count < 0) {
    return 0;
  }
  return count;
};

const createPortInstance = (
  definition: PortDefinition,
  context: PortInstanceCreationContext,
  resolvedDataType: string | string[] | undefined,
): Port => {
  return {
    id: context.id,
    definitionId: definition.id,
    type: definition.type,
    label: context.label,
    nodeId: context.nodeId,
    position: getPlacementSide(context.placement),
    placement: context.placement,
    dataType: resolvedDataType,
    maxConnections: definition.maxConnections,
    allowedNodeTypes: undefined,
    allowedPortTypes: undefined,
    instanceIndex: context.instanceIndex,
    instanceTotal: context.instanceTotal,
  };
};

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
 * Derive ports from node definition, applying any node-specific overrides.
 * This is the main entry point for port derivation.
 *
 * If no ports are defined in the definition, infers default ports based on:
 * - input ports positioned on the left
 * - output ports positioned on the right
 * - vertically centered
 */
export function deriveNodePorts(node: Node, definition: NodeDefinition): Port[] {
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

