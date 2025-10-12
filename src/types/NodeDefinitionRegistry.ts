import type { NodeDefinition } from "./NodeDefinition";
import type { NodeDataTypeMap } from "./NodeDefinition";

/**
 * Node definitions registry
 * @template TNodeDataTypeMap - The node data type map
 */
export type NodeDefinitionRegistry<TNodeDataTypeMap = NodeDataTypeMap> = {
  /** Map of type to definition */
  definitions: Map<string, NodeDefinition<string, TNodeDataTypeMap>>;
  /** Register a new node type */
  register: (definition: NodeDefinition<string, TNodeDataTypeMap>) => void;
  /** Unregister a node type */
  unregister: (type: string) => void;
  /** Get a node definition by type */
  get: (type: string) => NodeDefinition<string, TNodeDataTypeMap> | undefined;
  /** Get all definitions */
  getAll: () => NodeDefinition<string, TNodeDataTypeMap>[];
  /** Get definitions by category */
  getByCategory: (category: string) => NodeDefinition<string, TNodeDataTypeMap>[];
};

/**
 * Create a node definition registry
 * @template TNodeDataTypeMap - The node data type map
 */
export function createNodeDefinitionRegistry<
  TNodeDataTypeMap extends NodeDataTypeMap,
>(): NodeDefinitionRegistry<TNodeDataTypeMap> {
  const definitions = new Map<string, NodeDefinition<string, TNodeDataTypeMap>>();

  return {
    definitions,
    register(definition: NodeDefinition<string, TNodeDataTypeMap>) {
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
