/**
 * @file Context for providing node definition registry
 */
import * as React from "react";
import type { NodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";
import type { PortDefinitionResolver } from "../../core/port/model/definition";

/**
 * Context value for node definitions
 */
export type NodeDefinitionContextValue = {
  registry: NodeDefinitionRegistry;
  /** Resolve port definition from port instance and node type */
  getPortDefinition: PortDefinitionResolver;
};

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
NodeDefinitionContext.displayName = "NodeDefinitionContext";

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
