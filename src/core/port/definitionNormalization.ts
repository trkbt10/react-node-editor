/**
 * @file Port definition normalization utilities
 * Normalizes all port definitions to a consistent dynamic port form
 */
import type { Node } from "../../types/core";
import type {
  PortDefinition,
  PortInstanceContext,
  PortInstanceFactoryContext,
} from "../../types/NodeDefinition";

/**
 * Normalized port definition where instances is always a function
 */
export type NormalizedPortDefinition = Omit<PortDefinition, "instances" | "createPortId" | "createPortLabel"> & {
  /** Instance count resolver - always a function */
  instances: (context: PortInstanceContext) => number;
  /** Port ID generator */
  createPortId: (context: PortInstanceFactoryContext) => string;
  /** Port label generator */
  createPortLabel: (context: PortInstanceFactoryContext) => string;
};

/**
 * Default port ID generator
 * For single instance: uses definition ID directly
 * For multiple instances: appends 1-based index
 */
function defaultCreatePortId(context: PortInstanceFactoryContext): string {
  const { definition, index, total } = context;
  return total > 1 ? `${definition.id}-${index + 1}` : definition.id;
}

/**
 * Default port label generator
 * For single instance: uses definition label directly
 * For multiple instances: appends 1-based index
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
 *
 * This ensures:
 * - `instances` is always a function
 * - `createPortId` and `createPortLabel` have default implementations
 */
export function normalizePortDefinition(definition: PortDefinition): NormalizedPortDefinition {
  return {
    ...definition,
    instances: normalizeInstances(definition.instances),
    createPortId: definition.createPortId ?? defaultCreatePortId,
    createPortLabel: definition.createPortLabel ?? defaultCreatePortLabel,
  };
}

/**
 * Normalize all port definitions in an array
 */
export function normalizePortDefinitions(definitions: PortDefinition[]): NormalizedPortDefinition[] {
  return definitions.map(normalizePortDefinition);
}

/**
 * Check if a port definition is dynamic (instance count depends on node state)
 */
export function isDynamicPortDefinition(definition: PortDefinition): boolean {
  return typeof definition.instances === "function";
}

/**
 * Get the instance count for a port definition given a node
 */
export function getPortInstanceCount(definition: PortDefinition, node: Node): number {
  const normalized = normalizePortDefinition(definition);
  const count = normalized.instances({ node });
  // Ensure non-negative integer
  const flooredCount = Math.floor(count);
  return Number.isNaN(flooredCount) || flooredCount < 0 ? 0 : flooredCount;
}
