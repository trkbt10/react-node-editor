import * as React from "react";
import type { NodeDataTypeMap } from "../../types/NodeDefinition";
import type { NodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";

/**
 * Context value for node definitions
 * @template TNodeDataTypeMap - The node data type map
 */
export type NodeDefinitionContextValue<T extends NodeDataTypeMap> = { registry: NodeDefinitionRegistry<T> };

/**
 * Node definition context
 */
export const NodeDefinitionContext = React.createContext<
  NodeDefinitionContextValue<{
    [key: string]: Record<string, unknown>;
  }>
>(
  new Proxy({} as NodeDefinitionContextValue<{ [key: string]: Record<string, unknown> }>, {
    get: () => {
      throw new Error(
        "NodeDefinitionContext is not provided. Make sure to wrap your component tree with NodeDefinitionProvider.",
      );
    },
  }),
);

/**
 * Hook to use node definitions
 * @template TNodeDataTypeMap - The node data type map
 */
export function useNodeDefinitions<
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
>(): NodeDefinitionContextValue<TNodeDataTypeMap> {
  const context = React.useContext(NodeDefinitionContext);
  if (!context) {
    throw new Error("useNodeDefinitions must be used within a NodeDefinitionProvider");
  }
  return context as NodeDefinitionContextValue<TNodeDataTypeMap>;
}
