import * as React from "react";
import {
  NodeDefinition,
  type NodeDataTypeMap,
  toUntypedDefinition,
} from "../../types/NodeDefinition";
import { createNodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";
import { defaultNodeDefinitions } from "../../node-definitions";
import { NodeDefinitionContext, type NodeDefinitionContextValue } from "./context";

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

  const contextValue = { registry } as NodeDefinitionContextValue<TNodeDataTypeMap>;

  return <NodeDefinitionContext.Provider value={contextValue as any}>{children}</NodeDefinitionContext.Provider>;
}
