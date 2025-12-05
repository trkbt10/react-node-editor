/**
 * @file DragConnection component
 * Renders the preview connection line during drag operations (connecting or disconnecting).
 */
import * as React from "react";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import { useDynamicConnectionPoint } from "../../contexts/node-ports/hooks/usePortPosition";
import { calculateConnectionPath } from "../../core/connection/path";
import { getOppositeSide } from "../../core/port/side";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import type { Connection, Node as EditorNode, Port as CorePort, PortPosition, Position } from "../../types/core";
import styles from "./DragConnection.module.css";

// ============================================================================
// Types
// ============================================================================

type DragVariant = "connecting" | "disconnecting";

type DragConnectionParams = {
  variant: DragVariant;
  fromPosition: Position;
  toPosition: Position;
  fromDirection: PortPosition;
  toDirection: PortPosition;
  fromPort: CorePort;
  toPort: CorePort | undefined;
  fromNode: EditorNode;
  toNode: EditorNode | undefined;
  connection: Connection | null;
};

// ============================================================================
// Shared utilities
// ============================================================================

const EMPTY_PREVIEW_HANDLERS = {
  onPointerDown: (_event: React.PointerEvent) => {},
  onPointerEnter: (_event: React.PointerEvent) => {},
  onPointerLeave: (_event: React.PointerEvent) => {},
  onContextMenu: (_event?: React.MouseEvent) => {},
} as const;

type CustomConnectionRenderer = NonNullable<
  ReturnType<ReturnType<typeof useNodeDefinitions>["getPortDefinition"]>
>["renderConnection"];

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
// Hooks for extracting drag parameters
// ============================================================================

const useConnectingParams = (): DragConnectionParams | null => {
  const { state: interactionState } = useCanvasInteraction();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();

  const dragState = interactionState.connectionDragState;

  const fromNodeId = dragState?.fromPort.nodeId ?? "";
  const fromPortId = dragState?.fromPort.id ?? "";
  const candidateNodeId = dragState?.candidatePort?.nodeId ?? "";
  const candidatePortId = dragState?.candidatePort?.id ?? "";

  const fromPos = useDynamicConnectionPoint(fromNodeId, fromPortId);
  const candidatePos = useDynamicConnectionPoint(candidateNodeId, candidatePortId);

  if (!dragState || !fromPos) {
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

  const fromDirection = fromPos.connectionDirection;
  const toDirection = candidatePos?.connectionDirection ?? getOppositeSide(fromDirection);

  return {
    variant: "connecting",
    fromPosition: fromPos,
    toPosition,
    fromDirection,
    toDirection,
    fromPort: fromPortEntry,
    toPort: candidatePort,
    fromNode,
    toNode: candidateNode,
    connection: null,
  };
};

const useDisconnectingParams = (): DragConnectionParams | null => {
  const { state: interactionState } = useCanvasInteraction();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();

  const disconnectState = interactionState.connectionDisconnectState;

  const fixedNodeId = disconnectState?.fixedPort.nodeId ?? "";
  const fixedPortId = disconnectState?.fixedPort.id ?? "";
  const candidateNodeId = disconnectState?.candidatePort?.nodeId ?? "";
  const candidatePortId = disconnectState?.candidatePort?.id ?? "";

  const fixedPos = useDynamicConnectionPoint(fixedNodeId, fixedPortId);
  const candidatePos = useDynamicConnectionPoint(candidateNodeId, candidatePortId);

  if (!disconnectState || !fixedPos) {
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

  const fixedDirection = fixedPos.connectionDirection;
  const candidateDirection = candidatePos?.connectionDirection ?? getOppositeSide(fixedDirection);

  const isDraggingFrom = disconnectState.draggingEnd === "from";

  return {
    variant: "disconnecting",
    fromPosition: isDraggingFrom ? candidatePosition : fixedPos,
    toPosition: isDraggingFrom ? fixedPos : candidatePosition,
    fromDirection: isDraggingFrom ? candidateDirection : fixedDirection,
    toDirection: isDraggingFrom ? fixedDirection : candidateDirection,
    fromPort: originalFromPort,
    toPort: candidatePort ?? originalToPort,
    fromNode,
    toNode: candidateNode ?? toNode,
    connection: baseConnection,
  };
};

// ============================================================================
// Main Component
// ============================================================================

const DragConnectionComponent: React.FC = () => {
  const { getPortDefinition } = useNodeDefinitions();

  const connectingParams = useConnectingParams();
  const disconnectingParams = useDisconnectingParams();

  const params = connectingParams ?? disconnectingParams;
  if (!params) {
    return null;
  }

  const {
    variant,
    fromPosition,
    toPosition,
    fromDirection,
    toDirection,
    fromPort,
    toPort,
    fromNode,
    toNode,
    connection,
  } = params;

  const renderer = resolveConnectionRenderer(getPortDefinition, fromPort, fromNode, toPort, toNode);

  const pathData = calculateConnectionPath(fromPosition, toPosition, fromDirection, toDirection);

  const defaultRender = () => (
    <g className={styles.dragGroup} data-drag-state={variant} shapeRendering="geometricPrecision">
      <path d={pathData} className={styles.dragPath} data-drag-variant={variant} />
    </g>
  );

  if (!renderer) {
    return defaultRender();
  }

  const previewContext: ConnectionRenderContext = {
    connection,
    phase: variant,
    fromPort,
    toPort,
    fromNode,
    toNode,
    fromPosition,
    toPosition,
    fromConnectionDirection: fromDirection,
    toConnectionDirection: toDirection,
    isSelected: false,
    isHovered: false,
    isAdjacentToSelectedNode: false,
    isDragging: true,
    dragProgress: undefined,
    handlers: EMPTY_PREVIEW_HANDLERS,
  };

  return renderer(previewContext, defaultRender);
};

export const DragConnection = React.memo(DragConnectionComponent);
DragConnection.displayName = "DragConnection";
