import type { NodeDefinition, NodeDataTypeMap } from "../../../types/NodeDefinition";
import { useNodeDefinitions } from "../context";

/**
 * Hook to get a specific node definition
 * @template TNodeDataTypeMap - The node data type map
 */
export const useNodeDefinition = <
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  } = NodeDataTypeMap,
>(
  type: string,
): NodeDefinition<string, TNodeDataTypeMap> | undefined => {
  const { registry } = useNodeDefinitions<TNodeDataTypeMap>();
  return registry.get(type);
};
