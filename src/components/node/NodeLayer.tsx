/**
 * @file Main node layer rendering and interaction handler for the node editor canvas.
 */
import * as React from "react";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { useNodeResize } from "../../hooks/useNodeResize";
import { useVisibleNodes } from "../../hooks/useVisibleNodes";
import { usePointerInteraction } from "../../hooks/usePointerInteraction";
import { PORT_INTERACTION_THRESHOLD } from "../../constants/interaction";
import styles from "./NodeLayer.module.css";
import type { Port, ConnectionDisconnectState } from "../../types/core";
import { snapMultipleToGrid } from "../../contexts/node-editor/utils/gridSnap";
import { useRenderers } from "../../contexts/RendererContext";
import { hasGroupBehavior } from "../../types/behaviors";
import { usePortPositions } from "../../contexts/node-ports/context";
import {
  getPortConnections,
  isValidReconnection,
  getOtherPortInfo,
} from "../../contexts/node-ports/utils/portConnectionQueries";
import { createValidatedConnection } from "../../contexts/node-ports/utils/connectionOperations";
import type { Port as CorePort } from "../../types/core";
import { canConnectPorts } from "../../contexts/node-ports/utils/connectionValidation";
import {
  planConnectionChange,
  ConnectionSwitchBehavior,
} from "../../contexts/node-ports/utils/connectionSwitchBehavior";
import {
  computeConnectablePortIds,
  type ConnectablePortsResult,
} from "../../contexts/node-ports/utils/connectablePortPlanner";
import { findNearestConnectablePort } from "../../contexts/node-ports/utils/connectionCandidate";
import { getNodesToDrag, collectInitialPositions, calculateNewPositions, handleGroupMovement } from "../../contexts/node-editor/utils/nodeDragHelpers";
import { addUniqueIds } from "../../utils/selectionUtils";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import type { PointerType } from "../../types/interaction";
import { usePointerShortcutMatcher } from "../../hooks/usePointerShortcutMatcher";

const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});

export type NodeLayerProps = {
  doubleClickToEdit?: boolean;
};

/**
 * NodeLayer - Renders all nodes with optimized performance
 */
export const NodeLayer: React.FC<NodeLayerProps> = ({ doubleClickToEdit }) => {
  void doubleClickToEdit;
  const { state: nodeEditorState, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: canvasState, utils, containerRef } = useNodeCanvas();
  const { node: NodeComponent } = useRenderers();
  const { calculateNodePortPositions, getPortPosition, computePortPosition } = usePortPositions();
  const interactionSettings = useInteractionSettings();

  // Helper to get node definition
  const getNodeDef = useNodeDefinitions();
  const nodeDefinitions = useNodeDefinitionList();

  // Initialize hooks
  useNodeResize({
    minWidth: 100,
    minHeight: 40,
    snapToGrid: canvasState.gridSettings.snapToGrid,
    gridSize: canvasState.gridSettings.size,
  });

  const groupManager = useGroupManagement({
    autoUpdateMembership: true,
    membershipUpdateDelay: 200,
  });

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
    (canvasPosition: { x: number; y: number }) => {
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
    (canvasPosition: { x: number; y: number }) => {
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

  // Get only visible nodes for virtualization
  const visibleNodes = useVisibleNodes(nodeEditorState.nodes);

  // Memoize sorted visible nodes
  const defs = useNodeDefinitions();
  const sortedNodes = React.useMemo(() => {
    // Nodes with group behavior render first (lower z-index)
    return visibleNodes.sort((a, b) => {
      const aDef = defs.registry.get(a.type);
      const bDef = defs.registry.get(b.type);
      const aGroup = hasGroupBehavior(aDef);
      const bGroup = hasGroupBehavior(bDef);
      if (aGroup && !bGroup) {
        return -1;
      }
      if (!aGroup && bGroup) {
        return 1;
      }
      return 0;
    });
  }, [visibleNodes, defs.registry]);

  // Calculate connected ports once
  const connectedPorts = React.useMemo(() => {
    const ports = new Set<string>();
    Object.values(nodeEditorState.connections).forEach((connection) => {
      ports.add(connection.fromPortId);
      ports.add(connection.toPortId);
    });
    return ports;
  }, [nodeEditorState.connections]);

  // Update connected ports in action state only when changed
  React.useEffect(() => {
    actionActions.updateConnectedPorts(connectedPorts);
  }, [connectedPorts, actionActions]);

  // Event handlers
  const matchesPointerAction = usePointerShortcutMatcher();

  const handleNodeContextMenu = React.useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const nativeEvent = e.nativeEvent as MouseEvent & { pointerType?: string };
      if (!matchesPointerAction("node-open-context-menu", nativeEvent)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const pointerType: PointerType | "unknown" =
        nativeEvent.pointerType === "mouse" || nativeEvent.pointerType === "touch" || nativeEvent.pointerType === "pen"
          ? (nativeEvent.pointerType as PointerType)
          : "unknown";

      const screenPosition = { x: e.clientX, y: e.clientY };
      const canvasPos = utils.screenToCanvas(e.clientX, e.clientY);

      const defaultShow = () => actionActions.showContextMenu(screenPosition, nodeId, canvasPos);

      const handler = interactionSettings.contextMenu.handleRequest;
      if (handler) {
        handler({
          target: { kind: "node", nodeId },
          screenPosition,
          canvasPosition: canvasPos,
          pointerType,
          event: nativeEvent,
          defaultShow,
        });
        return;
      }

      defaultShow();
    },
    [actionActions, utils, interactionSettings.contextMenu.handleRequest, matchesPointerAction],
  );

  const handleNodePointerDown = React.useCallback(
    (e: React.PointerEvent, targetNodeId: string, isDragAllowed: boolean = true) => {
      const nativeEvent = e.nativeEvent;
      const matchesMultiSelect = matchesPointerAction("node-add-to-selection", nativeEvent);
      const matchesSelect = matchesPointerAction("node-select", nativeEvent) || matchesMultiSelect;

      if (!matchesSelect && !matchesMultiSelect) {
        return;
      }

      e.stopPropagation();
      const isInputElement =
        e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName);
      if (isInputElement) {
        return;
      }

      const finalIsMultiSelect = matchesMultiSelect;
      const clickedNode = nodeEditorState.nodes[targetNodeId];
      const wasSelected = actionState.selectedNodeIds.includes(targetNodeId);
      const hadMultipleSelection = actionState.selectedNodeIds.length > 1;

      if (finalIsMultiSelect) {
        actionActions.selectEditingNode(targetNodeId, true);
        actionActions.selectInteractionNode(targetNodeId, true);
        if (wasSelected) {
          return;
        }
      } else if (!wasSelected || !hadMultipleSelection) {
        actionActions.selectEditingNode(targetNodeId, false);
        actionActions.selectInteractionNode(targetNodeId, false);
      }

      if (clickedNode?.locked) {
        return;
      }

      // Get node definition to check if it's interactive
      const nodeDefinition = clickedNode ? getNodeDef.registry.get(clickedNode.type) : undefined;
      const isInteractive = nodeDefinition?.interactive || false;

      // For interactive nodes, check if dragging is allowed
      if (isInteractive && !isDragAllowed && !wasSelected) {
        return;
      }

      const selectionForDrag = (() => {
        if (finalIsMultiSelect) {
          return addUniqueIds(actionState.selectedNodeIds, [targetNodeId]);
        }
        if (wasSelected && hadMultipleSelection) {
          return actionState.selectedNodeIds;
        }
        return [targetNodeId];
      })();

      // Determine nodes to drag using helper function
      const nodesToDrag = getNodesToDrag(
        targetNodeId,
        finalIsMultiSelect,
        selectionForDrag,
        nodeEditorState.nodes,
        isInteractive,
        isDragAllowed,
      );

      if (nodesToDrag.length === 0) {
        return;
      }

      const startPosition = {
        x: e.clientX,
        y: e.clientY,
      };

      // Collect initial positions using helper
      const { initialPositions, affectedChildNodes } = collectInitialPositions(
        nodesToDrag,
        nodeEditorState.nodes,
        groupManager.getGroupChildren,
        nodeDefinitions,
      );

      actionActions.startNodeDrag(nodesToDrag, startPosition, initialPositions, affectedChildNodes);
    },
    [
      actionActions,
      actionState.selectedNodeIds,
      nodeEditorState.nodes,
      groupManager,
      getNodeDef,
      matchesPointerAction,
      nodeDefinitions,
    ],
  );

  // Track drag start for disconnect threshold
  const portDragStartRef = React.useRef<{ x: number; y: number; port: Port; hasConnection: boolean } | null>(null);

  // Port event handlers
  const handlePortPointerDown = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      e.stopPropagation();

      const node = nodeEditorState.nodes[port.nodeId];
      if (!node) {
        return;
      }

      // Calculate port position dynamically
      const nodeWithPorts = {
        ...node,
        ports: getNodePorts(port.nodeId),
      };
      const positions = calculateNodePortPositions(nodeWithPorts);
      const portPositionData = positions.get(port.id);
      const portPosition = portPositionData?.connectionPoint || { x: node.position.x, y: node.position.y };

      // Check if port is connected
      const existingConnections = getPortConnections(port, nodeEditorState.connections);

      // Store drag start info
      portDragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        port,
        hasConnection: existingConnections.length > 0,
      };

      if (e.pointerType !== "mouse") {
        containerRef.current?.setPointerCapture?.(e.pointerId);
      }

      // Start new connection drag when:
      // - the port has no connections, or
      // - it's an output port (outputs default to multi-connection unless limited by definition)
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
          getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
        });
        actionActions.updateConnectablePorts(connectable);
        return;
      }

      // Setup drag tracking for disconnect threshold
      const handlePointerMove = (e: PointerEvent) => {
        if (!portDragStartRef.current) {
          return;
        }

        const dx = e.clientX - portDragStartRef.current.x;
        const dy = e.clientY - portDragStartRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if we've exceeded the disconnect threshold
        if (distance > PORT_INTERACTION_THRESHOLD.DISCONNECT_THRESHOLD) {
          // Remove listeners
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp);

          // Start disconnect process
          startDisconnect();
        }
      };

      const handlePointerUp = () => {
        // Clean up
        portDragStartRef.current = null;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("pointercancel", handlePointerCancel);
        if (e.pointerType !== "mouse") {
          containerRef.current?.releasePointerCapture?.(e.pointerId);
        }
      };

      const startDisconnect = () => {
        // Handle disconnect
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
          getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
        });
        actionActions.updateConnectablePorts(disconnectConnectable);

        nodeEditorActions.deleteConnection(connection.id);

        // Clear drag ref
        portDragStartRef.current = null;
      };

      // Add listeners
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      const handlePointerCancel = () => {
        handlePointerUp();
      };
      document.addEventListener("pointercancel", handlePointerCancel);
    },
    [
      nodeEditorState.connections,
      nodeEditorState.nodes,
      actionActions,
      nodeEditorActions,
      getNodePorts,
      containerRef,
    ],
  );

  const completeDisconnectDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const disconnectState = actionState.connectionDisconnectState;
      if (!disconnectState) {
        return false;
      }
      const fixedPort = disconnectState.fixedPort;
      if (
        !isValidReconnection(fixedPort, targetPort, nodeEditorState.nodes, nodeEditorState.connections, (type: string) =>
          getNodeDef.registry.get(type),
        )
      ) {
        return false;
      }

      const newConnection = createValidatedConnection(
        fixedPort,
        targetPort,
        nodeEditorState.nodes,
        nodeEditorState.connections,
        (type: string) => getNodeDef.registry.get(type),
      );
      if (!newConnection) {
        return false;
      }
      nodeEditorActions.addConnection(newConnection);
      return true;
    },
    [
      actionState.connectionDisconnectState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      getNodeDef,
      nodeEditorActions,
    ],
  );

  const completeConnectionDrag = React.useCallback(
    (targetPort: Port): boolean => {
      const drag = actionState.connectionDragState;
      if (!drag) {
        return false;
      }
      const fromPort = drag.fromPort;
      const plan = planConnectionChange({
        fromPort,
        toPort: targetPort,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
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
      return false;
    },
    [actionState.connectionDragState, nodeEditorState.nodes, nodeEditorState.connections, getNodeDef, nodeEditorActions],
  );

  const handlePortPointerUp = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      e.stopPropagation();
      if (e.pointerType !== "mouse") {
        containerRef.current?.releasePointerCapture?.(e.pointerId);
      }

      if (actionState.connectionDisconnectState) {
        completeDisconnectDrag(port);
        actionActions.endConnectionDisconnect();
        actionActions.updateConnectablePorts(createEmptyConnectablePorts());
        return;
      }

      if (actionState.connectionDragState) {
        completeConnectionDrag(port);
        actionActions.endConnectionDrag();
        actionActions.updateConnectablePorts(createEmptyConnectablePorts());
      }
    },
    [
      actionState.connectionDisconnectState,
      actionState.connectionDragState,
      completeDisconnectDrag,
      completeConnectionDrag,
      actionActions,
      containerRef,
    ],
  );

  const handlePortPointerCancel = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      if (e.pointerType !== "mouse") {
        containerRef.current?.releasePointerCapture?.(e.pointerId);
      }
      handlePortPointerUp(e, port);
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
        getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
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
      getNodeDef,
    ],
  );

  const handlePortPointerEnter = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      updatePortHoverState(e.clientX, e.clientY, port);
    },
    [updatePortHoverState],
  );

  const handlePortPointerMove = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      if (!actionState.connectionDragState && !actionState.connectionDisconnectState) {
        return;
      }
      updatePortHoverState(e.clientX, e.clientY, port);
    },
    [actionState.connectionDragState, actionState.connectionDisconnectState, updatePortHoverState],
  );

  const handlePortPointerLeave = React.useCallback(() => {
    actionActions.setHoveredPort(null);
    // Clear connectable highlight when leaving (unless dragging)
    if (!actionState.connectionDragState) {
      actionActions.updateConnectablePorts(createEmptyConnectablePorts());
    }
  }, [actionActions, actionState.connectionDragState]);

  // Global drag handler
  React.useEffect(() => {
    if (!actionState.dragState) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!actionState.dragState) {
        return;
      }
      const deltaX = (e.clientX - actionState.dragState.startPosition.x) / canvasState.viewport.scale;
      const deltaY = (e.clientY - actionState.dragState.startPosition.y) / canvasState.viewport.scale;

      actionActions.updateNodeDrag({ x: deltaX, y: deltaY });
    };

    const handlePointerUp = () => {
      if (!actionState.dragState) {
        return;
      }
      const { nodeIds, initialPositions, offset } = actionState.dragState;

      // Calculate new positions using helper
      const newPositions = calculateNewPositions(nodeIds, initialPositions, offset);

      // Apply grid snapping if enabled
      const snappedPositions = canvasState.gridSettings.snapToGrid
        ? snapMultipleToGrid(newPositions, canvasState.gridSettings, nodeIds[0])
        : newPositions;

      // Handle group movement
      const finalPositions = handleGroupMovement(
        nodeIds,
        nodeEditorState.nodes,
        snappedPositions,
        initialPositions,
        groupManager.moveGroupWithChildren,
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
    groupManager,
  ]);

  // Global connection drag handler
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
        actionActions.endConnectionDrag();
        actionActions.updateConnectablePorts(createEmptyConnectablePorts());
        return;
      }
      const { fromPort, candidatePort, toPosition } = drag;
      if (candidatePort && fromPort.id !== candidatePort.id && completeConnectionDrag(candidatePort)) {
        actionActions.endConnectionDrag();
        actionActions.updateConnectablePorts(createEmptyConnectablePorts());
        return;
      }

      if (!candidatePort || fromPort.id === candidatePort.id) {
        // Open Node Search filtered by connectable node types at drop position
        const screen = utils.canvasToScreen(toPosition.x, toPosition.y);
        const defs = getNodeDef.registry.getAll();
        const fromNode = nodeEditorState.nodes[fromPort.nodeId];
        const fromDef = fromNode ? getNodeDef.registry.get(fromNode.type) : undefined;
        const allowed: string[] = [];
        defs.forEach((def) => {
          const ports = def.ports || [];
          const ok = ports.some((p) => {
            if (p.type === fromPort.type) {
              return false;
            }
            const tempPort: CorePort = { id: p.id, type: p.type, label: p.label, nodeId: "new", position: p.position };
            return canConnectPorts(
              fromPort.type === "output" ? fromPort : tempPort,
              fromPort.type === "output" ? tempPort : fromPort,
              fromDef,
              def,
              nodeEditorState.connections,
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
      actionActions.endConnectionDrag();
      actionActions.updateConnectablePorts(createEmptyConnectablePorts());
    },
  });

  // Global connection disconnect handler
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
      actionActions.endConnectionDisconnect();
      actionActions.updateConnectablePorts(createEmptyConnectablePorts());
    },
  });

  return (
    <div className={styles.nodeLayer} data-node-layer>
      {sortedNodes.map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={actionState.selectedNodeIds.includes(node.id)}
          isDragging={actionState.dragState?.nodeIds.includes(node.id) ?? false}
          dragOffset={actionState.dragState?.nodeIds.includes(node.id) ? actionState.dragState.offset : undefined}
          onPointerDown={handleNodePointerDown}
          onContextMenu={handleNodeContextMenu}
          onPortPointerDown={handlePortPointerDown}
          onPortPointerUp={handlePortPointerUp}
          onPortPointerEnter={handlePortPointerEnter}
          onPortPointerMove={handlePortPointerMove}
          onPortPointerLeave={handlePortPointerLeave}
          onPortPointerCancel={handlePortPointerCancel}
          connectablePorts={actionState.connectablePorts}
          connectingPort={
            actionState.connectionDragState?.fromPort
              ? {
                  id: actionState.connectionDragState.fromPort.id,
                  type: actionState.connectionDragState.fromPort.type,
                  label: actionState.connectionDragState.fromPort.label,
                  nodeId: actionState.connectionDragState.fromPort.nodeId,
                  position: actionState.connectionDragState.fromPort.position,
                }
              : undefined
          }
          hoveredPort={
            actionState.hoveredPort
              ? {
                  id: actionState.hoveredPort.id,
                  type: actionState.hoveredPort.type,
                  label: actionState.hoveredPort.label,
                  nodeId: actionState.hoveredPort.nodeId,
                  position: actionState.hoveredPort.position,
                }
              : undefined
          }
          connectedPorts={connectedPorts}
        />
      ))}
    </div>
  );
};

NodeLayer.displayName = "NodeLayer";

// Reference note: Reviewed connectionCandidate.ts, PortInteractionHandler.tsx, nodeDragHelpers.ts, and NodeDragHandler.tsx to coordinate selection toggling.
