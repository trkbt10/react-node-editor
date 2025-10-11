import * as React from "react";
import type { SettingsManager } from "../settings/SettingsManager";
import type { Settings } from "../hooks/useSettings";

export type NodeEditorSettingsContextValue = {
  /** Settings manager instance */
  settingsManager?: SettingsManager;
  /** Current settings values */
  settings: Settings;
  /** Whether the editor is currently saving */
  isSaving: boolean;
  /** Whether auto-save is enabled (can be overridden from props) */
  autoSaveEnabled: boolean;
  /** Auto-save interval in seconds (can be overridden from props) */
  autoSaveInterval: number;
}

export const NodeEditorSettingsContext = React.createContext<NodeEditorSettingsContextValue | null>(null);

export type NodeEditorSettingsProviderProps = {
  settingsManager?: SettingsManager;
  settings: Settings;
  isSaving: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  children: React.ReactNode;
}

export const NodeEditorSettingsProvider: React.FC<NodeEditorSettingsProviderProps> = ({
  settingsManager,
  settings,
  isSaving,
  autoSaveEnabled,
  autoSaveInterval,
  children,
}) => {
  const value = React.useMemo<NodeEditorSettingsContextValue>(
    () => ({
      settingsManager,
      settings,
      isSaving,
      autoSaveEnabled,
      autoSaveInterval,
    }),
    [settingsManager, settings, isSaving, autoSaveEnabled, autoSaveInterval]
  );

  return (
    <NodeEditorSettingsContext.Provider value={value}>
      {children}
    </NodeEditorSettingsContext.Provider>
  );
};































export function useNodeEditorSettings(): NodeEditorSettingsContextValue {
  const context = React.useContext(NodeEditorSettingsContext);
  if (!context) {
    throw new Error("useNodeEditorSettings must be used within NodeEditorSettingsProvider");
  }
  return context;
}
