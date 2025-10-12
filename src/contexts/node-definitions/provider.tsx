/**
 * @file Node Definition Provider
 * Provides node definition registry and context to the application
 */
import * as React from "react";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { createNodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";
import { defaultNodeDefinitions } from "../../node-definitions";
import { NodeDefinitionContext, type NodeDefinitionContextValue } from "./context";

/**
 * Node definition provider props
 */
export type NodeDefinitionProviderProps = {
  children: React.ReactNode;
  /** Custom node definitions to register */
  nodeDefinitions?: NodeDefinition[];
  /** Whether to include default definitions */
  includeDefaults?: boolean;
};

/**
 * Node definition provider
 */
export function NodeDefinitionProvider({
  children,
  nodeDefinitions = [],
  includeDefaults = true,
}: NodeDefinitionProviderProps) {
  const registry = React.useMemo(() => {
    const reg = createNodeDefinitionRegistry();

    // Register default definitions if requested
    if (includeDefaults) {
      defaultNodeDefinitions.forEach((def) => {
        reg.register(def);
      });
    }

    // Register custom definitions
    nodeDefinitions.forEach((def) => {
      reg.register(def);
    });

    return reg;
  }, [nodeDefinitions, includeDefaults]);

  const contextValue: NodeDefinitionContextValue = { registry };

  return <NodeDefinitionContext.Provider value={contextValue}>{children}</NodeDefinitionContext.Provider>;
}
