/**
 * @file Hook for resolving connection port positions and candidates.
 */
import * as React from "react";
import { useEditorActionState } from "../../composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../composed/canvas/interaction/context";
import { useNodeEditor } from "../../composed/node-editor/context";
import { usePortPositions } from "../context";
import { findNearestConnectablePort } from "../utils/connectionCandidate";
import type { Position } from "../../../types/core";

export const useConnectionPortResolvers = () => {
  const { state: actionState } = useEditorActionState();
  const { state: interactionState, actions: _interactionActions } = useCanvasInteraction();
  const { state: nodeEditorState, getNodePorts } = useNodeEditor();
  const { getPortPosition, computePortPosition } = usePortPositions();

  const resolveConnectionPoint = React.useCallback(
    (nodeId: string, portId: string) => {
      const stored = getPortPosition(nodeId, portId);
      if (stored) {
        return stored.connectionPoint;
      }
      const node = nodeEditorState.nodes[nodeId];
      if (!node) {
        return null;
      }
      const ports = getNodePorts(nodeId);
      const targetPort = ports.find((candidate) => candidate.id === portId);
      if (!targetPort) {
        return null;
      }
      const computed = computePortPosition({ ...node, ports }, targetPort);
      return computed.connectionPoint;
    },
    [getPortPosition, nodeEditorState.nodes, getNodePorts, computePortPosition],
  );

  const resolveCandidatePort = React.useCallback(
    (canvasPosition: Position) => {
      if (!interactionState.connectionDragState) {
        return null;
      }
      return findNearestConnectablePort({
        pointerCanvasPosition: canvasPosition,
        connectablePorts: actionState.connectablePorts,
        nodes: nodeEditorState.nodes,
        getNodePorts,
        getConnectionPoint: resolveConnectionPoint,
        excludePort: {
          nodeId: interactionState.connectionDragState.fromPort.nodeId,
          portId: interactionState.connectionDragState.fromPort.id,
        },
      });
    },
    [
      interactionState.connectionDragState,
      actionState.connectablePorts,
      nodeEditorState.nodes,
      getNodePorts,
      resolveConnectionPoint,
    ],
  );

  const resolveDisconnectCandidate = React.useCallback(
    (canvasPosition: Position) => {
      if (!interactionState.connectionDisconnectState) {
        return null;
      }
      return findNearestConnectablePort({
        pointerCanvasPosition: canvasPosition,
        connectablePorts: actionState.connectablePorts,
        nodes: nodeEditorState.nodes,
        getNodePorts,
        getConnectionPoint: resolveConnectionPoint,
        excludePort: {
          nodeId: interactionState.connectionDisconnectState.fixedPort.nodeId,
          portId: interactionState.connectionDisconnectState.fixedPort.id,
        },
      });
    },
    [
      interactionState.connectionDisconnectState,
      actionState.connectablePorts,
      nodeEditorState.nodes,
      getNodePorts,
      resolveConnectionPoint,
    ],
  );

  return { resolveCandidatePort, resolveDisconnectCandidate };
};
