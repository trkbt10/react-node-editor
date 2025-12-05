/**
 * @file DisconnectingDragConnection component
 * Renders the preview connection line when disconnecting/reconnecting an existing connection.
 */
import * as React from "react";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import { useDynamicConnectionPoint } from "../../contexts/node-ports/hooks/usePortPosition";
import { calculateConnectionPath } from "../../core/connection/path";
import { getOppositePortPosition } from "../../core/port/position";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import type { Position, Node as EditorNode, Port as CorePort } from "../../types/core";
import styles from "./DisconnectingDragConnection.module.css";

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

const DisconnectingDragConnectionComponent: React.FC = () => {
  const { state: interactionState } = useCanvasInteraction();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { getPortDefinition } = useNodeDefinitions();

  const disconnectState = interactionState.connectionDisconnectState;
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

  // Use connectionDirection from computed port position (source of truth)
  // For disconnecting, the fixed port's direction comes from fixedPos
  const fixedDirection = fixedPos.connectionDirection;
  const candidateDirection = candidatePos?.connectionDirection ?? getOppositePortPosition(fixedDirection);

  // Determine from/to directions based on which end is being dragged
  const fromDirection = disconnectState.draggingEnd === "from" ? candidateDirection : fixedDirection;
  const toDirection = disconnectState.draggingEnd === "from" ? fixedDirection : candidateDirection;

  const pathData = calculateConnectionPath(fromPosition, toPosition, fromDirection, toDirection);

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

export const DisconnectingDragConnection = React.memo(DisconnectingDragConnectionComponent);
DisconnectingDragConnection.displayName = "DisconnectingDragConnection";
