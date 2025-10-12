import type { NodeDefinition } from "../../../types/NodeDefinition";
import { useNodeDefinitions } from "../context";

/**
 * Hook to get all node definitions as an array
 */
export const useNodeDefinitionList = (): NodeDefinition[] => {
  const { registry } = useNodeDefinitions();
  return registry.getAll();
};
