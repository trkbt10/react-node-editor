/**
 * @file Node Definition Provider
 * Provides node definition registry and context to the application
 */
import * as React from "react";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { createNodeDefinitionRegistry, type FallbackDefinition } from "../../types/NodeDefinitionRegistry";
import { defaultNodeDefinitions } from "../../node-definitions";
import { defaultFallbackFactory } from "../../node-definitions/error";
import { createPortDefinitionResolver } from "../../core/port/model/definition";
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
  /**
   * Fallback definition for unknown node types.
   * - `true`: Use the default error node definition factory
   * - `false` or `undefined`: No fallback (returns undefined for unknown types)
   * - `NodeDefinition`: Use a fixed definition for all unknown types
   * - `(type: string) => NodeDefinition`: Use a factory function to create definitions based on the unknown type
   */
  fallbackDefinition?: FallbackDefinition | boolean;
};

/**
 * Node definition provider
 */
export function NodeDefinitionProvider({
  children,
  nodeDefinitions = [],
  includeDefaults = true,
  fallbackDefinition,
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

    // Set up fallback definition for unknown types
    if (fallbackDefinition === true) {
      reg.setFallback(defaultFallbackFactory);
    } else if (typeof fallbackDefinition === "function" || (typeof fallbackDefinition === "object" && fallbackDefinition !== null)) {
      reg.setFallback(fallbackDefinition);
    }

    return reg;
  }, [nodeDefinitions, includeDefaults, fallbackDefinition]);

  const getPortDefinition = React.useMemo(
    () => createPortDefinitionResolver((nodeType) => registry.get(nodeType)),
    [registry],
  );

  const contextValue: NodeDefinitionContextValue = React.useMemo(
    () => ({ registry, getPortDefinition }),
    [registry, getPortDefinition],
  );

  return <NodeDefinitionContext.Provider value={contextValue}>{children}</NodeDefinitionContext.Provider>;
}
