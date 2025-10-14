/**
 * @file Port-level interaction handler used by the connection system.
 */
import * as React from "react";
import { Port, NodeId, Position } from "../../../types/core";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { usePointerDrag } from "../../../hooks/usePointerDrag";
import { usePortPositions } from "../../../contexts/node-ports/context";
import { isPortConnectable } from "../../../contexts/node-ports/utils/portConnectability";
import {
  planConnectionChange,
  ConnectionSwitchBehavior,
} from "../../../contexts/node-ports/utils/connectionSwitchBehavior";
import {
  computeConnectablePortIds,
  type ConnectablePortsResult,
} from "../../../contexts/node-ports/utils/connectablePortPlanner";
import { findNearestConnectablePort } from "../../../contexts/node-ports/utils/connectionCandidate";
import { PORT_INTERACTION_THRESHOLD } from "../../../constants/interaction";

const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});

export type PortInteractionHandlerProps = {
  port: Port;
  node: { id: NodeId; position: Position };
  children: (props: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    isHovered: boolean;
    isConnecting: boolean;
    isConnectable: boolean;
    isCandidate: boolean;
    isConnected: boolean;
  }) => React.ReactNode;
};

/**
 * Handles all port interaction logic including connections and hover states
 */
export const PortInteractionHandler: React.FC<PortInteractionHandlerProps> = ({ port, children }) => {
  const { state: nodeEditorState, actions, dispatch, getNodePorts } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const { registry } = useNodeDefinitions();
  const { getPortPosition, computePortPosition } = usePortPositions();

  // Check port states
  const isHovered = actionState.hoveredPort?.id === port.id;
  const isConnecting = actionState.connectionDragState?.fromPort.id === port.id;
  const isConnectable = isPortConnectable(port, actionState.connectablePorts);
  const isCandidate = actionState.connectionDragState?.candidatePort?.id === port.id;
  const isConnected = actionState.connectedPorts.has(port.id);

  // Convert to Port for actions
  const actionPort = React.useMemo<Port>(
    () => ({
      id: port.id,
      nodeId: port.nodeId,
      type: port.type,
      label: port.label,
      position: port.position,
      dataType: port.dataType,
      maxConnections: port.maxConnections,
      allowedNodeTypes: port.allowedNodeTypes,
      allowedPortTypes: port.allowedPortTypes,
    }),
    [port],
  );

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

  // Handle connection drag
  const handleConnectionDragStart = React.useCallback(
    (_event: PointerEvent, _portElement: HTMLElement) => {
      // Calculate connectable ports using resolved ports and NodeDefinitions
      const connectablePorts = computeConnectablePortIds({
        fallbackPort: actionPort,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodePorts,
        getNodeDefinition: (type: string) => registry.get(type),
      });

      // Start connection drag and update connectable ports
      actionDispatch(actionActions.startConnectionDrag(actionPort));
      actionDispatch(actionActions.updateConnectablePorts(connectablePorts));
    },
    [
      actionPort,
      actionDispatch,
      actionActions,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      registry,
      getNodePorts,
    ],
  );

  const handleConnectionDragMove = React.useCallback(
    (event: PointerEvent, _delta: Position) => {
      const currentPos = {
        x: event.clientX,
        y: event.clientY,
      };

      // Convert to canvas coordinates
      const containerRect = document.querySelector("[data-node-layer]")?.getBoundingClientRect();
      if (!containerRect) {
        return;
      }

      const canvasPos = {
        x: (currentPos.x - containerRect.left) / canvasState.viewport.scale - canvasState.viewport.offset.x,
        y: (currentPos.y - containerRect.top) / canvasState.viewport.scale - canvasState.viewport.offset.y,
      };
      const candidate = resolveCandidatePort(canvasPos);
      actionDispatch(actionActions.updateConnectionDrag(canvasPos, candidate));
    },
    [canvasState.viewport, actionDispatch, actionActions, resolveCandidatePort],
  );

  const handleConnectionDragEnd = React.useCallback(
    (_event: PointerEvent, _delta: Position) => {
      if (!actionState.connectionDragState) {
        return;
      }

      const { fromPort, candidatePort } = actionState.connectionDragState;

      if (candidatePort && fromPort.id !== candidatePort.id) {
        const plan = planConnectionChange({
          fromPort,
          toPort: candidatePort,
          nodes: nodeEditorState.nodes,
          connections: nodeEditorState.connections,
          getNodeDefinition: (type: string) => registry.get(type),
        });

        switch (plan.behavior) {
          case ConnectionSwitchBehavior.Replace:
            if (plan.connection) {
              plan.connectionIdsToReplace.forEach((connectionId) => {
                dispatch(actions.deleteConnection(connectionId));
              });
              dispatch(actions.addConnection(plan.connection));
            }
            break;

          case ConnectionSwitchBehavior.Append:
            if (plan.connection) {
              dispatch(actions.addConnection(plan.connection));
            }
            break;

          case ConnectionSwitchBehavior.Ignore:
          default:
            break;
        }
      }

      // Clear drag state and connectable ports
      actionDispatch(actionActions.endConnectionDrag());
      actionDispatch(actionActions.updateConnectablePorts(createEmptyConnectablePorts()));
    },
    [
      actionState.connectionDragState,
      dispatch,
      actions,
      actionDispatch,
      actionActions,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      registry,
    ],
  );

  const { startDrag } = usePointerDrag({
    onStart: handleConnectionDragStart,
    onMove: handleConnectionDragMove,
    onEnd: handleConnectionDragEnd,
    threshold: PORT_INTERACTION_THRESHOLD.NEW_CONNECTION_THRESHOLD,
  });

  // Event handlers
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const portElement = e.currentTarget as HTMLElement;
      startDrag(e, portElement);
    },
    [startDrag],
  );

  const handlePointerEnter = React.useCallback(
    (_event: React.PointerEvent) => {
      actionDispatch(actionActions.setHoveredPort(actionPort));

      // Update candidate port if we're dragging a connection and this port is connectable
      if (actionState.connectionDragState && actionState.connectionDragState.fromPort.id !== port.id && isConnectable) {
        actionDispatch(actionActions.updateConnectionDrag(actionState.connectionDragState.toPosition, actionPort));
      }
    },
    [actionPort, port, actionState.connectionDragState, isConnectable, actionDispatch, actionActions],
  );

  const handlePointerLeave = React.useCallback(
    (_event: React.PointerEvent) => {
      actionDispatch(actionActions.setHoveredPort(null));

      // Clear candidate port if we're dragging
      if (actionState.connectionDragState?.candidatePort?.id === port.id) {
        actionDispatch(actionActions.updateConnectionDrag(actionState.connectionDragState.toPosition, null));
      }
    },
    [port.id, actionState.connectionDragState, actionDispatch, actionActions],
  );

  return (
    <>
      {children({
        onPointerDown: handlePointerDown,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        isHovered,
        isConnecting,
        isConnectable,
        isCandidate,
        isConnected,
      })}
    </>
  );
};

// Note: Reviewed connectionCandidate.ts and NodeLayer.tsx to align candidate detection flow.
