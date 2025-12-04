/**
 * @file Context for centralized node operations (copy, paste, duplicate, delete, cut)
 * Provides selection-aware operations that work with both single nodes and multi-selection
 */
import * as React from "react";
import { useEditorActionState } from "./EditorActionStateContext";
import { useNodeEditor, useNodeEditorActions } from "./node-editor/context";
import { useNodeDefinitionList } from "../node-definitions/hooks/useNodeDefinitionList";
import { canAddNodeType, countNodesByType } from "../node-definitions/utils/nodeTypeLimits";
import {
  copyNodesToClipboard,
  pasteNodesFromClipboard,
} from "./node-editor/utils/nodeClipboardOperations";

export type NodeOperations = {
  /**
   * Duplicate nodes. If targetNodeId is in selection, duplicates all selected nodes.
   * Otherwise duplicates only the target node.
   */
  duplicateNodes: (targetNodeId?: string) => void;
  /**
   * Delete nodes. If targetNodeId is in selection, deletes all selected nodes.
   * Otherwise deletes only the target node.
   */
  deleteNodes: (targetNodeId?: string) => void;
  /**
   * Copy nodes to clipboard. If targetNodeId is in selection, copies all selected nodes.
   * Otherwise copies only the target node.
   */
  copyNodes: (targetNodeId?: string) => void;
  /**
   * Cut nodes (copy then delete). If targetNodeId is in selection, cuts all selected nodes.
   * Otherwise cuts only the target node.
   */
  cutNodes: (targetNodeId?: string) => void;
  /**
   * Paste nodes from clipboard and select them.
   */
  pasteNodes: () => void;
};

const NodeOperationsContext = React.createContext<NodeOperations | null>(null);
NodeOperationsContext.displayName = "NodeOperationsContext";

/**
 * Resolve target node IDs based on selection state.
 * If targetNodeId is provided and is in the current selection, returns all selected nodes.
 * Otherwise returns only the target node (or empty array if no target).
 */
function resolveTargetNodeIds(
  targetNodeId: string | undefined,
  selectedNodeIds: string[],
): string[] {
  if (!targetNodeId) {
    return selectedNodeIds.length > 0 ? selectedNodeIds : [];
  }
  const isInSelection = selectedNodeIds.includes(targetNodeId);
  if (isInSelection && selectedNodeIds.length > 0) {
    return selectedNodeIds;
  }
  return [targetNodeId];
}

export type NodeOperationsProviderProps = {
  children: React.ReactNode;
};

export const NodeOperationsProvider: React.FC<NodeOperationsProviderProps> = ({ children }) => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const editorActions = useNodeEditorActions();
  const nodeDefinitions = useNodeDefinitionList();

  const duplicateNodes = React.useCallback(
    (targetNodeId?: string) => {
      const nodeIds = resolveTargetNodeIds(targetNodeId, actionState.selectedNodeIds);
      if (nodeIds.length === 0) {
        return;
      }
      // Check if all nodes can be duplicated
      const counts = countNodesByType(editorState);
      const canDuplicateAll = nodeIds.every((nodeId) => {
        const node = editorState.nodes[nodeId];
        if (!node) {
          return false;
        }
        return canAddNodeType(node.type, nodeDefinitions, counts);
      });
      if (!canDuplicateAll) {
        return;
      }
      editorActions.duplicateNodes(nodeIds);
    },
    [actionState.selectedNodeIds, editorActions, editorState, nodeDefinitions],
  );

  const deleteNodes = React.useCallback(
    (targetNodeId?: string) => {
      const nodeIds = resolveTargetNodeIds(targetNodeId, actionState.selectedNodeIds);
      if (nodeIds.length === 0) {
        return;
      }
      nodeIds.forEach((nodeId) => editorActions.deleteNode(nodeId));
      actionActions.clearSelection();
    },
    [actionState.selectedNodeIds, editorActions, actionActions],
  );

  const copyNodes = React.useCallback(
    (targetNodeId?: string) => {
      const nodeIds = resolveTargetNodeIds(targetNodeId, actionState.selectedNodeIds);
      if (nodeIds.length === 0) {
        return;
      }
      copyNodesToClipboard(nodeIds, editorState);
    },
    [actionState.selectedNodeIds, editorState],
  );

  const cutNodes = React.useCallback(
    (targetNodeId?: string) => {
      const nodeIds = resolveTargetNodeIds(targetNodeId, actionState.selectedNodeIds);
      if (nodeIds.length === 0) {
        return;
      }
      copyNodesToClipboard(nodeIds, editorState);
      nodeIds.forEach((nodeId) => editorActions.deleteNode(nodeId));
      actionActions.clearSelection();
    },
    [actionState.selectedNodeIds, editorActions, editorState, actionActions],
  );

  const pasteNodes = React.useCallback(() => {
    const result = pasteNodesFromClipboard();
    if (!result) {
      return;
    }
    // Add nodes
    result.nodes.forEach((node) => {
      editorActions.addNodeWithId(node);
    });
    // Add connections
    result.connections.forEach((conn) => {
      editorActions.addConnection(conn);
    });
    // Select pasted nodes
    const newIds = Array.from(result.idMap.values());
    actionActions.setInteractionSelection(newIds);
    actionActions.setEditingSelection(newIds);
  }, [editorActions, actionActions]);

  const operations = React.useMemo<NodeOperations>(
    () => ({
      duplicateNodes,
      deleteNodes,
      copyNodes,
      cutNodes,
      pasteNodes,
    }),
    [duplicateNodes, deleteNodes, copyNodes, cutNodes, pasteNodes],
  );

  return (
    <NodeOperationsContext.Provider value={operations}>
      {children}
    </NodeOperationsContext.Provider>
  );
};

export const useNodeOperations = (): NodeOperations => {
  const context = React.useContext(NodeOperationsContext);
  if (!context) {
    throw new Error("useNodeOperations must be used within a NodeOperationsProvider");
  }
  return context;
};
