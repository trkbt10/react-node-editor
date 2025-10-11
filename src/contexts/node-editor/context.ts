import * as React from "react";
import type { Node, NodeEditorData, NodeId, Port } from "../../types/core";
import type { nodeEditorActions as actions } from "./actions";
import type { Settings } from "../../hooks/useSettings";
import type { SettingsManager } from "../../settings/SettingsManager";

export type NodeEditorContextValue = {
  state: NodeEditorData;
  dispatch: React.Dispatch<ReturnType<typeof import('./actions')['nodeEditorActions']['addNode']>> | React.Dispatch<any>;
  actions: typeof actions;
  isLoading: boolean;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  /**
   * Returns ordered ports for a node, suitable for UI rendering.
   * Preserves definition order and applies node-specific overrides.
   * Note: For random access by (nodeId, portId) in hot paths, prefer `portLookupMap`.
   */
  getNodePorts: (nodeId: NodeId) => Port[];
  /**
   * O(1) lookup map for ports. Key format: "nodeId:portId".
   * Recomputed when nodes/definitions change. Do not mutate.
   * Use this for frequent single-port lookups (connections, hit tests, drags).
   */
  portLookupMap: Map<string, { node: Node; port: Port }>;
  settings: Settings;
  settingsManager?: SettingsManager;
  updateSetting: (key: string, value: unknown) => void;
}

export const NodeEditorContext = React.createContext<NodeEditorContextValue | null>(null);

export const useNodeEditor = (): NodeEditorContextValue => {
  const context = React.useContext(NodeEditorContext);
  if (!context) {throw new Error("useNodeEditor must be used within a NodeEditorProvider");}
  return context;
};

export type { NodeEditorData };
