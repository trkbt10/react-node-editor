/**
 * @file ConnectionView component
 */
import * as React from "react";
import type { Connection, Node, Port } from "../../types/core";
import {
  calculateBezierPath,
  calculateBezierControlPoints,
  cubicBezierPoint,
  cubicBezierTangent,
} from "./utils/connectionUtils";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import { useNodeDefinition } from "../../contexts/node-definitions";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import {
  CONNECTION_APPEARANCES,
  determineConnectionInteractionPhase,
  type ConnectionAdjacency,
  type ConnectionInteractionPhase,
  type ConnectionVisualAppearance,
} from "./connectionAppearance";
import { createMarkerGeometry, placeMarkerGeometry } from "./markerShapes";
import styles from "./ConnectionView.module.css";

type XYPosition = { x: number; y: number };
const DIRECTION_MARKER_RADIUS = 2;

const computeConnectionPoint = (
  basePosition: XYPosition | undefined,
  nodePosition: XYPosition,
  overridePosition?: XYPosition,
): XYPosition => {
  if (!basePosition) {
    return { x: nodePosition.x, y: nodePosition.y };
  }

  if (!overridePosition) {
    return basePosition;
  }

  return {
    x: basePosition.x + (overridePosition.x - nodePosition.x),
    y: basePosition.y + (overridePosition.y - nodePosition.y),
  };
};

export type ConnectionViewProps = {
  connection: Connection;
  fromNode: Node;
  toNode: Node;
  fromPort: Port;
  toPort: Port;
  isSelected: boolean;
  isHovered: boolean;
  // True when this connection touches a selected node
  isAdjacentToSelectedNode?: boolean;
  isDragging?: boolean;
  dragProgress?: number; // 0-1 for visual feedback during disconnect
  // Optional override positions for preview during drag
  fromNodePosition?: { x: number; y: number };
  toNodePosition?: { x: number; y: number };
  fromNodeSize?: { width: number; height: number };
  toNodeSize?: { width: number; height: number };
  onPointerDown?: (e: React.PointerEvent, connectionId: string) => void;
  onPointerEnter?: (e: React.PointerEvent, connectionId: string) => void;
  onPointerLeave?: (e: React.PointerEvent, connectionId: string) => void;
  onContextMenu?: (e: React.MouseEvent, connectionId: string) => void;
};

/**
 * ConnectionView - Renders a single connection between two ports
 */
const ConnectionViewComponent: React.FC<ConnectionViewProps> = ({
  connection,
  fromNode,
  toNode,
  fromPort,
  toPort,
  isSelected,
  isHovered,
  isDragging,
  dragProgress = 0,
  isAdjacentToSelectedNode = false,
  fromNodePosition,
  toNodePosition,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  // Get dynamic port positions
  const baseFromPosition = useDynamicConnectionPoint(fromNode.id, fromPort.id);
  const baseToPosition = useDynamicConnectionPoint(toNode.id, toPort.id);

  // Calculate port positions (use override positions for drag preview)
  const fromPosition = React.useMemo(
    () => computeConnectionPoint(baseFromPosition, fromNode.position, fromNodePosition),
    [baseFromPosition, fromNode.position.x, fromNode.position.y, fromNodePosition?.x, fromNodePosition?.y],
  );

  const toPosition = React.useMemo(
    () => computeConnectionPoint(baseToPosition, toNode.position, toNodePosition),
    [baseToPosition, toNode.position.x, toNode.position.y, toNodePosition?.x, toNodePosition?.y],
  );

  const adjacency: ConnectionAdjacency = isAdjacentToSelectedNode ? "adjacent" : "self";
  const interactionPhase = React.useMemo<ConnectionInteractionPhase>(
    () =>
      determineConnectionInteractionPhase({
        isDragging,
        dragProgress,
        isSelected,
        isHovered,
      }),
    [isDragging, dragProgress, isSelected, isHovered],
  );

  const visualAppearance = React.useMemo<ConnectionVisualAppearance>(
    () => CONNECTION_APPEARANCES[interactionPhase][adjacency],
    [interactionPhase, adjacency],
  );

  // Calculate bezier path (recalculate when positions change)
  const pathData = React.useMemo(
    () => calculateBezierPath(fromPosition, toPosition, fromPort.position, toPort.position),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPort.position, toPort.position],
  );
  // Compute mid-point and angle along the bezier at t=0.5
  const midAndAngle = React.useMemo(() => {
    const { cp1, cp2 } = calculateBezierControlPoints(fromPosition, toPosition, fromPort.position, toPort.position);
    const t = 0.5;
    const pt = cubicBezierPoint(fromPosition, cp1, cp2, toPosition, t);
    const tan = cubicBezierTangent(fromPosition, cp1, cp2, toPosition, t);
    const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
    return { x: pt.x, y: pt.y, angle };
  }, [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPort.position, toPort.position]);
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

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onPointerDown?.(e, connection.id);
    },
    [connection.id, onPointerDown],
  );

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent) => {
      onPointerEnter?.(e, connection.id);
    },
    [connection.id, onPointerEnter],
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent) => {
      onPointerLeave?.(e, connection.id);
    },
    [connection.id, onPointerLeave],
  );

  // Get node definitions to check for custom connection renderer
  const fromNodeDefinition = useNodeDefinition(fromNode.type);
  const toNodeDefinition = useNodeDefinition(toNode.type);

  // Find port definitions
  const fromPortDefinition = fromNodeDefinition?.ports?.find((p) => p.id === fromPort.id);
  const toPortDefinition = toNodeDefinition?.ports?.find((p) => p.id === toPort.id);

  // Prefer fromPort's renderer, fallback to toPort's renderer
  const customRenderer = fromPortDefinition?.renderConnection || toPortDefinition?.renderConnection;

  // Default render function
  const defaultRender = React.useCallback(
    () => (
      <g
        className={styles.connectionGroup}
        data-selected={isSelected}
        data-hovered={isHovered}
        data-dragging={isDragging}
        data-adjacent-node-selected={isAdjacentToSelectedNode}
        shapeRendering="geometricPrecision"
        data-connection-id={connection.id}
      >
        {/* Base connection line (hit test only on stroke). Draw first, stripes overlay. */}
        <path
          d={pathData}
          style={visualAppearance.path.style}
          className={styles.connectionBase}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => {
            e.stopPropagation();
            onContextMenu?.(e, connection.id);
          }}
        />

        {/* Flow stripes when hovered or selected (render after base so they appear on top) */}
        {visualAppearance.stripes.map((stripe) => (
          <path
            key={stripe.id}
            d={pathData}
            style={stripe.style}
            data-testid="connection-flow-stripe"
          />
        ))}

        {/* Direction marker at mid-point */}
        <g transform={`translate(${midAndAngle.x}, ${midAndAngle.y})`}>
          <circle r={DIRECTION_MARKER_RADIUS} style={visualAppearance.direction.style} />
        </g>

        {/* Arrow marker at the end */}
        <defs>
          <marker
            id={`arrow-${connection.id}`}
            viewBox={arrowMarker.viewBox}
            refX={arrowMarker.refX}
            refY={arrowMarker.refY}
            markerWidth={arrowMarker.markerWidth}
            markerHeight={arrowMarker.markerHeight}
            markerUnits={arrowMarker.markerUnits}
            orient={arrowMarker.orient}
          >
            <path
              d={arrowMarker.path}
              style={visualAppearance.arrowHead.style}
            />
          </marker>
        </defs>

        {/* Apply arrow marker to the visible path */}
        <path d={pathData} markerEnd={`url(#arrow-${connection.id})`} className={styles.connectionArrowOverlay} />
      </g>
    ),
    [
      connection.id,
      pathData,
      midAndAngle,
      arrowMarker,
      visualAppearance,
      isSelected,
      isHovered,
      isDragging,
      isAdjacentToSelectedNode,
      handlePointerDown,
      handlePointerEnter,
      handlePointerLeave,
      onContextMenu,
    ],
  );

  // Check if there's a custom renderer
  if (customRenderer) {
    // Build context for custom renderer
    const context: ConnectionRenderContext = {
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
    };

    return customRenderer(context, defaultRender);
  }

  // Use default rendering
  return defaultRender();
};

// Custom comparison function for memo
const areEqual = (prevProps: ConnectionViewProps, nextProps: ConnectionViewProps): boolean => {
  // Always re-render if basic properties change
  if (
    prevProps.connection.id !== nextProps.connection.id ||
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isHovered !== nextProps.isHovered ||
    prevProps.isAdjacentToSelectedNode !== nextProps.isAdjacentToSelectedNode ||
    prevProps.isDragging !== nextProps.isDragging ||
    prevProps.dragProgress !== nextProps.dragProgress
  ) {
    return false;
  }

  // Check node position changes (both actual and preview positions)
  if (
    prevProps.fromNode.position.x !== nextProps.fromNode.position.x ||
    prevProps.fromNode.position.y !== nextProps.fromNode.position.y ||
    prevProps.toNode.position.x !== nextProps.toNode.position.x ||
    prevProps.toNode.position.y !== nextProps.toNode.position.y ||
    prevProps.fromNodePosition?.x !== nextProps.fromNodePosition?.x ||
    prevProps.fromNodePosition?.y !== nextProps.fromNodePosition?.y ||
    prevProps.toNodePosition?.x !== nextProps.toNodePosition?.x ||
    prevProps.toNodePosition?.y !== nextProps.toNodePosition?.y
  ) {
    return false;
  }

  // Check node size changes (both actual and preview sizes)
  if (
    prevProps.fromNode.size?.width !== nextProps.fromNode.size?.width ||
    prevProps.fromNode.size?.height !== nextProps.fromNode.size?.height ||
    prevProps.toNode.size?.width !== nextProps.toNode.size?.width ||
    prevProps.toNode.size?.height !== nextProps.toNode.size?.height ||
    prevProps.fromNodeSize?.width !== nextProps.fromNodeSize?.width ||
    prevProps.fromNodeSize?.height !== nextProps.fromNodeSize?.height ||
    prevProps.toNodeSize?.width !== nextProps.toNodeSize?.width ||
    prevProps.toNodeSize?.height !== nextProps.toNodeSize?.height
  ) {
    return false;
  }

  // Check port position changes
  if (
    prevProps.fromPort.position !== nextProps.fromPort.position ||
    prevProps.toPort.position !== nextProps.toPort.position
  ) {
    return false;
  }

  // Re-render when node data changes so custom renderers receive fresh values
  if (prevProps.fromNode.data !== nextProps.fromNode.data || prevProps.toNode.data !== nextProps.toNode.data) {
    return false;
  }

  // Props are equal, skip re-render
  return true;
};

// Export memoized component
export const ConnectionView = React.memo(ConnectionViewComponent, areEqual);

ConnectionView.displayName = "ConnectionView";

/*
debug-notes:
- Reviewed src/components/connection/connectionAppearance.ts to align arrow head size fields (depth/halfBase).
- Reviewed src/types/NodeDefinition.ts for ConnectionRenderContext details.
*/
