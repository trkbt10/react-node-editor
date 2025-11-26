/**
 * @file ConnectionView component
 * Split into Container (context-aware) and Inner (pure rendering) for optimal memoization.
 */
import * as React from "react";
import type { Connection, Node, Port, PortPosition, Position } from "../../types/core";
import { calculateConnectionPath, calculateConnectionMidpoint } from "../../core/connection/path";
import { hasAnyPositionChanged, hasAnySizeChanged } from "../../core/geometry/comparators";
import { hasPortPositionChanged } from "../../core/port/comparators";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import type { ConnectionRenderContext, PortDefinition } from "../../types/NodeDefinition";
import {
  CONNECTION_APPEARANCES,
  determineConnectionInteractionPhase,
  type ConnectionAdjacency,
  type ConnectionInteractionPhase,
  type ConnectionVisualAppearance,
} from "../../core/connection/appearance";
import { createMarkerGeometry, placeMarkerGeometry } from "../../core/connection/marker";
import styles from "./ConnectionView.module.css";

const DIRECTION_MARKER_RADIUS = 2;

// ============================================================================
// Types
// ============================================================================

export type ConnectionViewProps = {
  connection: Connection;
  fromNode: Node;
  toNode: Node;
  fromPort: Port;
  toPort: Port;
  isSelected: boolean;
  isHovered: boolean;
  isAdjacentToSelectedNode?: boolean;
  isDragging?: boolean;
  dragProgress?: number;
  fromNodePosition?: Position;
  toNodePosition?: Position;
  fromNodeSize?: { width: number; height: number };
  toNodeSize?: { width: number; height: number };
  onPointerDown?: (e: React.PointerEvent, connectionId: string) => void;
  onPointerEnter?: (e: React.PointerEvent, connectionId: string) => void;
  onPointerLeave?: (e: React.PointerEvent, connectionId: string) => void;
  onContextMenu?: (e: React.MouseEvent, connectionId: string) => void;
};

type ConnectionViewInnerProps = {
  connectionId: string;
  fromPosition: Position;
  toPosition: Position;
  fromPortPosition: PortPosition;
  toPortPosition: PortPosition;
  isSelected: boolean;
  isHovered: boolean;
  isAdjacentToSelectedNode: boolean;
  isDragging: boolean;
  dragProgress: number;
  customRenderer: PortDefinition["renderConnection"] | undefined;
  renderContext: ConnectionRenderContext;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

// ============================================================================
// Inner Component (Pure Rendering)
// ============================================================================

const ConnectionViewInnerComponent: React.FC<ConnectionViewInnerProps> = ({
  connectionId,
  fromPosition,
  toPosition,
  fromPortPosition,
  toPortPosition,
  isSelected,
  isHovered,
  isAdjacentToSelectedNode,
  isDragging,
  dragProgress,
  customRenderer,
  renderContext,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  const adjacency: ConnectionAdjacency = isAdjacentToSelectedNode ? "adjacent" : "self";

  const interactionPhase = React.useMemo<ConnectionInteractionPhase>(
    () => determineConnectionInteractionPhase({ isDragging, dragProgress, isSelected, isHovered }),
    [isDragging, dragProgress, isSelected, isHovered],
  );

  const visualAppearance = React.useMemo<ConnectionVisualAppearance>(
    () => CONNECTION_APPEARANCES[interactionPhase][adjacency],
    [interactionPhase, adjacency],
  );

  const pathData = React.useMemo(
    () => calculateConnectionPath(fromPosition, toPosition, fromPortPosition, toPortPosition),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPortPosition, toPortPosition],
  );

  const midAndAngle = React.useMemo(
    () => calculateConnectionMidpoint(fromPosition, toPosition, fromPortPosition, toPortPosition),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPortPosition, toPortPosition],
  );

  const arrowGeometry = React.useMemo(
    () =>
      createMarkerGeometry(visualAppearance.arrowHead.shape, {
        depth: visualAppearance.arrowHead.dimensions.depth,
        halfBase: visualAppearance.arrowHead.dimensions.halfBase,
      }),
    [
      visualAppearance.arrowHead.shape,
      visualAppearance.arrowHead.dimensions.depth,
      visualAppearance.arrowHead.dimensions.halfBase,
    ],
  );

  const arrowMarker = React.useMemo(
    () => placeMarkerGeometry(arrowGeometry, { offset: visualAppearance.arrowHead.offset }),
    [arrowGeometry, visualAppearance.arrowHead.offset],
  );

  const defaultRender = React.useCallback(
    () => (
      <g
        className={styles.connectionGroup}
        data-selected={isSelected}
        data-hovered={isHovered}
        data-dragging={isDragging}
        data-adjacent-node-selected={isAdjacentToSelectedNode}
        shapeRendering="geometricPrecision"
        data-connection-id={connectionId}
      >
        <path
          d={pathData}
          style={visualAppearance.path.style}
          className={styles.connectionBase}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onContextMenu={onContextMenu}
        />
        {visualAppearance.stripes.map((stripe) => (
          <path key={stripe.id} d={pathData} style={stripe.style} data-testid="connection-flow-stripe" />
        ))}
        <g transform={`translate(${midAndAngle.x}, ${midAndAngle.y})`}>
          <circle r={DIRECTION_MARKER_RADIUS} style={visualAppearance.direction.style} />
        </g>
        <defs>
          <marker
            id={`arrow-${connectionId}`}
            viewBox={arrowMarker.viewBox}
            refX={arrowMarker.refX}
            refY={arrowMarker.refY}
            markerWidth={arrowMarker.markerWidth}
            markerHeight={arrowMarker.markerHeight}
            markerUnits={arrowMarker.markerUnits}
            orient={arrowMarker.orient}
          >
            <path d={arrowMarker.path} style={visualAppearance.arrowHead.style} />
          </marker>
        </defs>
        <path d={pathData} markerEnd={`url(#arrow-${connectionId})`} className={styles.connectionArrowOverlay} />
      </g>
    ),
    [
      connectionId,
      pathData,
      midAndAngle,
      arrowMarker,
      visualAppearance,
      isSelected,
      isHovered,
      isDragging,
      isAdjacentToSelectedNode,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onContextMenu,
    ],
  );

  if (customRenderer) {
    return customRenderer(renderContext, defaultRender);
  }

  return defaultRender();
};

const areInnerPropsEqual = (prev: ConnectionViewInnerProps, next: ConnectionViewInnerProps): boolean => {
  if (prev.connectionId !== next.connectionId) {
    return false;
  }
  if (prev.isSelected !== next.isSelected || prev.isHovered !== next.isHovered) {
    return false;
  }
  if (prev.isAdjacentToSelectedNode !== next.isAdjacentToSelectedNode) {
    return false;
  }
  if (prev.isDragging !== next.isDragging || prev.dragProgress !== next.dragProgress) {
    return false;
  }
  if (
    prev.fromPosition.x !== next.fromPosition.x ||
    prev.fromPosition.y !== next.fromPosition.y ||
    prev.toPosition.x !== next.toPosition.x ||
    prev.toPosition.y !== next.toPosition.y
  ) {
    return false;
  }
  if (prev.fromPortPosition !== next.fromPortPosition || prev.toPortPosition !== next.toPortPosition) {
    return false;
  }
  if (prev.customRenderer !== next.customRenderer) {
    return false;
  }
  // renderContext is memoized in container, check by reference
  if (prev.renderContext !== next.renderContext) {
    return false;
  }
  return true;
};

const ConnectionViewInner = React.memo(ConnectionViewInnerComponent, areInnerPropsEqual);
ConnectionViewInner.displayName = "ConnectionViewInner";

// ============================================================================
// Container Component (Context-Aware)
// ============================================================================

const resolvePosition = (
  basePosition: Position | undefined,
  nodePosition: Position,
  overridePosition?: Position,
): Position => basePosition ?? overridePosition ?? nodePosition;

const ConnectionViewContainer: React.FC<ConnectionViewProps> = ({
  connection,
  fromNode,
  toNode,
  fromPort,
  toPort,
  isSelected,
  isHovered,
  isDragging = false,
  dragProgress = 0,
  isAdjacentToSelectedNode = false,
  fromNodePosition,
  toNodePosition,
  fromNodeSize,
  toNodeSize,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  const connectionId = connection.id;

  // Dynamic port positions
  const baseFromPosition = useDynamicConnectionPoint(fromNode.id, fromPort.id, {
    positionOverride: fromNodePosition ?? undefined,
    sizeOverride: fromNodeSize ?? undefined,
    applyInteractionPreview: false,
  });
  const baseToPosition = useDynamicConnectionPoint(toNode.id, toPort.id, {
    positionOverride: toNodePosition ?? undefined,
    sizeOverride: toNodeSize ?? undefined,
    applyInteractionPreview: false,
  });

  const fromPosition = React.useMemo(
    () => resolvePosition(baseFromPosition, fromNode.position, fromNodePosition),
    [baseFromPosition, fromNode.position.x, fromNode.position.y, fromNodePosition?.x, fromNodePosition?.y],
  );

  const toPosition = React.useMemo(
    () => resolvePosition(baseToPosition, toNode.position, toNodePosition),
    [baseToPosition, toNode.position.x, toNode.position.y, toNodePosition?.x, toNodePosition?.y],
  );

  // Event handlers (stable via useEffectEvent)
  const handlePointerDown = React.useEffectEvent((e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerDown?.(e, connectionId);
  });

  const handlePointerEnter = React.useEffectEvent((e: React.PointerEvent) => {
    onPointerEnter?.(e, connectionId);
  });

  const handlePointerLeave = React.useEffectEvent((e: React.PointerEvent) => {
    onPointerLeave?.(e, connectionId);
  });

  const handleContextMenu = React.useEffectEvent((e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu?.(e, connectionId);
  });

  // Get port definitions for custom renderer (context access)
  const { getPortDefinition } = useNodeDefinitions();
  const fromPortDefinition = getPortDefinition(fromPort, fromNode.type);
  const toPortDefinition = getPortDefinition(toPort, toNode.type);
  const customRenderer = fromPortDefinition?.renderConnection || toPortDefinition?.renderConnection;

  // Build render context for custom renderer
  const renderContext: ConnectionRenderContext = React.useMemo(
    () => ({
      connection,
      phase: "connected",
      fromPort,
      toPort,
      fromNode,
      toNode,
      fromPosition,
      toPosition,
      isSelected,
      isHovered,
      isAdjacentToSelectedNode,
      isDragging,
      dragProgress,
      handlers: {
        onPointerDown: handlePointerDown,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        onContextMenu: handleContextMenu,
      },
    }),
    [
      connection,
      fromPort,
      toPort,
      fromNode,
      toNode,
      fromPosition,
      toPosition,
      isSelected,
      isHovered,
      isAdjacentToSelectedNode,
      isDragging,
      dragProgress,
    ],
  );

  return (
    <ConnectionViewInner
      connectionId={connectionId}
      fromPosition={fromPosition}
      toPosition={toPosition}
      fromPortPosition={fromPort.position}
      toPortPosition={toPort.position}
      isSelected={isSelected}
      isHovered={isHovered}
      isAdjacentToSelectedNode={isAdjacentToSelectedNode}
      isDragging={isDragging}
      dragProgress={dragProgress}
      customRenderer={customRenderer}
      renderContext={renderContext}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
    />
  );
};

// ============================================================================
// Exported Memoized Component
// ============================================================================

const areContainerPropsEqual = (prev: ConnectionViewProps, next: ConnectionViewProps): boolean => {
  if (
    prev.connection.id !== next.connection.id ||
    prev.isSelected !== next.isSelected ||
    prev.isHovered !== next.isHovered ||
    prev.isAdjacentToSelectedNode !== next.isAdjacentToSelectedNode ||
    prev.isDragging !== next.isDragging ||
    prev.dragProgress !== next.dragProgress
  ) {
    return false;
  }

  if (
    hasAnyPositionChanged([
      [prev.fromNode.position, next.fromNode.position],
      [prev.toNode.position, next.toNode.position],
      [prev.fromNodePosition, next.fromNodePosition],
      [prev.toNodePosition, next.toNodePosition],
    ])
  ) {
    return false;
  }

  if (
    hasAnySizeChanged([
      [prev.fromNode.size, next.fromNode.size],
      [prev.toNode.size, next.toNode.size],
      [prev.fromNodeSize, next.fromNodeSize],
      [prev.toNodeSize, next.toNodeSize],
    ])
  ) {
    return false;
  }

  if (hasPortPositionChanged(prev.fromPort, next.fromPort) || hasPortPositionChanged(prev.toPort, next.toPort)) {
    return false;
  }

  if (prev.fromNode.data !== next.fromNode.data || prev.toNode.data !== next.toNode.data) {
    return false;
  }

  return true;
};

export const ConnectionView = React.memo(ConnectionViewContainer, areContainerPropsEqual);
ConnectionView.displayName = "ConnectionView";
