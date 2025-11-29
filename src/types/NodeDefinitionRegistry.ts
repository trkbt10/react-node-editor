/**
 * @file Registry for managing and accessing node type definitions
 */
import type { NodeDefinition } from "./NodeDefinition";

/**
 * Type for the fallback definition option.
 * - NodeDefinition: A fixed fallback definition to use for all unknown types
 * - (type: string) => NodeDefinition: A factory function that creates a definition based on the unknown type
 */
export type FallbackDefinition = NodeDefinition | ((type: string) => NodeDefinition);

/**
 * Node definitions registry
 */
export type NodeDefinitionRegistry = {
  /** Map of type to definition */
  definitions: Map<string, NodeDefinition>;
  /** Current fallback definition (if set) */
  fallbackDefinition?: FallbackDefinition;
  /** Register a new node type */
  register: <TData extends Record<string, unknown> = Record<string, unknown>>(
    definition: NodeDefinition<TData>,
  ) => void;
  /** Unregister a node type */
  unregister: (type: string) => void;
  /** Get a node definition by type. Returns fallback if type not found and fallback is set. */
  get: (type: string) => NodeDefinition | undefined;
  /** Get all registered definitions (excludes dynamically generated fallback definitions) */
  getAll: () => NodeDefinition[];
  /** Get definitions by category */
  getByCategory: (category: string) => NodeDefinition[];
  /** Set a fallback definition for unknown types */
  setFallback: (fallback: FallbackDefinition) => void;
  /** Clear the fallback definition */
  clearFallback: () => void;
  /** Check if the registry has a fallback definition set */
  hasFallback: () => boolean;
};

/**
 * Create a node definition registry
 */
export function createNodeDefinitionRegistry(): NodeDefinitionRegistry {
  const definitions = new Map<string, NodeDefinition>();
  let fallbackDefinition: FallbackDefinition | undefined;

  const registry: NodeDefinitionRegistry = {
    definitions,
    get fallbackDefinition() {
      return fallbackDefinition;
    },
    register<TData extends Record<string, unknown> = Record<string, unknown>>(definition: NodeDefinition<TData>) {
      definitions.set(definition.type, definition as NodeDefinition);
    },
    unregister(type: string) {
      definitions.delete(type);
    },
    get(type: string) {
      const definition = definitions.get(type);
      if (definition) {
        return definition;
      }
      // Return fallback definition if set and type not found
      if (fallbackDefinition) {
        if (typeof fallbackDefinition === "function") {
          return fallbackDefinition(type);
        }
        return fallbackDefinition;
      }
      return undefined;
    },
    getAll() {
      return Array.from(definitions.values());
    },
    getByCategory(category: string) {
      return Array.from(definitions.values()).filter((def) => def.category === category);
    },
    setFallback(fallback: FallbackDefinition) {
      fallbackDefinition = fallback;
    },
    clearFallback() {
      fallbackDefinition = undefined;
    },
    hasFallback() {
      return fallbackDefinition !== undefined;
    },
  };

  return registry;
}
