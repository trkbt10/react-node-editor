/**
 * @file Context provider for coordinating nested sub-editor windows
 */
import * as React from "react";
export type SubEditorOpenRequest = {
  nodeId: string;
  title: string;
  externalRefId: string;
};

export type SubEditorHostContextValue = {
  openSubEditor: (request: SubEditorOpenRequest) => void;
};

const SubEditorHostContext = React.createContext<SubEditorHostContextValue | null>(null);
SubEditorHostContext.displayName = "SubEditorHostContext";

export type SubEditorHostProviderProps = {
  value: SubEditorHostContextValue;
  children: React.ReactNode;
};

/**
 * Provides the sub-editor host context to child components.
 *
 * @param props - Provider properties containing value and children.
 * @returns React element wrapping children with context.
 */
export const SubEditorHostProvider: React.FC<SubEditorHostProviderProps> = ({ value, children }) => {
  return <SubEditorHostContext.Provider value={value}>{children}</SubEditorHostContext.Provider>;
};

/**
 * Hook for consuming the sub-editor host context.
 *
 * @returns Current SubEditorHostContextValue.
 * @throws Error when used outside of a SubEditorHostProvider.
 */
export function useSubEditorHost(): SubEditorHostContextValue {
  const context = React.useContext(SubEditorHostContext);
  if (!context) {
    throw new Error("useSubEditorHost must be used within a SubEditorHostProvider");
  }
  return context;
}

/*
debug-notes:
- Created to share openSubEditor handler between custom node renderers and the advanced nested editor example.
*/
