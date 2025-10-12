import * as React from "react";
import type { Node, NodeEditorData, NodeId, Port, Position, GridSettings } from "../../types/core";
import type { nodeEditorActions as actions, NodeEditorAction } from "./actions";
import type { Settings } from "../../hooks/useSettings";
import type { SettingsManager } from "../../settings/SettingsManager";
import type { NodeDefinition } from "../../types/NodeDefinition";

export type NodeEditorUtils = {
  /**
   * Snap a position to grid based on grid settings
   */
  snapToGrid: (position: Position, gridSettings: GridSettings) => Position;
  /**
   * Find which group (if any) a node should belong to
   */
  findContainingGroup: (node: Node, allNodes: Record<NodeId, Node>, nodeDefinitions: NodeDefinition[]) => NodeId | null;
  /**
   * Get all child nodes of a group
   */
  getGroupChildren: (groupId: NodeId, allNodes: Record<NodeId, Node>) => Node[];
  /**
   * Check if a node is inside a group's bounds
   */
  isNodeInsideGroup: (node: Node, groupNode: Node, nodeDefinitions: NodeDefinition[]) => boolean;
};

export type NodeEditorContextValue = {
  state: NodeEditorData;
  dispatch: React.Dispatch<NodeEditorAction>;
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
  /**
   * Utility functions for common node editor operations
   * These should be used instead of directly importing from utils
   */
  utils: NodeEditorUtils;
}

export const NodeEditorContext = React.createContext<NodeEditorContextValue | null>(null);

export const useNodeEditor = (): NodeEditorContextValue => {
  const context = React.useContext(NodeEditorContext);
  if (!context) {throw new Error("useNodeEditor must be used within a NodeEditorProvider");}
  return context;
};

export type { NodeEditorData };
