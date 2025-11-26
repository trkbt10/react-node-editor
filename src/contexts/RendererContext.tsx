/**
 * @file Context for providing custom renderer components for nodes, ports, and connections
 */
import * as React from "react";
import type { NodeEditorRenderers } from "../types/renderers";

const RendererContext = React.createContext<NodeEditorRenderers | null>(null);
RendererContext.displayName = "RendererContext";

export type RendererProviderProps = {
  renderers: NodeEditorRenderers;
  children: React.ReactNode;
};

export const RendererProvider: React.FC<RendererProviderProps> = ({ renderers, children }) => {
  // Memoize by individual component references to avoid unnecessary re-renders
  // when parent recreates the renderers object with the same component references
  const memoizedRenderers = React.useMemo(
    () => renderers,
    [renderers.node, renderers.port, renderers.connection],
  );

  return <RendererContext.Provider value={memoizedRenderers}>{children}</RendererContext.Provider>;
};

export const useRenderers = (): NodeEditorRenderers => {
  const context = React.useContext(RendererContext);
  if (!context) {
    throw new Error("useRenderers must be used within a RendererProvider");
  }
  return context;
};

export const useOptionalRenderers = (): NodeEditorRenderers | null => React.useContext(RendererContext);
