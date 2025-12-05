/**
 * @file ConnectionRenderer component
 * Split into Container (context-aware) and Inner (pure rendering) for optimal memoization.
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useEditorActionState } from "../../contexts/composed/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/composed/canvas/viewport/context";
import { useDynamicConnectionPoint } from "../../contexts/node-ports/hooks/usePortPosition";
import { useRenderers } from "../../contexts/RendererContext";
import { useInteractionSettings } from "../../contexts/interaction-settings/context";
import { usePointerShortcutMatcher } from "../../contexts/interaction-settings/hooks/usePointerShortcutMatcher";
import { getPreviewPosition } from "../../core/geometry/position";
import { hasPositionChanged, hasSizeChanged } from "../../core/geometry/comparators";
import { ensurePort } from "../../core/port/typeGuards";
import type { Connection, Node as EditorNode, Port as CorePort, Position, Size } from "../../types/core";
import type { PointerType } from "../../types/interaction";

// ============================================================================
// Types
// ============================================================================

export type ConnectionRendererProps = {
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
// Inner Component (Pure Rendering)
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

const areInnerPropsEqual = (prev: ConnectionRendererInnerProps, next: ConnectionRendererInnerProps): boolean => {
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
// Container Component (Context-Aware)
// ============================================================================

const ConnectionRendererContainerComponent: React.FC<ConnectionRendererProps> = ({
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

const areContainerPropsEqual = (prev: ConnectionRendererProps, next: ConnectionRendererProps): boolean => {
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

export const ConnectionRenderer = React.memo(ConnectionRendererContainerComponent, areContainerPropsEqual);
ConnectionRenderer.displayName = "ConnectionRenderer";
