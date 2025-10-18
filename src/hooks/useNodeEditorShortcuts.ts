/**
 * @file Hook for registering all standard keyboard shortcuts for the node editor
 */
import * as React from "react";
import {
  useKeyboardShortcut,
  type KeyboardShortcut,
  type ShortcutHandler,
} from "../contexts/KeyboardShortcutContext";
import { useNodeEditor } from "../contexts/node-editor/context";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import { useHistoryIntegration } from "./useHistoryIntegration";
import { useAutoLayout } from "./useAutoLayout";
import { filterDuplicableNodeIds } from "../contexts/node-definitions/utils/nodeTypeLimits";
import { copyNodesToClipboard, pasteNodesFromClipboard } from "../contexts/node-editor/utils/nodeClipboardOperations";
import { useNodeDefinitionList } from "../contexts/node-definitions/hooks/useNodeDefinitionList";
import { generateId } from "../contexts/node-editor/reducer";
import type { NodeId } from "../types/core";

const DEFAULT_SHORTCUT_BINDING_MAP: Record<NodeEditorShortcutAction, ShortcutBinding[]> = (() => {
  const defaults = defaultInteractionSettings.keyboardShortcuts.actions;
  const map = {} as Record<NodeEditorShortcutAction, ShortcutBinding[]>;
  (Object.keys(defaults) as NodeEditorShortcutAction[]).forEach((action) => {
    const bindings = defaults[action]?.bindings ?? [];
    map[action] = bindings.map((binding) => ({ ...binding }));
  });
  return map;
})();

const expandBinding = (binding: ShortcutBinding): KeyboardShortcut[] => {
  if (binding.cmdOrCtrl) {
    const { cmdOrCtrl: _ignore, ...rest } = binding;
    return [
      { ...rest, ctrl: true, meta: false },
      { ...rest, ctrl: false, meta: true },
    ];
  }
  return [{ ...binding }];
};

const serializeBindings = (bindings: ShortcutBinding[]): string => {
  return bindings
    .map((binding) =>
      JSON.stringify({
        key: binding.key,
        ctrl: !!binding.ctrl,
        shift: !!binding.shift,
        alt: !!binding.alt,
        meta: !!binding.meta,
        cmdOrCtrl: !!binding.cmdOrCtrl,
      }),
    )
    .sort()
    .join("|");
};

const useConfigurableShortcut = (
  action: NodeEditorShortcutAction,
  defaultBindings: ShortcutBinding[],
  handler: ShortcutHandler,
): void => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcut();
  const { keyboardShortcuts } = useInteractionSettings();

  const actionConfig = keyboardShortcuts.actions[action];
  const enabled = keyboardShortcuts.enabled && (actionConfig?.enabled ?? true);
  const bindings =
    actionConfig?.bindings && actionConfig.bindings.length > 0 ? actionConfig.bindings : defaultBindings;
  const bindingSignature = React.useMemo(() => serializeBindings(bindings), [bindings]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const expanded = bindings.flatMap(expandBinding);
    if (expanded.length === 0) {
      return;
    }

    expanded.forEach((combo) => registerShortcut(combo, handler));
    return () => {
      expanded.forEach((combo) => unregisterShortcut(combo));
    };
  }, [registerShortcut, unregisterShortcut, handler, enabled, bindingSignature]);
};
import { useInteractionSettings, defaultInteractionSettings } from "../contexts/InteractionSettingsContext";
import type { NodeEditorShortcutAction, ShortcutBinding } from "../types/interaction";

/**
 * Hook that registers all standard node editor keyboard shortcuts
 */
export const useNodeEditorShortcuts = () => {
  const {
    state: nodeEditorState,
    actions: nodeEditorActions,
    handleSave,
  } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
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

  // Delete selected nodes (Delete/Backspace)
  useConfigurableShortcut(
    "delete-selection",
    DEFAULT_SHORTCUT_BINDING_MAP["delete-selection"],
    React.useCallback(() => {
      console.log("Delete shortcut triggered");
      if (actionState.selectedNodeIds.length > 0) {
        actionState.selectedNodeIds.forEach((nodeId) => {
          nodeEditorActions.deleteNode(nodeId);
        });
        actionActions.clearSelection();
      } else if (actionState.selectedConnectionIds.length > 0) {
        actionState.selectedConnectionIds.forEach((connectionId) => {
          nodeEditorActions.deleteConnection(connectionId);
        });
        actionActions.clearSelection();
      }
    }, [actionState.selectedNodeIds, actionState.selectedConnectionIds, nodeEditorActions, actionActions]),
  );

  // Select all nodes (Ctrl/Cmd+A)
  useConfigurableShortcut(
    "select-all",
    DEFAULT_SHORTCUT_BINDING_MAP["select-all"],
    React.useCallback(() => {
      console.log("Select All shortcut triggered");
      const allNodeIds = Object.keys(nodeEditorState.nodes);
      actionActions.setInteractionSelection(allNodeIds);
    }, [nodeEditorState.nodes, actionActions]),
  );

  // Clear selection
  useConfigurableShortcut(
    "clear-selection",
    DEFAULT_SHORTCUT_BINDING_MAP["clear-selection"],
    React.useCallback(() => {
      console.log("Escape shortcut triggered");
      actionActions.clearSelection();
    }, [actionActions]),
  );

  // Add new node
  useConfigurableShortcut(
    "add-node",
    DEFAULT_SHORTCUT_BINDING_MAP["add-node"],
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
      nodeEditorActions.addNode(newNode);
    }, [nodeEditorActions]),
  );

  // Duplicate selected nodes (Ctrl/Cmd+D)
  useConfigurableShortcut(
    "duplicate-selection",
    DEFAULT_SHORTCUT_BINDING_MAP["duplicate-selection"],
    React.useCallback(() => {
      console.log("Duplicate shortcut triggered");
      const sel = actionStateRef.current.selectedNodeIds;
      const ned = nodeEditorStateRef.current;
      const defs = nodeDefinitionsRef.current;
      if (sel.length > 0) {
        // Respect per-type limits by filtering duplicable ids
        const allowed = filterDuplicableNodeIds(sel, ned, defs);
        if (allowed.length > 0) {
          nodeEditorActions.duplicateNodes(allowed);
        }
      }
    }, [nodeEditorActions]),
  );

  // Group selected nodes (Ctrl/Cmd+G)
  useConfigurableShortcut(
    "group-selection",
    DEFAULT_SHORTCUT_BINDING_MAP["group-selection"],
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {
        return;
      }

      const editorState = nodeEditorStateRef.current;
      const nodesToGroup = selected.filter((nodeId) => Boolean(editorState.nodes[nodeId]));

      if (nodesToGroup.length === 0) {
        return;
      }

      const newGroupId = generateId();
      nodeEditorActions.groupNodes(nodesToGroup, newGroupId);

      const membershipUpdates = nodesToGroup.reduce<Record<NodeId, { parentId?: NodeId }>>((acc, nodeId) => {
        const node = editorState.nodes[nodeId];
        if (!node) {
          return acc;
        }
        acc[nodeId] = { parentId: newGroupId };
        return acc;
      }, {});

      if (Object.keys(membershipUpdates).length > 0) {
        nodeEditorActions.updateGroupMembership(membershipUpdates);
      }

      actionActions.setInteractionSelection([newGroupId]);
    }, [nodeEditorActions, actionActions]),
  );

  // Lock selected nodes (Cmd+2 / Ctrl+2)
  useConfigurableShortcut(
    "lock-selection",
    DEFAULT_SHORTCUT_BINDING_MAP["lock-selection"],
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {
        return;
      }
      selected.forEach((nodeId) => nodeEditorActions.updateNode(nodeId, { locked: true }));
    }, [nodeEditorActions]),
  );

  // Unlock all nodes (Cmd+Shift+2 / Ctrl+Shift+2)
  useConfigurableShortcut(
    "unlock-all",
    DEFAULT_SHORTCUT_BINDING_MAP["unlock-all"],
    React.useCallback(() => {
      const allIds = Object.keys(nodeEditorStateRef.current.nodes);
      allIds.forEach((nodeId) => nodeEditorActions.updateNode(nodeId, { locked: false }));
    }, [nodeEditorActions]),
  );

  // Auto-select duplicated nodes when they are created
  React.useEffect(() => {
    if (nodeEditorState.lastDuplicatedNodeIds && nodeEditorState.lastDuplicatedNodeIds.length > 0) {
      actionActions.setInteractionSelection(nodeEditorState.lastDuplicatedNodeIds);

      // Clear the lastDuplicatedNodeIds to avoid re-selection
      nodeEditorActions.setNodeData({
        ...nodeEditorState,
        lastDuplicatedNodeIds: undefined,
      });
    }
  }, [
    nodeEditorState.lastDuplicatedNodeIds,
    actionActions,
    nodeEditorActions,
    nodeEditorState,
  ]);

  // Save (Ctrl/Cmd+S)
  useConfigurableShortcut(
    "save",
    DEFAULT_SHORTCUT_BINDING_MAP.save,
    React.useCallback(() => {
      handleSave();
    }, [handleSave]),
  );

  // Auto layout with force-directed algorithm
  useConfigurableShortcut(
    "auto-layout",
    DEFAULT_SHORTCUT_BINDING_MAP["auto-layout"],
    React.useCallback(() => {
      console.log("Auto Layout shortcut triggered");
      const selectedOnly = actionState.selectedNodeIds.length > 0;
      applyLayout("force", selectedOnly);
    }, [actionState.selectedNodeIds, applyLayout]),
  );

  // Undo (Ctrl/Cmd+Z)
  useConfigurableShortcut(
    "undo",
    DEFAULT_SHORTCUT_BINDING_MAP.undo,
    React.useCallback(() => {
      console.log("Undo shortcut triggered");
      if (canUndo) {
        performUndo();
      }
    }, [canUndo, performUndo]),
  );

  // Redo (Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y)
  useConfigurableShortcut(
    "redo",
    DEFAULT_SHORTCUT_BINDING_MAP.redo,
    React.useCallback(() => {
      console.log("Redo shortcut triggered");
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo]),
  );

  // Clipboard for copy/cut/paste of nodes - use shared storage

  // Copy (Ctrl/Cmd+C)
  useConfigurableShortcut(
    "copy",
    DEFAULT_SHORTCUT_BINDING_MAP.copy,
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      const clipboardData = copyNodesToClipboard(selected, nodeEditorStateRef.current);
      if (clipboardData) {
        console.log("Copied nodes:", clipboardData.nodes.length, "connections:", clipboardData.connections.length);
      }
    }, []),
  );

  // Cut (Ctrl/Cmd+X)
  useConfigurableShortcut(
    "cut",
    DEFAULT_SHORTCUT_BINDING_MAP.cut,
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {
        return;
      }

      // Copy first
      copyNodesToClipboard(selected, nodeEditorStateRef.current);

      // Delete nodes
      selected.forEach((nodeId) => nodeEditorActions.deleteNode(nodeId));
      actionActions.clearSelection();
    }, [nodeEditorActions, actionActions]),
  );

  // Paste (Ctrl/Cmd+V)
  useConfigurableShortcut(
    "paste",
    DEFAULT_SHORTCUT_BINDING_MAP.paste,
    React.useCallback(() => {
      const result = pasteNodesFromClipboard();
      if (!result) {
        return;
      }

      // Add nodes
      result.nodes.forEach((node) => {
        nodeEditorActions.addNodeWithId(node);
      });

      // Add connections
      result.connections.forEach((conn) => {
        nodeEditorActions.addConnection(conn);
      });

      // Select pasted nodes
      const newIds = Array.from(result.idMap.values());
      actionActions.setInteractionSelection(newIds);
    }, [nodeEditorActions, actionActions]),
  );
};
