import * as React from "react";
import type { NodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";

/**
 * Context value for node definitions
 */
export type NodeDefinitionContextValue = { registry: NodeDefinitionRegistry };

/**
 * Node definition context
 */
export const NodeDefinitionContext = React.createContext<NodeDefinitionContextValue>(
  new Proxy({} as NodeDefinitionContextValue, {
    get: () => {
      throw new Error(
        "NodeDefinitionContext is not provided. Make sure to wrap your component tree with NodeDefinitionProvider.",
      );
    },
  }),
);

/**
 * Hook to use node definitions
 */
export function useNodeDefinitions(): NodeDefinitionContextValue {
  const context = React.useContext(NodeDefinitionContext);
  if (!context) {
    throw new Error("useNodeDefinitions must be used within a NodeDefinitionProvider");
  }
  return context;
}
