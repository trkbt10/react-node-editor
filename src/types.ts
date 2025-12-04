/**
 * @file Main type export module - re-exports core types and context-specific types
 */
// Re-export core types
export type {
  NodeId,
  ConnectionId,
  PortId,
  Position,
  Size,
  Port,
  Node,
  Connection,
  NodeEditorData,
  Viewport,
  GridSettings,
} from "./types/core";

// Re-export context-specific types
export type { NodeEditorAction } from "./contexts/composed/node-editor/actions";

export type { PanState, NodeCanvasState, NodeCanvasAction } from "./contexts/composed/canvas/viewport/context";
export type { nodeCanvasReducer } from "./contexts/composed/canvas/viewport/provider";

// Import types to use in local definitions
import type { NodeEditorData, Node, NodeId } from "./types/core";

// Alias for compatibility
export type NodeEditorState = NodeEditorData;

// Specific node types used in components
export type StandardNode = Node & {
  type: Exclude<string, "group">;
};

export type GroupNode = Node & {
  type: "group";
  children: NodeId[];
  expanded: boolean;
};
