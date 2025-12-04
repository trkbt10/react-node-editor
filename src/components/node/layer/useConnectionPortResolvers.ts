/**
 * @file Hook for resolving connection port positions and candidates.
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { usePortPositions } from "../../../contexts/node-ports/context";
import { findNearestConnectablePort } from "../../../contexts/node-ports/utils/connectionCandidate";
import type { Position } from "../../../types/core";

export const useConnectionPortResolvers = () => {
  const { state: actionState } = useEditorActionState();
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
      if (!actionState.connectionDragState) {
        return null;
      }
      return findNearestConnectablePort({
        pointerCanvasPosition: canvasPosition,
        connectablePorts: actionState.connectablePorts,
        nodes: nodeEditorState.nodes,
        getNodePorts,
        getConnectionPoint: resolveConnectionPoint,
        excludePort: {
          nodeId: actionState.connectionDragState.fromPort.nodeId,
          portId: actionState.connectionDragState.fromPort.id,
        },
      });
    },
    [
      actionState.connectionDragState,
      actionState.connectablePorts,
      nodeEditorState.nodes,
      getNodePorts,
      resolveConnectionPoint,
    ],
  );

  const resolveDisconnectCandidate = React.useCallback(
    (canvasPosition: Position) => {
      if (!actionState.connectionDisconnectState) {
        return null;
      }
      return findNearestConnectablePort({
        pointerCanvasPosition: canvasPosition,
        connectablePorts: actionState.connectablePorts,
        nodes: nodeEditorState.nodes,
        getNodePorts,
        getConnectionPoint: resolveConnectionPoint,
        excludePort: {
          nodeId: actionState.connectionDisconnectState.fixedPort.nodeId,
          portId: actionState.connectionDisconnectState.fixedPort.id,
        },
      });
    },
    [
      actionState.connectionDisconnectState,
      actionState.connectablePorts,
      nodeEditorState.nodes,
      getNodePorts,
      resolveConnectionPoint,
    ],
  );

  return { resolveCandidatePort, resolveDisconnectCandidate };
};
