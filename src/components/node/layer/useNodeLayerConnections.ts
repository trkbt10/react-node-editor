/**
 * @file Hook for handling connection drag and disconnect interactions.
 */
import { useEditorActionState } from "../../../contexts/composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../../contexts/composed/canvas/interaction/context";
import { useNodeCanvas } from "../../../contexts/composed/canvas/viewport/context";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { getConnectableNodeTypes } from "../../../contexts/node-ports/utils/portConnectability";
import { usePointerInteraction } from "../../../hooks/usePointerInteraction";
import { useConnectionPortResolvers } from "../../../contexts/node-ports/hooks/useConnectionPortResolvers";
import { useConnectionOperations } from "../../../contexts/node-ports/hooks/useConnectionOperations";

export const useNodeLayerConnections = () => {
  const { state: _actionState, actions: actionActions } = useEditorActionState();
  const { state: interactionState, actions: interactionActions } = useCanvasInteraction();
  const { state: nodeEditorState } = useNodeEditor();
  const { state: canvasState, utils } = useNodeCanvas();
  const { registry } = useNodeDefinitions();
  const { resolveCandidatePort, resolveDisconnectCandidate } = useConnectionPortResolvers();
  const { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect } =
    useConnectionOperations();

  usePointerInteraction({
    interactionState: interactionState.connectionDragState,
    viewport: canvasState.viewport,
    screenToCanvas: utils.screenToCanvas,
    onPointerMove: (canvasPosition) => {
      const candidate = resolveCandidatePort(canvasPosition);
      interactionActions.updateConnectionDrag(canvasPosition, candidate);
    },
    onPointerUp: () => {
      const drag = interactionState.connectionDragState;
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
    interactionState: interactionState.connectionDisconnectState,
    viewport: canvasState.viewport,
    screenToCanvas: utils.screenToCanvas,
    onPointerMove: (canvasPosition) => {
      const candidate = resolveDisconnectCandidate(canvasPosition);
      interactionActions.updateConnectionDisconnect(canvasPosition, candidate);
    },
    onPointerUp: () => {
      const disconnectState = interactionState.connectionDisconnectState;
      if (disconnectState?.candidatePort) {
        completeDisconnectDrag(disconnectState.candidatePort);
      }
      endConnectionDisconnect();
    },
  });
};
