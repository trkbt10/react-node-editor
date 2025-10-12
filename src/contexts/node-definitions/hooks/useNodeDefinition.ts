import type { NodeDefinition } from "../../../types/NodeDefinition";
import { useNodeDefinitions } from "../context";

/**
 * Hook to get a specific node definition
 */
export const useNodeDefinition = (type: string): NodeDefinition | undefined => {
  const { registry } = useNodeDefinitions();
  return registry.get(type);
};
