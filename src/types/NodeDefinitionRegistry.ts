import type { NodeDefinition } from "./NodeDefinition";

/**
 * Node definitions registry
 */
export type NodeDefinitionRegistry = {
  /** Map of type to definition */
  definitions: Map<string, NodeDefinition>;
  /** Register a new node type */
  register: <TData extends Record<string, unknown> = Record<string, unknown>>(definition: NodeDefinition<TData>) => void;
  /** Unregister a node type */
  unregister: (type: string) => void;
  /** Get a node definition by type */
  get: (type: string) => NodeDefinition | undefined;
  /** Get all definitions */
  getAll: () => NodeDefinition[];
  /** Get definitions by category */
  getByCategory: (category: string) => NodeDefinition[];
};

/**
 * Create a node definition registry
 */
export function createNodeDefinitionRegistry(): NodeDefinitionRegistry {
  const definitions = new Map<string, NodeDefinition>();

  return {
    definitions,
    register(definition: NodeDefinition) {
      definitions.set(definition.type, definition);
    },
    unregister(type: string) {
      definitions.delete(type);
    },
    get(type: string) {
      return definitions.get(type);
    },
    getAll() {
      return Array.from(definitions.values());
    },
    getByCategory(category: string) {
      return Array.from(definitions.values()).filter((def) => def.category === category);
    },
  };
}
