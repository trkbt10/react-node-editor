/**
 * @file Hook for connection operations (create, disconnect, complete).
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../../contexts/composed/canvas/interaction/context";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { isValidReconnection } from "../../../contexts/node-ports/utils/portConnectionQueries";
import { createValidatedConnection } from "../../../contexts/node-ports/utils/connectionOperations";
import {
  planConnectionChange,
  ConnectionSwitchBehavior,
} from "../../../contexts/node-ports/utils/connectionSwitchBehavior";
import type { Port } from "../../../types/core";
import { createEmptyConnectablePorts } from "./connectablePortsUtils";

export const useConnectionOperations = () => {
  const { state: _actionState, actions: actionActions } = useEditorActionState();
  const { state: interactionState, actions: interactionActions } = useCanvasInteraction();
  const { state: nodeEditorState, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { registry } = useNodeDefinitions();

  const completeDisconnectDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const disconnectState = interactionState.connectionDisconnectState;
      if (!disconnectState) {
        return false;
      }
      const fixedPort = disconnectState.fixedPort;
      if (
        !isValidReconnection(
          fixedPort,
          targetPort,
          nodeEditorState.nodes,
          nodeEditorState.connections,
          (type: string) => registry.get(type),
        )
      ) {
        return false;
      }

      const newConnection = createValidatedConnection(
        fixedPort,
        targetPort,
        nodeEditorState.nodes,
        nodeEditorState.connections,
        (type: string) => registry.get(type),
      );
      if (!newConnection) {
        return false;
      }
      nodeEditorActions.addConnection(newConnection);
      return true;
    },
    [
      interactionState.connectionDisconnectState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      registry,
      nodeEditorActions,
    ],
  );

  const completeConnectionDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const drag = interactionState.connectionDragState;
      if (!drag) {
        return false;
      }
      const resolveCurrentPort = (port: Port): Port => {
        const current = getNodePorts(port.nodeId).find((candidate) => candidate.id === port.id);
        return current ?? port;
      };

      const fromPort = resolveCurrentPort(drag.fromPort);
      const toPort = resolveCurrentPort(targetPort);
      const plan = planConnectionChange({
        fromPort,
        toPort,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodeDefinition: (type: string) => registry.get(type),
      });

      switch (plan.behavior) {
        case ConnectionSwitchBehavior.Replace:
          if (plan.connection) {
            plan.connectionIdsToReplace.forEach((connectionId) => {
              nodeEditorActions.deleteConnection(connectionId);
            });
            nodeEditorActions.addConnection(plan.connection);
            return true;
          }
          break;
        case ConnectionSwitchBehavior.Append:
          if (plan.connection) {
            nodeEditorActions.addConnection(plan.connection);
            return true;
          }
          break;
        case ConnectionSwitchBehavior.Ignore:
        default:
          break;
      }

      const fallbackConnection = createValidatedConnection(
        fromPort,
        toPort,
        nodeEditorState.nodes,
        nodeEditorState.connections,
        (type: string) => registry.get(type),
      );

      if (fallbackConnection) {
        nodeEditorActions.addConnection(fallbackConnection);
        return true;
      }

      return false;
    },
    [
      interactionState.connectionDragState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      registry,
      nodeEditorActions,
      getNodePorts,
    ],
  );

  const endConnectionDrag = React.useCallback(() => {
    interactionActions.endConnectionDrag();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  }, [actionActions]);

  const endConnectionDisconnect = React.useCallback(() => {
    interactionActions.endConnectionDisconnect();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  }, [actionActions]);

  return { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect };
};
