import * as React from "react";
import { useEditorActionState } from "../contexts/EditorActionStateContext";

/**
 * Hook that provides pre-bound action creators for the Editor Action State
 * No need to call dispatch manually - actions are automatically dispatched
 */
export function useActionStateActions() {
  const { dispatch, actions } = useEditorActionState();

  return React.useMemo(() => ({
    selectNode: (nodeId: Parameters<typeof actions.selectNode>[0], multiple?: Parameters<typeof actions.selectNode>[1]) => dispatch(actions.selectNode(nodeId, multiple)),
    selectConnection: (connectionId: Parameters<typeof actions.selectConnection>[0], multiple?: Parameters<typeof actions.selectConnection>[1]) => dispatch(actions.selectConnection(connectionId, multiple)),
    clearSelection: () => dispatch(actions.clearSelection()),
    selectAllNodes: (nodeIds: Parameters<typeof actions.selectAllNodes>[0]) => dispatch(actions.selectAllNodes(nodeIds)),
    setSelectionBox: (box: Parameters<typeof actions.setSelectionBox>[0]) => dispatch(actions.setSelectionBox(box)),
    startNodeDrag: (nodeIds: Parameters<typeof actions.startNodeDrag>[0], startPosition: Parameters<typeof actions.startNodeDrag>[1], initialPositions: Parameters<typeof actions.startNodeDrag>[2], affectedChildNodes: Parameters<typeof actions.startNodeDrag>[3]) => dispatch(actions.startNodeDrag(nodeIds, startPosition, initialPositions, affectedChildNodes)),
    updateNodeDrag: (offset: Parameters<typeof actions.updateNodeDrag>[0]) => dispatch(actions.updateNodeDrag(offset)),
    endNodeDrag: () => dispatch(actions.endNodeDrag()),
    setHoveredNode: (nodeId: Parameters<typeof actions.setHoveredNode>[0]) => dispatch(actions.setHoveredNode(nodeId)),
    setHoveredConnection: (connectionId: Parameters<typeof actions.setHoveredConnection>[0]) => dispatch(actions.setHoveredConnection(connectionId)),
    startConnectionDrag: (fromPort: Parameters<typeof actions.startConnectionDrag>[0]) => dispatch(actions.startConnectionDrag(fromPort)),
    updateConnectionDrag: (toPosition: Parameters<typeof actions.updateConnectionDrag>[0], candidatePort: Parameters<typeof actions.updateConnectionDrag>[1]) => dispatch(actions.updateConnectionDrag(toPosition, candidatePort)),
    endConnectionDrag: () => dispatch(actions.endConnectionDrag()),
    setHoveredPort: (port: Parameters<typeof actions.setHoveredPort>[0]) => dispatch(actions.setHoveredPort(port)),
    updateConnectedPorts: (connectedPorts: Parameters<typeof actions.updateConnectedPorts>[0]) => dispatch(actions.updateConnectedPorts(connectedPorts)),
    startConnectionDisconnect: (originalConnection: Parameters<typeof actions.startConnectionDisconnect>[0], disconnectedEnd: Parameters<typeof actions.startConnectionDisconnect>[1], fixedPort: Parameters<typeof actions.startConnectionDisconnect>[2], draggingPosition: Parameters<typeof actions.startConnectionDisconnect>[3]) => dispatch(actions.startConnectionDisconnect(originalConnection, disconnectedEnd, fixedPort, draggingPosition)),
    updateConnectionDisconnect: (draggingPosition: Parameters<typeof actions.updateConnectionDisconnect>[0], candidatePort: Parameters<typeof actions.updateConnectionDisconnect>[1]) => dispatch(actions.updateConnectionDisconnect(draggingPosition, candidatePort)),
    endConnectionDisconnect: () => dispatch(actions.endConnectionDisconnect()),
    startNodeResize: (nodeId: Parameters<typeof actions.startNodeResize>[0], startPosition: Parameters<typeof actions.startNodeResize>[1], startSize: Parameters<typeof actions.startNodeResize>[2], handle: Parameters<typeof actions.startNodeResize>[3]) => dispatch(actions.startNodeResize(nodeId, startPosition, startSize, handle)),
    updateNodeResize: (currentSize: Parameters<typeof actions.updateNodeResize>[0]) => dispatch(actions.updateNodeResize(currentSize)),
    endNodeResize: () => dispatch(actions.endNodeResize()),
    showContextMenu: (position: Parameters<typeof actions.showContextMenu>[0], nodeId?: Parameters<typeof actions.showContextMenu>[1], canvasPosition?: Parameters<typeof actions.showContextMenu>[2]) => dispatch(actions.showContextMenu(position, nodeId, canvasPosition)),
    hideContextMenu: () => dispatch(actions.hideContextMenu()),
  }), [dispatch, actions]);
}

/**
 * Hook that provides both state and pre-bound actions for the Editor Action State
 * Convenient alternative to useEditorActionState when you need both state and actions
 */
export function useActionState() {
  const { state } = useEditorActionState();
  const actions = useActionStateActions();

  return { state, actions };
}