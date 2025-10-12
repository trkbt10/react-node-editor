import * as React from "react";
import {
  NodeDefinition,
  type NodeDataTypeMap,
  toUntypedDefinition,
} from "../types/NodeDefinition";
import {
  NodeDefinitionRegistry,
  createNodeDefinitionRegistry,
} from "../types/NodeDefinitionRegistry";
import { defaultNodeDefinitions } from "../node-definitions";

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
 * Node definition provider props
 */
export type NodeDefinitionProviderProps<
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
> = {
  children: React.ReactNode;
  /** Custom node definitions to register */
  nodeDefinitions?: NodeDefinition<string, TNodeDataTypeMap>[];
  /** Whether to include default definitions */
  includeDefaults?: boolean;
};

/**
 * Node definition provider
 */
export function NodeDefinitionProvider<
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
>({ children, nodeDefinitions = [], includeDefaults = true }: NodeDefinitionProviderProps<TNodeDataTypeMap>) {
  const registry = React.useMemo(() => {
    const reg = createNodeDefinitionRegistry<NodeDataTypeMap>();

    // Register default definitions if requested
    if (includeDefaults) {
      defaultNodeDefinitions.forEach((def) => {
        reg.register(toUntypedDefinition(def));
      });
    }

    // Register custom definitions
    nodeDefinitions.forEach((def) => {
      reg.register(toUntypedDefinition(def));
    });

    return reg;
  }, [nodeDefinitions, includeDefaults]);

  const contextValue: NodeDefinitionContextValue<TNodeDataTypeMap> = { registry };

  return <NodeDefinitionContext.Provider value={contextValue}>{children}</NodeDefinitionContext.Provider>;
}

/**
 * Hook to use node definitions
 * @template TNodeDataTypeMap - The node data type map
 */
export function useNodeDefinitions<
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
>(): NodeDefinitionContextValue<TNodeDataTypeMap> {
  const context = React.useContext<NodeDefinitionContextValue<TNodeDataTypeMap>>(NodeDefinitionContext);
  if (!context) {
    throw new Error("useNodeDefinitions must be used within a NodeDefinitionProvider");
  }
  return context;
}

/**
 * Hook to get a specific node definition
 * @template TNodeDataTypeMap - The node data type map
 */
export const useNodeDefinition = <
  TNodeDataTypeMap extends {
    [key: string]: Record<string, unknown>;
  },
>(
  type: string,
): NodeDefinition<string, NodeDataTypeMap> | undefined => {
  const { registry } = useNodeDefinitions<TNodeDataTypeMap>();
  return registry.get(type);
};

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
