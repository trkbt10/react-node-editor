/**
 * @file Hook for handling connection drag and disconnect interactions.
 */
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { getConnectableNodeTypes } from "../../../contexts/node-ports/utils/portConnectability";
import { usePointerInteraction } from "../../../hooks/usePointerInteraction";
import { useConnectionPortResolvers } from "./useConnectionPortResolvers";
import { useConnectionOperations } from "./useConnectionOperations";

export const useNodeLayerConnections = () => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState } = useNodeEditor();
  const { state: canvasState, utils } = useNodeCanvas();
  const { registry } = useNodeDefinitions();
  const { resolveCandidatePort, resolveDisconnectCandidate } = useConnectionPortResolvers();
  const { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect } =
    useConnectionOperations();

  usePointerInteraction({
    interactionState: actionState.connectionDragState,
    viewport: canvasState.viewport,
    screenToCanvas: utils.screenToCanvas,
    onPointerMove: (canvasPosition) => {
      const candidate = resolveCandidatePort(canvasPosition);
      actionActions.updateConnectionDrag(canvasPosition, candidate);
    },
    onPointerUp: () => {
      const drag = actionState.connectionDragState;
      if (!drag) {
        endConnectionDrag();
        return;
      }
      const { fromPort, candidatePort, toPosition } = drag;
      if (candidatePort && fromPort.id !== candidatePort.id && completeConnectionDrag(candidatePort)) {
        endConnectionDrag();
        return;
      }

      if (!candidatePort || fromPort.id === candidatePort.id) {
        const screen = utils.canvasToScreen(toPosition.x, toPosition.y);
        const allowed = getConnectableNodeTypes({
          fromPort,
          nodes: nodeEditorState.nodes,
          connections: nodeEditorState.connections,
          getNodeDefinition: (type: string) => registry.get(type),
          getAllNodeDefinitions: () => registry.getAll(),
        });
        actionActions.showContextMenu({
          position: { x: screen.x, y: screen.y },
          canvasPosition: { x: toPosition.x, y: toPosition.y },
          mode: "search",
          allowedNodeTypes: allowed,
          fromPort,
        });
      }
      endConnectionDrag();
    },
  });

  usePointerInteraction({
    interactionState: actionState.connectionDisconnectState,
    viewport: canvasState.viewport,
    screenToCanvas: utils.screenToCanvas,
    onPointerMove: (canvasPosition) => {
      const candidate = resolveDisconnectCandidate(canvasPosition);
      actionActions.updateConnectionDisconnect(canvasPosition, candidate);
    },
    onPointerUp: () => {
      const disconnectState = actionState.connectionDisconnectState;
      if (disconnectState?.candidatePort) {
        completeDisconnectDrag(disconnectState.candidatePort);
      }
      endConnectionDisconnect();
    },
  });
};
