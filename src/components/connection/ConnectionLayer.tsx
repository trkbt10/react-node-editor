/**
 * @file ConnectionLayer component
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { calculateBezierPath, getOppositePortPosition } from "./utils/connectionUtils";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import type { Connection, Node as EditorNode, Port as CorePort, Position } from "../../types/core";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import { useRenderers } from "../../contexts/RendererContext";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import styles from "./ConnectionLayer.module.css";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import type { PointerType } from "../../types/interaction";

export type ConnectionLayerProps = {
  className?: string;
};

/**
 * ConnectionLayer - Renders all connections and handles connection interactions
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ className }) => {
  const { state: nodeEditorState } = useNodeEditor();

  return (
    <svg className={className ? `${styles.root} ${className}` : styles.root} data-connection-layer="root">
      {/* Render all connections */}
      {Object.values(nodeEditorState.connections).map((connection) => {
        return <ConnectionRenderer key={connection.id} connection={connection} />;
      })}

      {/* Render drag connection */}
      <DragConnection />
    </svg>
  );
};

ConnectionLayer.displayName = "ConnectionLayer";
const DragConnection = React.memo(() => {
  const { state: actionState } = useEditorActionState();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { registry } = useNodeDefinitions();

  const dragFromNodeId = actionState.connectionDragState?.fromPort.nodeId ?? "";
  const dragFromPortId = actionState.connectionDragState?.fromPort.id ?? "";
  const dragCandidateNodeId = actionState.connectionDragState?.candidatePort?.nodeId ?? "";
  const dragCandidatePortId = actionState.connectionDragState?.candidatePort?.id ?? "";

  const disconnectFixedNodeId = actionState.connectionDisconnectState?.fixedPort.nodeId ?? "";
  const disconnectFixedPortId = actionState.connectionDisconnectState?.fixedPort.id ?? "";
  const disconnectCandidateNodeId = actionState.connectionDisconnectState?.candidatePort?.nodeId ?? "";
  const disconnectCandidatePortId = actionState.connectionDisconnectState?.candidatePort?.id ?? "";

  const dragFromPos = useDynamicConnectionPoint(dragFromNodeId, dragFromPortId);
  const dragCandidatePos = useDynamicConnectionPoint(dragCandidateNodeId, dragCandidatePortId);
  const disconnectFixedPos = useDynamicConnectionPoint(disconnectFixedNodeId, disconnectFixedPortId);
  const disconnectCandidatePos = useDynamicConnectionPoint(disconnectCandidateNodeId, disconnectCandidatePortId);

  const previewHandlers = React.useMemo(
    () => ({
      onPointerDown: (_event: React.PointerEvent) => {},
      onPointerEnter: (_event: React.PointerEvent) => {},
      onPointerLeave: (_event: React.PointerEvent) => {},
      onContextMenu: (_event?: React.MouseEvent) => {},
    }),
    [],
  );

  const resolveRenderConnection = React.useCallback(
    (primaryPort: CorePort | undefined, primaryNode: EditorNode | undefined, fallbackPort?: CorePort, fallbackNode?: EditorNode) => {
      if (primaryPort && primaryNode) {
        const primaryDefinition = registry.get(primaryNode.type);
        const primaryPortDefinition = primaryDefinition?.ports?.find((definition) => definition.id === primaryPort.id);
        if (primaryPortDefinition?.renderConnection) {
          return primaryPortDefinition.renderConnection;
        }
      }

      if (fallbackPort && fallbackNode) {
        const fallbackDefinition = registry.get(fallbackNode.type);
        const fallbackPortDefinition = fallbackDefinition?.ports?.find((definition) => definition.id === fallbackPort.id);
        if (fallbackPortDefinition?.renderConnection) {
          return fallbackPortDefinition.renderConnection;
        }
      }

      return null;
    },
    [registry],
  );

  if (actionState.connectionDragState && dragFromPos) {
    const dragState = actionState.connectionDragState;
    const fromPortEntry = portLookupMap.get(`${dragState.fromPort.nodeId}:${dragState.fromPort.id}`)?.port ?? dragState.fromPort;
    const fromNode = nodeEditorState.nodes[fromPortEntry.nodeId];
    if (!fromNode) {
      return null;
    }

    const candidatePort = dragState.candidatePort ?? undefined;
    const candidateNode = candidatePort ? nodeEditorState.nodes[candidatePort.nodeId] : undefined;

    const toPosition = candidatePort && dragCandidatePos ? dragCandidatePos : dragState.toPosition;
    const renderer = resolveRenderConnection(fromPortEntry, fromNode, candidatePort, candidateNode);

    const pathData = calculateBezierPath(
      dragFromPos,
      toPosition,
      fromPortEntry.position,
      candidatePort ? candidatePort.position : getOppositePortPosition(fromPortEntry.position),
    );

    const defaultRender = () => (
      <g className={styles.dragGroup} data-drag-state="connecting" shapeRendering="geometricPrecision">
        <path d={pathData} className={styles.dragPath} data-drag-variant="connecting" />
      </g>
    );

    const previewContext: ConnectionRenderContext = {
      connection: null,
      phase: "connecting",
      fromPort: fromPortEntry,
      toPort: candidatePort,
      fromNode,
      toNode: candidateNode,
      fromPosition: dragFromPos,
      toPosition,
      isSelected: false,
      isHovered: false,
      isAdjacentToSelectedNode: false,
      isDragging: true,
      dragProgress: undefined,
      handlers: previewHandlers,
    };

    if (renderer) {
      return (
        <ConnectionRendererInvoker
          key={`connecting-${fromPortEntry.id}`}
          renderer={renderer}
          context={previewContext}
          defaultRender={defaultRender}
        />
      );
    }

    return defaultRender();
  }

  if (actionState.connectionDisconnectState && disconnectFixedPos) {
    const disconnectState = actionState.connectionDisconnectState;
    const baseConnection =
      nodeEditorState.connections[disconnectState.connectionId] ?? disconnectState.originalConnection;

    const originalFromPort = portLookupMap.get(`${baseConnection.fromNodeId}:${baseConnection.fromPortId}`)?.port;
    const originalToPort = portLookupMap.get(`${baseConnection.toNodeId}:${baseConnection.toPortId}`)?.port;

    if (!originalFromPort || !originalToPort) {
      return null;
    }

    const fromNode = nodeEditorState.nodes[baseConnection.fromNodeId];
    const toNode = nodeEditorState.nodes[baseConnection.toNodeId];
    if (!fromNode || !toNode) {
      return null;
    }

    const candidatePort = disconnectState.candidatePort ?? undefined;
    const candidateNode = candidatePort ? nodeEditorState.nodes[candidatePort.nodeId] : undefined;

    const draggingPosition = disconnectState.draggingPosition;
    const candidatePosition = candidatePort && disconnectCandidatePos ? disconnectCandidatePos : draggingPosition;
    const fixedPosition = disconnectFixedPos;

    let fromPosition: Position;
    let toPosition: Position;
    let targetPort: CorePort | undefined = originalToPort;
    let targetNode: EditorNode | undefined = toNode;

    if (disconnectState.draggingEnd === "from") {
      fromPosition = candidatePosition;
      toPosition = fixedPosition;
    } else {
      fromPosition = fixedPosition;
      toPosition = candidatePosition;
    }

    if (candidatePort) {
      targetPort = candidatePort;
      targetNode = candidateNode ?? targetNode;
    }

    const renderer = resolveRenderConnection(originalFromPort, fromNode, targetPort, targetNode);

    const pathData = calculateBezierPath(
      fromPosition,
      toPosition,
      originalFromPort.position,
      targetPort ? targetPort.position : getOppositePortPosition(originalFromPort.position),
    );

    const defaultRender = () => (
      <g className={styles.dragGroup} data-drag-state="disconnecting" shapeRendering="geometricPrecision">
        <path d={pathData} className={styles.dragPath} data-drag-variant="disconnecting" />
      </g>
    );

    const previewContext: ConnectionRenderContext = {
      connection: baseConnection,
      phase: "disconnecting",
      fromPort: originalFromPort,
      toPort: targetPort,
      fromNode,
      toNode: targetNode,
      fromPosition,
      toPosition,
      isSelected: false,
      isHovered: false,
      isAdjacentToSelectedNode: false,
      isDragging: true,
      dragProgress: undefined,
      handlers: previewHandlers,
    };

    if (renderer) {
      return (
        <ConnectionRendererInvoker
          key={`disconnecting-${baseConnection.id}`}
          renderer={renderer}
          context={previewContext}
          defaultRender={defaultRender}
        />
      );
    }

    return defaultRender();
  }

  return null;
});

type RendererInvokerProps = {
  renderer: (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => React.ReactElement;
  context: ConnectionRenderContext;
  defaultRender: () => React.ReactElement;
};

const ConnectionRendererInvoker: React.FC<RendererInvokerProps> = ({ renderer, context, defaultRender }) => {
  return renderer(context, defaultRender);
};
const ConnectionRenderer = ({ connection }: { connection: Connection }) => {
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();
  const { connection: ConnectionComponent } = useRenderers();
  const interactionSettings = useInteractionSettings();

  // Runtime type guard for CorePort
  const isCorePort = (p: unknown): p is CorePort => {
    if (!p || typeof p !== "object") {
      return false;
    }
    const o = p as Record<string, unknown>;
    const typeOk = o.type === "input" || o.type === "output";
    const posOk = o.position === "left" || o.position === "right" || o.position === "top" || o.position === "bottom";
    return typeof o.id === "string" && typeof o.nodeId === "string" && typeof o.label === "string" && typeOk && posOk;
  };

  // Get dynamic port positions
  const fromPortPos = useDynamicConnectionPoint(connection.fromNodeId, connection.fromPortId);
  const toPortPos = useDynamicConnectionPoint(connection.toNodeId, connection.toPortId);

  // Handle connection pointer events
  const handleConnectionPointerDown = React.useCallback(
    (e: React.PointerEvent, connectionId: string) => {
      const fromNode = nodeEditorState.nodes[connection.fromNodeId];
      const toNode = nodeEditorState.nodes[connection.toNodeId];
      const fromPort = portLookupMap.get(`${connection.fromNodeId}:${connection.fromPortId}`)?.port;
      const toPort = portLookupMap.get(`${connection.toNodeId}:${connection.toPortId}`)?.port;

      if (!fromNode || !toNode || !fromPort || !toPort) {
        return;
      }

      // Use pre-calculated positions
      if (!fromPortPos || !toPortPos) {
        return;
      }

      // Select the connection
      const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
      actionActions.selectConnection(connectionId, isMultiSelect);
    },
    [connection, nodeEditorState, portLookupMap, actionActions, fromPortPos, toPortPos],
  );

  const handleConnectionPointerEnter = React.useCallback(
    (_e: React.PointerEvent, connectionId: string) => {
      actionActions.setHoveredConnection(connectionId);
    },
    [actionActions],
  );

  const handleConnectionPointerLeave = React.useCallback(
    (_e: React.PointerEvent, _connectionId: string) => {
      actionActions.setHoveredConnection(null);
    },
    [actionActions],
  );

  const handleConnectionContextMenu = React.useCallback(
    (e: React.MouseEvent, connectionId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const nativeEvent = e.nativeEvent as MouseEvent & { pointerType?: string };
      const pointerType: PointerType | "unknown" =
        nativeEvent.pointerType === "mouse" || nativeEvent.pointerType === "touch" || nativeEvent.pointerType === "pen"
          ? (nativeEvent.pointerType as PointerType)
          : "unknown";

      const position = { x: e.clientX, y: e.clientY };
      const canvasPos = utils.screenToCanvas(e.clientX, e.clientY);

      const defaultShow = () => actionActions.showContextMenu(position, undefined, canvasPos, connectionId);

      const handler = interactionSettings.contextMenu.handleRequest;
      if (handler) {
        handler({
          target: { kind: "connection", connectionId },
          screenPosition: position,
          canvasPosition: canvasPos,
          pointerType,
          event: nativeEvent,
          defaultShow,
        });
        return;
      }

      defaultShow();
    },
    [actionActions, utils, interactionSettings.contextMenu.handleRequest],
  );
  const fromNode = nodeEditorState.nodes[connection.fromNodeId];
  const toNode = nodeEditorState.nodes[connection.toNodeId];

  const fromRaw = portLookupMap.get(`${connection.fromNodeId}:${connection.fromPortId}`)?.port as unknown;
  const toRaw = portLookupMap.get(`${connection.toNodeId}:${connection.toPortId}`)?.port as unknown;
  // Require nodes; if ports are missing (e.g., tests without full port resolution), synthesize minimal ports
  if (!fromNode || !toNode) {
    return null;
  }

  const ensurePort = (raw: unknown, fallback: CorePort): CorePort => (isCorePort(raw) ? raw : fallback);

  const fromPort: CorePort = ensurePort(fromRaw, {
    id: connection.fromPortId,
    nodeId: connection.fromNodeId,
    type: "output",
    label: connection.fromPortId,
    position: "right",
  });
  const toPort: CorePort = ensurePort(toRaw, {
    id: connection.toPortId,
    nodeId: connection.toNodeId,
    type: "input",
    label: connection.toPortId,
    position: "left",
  });

  // Skip if nodes are not visible
  if (fromNode.visible === false || toNode.visible === false) {
    return null;
  }

  // Get preview position and size for nodes during drag or resize
  const getNodePreviewData = (node: EditorNode, nodeId: string) => {
    let previewPosition = null;
    let previewSize = null;

    // Check for drag state
    if (actionState.dragState) {
      const { nodeIds, offset, affectedChildNodes } = actionState.dragState;

      // Check if this node is directly being dragged
      if (nodeIds.includes(nodeId)) {
        previewPosition = {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        };
      } else {
        // Check if this node is a child of a dragging group
        const isChildOfDraggingGroup = Object.entries(affectedChildNodes).some(([_groupId, childIds]) =>
          childIds.includes(nodeId),
        );

        if (isChildOfDraggingGroup) {
          previewPosition = {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          };
        }
      }
    }

    // Check for resize state
    if (actionState.resizeState && actionState.resizeState.nodeId === nodeId) {
      previewSize = actionState.resizeState.currentSize;
    }

    return { previewPosition, previewSize };
  };

  const fromNodeData = getNodePreviewData(fromNode, connection.fromNodeId);
  const toNodeData = getNodePreviewData(toNode, connection.toNodeId);
  return (
    <ConnectionComponent
      key={connection.id}
      connection={connection}
      fromNode={fromNode}
      toNode={toNode}
      fromPort={fromPort}
      toPort={toPort}
      isAdjacentToSelectedNode={
        actionState.selectedNodeIds.includes(connection.fromNodeId) ||
        actionState.selectedNodeIds.includes(connection.toNodeId)
      }
      fromNodePosition={fromNodeData.previewPosition || undefined}
      toNodePosition={toNodeData.previewPosition || undefined}
      fromNodeSize={fromNodeData.previewSize || undefined}
      toNodeSize={toNodeData.previewSize || undefined}
      isSelected={actionState.selectedConnectionIds.includes(connection.id)}
      isHovered={actionState.hoveredConnectionId === connection.id}
      onPointerDown={handleConnectionPointerDown}
      onPointerEnter={handleConnectionPointerEnter}
      onPointerLeave={handleConnectionPointerLeave}
      onContextMenu={handleConnectionContextMenu}
    />
  );
};
