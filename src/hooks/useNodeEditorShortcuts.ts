/**
 * @file Hook for registering all standard keyboard shortcuts for the node editor
 */
import * as React from "react";
import { useRegisterShortcut } from "../contexts/KeyboardShortcutContext";
import { useNodeEditor } from "../contexts/node-editor/context";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import { useHistoryIntegration } from "./useHistoryIntegration";
import { useAutoLayout } from "./useAutoLayout";
import { filterDuplicableNodeIds } from "../contexts/node-definitions/utils/nodeTypeLimits";
import { copyNodesToClipboard, pasteNodesFromClipboard } from "../contexts/node-editor/utils/nodeClipboardOperations";
import { useNodeDefinitionList } from "../contexts/node-definitions/hooks/useNodeDefinitionList";

/**
 * Hook that registers all standard node editor keyboard shortcuts
 */
export const useNodeEditorShortcuts = () => {
  const {
    state: nodeEditorState,
    dispatch: nodeEditorDispatch,
    actions: nodeEditorActions,
    handleSave,
  } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { performUndo, performRedo, canUndo, canRedo } = useHistoryIntegration();
  const { applyLayout } = useAutoLayout();
  const nodeDefinitions = useNodeDefinitionList();

  // Keep latest states/definitions in refs to avoid re-registering shortcuts
  const actionStateRef = React.useRef(actionState);
  const nodeEditorStateRef = React.useRef(nodeEditorState);
  const nodeDefinitionsRef = React.useRef(nodeDefinitions);
  React.useEffect(() => {
    actionStateRef.current = actionState;
  }, [actionState]);
  React.useEffect(() => {
    nodeEditorStateRef.current = nodeEditorState;
  }, [nodeEditorState]);
  React.useEffect(() => {
    nodeDefinitionsRef.current = nodeDefinitions;
  }, [nodeDefinitions]);

  // Delete selected nodes
  useRegisterShortcut(
    { key: "Delete" },
    React.useCallback(() => {
      console.log("Delete shortcut triggered");
      if (actionState.selectedNodeIds.length > 0) {
        actionState.selectedNodeIds.forEach((nodeId) => {
          nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId));
        });
        actionDispatch(actionActions.clearSelection());
      } else if (actionState.selectedConnectionIds.length > 0) {
        actionState.selectedConnectionIds.forEach((connectionId) => {
          nodeEditorDispatch(nodeEditorActions.deleteConnection(connectionId));
        });
        actionDispatch(actionActions.clearSelection());
      }
    }, [
      actionState.selectedNodeIds,
      actionState.selectedConnectionIds,
      nodeEditorDispatch,
      nodeEditorActions,
      actionDispatch,
      actionActions,
    ]),
  );

  // Backspace also deletes
  useRegisterShortcut(
    { key: "Backspace" },
    React.useCallback(() => {
      console.log("Backspace shortcut triggered");
      if (actionState.selectedNodeIds.length > 0) {
        actionState.selectedNodeIds.forEach((nodeId) => {
          nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId));
        });
        actionDispatch(actionActions.clearSelection());
      } else if (actionState.selectedConnectionIds.length > 0) {
        actionState.selectedConnectionIds.forEach((connectionId) => {
          nodeEditorDispatch(nodeEditorActions.deleteConnection(connectionId));
        });
        actionDispatch(actionActions.clearSelection());
      }
    }, [
      actionState.selectedNodeIds,
      actionState.selectedConnectionIds,
      nodeEditorDispatch,
      nodeEditorActions,
      actionDispatch,
      actionActions,
    ]),
  );

  // Select all nodes (Ctrl/Cmd+A)
  useRegisterShortcut(
    { key: "a", cmdOrCtrl: true },
    React.useCallback(() => {
      console.log("Select All shortcut triggered");
      const allNodeIds = Object.keys(nodeEditorState.nodes);
      actionDispatch(actionActions.selectAllNodes(allNodeIds));
    }, [nodeEditorState.nodes, actionDispatch, actionActions]),
  );

  // Clear selection
  useRegisterShortcut(
    { key: "Escape" },
    React.useCallback(() => {
      console.log("Escape shortcut triggered");
      actionDispatch(actionActions.clearSelection());
    }, [actionDispatch, actionActions]),
  );

  // Add new node
  useRegisterShortcut(
    { key: "n", ctrl: true },
    React.useCallback(() => {
      console.log("Add Node shortcut triggered");
      const nodeId = `node-${Date.now()}`;
      const newNode = {
        title: "New Node",
        type: "default" as const,
        position: { x: 100, y: 100 },
        data: { title: "" },
        ports: [
          {
            id: `port-input-${Date.now()}`,
            type: "input" as const,
            label: "Input",
            position: "left" as const,
            nodeId,
          },
          {
            id: `port-output-${Date.now()}`,
            type: "output" as const,
            label: "Output",
            position: "right" as const,
            nodeId,
          },
        ],
      };
      nodeEditorDispatch(nodeEditorActions.addNode(newNode));
    }, [nodeEditorDispatch, nodeEditorActions]),
  );

  // Duplicate selected nodes (Ctrl/Cmd+D)
  useRegisterShortcut(
    { key: "d", cmdOrCtrl: true },
    React.useCallback(() => {
      console.log("Duplicate shortcut triggered");
      const sel = actionStateRef.current.selectedNodeIds;
      const ned = nodeEditorStateRef.current;
      const defs = nodeDefinitionsRef.current;
      if (sel.length > 0) {
        // Respect per-type limits by filtering duplicable ids
        const allowed = filterDuplicableNodeIds(sel, ned, defs);
        if (allowed.length > 0) {
          nodeEditorDispatch(nodeEditorActions.duplicateNodes(allowed));
        }
      }
    }, [nodeEditorDispatch, nodeEditorActions]),
  );

  // Lock selected nodes (Cmd+2 / Ctrl+2)
  useRegisterShortcut(
    { key: "2", cmdOrCtrl: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {
        return;
      }
      selected.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.updateNode(nodeId, { locked: true })));
    }, [nodeEditorDispatch, nodeEditorActions]),
  );

  // Unlock all nodes (Cmd+Shift+2 / Ctrl+Shift+2)
  useRegisterShortcut(
    { key: "2", cmdOrCtrl: true, shift: true },
    React.useCallback(() => {
      const allIds = Object.keys(nodeEditorStateRef.current.nodes);
      allIds.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.updateNode(nodeId, { locked: false })));
    }, [nodeEditorDispatch, nodeEditorActions]),
  );

  // Auto-select duplicated nodes when they are created
  React.useEffect(() => {
    if (nodeEditorState.lastDuplicatedNodeIds && nodeEditorState.lastDuplicatedNodeIds.length > 0) {
      actionDispatch(actionActions.selectAllNodes(nodeEditorState.lastDuplicatedNodeIds));

      // Clear the lastDuplicatedNodeIds to avoid re-selection
      nodeEditorDispatch(
        nodeEditorActions.setNodeData({
          ...nodeEditorState,
          lastDuplicatedNodeIds: undefined,
        }),
      );
    }
  }, [
    nodeEditorState.lastDuplicatedNodeIds,
    actionDispatch,
    actionActions,
    nodeEditorDispatch,
    nodeEditorActions,
    nodeEditorState,
  ]);

  // Save (Ctrl/Cmd+S)
  useRegisterShortcut(
    { key: "s", cmdOrCtrl: true },
    React.useCallback(() => {
      handleSave();
    }, [handleSave]),
  );

  // Auto layout with force-directed algorithm
  useRegisterShortcut(
    { key: "l", ctrl: true },
    React.useCallback(() => {
      console.log("Auto Layout shortcut triggered");
      const selectedOnly = actionState.selectedNodeIds.length > 0;
      applyLayout("force", selectedOnly);
    }, [actionState.selectedNodeIds, applyLayout]),
  );

  // Undo (Ctrl/Cmd+Z)
  useRegisterShortcut(
    { key: "z", cmdOrCtrl: true },
    React.useCallback(() => {
      console.log("Undo shortcut triggered");
      if (canUndo) {
        performUndo();
      }
    }, [canUndo, performUndo]),
  );

  // Redo (Ctrl/Cmd+Shift+Z)
  useRegisterShortcut(
    { key: "z", cmdOrCtrl: true, shift: true },
    React.useCallback(() => {
      console.log("Redo shortcut triggered");
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo]),
  );

  // Alternative Redo (Ctrl/Cmd+Y)
  useRegisterShortcut(
    { key: "y", cmdOrCtrl: true },
    React.useCallback(() => {
      console.log("Redo (Y) shortcut triggered");
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo]),
  );

  // Clipboard for copy/cut/paste of nodes - use shared storage

  // Copy (Ctrl/Cmd+C)
  useRegisterShortcut(
    { key: "c", cmdOrCtrl: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      const clipboardData = copyNodesToClipboard(selected, nodeEditorStateRef.current);
      if (clipboardData) {
        console.log("Copied nodes:", clipboardData.nodes.length, "connections:", clipboardData.connections.length);
      }
    }, []),
  );

  // Cut (Ctrl/Cmd+X)
  useRegisterShortcut(
    { key: "x", cmdOrCtrl: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {
        return;
      }

      // Copy first
      copyNodesToClipboard(selected, nodeEditorStateRef.current);

      // Delete nodes
      selected.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId)));
      actionDispatch(actionActions.clearSelection());
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions]),
  );

  // Paste (Ctrl/Cmd+V)
  useRegisterShortcut(
    { key: "v", cmdOrCtrl: true },
    React.useCallback(() => {
      const result = pasteNodesFromClipboard();
      if (!result) {
        return;
      }

      // Add nodes
      result.nodes.forEach((node) => {
        nodeEditorDispatch(nodeEditorActions.addNodeWithId(node));
      });

      // Add connections
      result.connections.forEach((conn) => {
        nodeEditorDispatch(nodeEditorActions.addConnection(conn));
      });

      // Select pasted nodes
      const newIds = Array.from(result.idMap.values());
      actionDispatch(actionActions.selectAllNodes(newIds));
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions]),
  );
};
