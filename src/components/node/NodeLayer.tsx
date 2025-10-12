import * as React from "react";
import { classNames } from "../elements";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeDefinitions, useNodeDefinitionList } from "../../contexts/node-definitions";
import { useNodeEditor } from "../../contexts/node-editor";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { useNodeResize } from "../../hooks/useNodeResize";
import { useVisibleNodes } from "../../hooks/useVisibleNodes";
import { usePointerInteraction } from "../../hooks/usePointerInteraction";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import { PORT_INTERACTION_THRESHOLD } from "../../constants/interaction";
import styles from "./NodeLayer.module.css";
import type { Port } from "../../types/core";
import { snapMultipleToGrid } from "../../utils/gridSnap";
import { useRenderers } from "../../contexts/RendererContext";
import { hasGroupBehavior } from "../../types/behaviors";
import { usePortPositions } from "../../contexts/node-ports/context";
import { getPortConnections, isValidReconnection, getOtherPortInfo } from "../../contexts/node-ports/utils/portConnectionQueries";
import { createValidatedConnection } from "../../contexts/node-ports/utils/connectionOperations";
import type { Port as CorePort } from "../../types/core";
import { canConnectPorts } from "../../contexts/node-ports/utils/connectionValidation";
import { planConnectionChange, ConnectionSwitchBehavior } from "../../contexts/node-ports/utils/connectionSwitchBehavior";
import { computeConnectablePortIds, type ConnectablePortsResult } from "../../contexts/node-ports/utils/connectablePortPlanner";
import { getNodesToDrag, collectInitialPositions, calculateNewPositions, handleGroupMovement } from "../../utils/nodeDragHelpers";

const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});

export type NodeLayerProps = {
  className?: string;
  doubleClickToEdit?: boolean;
}

/**
 * NodeLayer - Renders all nodes with optimized performance
 */
export const NodeLayer: React.FC<NodeLayerProps> = ({ className, doubleClickToEdit = true }) => {
  const { state: nodeEditorState, dispatch: nodeEditorDispatch, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: canvasState, utils } = useNodeCanvas();
  const { node: NodeComponent } = useRenderers();
  const { calculateNodePortPositions } = usePortPositions();

  // Helper to get node definition
  const getNodeDef = useNodeDefinitions();
  const nodeDefinitions = useNodeDefinitionList();

  // Initialize hooks
  const nodeResize = useNodeResize({
    minWidth: 100,
    minHeight: 40,
    snapToGrid: canvasState.gridSettings.snapToGrid,
    gridSize: canvasState.gridSettings.size,
  });

  const groupManager = useGroupManagement({
    autoUpdateMembership: true,
    membershipUpdateDelay: 200,
  });

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
      if (aGroup && !bGroup) {return -1;}
      if (!aGroup && bGroup) {return 1;}
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
    actionDispatch(actionActions.updateConnectedPorts(connectedPorts));
  }, [connectedPorts, actionDispatch, actionActions]);

  // Event handlers
  const handleNodeContextMenu = React.useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const position = { x: e.clientX, y: e.clientY };
      const canvasPos = utils.screenToCanvas(e.clientX, e.clientY);
      actionDispatch(actionActions.showContextMenu(position, nodeId, canvasPos));
    },
    [actionDispatch, actionActions, utils]
  );

  const handleNodePointerDown = React.useCallback(
    (e: React.PointerEvent, nodeId: string, isDragAllowed: boolean = true) => {
      if (e.button !== 0) {return;}

      e.stopPropagation();

      const clickedNode = nodeEditorState.nodes[nodeId];
      const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;

      if (clickedNode?.locked) {
        actionDispatch(actionActions.selectNode(nodeId, isMultiSelect));
        return;
      }

      // Get node definition to check if it's interactive
      const nodeDefinition = clickedNode ? getNodeDef.registry.get(clickedNode.type) : undefined;
      const isInteractive = nodeDefinition?.interactive || false;

      // For interactive nodes, check if dragging is allowed
      if (isInteractive && !isDragAllowed && !actionState.selectedNodeIds.includes(nodeId)) {
        // Just select the node without starting drag
        actionDispatch(actionActions.selectNode(nodeId, isMultiSelect));
        return;
      }

      // Determine nodes to drag using helper function
      const nodesToDrag = getNodesToDrag(
        nodeId,
        isMultiSelect,
        actionState.selectedNodeIds,
        nodeEditorState.nodes,
        isInteractive,
        isDragAllowed
      );

      // Handle selection if not already selected
      if (!actionState.selectedNodeIds.includes(nodeId)) {
        actionDispatch(actionActions.selectNode(nodeId, isMultiSelect));
      }

      if (nodesToDrag.length === 0) {return;}

      const startPosition = {
        x: e.clientX,
        y: e.clientY,
      };

      // Collect initial positions using helper
      const { initialPositions, affectedChildNodes } = collectInitialPositions(
        nodesToDrag,
        nodeEditorState.nodes,
        groupManager.getGroupChildren,
        nodeDefinitions
      );

      actionDispatch(actionActions.startNodeDrag(nodesToDrag, startPosition, initialPositions, affectedChildNodes));
    },
    [actionDispatch, actionActions, actionState.selectedNodeIds, nodeEditorState.nodes, groupManager, getNodeDef]
  );

  // Track drag start for disconnect threshold
  const portDragStartRef = React.useRef<{ x: number; y: number; port: Port; hasConnection: boolean } | null>(null);

  // Port event handlers
  const handlePortPointerDown = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      e.stopPropagation();

      const node = nodeEditorState.nodes[port.nodeId];
      if (!node) {return;}

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
        actionDispatch(actionActions.startConnectionDrag(actionPort));
        actionDispatch(actionActions.updateConnectionDrag(portPosition, null));
        const connectable = computeConnectablePortIds({
          fallbackPort: actionPort,
          nodes: nodeEditorState.nodes,
          connections: nodeEditorState.connections,
          getNodePorts,
          getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
        });
        actionDispatch(actionActions.updateConnectablePorts(connectable));
        return;
      }

      // Setup drag tracking for disconnect threshold
      const handlePointerMove = (e: PointerEvent) => {
        if (!portDragStartRef.current) {return;}

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
      };

      const startDisconnect = () => {
        // Handle disconnect
        const connection = existingConnections[0];
        const portInfo = getOtherPortInfo(connection, port, nodeEditorState.nodes, getNodePorts);
        
        if (!portInfo) {return;}

        const { otherNode, otherPort, isFromPort } = portInfo;
        const fixedPort: Port = {
          id: otherPort.id,
          nodeId: otherNode.id,
          type: otherPort.type,
          label: otherPort.label,
          position: otherPort.position,
        };

        actionDispatch(
          actionActions.startConnectionDisconnect(
            {
              id: connection.id,
              fromNodeId: connection.fromNodeId,
              fromPortId: connection.fromPortId,
              toNodeId: connection.toNodeId,
              toPortId: connection.toPortId,
            },
            isFromPort ? "from" : "to",
            fixedPort,
            portPosition
          )
        );

        nodeEditorDispatch(nodeEditorActions.deleteConnection(connection.id));

        // Clear drag ref
        portDragStartRef.current = null;
      };

      // Add listeners
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [
      nodeEditorState.connections,
      nodeEditorState.nodes,
      actionDispatch,
      actionActions,
      nodeEditorDispatch,
      nodeEditorActions,
      getNodePorts,
    ]
  );

  const handlePortPointerUp = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
      e.stopPropagation();

      // Handle reconnection from disconnect drag
      if (actionState.connectionDisconnectState) {
        const disconnectState = actionState.connectionDisconnectState;
        const fixedPort = disconnectState.fixedPort;

        if (isValidReconnection(
          fixedPort,
          port,
          nodeEditorState.nodes,
          nodeEditorState.connections,
          (type: string) => getNodeDef.registry.get(type)
        )) {
          const newConnection = createValidatedConnection(
            fixedPort,
            port,
            nodeEditorState.nodes,
            nodeEditorState.connections,
            (type: string) => getNodeDef.registry.get(type)
          );
          if (newConnection) {
            nodeEditorDispatch(nodeEditorActions.addConnection(newConnection));
          }
        }

        actionDispatch(actionActions.endConnectionDisconnect());
        return;
      }

      // Handle new connection
      if (!actionState.connectionDragState) {return;}

      const fromPort = actionState.connectionDragState.fromPort;
      const plan = planConnectionChange({
        fromPort,
        toPort: port,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
      });

      switch (plan.behavior) {
        case ConnectionSwitchBehavior.Replace:
          if (plan.connection) {
            plan.connectionIdsToReplace.forEach((connectionId) => {
              nodeEditorDispatch(nodeEditorActions.deleteConnection(connectionId));
            });
            nodeEditorDispatch(nodeEditorActions.addConnection(plan.connection));
          }
          break;

        case ConnectionSwitchBehavior.Append:
          if (plan.connection) {
            nodeEditorDispatch(nodeEditorActions.addConnection(plan.connection));
          }
          break;

        case ConnectionSwitchBehavior.Ignore:
        default:
          break;
      }

      actionDispatch(actionActions.endConnectionDrag());
      actionDispatch(actionActions.updateConnectablePorts(createEmptyConnectablePorts()));
    },
    [
      actionState.connectionDragState,
      actionState.connectionDisconnectState,
      actionDispatch,
      actionActions,
      nodeEditorDispatch,
      nodeEditorActions,
    ]
  );

  const handlePortPointerEnter = React.useCallback(
    (e: React.PointerEvent, port: Port) => {
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
      actionDispatch(actionActions.setHoveredPort(actionPort));
      const connectable = computeConnectablePortIds({
        dragState: actionState.connectionDragState,
        disconnectState: actionState.connectionDisconnectState,
        fallbackPort: actionPort,
        nodes: nodeEditorState.nodes,
        connections: nodeEditorState.connections,
        getNodePorts,
        getNodeDefinition: (type: string) => getNodeDef.registry.get(type),
      });
      actionDispatch(actionActions.updateConnectablePorts(connectable));
    },
    [
      actionDispatch,
      actionActions,
      actionState.connectionDragState,
      actionState.connectionDisconnectState,
      nodeEditorState.nodes,
      nodeEditorState.connections,
      getNodeDef,
      getNodePorts,
    ]
  );

  const handlePortPointerLeave = React.useCallback(() => {
    actionDispatch(actionActions.setHoveredPort(null));
    // Clear connectable highlight when leaving (unless dragging)
    if (!actionState.connectionDragState) {
      actionDispatch(actionActions.updateConnectablePorts(createEmptyConnectablePorts()));
    }
  }, [actionDispatch, actionActions, actionState.connectionDragState]);

  // Global drag handler
  React.useEffect(() => {
    if (!actionState.dragState) {return;}

    const handlePointerMove = (e: PointerEvent) => {
      if (!actionState.dragState) {return;}
      const deltaX = (e.clientX - actionState.dragState.startPosition.x) / canvasState.viewport.scale;
      const deltaY = (e.clientY - actionState.dragState.startPosition.y) / canvasState.viewport.scale;

      actionDispatch(actionActions.updateNodeDrag({ x: deltaX, y: deltaY }));
    };

    const handlePointerUp = () => {
      if (!actionState.dragState) {return;}
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
        nodeDefinitions
      );

      if (Object.keys(finalPositions).length > 0) {
        nodeEditorDispatch(nodeEditorActions.moveNodes(finalPositions));
      }

      actionDispatch(actionActions.endNodeDrag());
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
    actionDispatch,
    actionActions,
    nodeEditorDispatch,
    nodeEditorActions,
    nodeEditorState.nodes,
    groupManager,
  ]);

  // Global connection drag handler
  usePointerInteraction({
    interactionState: actionState.connectionDragState,
    viewport: canvasState.viewport,
    onPointerMove: (canvasPosition) => {
      actionDispatch(actionActions.updateConnectionDrag(canvasPosition, null));
    },
    onPointerUp: () => {
      const drag = actionState.connectionDragState;
      if (!drag) {
        actionDispatch(actionActions.endConnectionDrag());
        return;
      }
      const { fromPort, candidatePort, toPosition } = drag;
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
            if (p.type === fromPort.type) {return false;}
            const tempPort: CorePort = { id: p.id, type: p.type, label: p.label, nodeId: 'new', position: p.position };
            return canConnectPorts(
              fromPort.type === 'output' ? fromPort : tempPort,
              fromPort.type === 'output' ? tempPort : fromPort,
              fromDef,
              def,
              nodeEditorState.connections
            );
          });
          if (ok) {allowed.push(def.type);}
        });
        actionDispatch(actionActions.showContextMenu(
          { x: screen.x, y: screen.y },
          undefined,
          { x: toPosition.x, y: toPosition.y },
          undefined,
          'search',
          allowed,
          fromPort
        ));
      }
      actionDispatch(actionActions.endConnectionDrag());
    },
  });

  // Global connection disconnect handler
  usePointerInteraction({
    interactionState: actionState.connectionDisconnectState,
    viewport: canvasState.viewport,
    onPointerMove: (canvasPosition) => {
      actionDispatch(actionActions.updateConnectionDisconnect(canvasPosition, null));
    },
    onPointerUp: () => {
      actionDispatch(actionActions.endConnectionDisconnect());
    },
  });

  return (
    <div className={classNames(styles.nodeLayer, className)} data-node-layer>
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
          onPortPointerLeave={handlePortPointerLeave}
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
