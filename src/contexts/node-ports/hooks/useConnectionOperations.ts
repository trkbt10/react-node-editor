/**
 * @file Hook for connection operations (create, disconnect, complete).
 */
import * as React from "react";
import { useEditorActionState } from "../../composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../composed/canvas/interaction/context";
import { useNodeDefinitions } from "../../node-definitions/context";
import { useNodeEditor } from "../../composed/node-editor/context";
import { createValidatedConnection } from "../../../core/connection/operations";
import {
  planConnectionChange,
  ConnectionSwitchBehavior,
} from "../../../core/port/connectivity/connectionPlanning";
import type { Port } from "../../../types/core";
import { createEmptyConnectablePorts } from "../../../core/port/connectivity/connectableTypes";

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

      // createValidatedConnection handles all validation internally:
      // - port normalization
      // - same-type/same-node checks
      // - validateConnection callbacks
      // - data type compatibility
      // - capacity limits
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
  }, [interactionActions, actionActions]);

  const endConnectionDisconnect = React.useCallback(() => {
    interactionActions.endConnectionDisconnect();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  }, [interactionActions, actionActions]);

  return { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect };
};
