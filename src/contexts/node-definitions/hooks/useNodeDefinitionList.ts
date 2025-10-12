import type { NodeDefinition, NodeDataTypeMap } from "../../../types/NodeDefinition";
import { useNodeDefinitions } from "../context";

/**
 * Hook to get all node definitions as an array
 * @template TNodeDataTypeMap - The node data type map
 */
export const useNodeDefinitionList = <
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
>(): NodeDefinition<string, NodeDataTypeMap>[] => {
  const { registry } = useNodeDefinitions<TNodeDataTypeMap>();
  return registry.getAll();
};
