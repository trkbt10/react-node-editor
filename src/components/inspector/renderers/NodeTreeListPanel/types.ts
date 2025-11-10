/**
 * @file Shared types for NodeTreeListPanel components
 */
import type { Node, NodeId } from "../../../../types/core";

export type DragState = {
  draggingNodeId: NodeId | null;
  dragOverNodeId: NodeId | null;
  dragOverPosition: "before" | "inside" | "after" | null;
};

export type NodeTreeItemProps = {
  node: Node;
  level: number;
  isSelected: boolean;
  onSelect: (nodeId: NodeId, multiSelect: boolean) => void;
  onToggleVisibility?: (nodeId: NodeId) => void;
  onToggleLock?: (nodeId: NodeId) => void;
  onToggleExpand?: (nodeId: NodeId) => void;
  onDeleteNode?: (nodeId: NodeId) => void;
  onUpdateTitle?: (nodeId: NodeId, title: string) => void;
  childNodes: Node[];
  dragState: DragState;
  onNodeDrop: (draggedNodeId: NodeId, targetNodeId: NodeId, position: "before" | "inside" | "after") => void;
  onDragStateChange: (state: Partial<DragState>) => void;
};

export type ConnectedNodeTreeItemProps = {
  nodeId: NodeId;
  level: number;
  dragState: DragState;
  onNodeDrop: (draggedNodeId: NodeId, targetNodeId: NodeId, position: "before" | "inside" | "after") => void;
  onDragStateChange: (state: Partial<DragState>) => void;
};
