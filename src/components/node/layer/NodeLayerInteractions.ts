/**
 * @file Encapsulated interaction hooks for NodeLayer (ports, drag, connections).
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { useNodeDefinitionList } from "../../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { usePortPositions } from "../../../contexts/node-ports/context";
import {
  computeConnectablePortIds,
  type ConnectablePortsResult,
} from "../../../contexts/node-ports/utils/connectablePortPlanner";
import { getOtherPortInfo, isValidReconnection } from "../../../contexts/node-ports/utils/portConnectionQueries";
import { getPortConnections } from "../../../core/port/queries";
import { createValidatedConnection } from "../../../contexts/node-ports/utils/connectionOperations";
import { canConnectPorts } from "../../../core/connection/validation";
import {
  planConnectionChange,
  ConnectionSwitchBehavior,
} from "../../../contexts/node-ports/utils/connectionSwitchBehavior";
import { findNearestConnectablePort } from "../../../contexts/node-ports/utils/connectionCandidate";
import { snapMultipleToGrid } from "../../../contexts/node-editor/utils/gridSnap";
import { calculateNewPositions, handleGroupMovement } from "../../../contexts/node-editor/utils/nodeDragHelpers";
import { PORT_INTERACTION_THRESHOLD } from "../../../constants/interaction";
import type { Port, Position, ConnectionDisconnectState } from "../../../types/core";
import { usePointerInteraction } from "../../../hooks/usePointerInteraction";
import type { UseGroupManagementResult } from "../../../hooks/useGroupManagement";

const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});

const useConnectionPortResolvers = () => {
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

const useConnectionOperations = () => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { registry } = useNodeDefinitions();

  const completeDisconnectDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const disconnectState = actionState.connectionDisconnectState;
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
    [actionState.connectionDisconnectState, nodeEditorState.nodes, nodeEditorState.connections, registry, nodeEditorActions],
  );

  const completeConnectionDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const drag = actionState.connectionDragState;
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
      actionState.connectionDragState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      registry,
      nodeEditorActions,
      getNodePorts,
    ],
  );

  const endConnectionDrag = React.useCallback(() => {
    actionActions.endConnectionDrag();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  }, [actionActions]);

  const endConnectionDisconnect = React.useCallback(() => {
    actionActions.endConnectionDisconnect();
    actionActions.updateConnectablePorts(createEmptyConnectablePorts());
  }, [actionActions]);

  return { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect };
};

export const useNodeLayerPorts = () => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { containerRef, utils } = useNodeCanvas();
  const { calculateNodePortPositions } = usePortPositions();
  const { registry } = useNodeDefinitions();
  const { resolveCandidatePort, resolveDisconnectCandidate } = useConnectionPortResolvers();
  const { completeConnectionDrag, completeDisconnectDrag, endConnectionDrag, endConnectionDisconnect } =
    useConnectionOperations();

  const portDragStartRef = React.useRef<{ x: number; y: number; port: Port; hasConnection: boolean } | null>(null);

  const handlePortPointerDown = React.useCallback(
    (event: React.PointerEvent, port: Port) => {
      event.stopPropagation();

      const node = nodeEditorState.nodes[port.nodeId];
      if (!node) {
        return;
      }

      const nodeWithPorts = {
        ...node,
        ports: getNodePorts(port.nodeId),
      };
      const positions = calculateNodePortPositions(nodeWithPorts);
      const portPositionData = positions.get(port.id);
      const portPosition = portPositionData?.connectionPoint || { x: node.position.x, y: node.position.y };

      const existingConnections = getPortConnections(port, nodeEditorState.connections);

      portDragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        port,
        hasConnection: existingConnections.length > 0,
      };

      if (event.pointerType !== "mouse") {
        containerRef.current?.setPointerCapture?.(event.pointerId);
      }

      if (existingConnections.length === 0 || port.type === "output") {
        const actionPort: Port = {
          id: port.id,
          nodeId: port.nodeId,
          type: port.type,
          label: port.label,
          position: port.position,
          dataType: port.dataType,
          maxConnections: port.maxConnections,
          allowedNodeTypes: port.allowedNodeTypes,
          allowedPortTypes: port.allowedPortTypes,
        };
        actionActions.startConnectionDrag(actionPort);
        actionActions.updateConnectionDrag(portPosition, null);
        const connectable = computeConnectablePortIds({
          fallbackPort: actionPort,
          nodes: nodeEditorState.nodes,
          connections: nodeEditorState.connections,
          getNodePorts,
          getNodeDefinition: (type: string) => registry.get(type),
        });
        actionActions.updateConnectablePorts(connectable);
        return;
      }

      const startDisconnect = () => {
        const connection = existingConnections[0];
        const portInfo = getOtherPortInfo(connection, port, nodeEditorState.nodes, getNodePorts);

        if (!portInfo) {
          return;
        }

        const { otherNode, otherPort, isFromPort } = portInfo;
        const fixedPort: Port = {
          id: otherPort.id,
          nodeId: otherNode.id,
          type: otherPort.type,
          label: otherPort.label,
          position: otherPort.position,
        };
        const disconnectedEnd = isFromPort ? "from" : "to";
        const originalConnectionSnapshot = {
          id: connection.id,
          fromNodeId: connection.fromNodeId,
          fromPortId: connection.fromPortId,
          toNodeId: connection.toNodeId,
          toPortId: connection.toPortId,
        };
        const disconnectState: ConnectionDisconnectState = {
          connectionId: connection.id,
          fixedPort,
          draggingEnd: disconnectedEnd,
          draggingPosition: portPosition,
          originalConnection: originalConnectionSnapshot,
          disconnectedEnd,
          candidatePort: null,
        };

        actionActions.startConnectionDisconnect(originalConnectionSnapshot, disconnectedEnd, fixedPort, portPosition);

        const disconnectConnectable = computeConnectablePortIds({
          disconnectState,
          nodes: nodeEditorState.nodes,
          connections: nodeEditorState.connections,
          getNodePorts,
          getNodeDefinition: (type: string) => registry.get(type),
        });
        actionActions.updateConnectablePorts(disconnectConnectable);

        nodeEditorActions.deleteConnection(connection.id);

        portDragStartRef.current = null;
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!portDragStartRef.current) {
          return;
        }

        const dx = e.clientX - portDragStartRef.current.x;
        const dy = e.clientY - portDragStartRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > PORT_INTERACTION_THRESHOLD.DISCONNECT_THRESHOLD) {
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp);
          document.removeEventListener("pointercancel", handlePointerCancel);
          startDisconnect();
        }
      };

      const handlePointerUp = () => {
        portDragStartRef.current = null;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("pointercancel", handlePointerCancel);
        if (event.pointerType !== "mouse") {
          containerRef.current?.releasePointerCapture?.(event.pointerId);
        }
      };

      const handlePointerCancel = () => {
        handlePointerUp();
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerCancel);
    },
    [
      actionActions,
      calculateNodePortPositions,
      containerRef,
      getNodePorts,
      nodeEditorActions,
      nodeEditorState.connections,
      nodeEditorState.nodes,
      registry,
    ],
  );

  const handlePortPointerUp = React.useCallback(
    (event: React.PointerEvent, port: Port) => {
      event.stopPropagation();
      if (event.pointerType !== "mouse") {
        containerRef.current?.releasePointerCapture?.(event.pointerId);
      }

      if (actionState.connectionDisconnectState) {
        completeDisconnectDrag(port);
        endConnectionDisconnect();
        return;
      }

      if (actionState.connectionDragState) {
        completeConnectionDrag(port);
        endConnectionDrag();
      }
    },
    [
      actionState.connectionDisconnectState,
      actionState.connectionDragState,
      completeDisconnectDrag,
      completeConnectionDrag,
      endConnectionDisconnect,
      endConnectionDrag,
      containerRef,
    ],
  );

  const handlePortPointerCancel = React.useCallback(
    (event: React.PointerEvent, port: Port) => {
      if (event.pointerType !== "mouse") {
        containerRef.current?.releasePointerCapture?.(event.pointerId);
      }
      handlePortPointerUp(event, port);
    },
    [handlePortPointerUp, containerRef],
  );

  const updatePortHoverState = React.useCallback(
    (clientX: number, clientY: number, fallbackPort: Port) => {
      const canvasPosition = utils.screenToCanvas(clientX, clientY);
      const candidate =
        resolveCandidatePort(canvasPosition) || resolveDisconnectCandidate(canvasPosition) || fallbackPort;

      actionActions.setHoveredPort(candidate);
      const connectable = computeConnectablePortIds({
        dragState: actionState.connectionDragState,
        disconnectState: actionState.connectionDisconnectState,
        fallbackPort: candidate,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodePorts,
        getNodeDefinition: (type: string) => registry.get(type),
      });
      actionActions.updateConnectablePorts(connectable);
    },
    [
      actionActions,
      actionState.connectionDragState,
      actionState.connectionDisconnectState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      utils,
      resolveCandidatePort,
      resolveDisconnectCandidate,
      getNodePorts,
      registry,
    ],
  );

  const handlePortPointerEnter = React.useCallback(
    (event: React.PointerEvent, port: Port) => {
      updatePortHoverState(event.clientX, event.clientY, port);
    },
    [updatePortHoverState],
  );

  const handlePortPointerMove = React.useCallback(
    (event: React.PointerEvent, port: Port) => {
      if (!actionState.connectionDragState && !actionState.connectionDisconnectState) {
        return;
      }
      updatePortHoverState(event.clientX, event.clientY, port);
    },
    [actionState.connectionDragState, actionState.connectionDisconnectState, updatePortHoverState],
  );

  const handlePortPointerLeave = React.useCallback(() => {
    actionActions.setHoveredPort(null);
    if (!actionState.connectionDragState) {
      actionActions.updateConnectablePorts(createEmptyConnectablePorts());
    }
  }, [actionActions, actionState.connectionDragState]);

  return {
    handlePortPointerDown,
    handlePortPointerUp,
    handlePortPointerEnter,
    handlePortPointerMove,
    handlePortPointerLeave,
    handlePortPointerCancel,
  };
};

export const useNodeLayerDrag = (moveGroupWithChildren: UseGroupManagementResult["moveGroupWithChildren"]) => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState, actions: nodeEditorActions } = useNodeEditor();
  const { state: canvasState } = useNodeCanvas();
  const nodeDefinitions = useNodeDefinitionList();

  React.useEffect(() => {
    if (!actionState.dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!actionState.dragState) {
        return;
      }
      const deltaX = (event.clientX - actionState.dragState.startPosition.x) / canvasState.viewport.scale;
      const deltaY = (event.clientY - actionState.dragState.startPosition.y) / canvasState.viewport.scale;

      actionActions.updateNodeDrag({ x: deltaX, y: deltaY });
    };

    const handlePointerUp = () => {
      if (!actionState.dragState) {
        return;
      }
      const { nodeIds, initialPositions, offset } = actionState.dragState;
      const newPositions = calculateNewPositions(nodeIds, initialPositions, offset);

      const snappedPositions = canvasState.gridSettings.snapToGrid
        ? snapMultipleToGrid(newPositions, canvasState.gridSettings, nodeIds[0])
        : newPositions;

      const finalPositions = handleGroupMovement(
        nodeIds,
        nodeEditorState.nodes,
        snappedPositions,
        initialPositions,
        moveGroupWithChildren,
        nodeDefinitions,
      );

      if (Object.keys(finalPositions).length > 0) {
        nodeEditorActions.moveNodes(finalPositions);
      }

      actionActions.endNodeDrag();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    actionState.dragState,
    canvasState.viewport.scale,
    canvasState.gridSettings,
    actionActions,
    nodeEditorActions,
    nodeEditorState.nodes,
    moveGroupWithChildren,
    nodeDefinitions,
  ]);
};

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
        const defs = registry.getAll();
        const fromNode = nodeEditorState.nodes[fromPort.nodeId];
        const fromDef = fromNode ? registry.get(fromNode.type) : undefined;
        const allowed: string[] = [];
        defs.forEach((def) => {
          const ports = def.ports || [];
          const ok = ports.some((p) => {
            if (p.type === fromPort.type) {
              return false;
            }
            const tempPort: Port = {
              id: p.id,
              definitionId: p.id,
              type: p.type,
              label: p.label,
              nodeId: "new",
              position: typeof p.position === "string" ? p.position : p.position.side,
              placement: typeof p.position === "string" ? undefined : p.position,
            };
            return canConnectPorts(
              fromPort.type === "output" ? fromPort : tempPort,
              fromPort.type === "output" ? tempPort : fromPort,
              fromDef,
              def,
              nodeEditorState.connections,
              { nodes: nodeEditorState.nodes },
            );
          });
          if (ok) {
            allowed.push(def.type);
          }
        });
        actionActions.showContextMenu(
          { x: screen.x, y: screen.y },
          undefined,
          { x: toPosition.x, y: toPosition.y },
          undefined,
          "search",
          allowed,
          fromPort,
        );
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
