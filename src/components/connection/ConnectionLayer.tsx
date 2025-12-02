/**
 * @file ConnectionLayer component
 * Split into Container (context-aware) and Inner (pure rendering) for optimal memoization.
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { calculateConnectionPath } from "../../core/connection/path";
import { getOppositePortPosition } from "../../core/port/position";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import type { Connection, Node as EditorNode, Port as CorePort, Position, Size } from "../../types/core";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import { useRenderers } from "../../contexts/RendererContext";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import styles from "./ConnectionLayer.module.css";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import type { PointerType } from "../../types/interaction";
import { usePointerShortcutMatcher } from "../../hooks/usePointerShortcutMatcher";
import { getPreviewPosition } from "../../core/geometry/position";
import { hasPositionChanged, hasSizeChanged } from "../../core/geometry/comparators";
import { getNodeResizeSize } from "../../core/node/resizeState";
import { ensurePort } from "../../core/port/typeGuards";

export type ConnectionLayerProps = {
  className?: string;
};

/**
 * ConnectionLayer - Renders all connections and handles connection interactions
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ className }) => {
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();

  const { dragState, resizeState, selectedConnectionIds, hoveredConnectionId, selectedNodeIds } = actionState;

  // Convert to Sets for O(1) lookup instead of O(n) includes
  const selectedConnectionIdsSet = React.useMemo(
    () => new Set(selectedConnectionIds),
    [selectedConnectionIds],
  );
  const selectedNodeIdsSet = React.useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

  // Pre-compute drag state set for O(1) lookup
  const draggedNodeIdsSet = React.useMemo(() => {
    if (!dragState) {
      return null;
    }
    const set = new Set<string>(dragState.nodeIds);
    // Include affected children
    for (const childIds of Object.values(dragState.affectedChildNodes)) {
      for (const id of childIds) {
        set.add(id);
      }
    }
    return set;
  }, [dragState]);

  return (
    <svg className={className ? `${styles.root} ${className}` : styles.root} data-connection-layer="root">
      {/* Render all connections */}
      {Object.values(nodeEditorState.connections).map((connection) => {
        // O(1) lookup using Sets
        const isFromDragging = draggedNodeIdsSet?.has(connection.fromNodeId) ?? false;
        const isToDragging = draggedNodeIdsSet?.has(connection.toNodeId) ?? false;
        const fromDragOffset = isFromDragging && dragState ? dragState.offset : null;
        const toDragOffset = isToDragging && dragState ? dragState.offset : null;
        const fromResizeSize = getNodeResizeSize(resizeState, connection.fromNodeId);
        const toResizeSize = getNodeResizeSize(resizeState, connection.toNodeId);
        const isSelected = selectedConnectionIdsSet.has(connection.id);
        const isHovered = hoveredConnectionId === connection.id;
        const isAdjacentToSelectedNode =
          selectedNodeIdsSet.has(connection.fromNodeId) || selectedNodeIdsSet.has(connection.toNodeId);

        return (
          <ConnectionRenderer
            key={connection.id}
            connection={connection}
            fromDragOffset={fromDragOffset}
            toDragOffset={toDragOffset}
            fromResizeSize={fromResizeSize}
            toResizeSize={toResizeSize}
            isSelected={isSelected}
            isHovered={isHovered}
            isAdjacentToSelectedNode={isAdjacentToSelectedNode}
          />
        );
      })}

      {/* Render drag connection */}
      <DragConnection />
    </svg>
  );
};

ConnectionLayer.displayName = "ConnectionLayer";

// ============================================================================
// DragConnection Types and Utilities
// ============================================================================

const EMPTY_PREVIEW_HANDLERS = {
  onPointerDown: (_event: React.PointerEvent) => {},
  onPointerEnter: (_event: React.PointerEvent) => {},
  onPointerLeave: (_event: React.PointerEvent) => {},
  onContextMenu: (_event?: React.MouseEvent) => {},
} as const;

type CustomConnectionRenderer = NonNullable<ReturnType<ReturnType<typeof useNodeDefinitions>["getPortDefinition"]>>["renderConnection"];

const resolveConnectionRenderer = (
  getPortDefinition: ReturnType<typeof useNodeDefinitions>["getPortDefinition"],
  primaryPort: CorePort | undefined,
  primaryNode: EditorNode | undefined,
  fallbackPort?: CorePort,
  fallbackNode?: EditorNode,
): CustomConnectionRenderer | null => {
  if (primaryPort && primaryNode) {
    const definition = getPortDefinition(primaryPort, primaryNode.type);
    if (definition?.renderConnection) {
      return definition.renderConnection;
    }
  }
  if (fallbackPort && fallbackNode) {
    const definition = getPortDefinition(fallbackPort, fallbackNode.type);
    if (definition?.renderConnection) {
      return definition.renderConnection;
    }
  }
  return null;
};

// ============================================================================
// ConnectingDragConnection (New Connection Drag)
// ============================================================================

const ConnectingDragConnectionComponent: React.FC = () => {
  const { state: actionState } = useEditorActionState();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { getPortDefinition } = useNodeDefinitions();

  const dragState = actionState.connectionDragState;
  if (!dragState) {
    return null;
  }

  const fromNodeId = dragState.fromPort.nodeId;
  const fromPortId = dragState.fromPort.id;
  const candidateNodeId = dragState.candidatePort?.nodeId ?? "";
  const candidatePortId = dragState.candidatePort?.id ?? "";

  const fromPos = useDynamicConnectionPoint(fromNodeId, fromPortId);
  const candidatePos = useDynamicConnectionPoint(candidateNodeId, candidatePortId);

  if (!fromPos) {
    return null;
  }

  const fromPortEntry = portLookupMap.get(`${fromNodeId}:${fromPortId}`)?.port ?? dragState.fromPort;
  const fromNode = nodeEditorState.nodes[fromPortEntry.nodeId];
  if (!fromNode) {
    return null;
  }

  const candidatePort = dragState.candidatePort ?? undefined;
  const candidateNode = candidatePort ? nodeEditorState.nodes[candidatePort.nodeId] : undefined;
  const toPosition = candidatePort && candidatePos ? candidatePos : dragState.toPosition;

  const renderer = resolveConnectionRenderer(getPortDefinition, fromPortEntry, fromNode, candidatePort, candidateNode);

  const pathData = calculateConnectionPath(
    fromPos,
    toPosition,
    fromPortEntry.position,
    candidatePort ? candidatePort.position : getOppositePortPosition(fromPortEntry.position),
  );

  const defaultRender = () => (
    <g className={styles.dragGroup} data-drag-state="connecting" shapeRendering="geometricPrecision">
      <path d={pathData} className={styles.dragPath} data-drag-variant="connecting" />
    </g>
  );

  if (!renderer) {
    return defaultRender();
  }

  const previewContext: ConnectionRenderContext = {
    connection: null,
    phase: "connecting",
    fromPort: fromPortEntry,
    toPort: candidatePort,
    fromNode,
    toNode: candidateNode,
    fromPosition: fromPos,
    toPosition,
    isSelected: false,
    isHovered: false,
    isAdjacentToSelectedNode: false,
    isDragging: true,
    dragProgress: undefined,
    handlers: EMPTY_PREVIEW_HANDLERS,
  };

  return (
    <ConnectionRendererInvoker
      key={`connecting-${fromPortEntry.id}`}
      renderer={renderer}
      context={previewContext}
      defaultRender={defaultRender}
    />
  );
};

const ConnectingDragConnection = React.memo(ConnectingDragConnectionComponent);
ConnectingDragConnection.displayName = "ConnectingDragConnection";

// ============================================================================
// DisconnectingDragConnection (Existing Connection Drag)
// ============================================================================

const DisconnectingDragConnectionComponent: React.FC = () => {
  const { state: actionState } = useEditorActionState();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { getPortDefinition } = useNodeDefinitions();

  const disconnectState = actionState.connectionDisconnectState;
  if (!disconnectState) {
    return null;
  }

  const fixedNodeId = disconnectState.fixedPort.nodeId;
  const fixedPortId = disconnectState.fixedPort.id;
  const candidateNodeId = disconnectState.candidatePort?.nodeId ?? "";
  const candidatePortId = disconnectState.candidatePort?.id ?? "";

  const fixedPos = useDynamicConnectionPoint(fixedNodeId, fixedPortId);
  const candidatePos = useDynamicConnectionPoint(candidateNodeId, candidatePortId);

  if (!fixedPos) {
    return null;
  }

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
  const candidatePosition = candidatePort && candidatePos ? candidatePos : draggingPosition;

  let fromPosition: Position;
  let toPosition: Position;
  let targetPort: CorePort | undefined = originalToPort;
  let targetNode: EditorNode | undefined = toNode;

  if (disconnectState.draggingEnd === "from") {
    fromPosition = candidatePosition;
    toPosition = fixedPos;
  } else {
    fromPosition = fixedPos;
    toPosition = candidatePosition;
  }

  if (candidatePort) {
    targetPort = candidatePort;
    targetNode = candidateNode ?? targetNode;
  }

  const renderer = resolveConnectionRenderer(getPortDefinition, originalFromPort, fromNode, targetPort, targetNode);

  const pathData = calculateConnectionPath(
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

  if (!renderer) {
    return defaultRender();
  }

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
    handlers: EMPTY_PREVIEW_HANDLERS,
  };

  return (
    <ConnectionRendererInvoker
      key={`disconnecting-${baseConnection.id}`}
      renderer={renderer}
      context={previewContext}
      defaultRender={defaultRender}
    />
  );
};

const DisconnectingDragConnection = React.memo(DisconnectingDragConnectionComponent);
DisconnectingDragConnection.displayName = "DisconnectingDragConnection";

// ============================================================================
// DragConnection (Coordinator Component)
// ============================================================================

const DragConnectionComponent: React.FC = () => {
  const { state: actionState } = useEditorActionState();

  if (actionState.connectionDragState) {
    return <ConnectingDragConnection />;
  }

  if (actionState.connectionDisconnectState) {
    return <DisconnectingDragConnection />;
  }

  return null;
};

const DragConnection = React.memo(DragConnectionComponent);
DragConnection.displayName = "DragConnection";

type RendererInvokerProps = {
  renderer: (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => React.ReactElement;
  context: ConnectionRenderContext;
  defaultRender: () => React.ReactElement;
};

const ConnectionRendererInvoker: React.FC<RendererInvokerProps> = ({ renderer, context, defaultRender }) => {
  return renderer(context, defaultRender);
};

// ============================================================================
// ConnectionRenderer Types
// ============================================================================

type ConnectionRendererContainerProps = {
  connection: Connection;
  fromDragOffset: Position | null;
  toDragOffset: Position | null;
  fromResizeSize: Size | null;
  toResizeSize: Size | null;
  isSelected: boolean;
  isHovered: boolean;
  isAdjacentToSelectedNode: boolean;
};

type ConnectionRendererInnerProps = {
  connection: Connection;
  fromNode: EditorNode;
  toNode: EditorNode;
  fromPort: CorePort;
  toPort: CorePort;
  fromPreviewPosition: Position | null;
  toPreviewPosition: Position | null;
  fromResizeSize: Size | null;
  toResizeSize: Size | null;
  isSelected: boolean;
  isHovered: boolean;
  isAdjacentToSelectedNode: boolean;
  onPointerDown: (e: React.PointerEvent, connectionId: string) => void;
  onPointerEnter: (e: React.PointerEvent, connectionId: string) => void;
  onPointerLeave: (e: React.PointerEvent, connectionId: string) => void;
  onContextMenu: (e: React.MouseEvent, connectionId: string) => void;
};

// ============================================================================
// ConnectionRenderer Inner Component (Pure Rendering)
// ============================================================================

const ConnectionRendererInnerComponent: React.FC<ConnectionRendererInnerProps> = ({
  connection,
  fromNode,
  toNode,
  fromPort,
  toPort,
  fromPreviewPosition,
  toPreviewPosition,
  fromResizeSize,
  toResizeSize,
  isSelected,
  isHovered,
  isAdjacentToSelectedNode,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  const { connection: ConnectionComponent } = useRenderers();

  return (
    <ConnectionComponent
      connection={connection}
      fromNode={fromNode}
      toNode={toNode}
      fromPort={fromPort}
      toPort={toPort}
      isAdjacentToSelectedNode={isAdjacentToSelectedNode}
      fromNodePosition={fromPreviewPosition || undefined}
      toNodePosition={toPreviewPosition || undefined}
      fromNodeSize={fromResizeSize || undefined}
      toNodeSize={toResizeSize || undefined}
      isSelected={isSelected}
      isHovered={isHovered}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
    />
  );
};

const areInnerPropsEqual = (
  prev: ConnectionRendererInnerProps,
  next: ConnectionRendererInnerProps,
): boolean => {
  if (prev.connection !== next.connection) {
    return false;
  }
  if (prev.isSelected !== next.isSelected || prev.isHovered !== next.isHovered) {
    return false;
  }
  if (prev.isAdjacentToSelectedNode !== next.isAdjacentToSelectedNode) {
    return false;
  }
  if (prev.fromNode !== next.fromNode || prev.toNode !== next.toNode) {
    return false;
  }
  if (prev.fromPort !== next.fromPort || prev.toPort !== next.toPort) {
    return false;
  }
  if (hasPositionChanged(prev.fromPreviewPosition, next.fromPreviewPosition)) {
    return false;
  }
  if (hasPositionChanged(prev.toPreviewPosition, next.toPreviewPosition)) {
    return false;
  }
  if (hasSizeChanged(prev.fromResizeSize, next.fromResizeSize)) {
    return false;
  }
  if (hasSizeChanged(prev.toResizeSize, next.toResizeSize)) {
    return false;
  }
  return true;
};

const ConnectionRendererInner = React.memo(ConnectionRendererInnerComponent, areInnerPropsEqual);
ConnectionRendererInner.displayName = "ConnectionRendererInner";

// ============================================================================
// ConnectionRenderer Container Component (Context-Aware)
// ============================================================================

const ConnectionRendererContainerComponent: React.FC<ConnectionRendererContainerProps> = ({
  connection,
  fromDragOffset,
  toDragOffset,
  fromResizeSize,
  toResizeSize,
  isSelected,
  isHovered,
  isAdjacentToSelectedNode,
}) => {
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();
  const interactionSettings = useInteractionSettings();
  const matchesPointerAction = usePointerShortcutMatcher();

  // Get nodes
  const fromNode = nodeEditorState.nodes[connection.fromNodeId];
  const toNode = nodeEditorState.nodes[connection.toNodeId];

  // Get dynamic port positions (used for validation in event handlers)
  const fromPortPos = useDynamicConnectionPoint(connection.fromNodeId, connection.fromPortId);
  const toPortPos = useDynamicConnectionPoint(connection.toNodeId, connection.toPortId);

  // Get ports with fallback
  const fromRaw = portLookupMap.get(`${connection.fromNodeId}:${connection.fromPortId}`)?.port as unknown;
  const toRaw = portLookupMap.get(`${connection.toNodeId}:${connection.toPortId}`)?.port as unknown;

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

  // Event handlers using useEffectEvent for stable references
  const handlePointerDown = React.useEffectEvent((e: React.PointerEvent, connectionId: string) => {
    if (!fromNode || !toNode || !fromPortPos || !toPortPos) {
      return;
    }

    const nativeEvent = e.nativeEvent;
    const matchesMultiSelect = matchesPointerAction("node-add-to-selection", nativeEvent);
    const matchesSelect = matchesPointerAction("node-select", nativeEvent) || matchesMultiSelect;

    if (!matchesSelect && !matchesMultiSelect) {
      return;
    }

    actionActions.selectConnection(connectionId, matchesMultiSelect);
  });

  const handlePointerEnter = React.useEffectEvent((_e: React.PointerEvent, connectionId: string) => {
    actionActions.setHoveredConnection(connectionId);
  });

  const handlePointerLeave = React.useEffectEvent((_e: React.PointerEvent, _connectionId: string) => {
    actionActions.setHoveredConnection(null);
  });

  const handleContextMenu = React.useEffectEvent((e: React.MouseEvent, connectionId: string) => {
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

    const position = { x: e.clientX, y: e.clientY };
    const canvasPos = utils.screenToCanvas(e.clientX, e.clientY);

    const defaultShow = () => actionActions.showContextMenu({ position, canvasPosition: canvasPos, connectionId });

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
  });

  // Early return if nodes are missing or not visible
  if (!fromNode || !toNode) {
    return null;
  }
  if (fromNode.visible === false || toNode.visible === false) {
    return null;
  }

  // Calculate preview positions
  const fromPreviewPosition = getPreviewPosition(fromNode.position, fromDragOffset);
  const toPreviewPosition = getPreviewPosition(toNode.position, toDragOffset);

  return (
    <ConnectionRendererInner
      connection={connection}
      fromNode={fromNode}
      toNode={toNode}
      fromPort={fromPort}
      toPort={toPort}
      fromPreviewPosition={fromPreviewPosition}
      toPreviewPosition={toPreviewPosition}
      fromResizeSize={fromResizeSize}
      toResizeSize={toResizeSize}
      isSelected={isSelected}
      isHovered={isHovered}
      isAdjacentToSelectedNode={isAdjacentToSelectedNode}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
    />
  );
};

const areContainerPropsEqual = (
  prev: ConnectionRendererContainerProps,
  next: ConnectionRendererContainerProps,
): boolean => {
  if (prev.connection !== next.connection) {
    return false;
  }
  if (prev.isSelected !== next.isSelected || prev.isHovered !== next.isHovered) {
    return false;
  }
  if (prev.isAdjacentToSelectedNode !== next.isAdjacentToSelectedNode) {
    return false;
  }
  if (hasPositionChanged(prev.fromDragOffset, next.fromDragOffset)) {
    return false;
  }
  if (hasPositionChanged(prev.toDragOffset, next.toDragOffset)) {
    return false;
  }
  if (hasSizeChanged(prev.fromResizeSize, next.fromResizeSize)) {
    return false;
  }
  if (hasSizeChanged(prev.toResizeSize, next.toResizeSize)) {
    return false;
  }
  return true;
};

const ConnectionRenderer = React.memo(ConnectionRendererContainerComponent, areContainerPropsEqual);
ConnectionRenderer.displayName = "ConnectionRenderer";
