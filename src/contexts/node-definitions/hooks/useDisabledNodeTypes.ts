/**
 * @file Hook for determining which node types are disabled based on per-flow limits
 */
import * as React from "react";
import { useNodeEditor } from "../../composed/node-editor/context";
import { useNodeDefinitionList } from "./useNodeDefinitionList";
import { countNodesByType, getDisabledNodeTypes } from "../utils/nodeTypeLimits";

/**
 * Hook to get the list of node types that have reached their per-flow limit
 * and should be disabled in the node palette/context menu
 *
 * @returns Array of node type strings that should be disabled
 */
export function useDisabledNodeTypes(): string[] {
  const { state } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();

  const nodeTypeCounts = React.useMemo(() => countNodesByType(state), [state]);

  return React.useMemo(
    () => getDisabledNodeTypes(nodeDefinitions, nodeTypeCounts),
    [nodeDefinitions, nodeTypeCounts],
  );
}

/**
 * Hook to get the count of nodes by type
 * Useful when you need both counts and disabled types
 *
 * @returns Map of node type to count
 */
export function useNodeTypeCounts(): Map<string, number> {
  const { state } = useNodeEditor();
  return React.useMemo(() => countNodesByType(state), [state]);
}
