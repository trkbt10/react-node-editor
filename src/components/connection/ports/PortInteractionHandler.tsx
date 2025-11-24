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
import { createValidatedConnection } from "../../../contexts/node-ports/utils/connectionOperations";
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
  const { state: nodeEditorState, actions, getNodePorts } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();
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
      definitionId: port.definitionId,
      nodeId: port.nodeId,
      type: port.type,
      label: port.label,
      position: port.position,
      placement: port.placement,
      dataType: port.dataType,
      maxConnections: port.maxConnections,
      allowedNodeTypes: port.allowedNodeTypes,
      allowedPortTypes: port.allowedPortTypes,
      instanceIndex: port.instanceIndex,
      instanceTotal: port.instanceTotal,
    }),
    [port],
  );

  const resolveConnectionPoint = React.useEffectEvent((nodeId: string, portId: string) => {
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
  });

  const resolveCandidatePort = React.useEffectEvent((canvasPosition: Position) => {
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
  });

  // Handle connection drag
  const handleConnectionDragStartImpl = React.useEffectEvent((_event: PointerEvent, _portElement: HTMLElement) => {
    // Calculate connectable ports using resolved ports and NodeDefinitions
    const connectablePorts = computeConnectablePortIds({
      fallbackPort: actionPort,
      nodes: nodeEditorState.nodes,
      connections: nodeEditorState.connections,
      getNodePorts,
      getNodeDefinition: (type: string) => registry.get(type),
    });

    // Start connection drag and update connectable ports
    actionActions.startConnectionDrag(actionPort);
    actionActions.updateConnectablePorts(connectablePorts);
  });

  const handleConnectionDragStart = React.useCallback(
    (event: PointerEvent, portElement: HTMLElement) => {
      handleConnectionDragStartImpl(event, portElement);
    },
    [],
  );

  const handleConnectionDragMoveImpl = React.useEffectEvent((event: PointerEvent, _delta: Position) => {
    const canvasPos = utils.screenToCanvas(event.clientX, event.clientY);
    const candidate = resolveCandidatePort(canvasPos);
    actionActions.updateConnectionDrag(canvasPos, candidate);
  });

  const handleConnectionDragMove = React.useCallback(
    (event: PointerEvent, delta: Position) => {
      handleConnectionDragMoveImpl(event, delta);
    },
    [],
  );

  const handleConnectionDragEndImpl = React.useEffectEvent((_event: PointerEvent, _delta: Position) => {
    if (!actionState.connectionDragState) {
      return;
    }

    const { fromPort, candidatePort } = actionState.connectionDragState;
    const resolveCurrentPort = (port: Port | null): Port | null => {
      if (!port) {
        return null;
      }
      const ports = getNodePorts(port.nodeId);
      const current = ports.find((candidate) => candidate.id === port.id);
      return current ?? port;
    };

    const resolvedFromPort = resolveCurrentPort(fromPort);
    const resolvedCandidate = resolveCurrentPort(candidatePort);

    if (resolvedFromPort && resolvedCandidate && resolvedFromPort.id !== resolvedCandidate.id) {
      const plan = planConnectionChange({
        fromPort: resolvedFromPort,
        toPort: resolvedCandidate,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodeDefinition: (type: string) => registry.get(type),
      });

      switch (plan.behavior) {
        case ConnectionSwitchBehavior.Replace:
          if (plan.connection) {
            plan.connectionIdsToReplace.forEach((connectionId) => {
              actions.deleteConnection(connectionId);
            });
            actions.addConnection(plan.connection);
          }
          break;

        case ConnectionSwitchBehavior.Append:
          if (plan.connection) {
            actions.addConnection(plan.connection);
          }
          break;

        case ConnectionSwitchBehavior.Ignore:
        default:
          break;
      }

      if (!plan.connection && resolvedFromPort && resolvedCandidate) {
        const fallback = createValidatedConnection(
          resolvedFromPort,
          resolvedCandidate,
          nodeEditorState.nodes,
          nodeEditorState.connections,
          (type: string) => registry.get(type),
        );
        if (fallback) {
          actions.addConnection(fallback);
        }
      }
    }

    // Clear drag state and connectable ports
    actionActions.endConnectionDrag();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  });

  const handleConnectionDragEnd = React.useCallback(
    (event: PointerEvent, delta: Position) => {
      handleConnectionDragEndImpl(event, delta);
    },
    [],
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

  const handlePointerEnterImpl = React.useEffectEvent((_event: React.PointerEvent) => {
    actionActions.setHoveredPort(actionPort);

    // Update candidate port if we're dragging a connection and this port is connectable
    if (actionState.connectionDragState && actionState.connectionDragState.fromPort.id !== port.id && isConnectable) {
      actionActions.updateConnectionDrag(actionState.connectionDragState.toPosition, actionPort);
    }
  });

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent) => {
      handlePointerEnterImpl(event);
    },
    [],
  );

  const handlePointerLeaveImpl = React.useEffectEvent((_event: React.PointerEvent) => {
    actionActions.setHoveredPort(null);

    // Clear candidate port if we're dragging
    if (actionState.connectionDragState?.candidatePort?.id === port.id) {
      actionActions.updateConnectionDrag(actionState.connectionDragState.toPosition, null);
    }
  });

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent) => {
      handlePointerLeaveImpl(event);
    },
    [],
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

/*
debug-notes:
- Reviewed src/components/node/NodeLayer.tsx to ensure pointer utilities remain compatible with node-layer dataset selectors.
- Reviewed src/examples/demos/advanced/subeditor/SubEditorWindow.tsx to confirm nested editors encapsulate their own canvas providers and require local screenToCanvas conversions.
- Reviewed src/contexts/NodeCanvasContext.tsx to reuse screenToCanvas logic instead of querying the global node layer.
*/
