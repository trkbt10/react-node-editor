import * as React from "react";
import { useKeyboardShortcut, useRegisterShortcut } from "../contexts/KeyboardShortcutContext";
import { useNodeEditor } from "../contexts/node-editor";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import { useHistoryIntegration } from "./useHistoryIntegration";
import { useAutoLayout } from "./useAutoLayout";
import { filterDuplicableNodeIds } from "../utils/nodeTypeLimits";
import { getClipboard, setClipboard } from "../utils/clipboard";
import { useNodeDefinitionList } from "../contexts/NodeDefinitionContext";

/**
 * Hook that registers all standard node editor keyboard shortcuts
 */
export const useNodeEditorShortcuts = () => {
  const { state: nodeEditorState, dispatch: nodeEditorDispatch, actions: nodeEditorActions } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { performUndo, performRedo, canUndo, canRedo } = useHistoryIntegration();
  const { applyLayout } = useAutoLayout();
  const nodeDefinitions = useNodeDefinitionList();

  // Keep latest states/definitions in refs to avoid re-registering shortcuts
  const actionStateRef = React.useRef(actionState);
  const nodeEditorStateRef = React.useRef(nodeEditorState);
  const nodeDefinitionsRef = React.useRef(nodeDefinitions);
  React.useEffect(() => { actionStateRef.current = actionState; }, [actionState]);
  React.useEffect(() => { nodeEditorStateRef.current = nodeEditorState; }, [nodeEditorState]);
  React.useEffect(() => { nodeDefinitionsRef.current = nodeDefinitions; }, [nodeDefinitions]);

  // Delete selected nodes
  useRegisterShortcut(
    { key: "Delete" },
    React.useCallback(() => {
      console.log('Delete shortcut triggered');
      if (actionState.selectedNodeIds.length > 0) {
        actionState.selectedNodeIds.forEach(nodeId => {
          nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId));
        });
        actionDispatch(actionActions.clearSelection());
      } else if (actionState.selectedConnectionIds.length > 0) {
        actionState.selectedConnectionIds.forEach(connectionId => {
          nodeEditorDispatch(nodeEditorActions.deleteConnection(connectionId));
        });
        actionDispatch(actionActions.clearSelection());
      }
    }, [actionState.selectedNodeIds, actionState.selectedConnectionIds, nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );

  // Backspace also deletes
  useRegisterShortcut(
    { key: "Backspace" },
    React.useCallback(() => {
      console.log('Backspace shortcut triggered');
      if (actionState.selectedNodeIds.length > 0) {
        actionState.selectedNodeIds.forEach(nodeId => {
          nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId));
        });
        actionDispatch(actionActions.clearSelection());
      } else if (actionState.selectedConnectionIds.length > 0) {
        actionState.selectedConnectionIds.forEach(connectionId => {
          nodeEditorDispatch(nodeEditorActions.deleteConnection(connectionId));
        });
        actionDispatch(actionActions.clearSelection());
      }
    }, [actionState.selectedNodeIds, actionState.selectedConnectionIds, nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );

  // Select all nodes (Ctrl/Cmd+A)
  useRegisterShortcut(
    { key: "a", ctrl: true },
    React.useCallback(() => {
      console.log('Select All shortcut triggered');
      const allNodeIds = Object.keys(nodeEditorState.nodes);
      actionDispatch(actionActions.selectAllNodes(allNodeIds));
    }, [nodeEditorState.nodes, actionDispatch, actionActions])
  );
  useRegisterShortcut(
    { key: "a", meta: true },
    React.useCallback(() => {
      console.log('Select All (Cmd) shortcut triggered');
      const allNodeIds = Object.keys(nodeEditorState.nodes);
      actionDispatch(actionActions.selectAllNodes(allNodeIds));
    }, [nodeEditorState.nodes, actionDispatch, actionActions])
  );

  // Clear selection
  useRegisterShortcut(
    { key: "Escape" },
    React.useCallback(() => {
      console.log('Escape shortcut triggered');
      actionDispatch(actionActions.clearSelection());
    }, [actionDispatch, actionActions])
  );

  // Add new node
  useRegisterShortcut(
    { key: "n", ctrl: true },
    React.useCallback(() => {
      console.log('Add Node shortcut triggered');
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
    }, [nodeEditorDispatch, nodeEditorActions])
  );

  // Duplicate selected nodes (Ctrl/Cmd+D)
  useRegisterShortcut(
    { key: "d", ctrl: true },
    React.useCallback(() => {
      console.log('Duplicate shortcut triggered');
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
    }, [nodeEditorDispatch, nodeEditorActions])
  );

  // Lock selected nodes (Cmd+2 / Ctrl+2 on Windows if desired)
  useRegisterShortcut(
    { key: "2", meta: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {return;}
      selected.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.updateNode(nodeId, { locked: true })));
    }, [nodeEditorDispatch, nodeEditorActions])
  );

  // Unlock all nodes (Cmd+Shift+2)
  useRegisterShortcut(
    { key: "2", meta: true, shift: true },
    React.useCallback(() => {
      const allIds = Object.keys(nodeEditorStateRef.current.nodes);
      allIds.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.updateNode(nodeId, { locked: false })));
    }, [nodeEditorDispatch, nodeEditorActions])
  );
  useRegisterShortcut(
    { key: "d", meta: true },
    React.useCallback(() => {
      console.log('Duplicate (Cmd) shortcut triggered');
      const sel = actionStateRef.current.selectedNodeIds;
      const ned = nodeEditorStateRef.current;
      const defs = nodeDefinitionsRef.current;
      if (sel.length > 0) {
        const allowed = filterDuplicableNodeIds(sel, ned, defs);
        if (allowed.length > 0) {
          nodeEditorDispatch(nodeEditorActions.duplicateNodes(allowed));
        }
      }
    }, [nodeEditorDispatch, nodeEditorActions])
  );

  // Auto-select duplicated nodes when they are created
  React.useEffect(() => {
    if (nodeEditorState.lastDuplicatedNodeIds && nodeEditorState.lastDuplicatedNodeIds.length > 0) {
      actionDispatch(actionActions.selectAllNodes(nodeEditorState.lastDuplicatedNodeIds));
      
      // Clear the lastDuplicatedNodeIds to avoid re-selection
      nodeEditorDispatch(nodeEditorActions.setNodeData({
        ...nodeEditorState,
        lastDuplicatedNodeIds: undefined,
      }));
    }
  }, [nodeEditorState.lastDuplicatedNodeIds, actionDispatch, actionActions, nodeEditorDispatch, nodeEditorActions, nodeEditorState]);

  // Save (placeholder - will be implemented with API integration)
  useRegisterShortcut(
    { key: "s", ctrl: true },
    React.useCallback((e) => {
      console.log('Save shortcut triggered');
      // TODO: Implement save functionality
      console.log('Save not yet implemented');
    }, [])
  );

  // Auto layout with force-directed algorithm
  useRegisterShortcut(
    { key: "l", ctrl: true },
    React.useCallback(() => {
      console.log('Auto Layout shortcut triggered');
      const selectedOnly = actionState.selectedNodeIds.length > 0;
      applyLayout("force", selectedOnly);
    }, [actionState.selectedNodeIds, applyLayout])
  );

  // Undo (Ctrl/Cmd+Z)
  useRegisterShortcut(
    { key: "z", ctrl: true },
    React.useCallback(() => {
      console.log('Undo shortcut triggered');
      if (canUndo) {
        performUndo();
      }
    }, [canUndo, performUndo])
  );
  useRegisterShortcut(
    { key: "z", meta: true },
    React.useCallback(() => {
      console.log('Undo (Cmd) shortcut triggered');
      if (canUndo) {
        performUndo();
      }
    }, [canUndo, performUndo])
  );

  // Redo (Ctrl/Cmd+Shift+Z)
  useRegisterShortcut(
    { key: "z", ctrl: true, shift: true },
    React.useCallback(() => {
      console.log('Redo shortcut triggered');
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo])
  );
  useRegisterShortcut(
    { key: "z", meta: true, shift: true },
    React.useCallback(() => {
      console.log('Redo (Cmd+Shift+Z) shortcut triggered');
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo])
  );

  // Alternative Redo (Ctrl/Cmd+Y)
  useRegisterShortcut(
    { key: "y", ctrl: true },
    React.useCallback(() => {
      console.log('Redo (Ctrl+Y) shortcut triggered');
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo])
  );
  useRegisterShortcut(
    { key: "y", meta: true },
    React.useCallback(() => {
      console.log('Redo (Cmd+Y) shortcut triggered');
      if (canRedo) {
        performRedo();
      }
    }, [canRedo, performRedo])
  );

  // Clipboard for copy/cut/paste of nodes - use shared storage

  // Copy (Ctrl/Cmd+C)
  useRegisterShortcut(
    { key: "c", ctrl: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {return;}
      const nodes = selected
        .map((id) => nodeEditorStateRef.current.nodes[id])
        .filter(Boolean)
        .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
      const selSet = new Set(selected);
      const connections = Object.values(nodeEditorStateRef.current.connections).filter(
        (c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId)
      ).map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
      setClipboard({ nodes, connections });
      console.log('Copied nodes:', nodes.length, 'connections:', connections.length);
    }, [])
  );
  useRegisterShortcut(
    { key: "c", meta: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {return;}
      const nodes = selected
        .map((id) => nodeEditorStateRef.current.nodes[id])
        .filter(Boolean)
        .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
      const selSet = new Set(selected);
      const connections = Object.values(nodeEditorStateRef.current.connections).filter(
        (c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId)
      ).map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
      setClipboard({ nodes, connections });
      console.log('Copied (Cmd) nodes:', nodes.length, 'connections:', connections.length);
    }, [])
  );

  // Cut (Ctrl/Cmd+X)
  useRegisterShortcut(
    { key: "x", ctrl: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {return;}
      // Copy first
      const nodes = selected
        .map((id) => nodeEditorStateRef.current.nodes[id])
        .filter(Boolean)
        .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
      const selSet = new Set(selected);
      const connections = Object.values(nodeEditorStateRef.current.connections).filter(
        (c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId)
      ).map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
      setClipboard({ nodes, connections });

      // Delete nodes
      selected.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId)));
      actionDispatch(actionActions.clearSelection());
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );
  useRegisterShortcut(
    { key: "x", meta: true },
    React.useCallback(() => {
      const selected = actionStateRef.current.selectedNodeIds;
      if (selected.length === 0) {return;}
      const nodes = selected
        .map((id) => nodeEditorStateRef.current.nodes[id])
        .filter(Boolean)
        .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
      const selSet = new Set(selected);
      const connections = Object.values(nodeEditorStateRef.current.connections).filter(
        (c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId)
      ).map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
      setClipboard({ nodes, connections });
      selected.forEach((nodeId) => nodeEditorDispatch(nodeEditorActions.deleteNode(nodeId)));
      actionDispatch(actionActions.clearSelection());
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );

  // Paste (Ctrl/Cmd+V)
  useRegisterShortcut(
    { key: "v", ctrl: true },
    React.useCallback(() => {
      const clip = getClipboard();
      if (!clip || clip.nodes.length === 0) {return;}
      const idMap = new Map<string, string>();

      // Add nodes with new ids and slight offset
      clip.nodes.forEach((n) => {
        const newId = Math.random().toString(36).slice(2, 10);
        idMap.set(n.id, newId);
        const newNode = {
          id: newId,
          type: n.type,
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          size: n.size,
          data: { ...(n.data || {}), title: typeof n.data?.title === 'string' ? `${n.data.title} Copy` : n.data?.title },
        };
        nodeEditorDispatch(nodeEditorActions.addNodeWithId(newNode));
      });

      // Recreate internal connections among pasted nodes
      clip.connections.forEach((c) => {
        const fromId = idMap.get(c.fromNodeId);
        const toId = idMap.get(c.toNodeId);
        if (fromId && toId) {
          nodeEditorDispatch(
            nodeEditorActions.addConnection({
              fromNodeId: fromId,
              fromPortId: c.fromPortId,
              toNodeId: toId,
              toPortId: c.toPortId,
            })
          );
        }
      });

      // Select pasted nodes
      const newIds = Array.from(idMap.values());
      actionDispatch(actionActions.selectAllNodes(newIds));
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );
  useRegisterShortcut(
    { key: "v", meta: true },
    React.useCallback(() => {
      const clip = getClipboard();
      if (!clip || clip.nodes.length === 0) {return;}
      const idMap = new Map<string, string>();
      clip.nodes.forEach((n) => {
        const newId = Math.random().toString(36).slice(2, 10);
        idMap.set(n.id, newId);
        const newNode = {
          id: newId,
          type: n.type,
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          size: n.size,
          data: { ...(n.data || {}), title: typeof n.data?.title === 'string' ? `${n.data.title} Copy` : n.data?.title },
        };
        nodeEditorDispatch(nodeEditorActions.addNodeWithId(newNode));
      });
      clip.connections.forEach((c) => {
        const fromId = idMap.get(c.fromNodeId);
        const toId = idMap.get(c.toNodeId);
        if (fromId && toId) {
          nodeEditorDispatch(
            nodeEditorActions.addConnection({
              fromNodeId: fromId,
              fromPortId: c.fromPortId,
              toNodeId: toId,
              toPortId: c.toPortId,
            })
          );
        }
      });
      const newIds = Array.from(idMap.values());
      actionDispatch(actionActions.selectAllNodes(newIds));
    }, [nodeEditorDispatch, nodeEditorActions, actionDispatch, actionActions])
  );
};
