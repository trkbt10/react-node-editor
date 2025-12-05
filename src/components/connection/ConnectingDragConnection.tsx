/**
 * @file ConnectingDragConnection component
 * Renders the preview connection line when creating a new connection.
 */
import * as React from "react";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import { useDynamicConnectionPoint } from "../../contexts/node-ports/hooks/usePortPosition";
import { calculateConnectionPath } from "../../core/connection/path";
import { getOppositePortPosition } from "../../core/port/position";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import type { Node as EditorNode, Port as CorePort } from "../../types/core";
import styles from "./ConnectingDragConnection.module.css";

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

const ConnectingDragConnectionComponent: React.FC = () => {
  const { state: interactionState } = useCanvasInteraction();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { getPortDefinition } = useNodeDefinitions();

  const dragState = interactionState.connectionDragState;
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

  // Use connectionDirection from computed port position (source of truth)
  const fromDirection = fromPos.connectionDirection;
  const toDirection = candidatePos?.connectionDirection ?? getOppositePortPosition(fromDirection);

  const pathData = calculateConnectionPath(fromPos, toPosition, fromDirection, toDirection);

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

export const ConnectingDragConnection = React.memo(ConnectingDragConnectionComponent);
ConnectingDragConnection.displayName = "ConnectingDragConnection";
