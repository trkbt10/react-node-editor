import * as React from "react";
import { useNodeEditor } from "../contexts/node-editor";

/**
 * Hook that provides pre-bound action creators for the NodeEditor
 * No need to call dispatch manually - actions are automatically dispatched
 */
export function useNodeEditorActions() {
  const { dispatch, actions } = useNodeEditor();

  return React.useMemo(() => ({
    addNode: (node: Parameters<typeof actions.addNode>[0]) => dispatch(actions.addNode(node)),
    addNodeWithId: (node: Parameters<typeof actions.addNodeWithId>[0]) => dispatch(actions.addNodeWithId(node)),
    updateNode: (nodeId: Parameters<typeof actions.updateNode>[0], updates: Parameters<typeof actions.updateNode>[1]) => dispatch(actions.updateNode(nodeId, updates)),
    deleteNode: (nodeId: Parameters<typeof actions.deleteNode>[0]) => dispatch(actions.deleteNode(nodeId)),
    moveNode: (nodeId: Parameters<typeof actions.moveNode>[0], position: Parameters<typeof actions.moveNode>[1]) => dispatch(actions.moveNode(nodeId, position)),
    moveNodes: (updates: Parameters<typeof actions.moveNodes>[0]) => dispatch(actions.moveNodes(updates)),
    addConnection: (connection: Parameters<typeof actions.addConnection>[0]) => dispatch(actions.addConnection(connection)),
    deleteConnection: (connectionId: Parameters<typeof actions.deleteConnection>[0]) => dispatch(actions.deleteConnection(connectionId)),
    setNodeData: (data: Parameters<typeof actions.setNodeData>[0]) => dispatch(actions.setNodeData(data)),
    restoreState: (data: Parameters<typeof actions.restoreState>[0]) => dispatch(actions.restoreState(data)),
    duplicateNodes: (nodeIds: Parameters<typeof actions.duplicateNodes>[0]) => dispatch(actions.duplicateNodes(nodeIds)),
    groupNodes: (nodeIds: Parameters<typeof actions.groupNodes>[0], groupId?: Parameters<typeof actions.groupNodes>[1]) => dispatch(actions.groupNodes(nodeIds, groupId)),
    ungroupNode: (groupId: Parameters<typeof actions.ungroupNode>[0]) => dispatch(actions.ungroupNode(groupId)),
    updateGroupMembership: (updates: Parameters<typeof actions.updateGroupMembership>[0]) => dispatch(actions.updateGroupMembership(updates)),
    moveGroupWithChildren: (groupId: Parameters<typeof actions.moveGroupWithChildren>[0], delta: Parameters<typeof actions.moveGroupWithChildren>[1]) => dispatch(actions.moveGroupWithChildren(groupId, delta)),
    autoLayout: (layoutType: Parameters<typeof actions.autoLayout>[0], selectedOnly?: Parameters<typeof actions.autoLayout>[1]) => dispatch(actions.autoLayout(layoutType, selectedOnly)),
  }), [dispatch, actions]);
}

/**
 * Hook that provides both state and pre-bound actions for the NodeEditor
 * Convenient alternative to useNodeEditor when you need both state and actions
 */
export function useNodeEditorState() {
  const { state } = useNodeEditor();
  const actions = useNodeEditorActions();

  return { state, actions };
}
