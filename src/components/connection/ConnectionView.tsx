import * as React from "react";
import type { Connection, Node, Port } from "../../types/core";
import { calculateBezierPath, calculateBezierControlPoints, cubicBezierPoint, cubicBezierTangent } from "./utils/connectionUtils";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import { useNodeDefinition } from "../../contexts/NodeDefinitionContext";
import type { ConnectionRenderContext } from "../../types/NodeDefinition";
import { classNames } from "../elements";
import styles from "./ConnectionView.module.css";

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
}

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
  fromNodeSize,
  toNodeSize,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  // Get dynamic port positions
  const baseFromPosition = useDynamicConnectionPoint(fromNode.id, fromPort.id);
  const baseToPosition = useDynamicConnectionPoint(toNode.id, toPort.id);
  
  // Calculate port positions (use override positions for drag preview)
  const fromPosition = React.useMemo(() => {
    if (!baseFromPosition) {
      // Fallback if position not found
      return { x: fromNode.position.x, y: fromNode.position.y };
    }
    
    // Apply drag offset if dragging
    if (fromNodePosition) {
      const deltaX = fromNodePosition.x - fromNode.position.x;
      const deltaY = fromNodePosition.y - fromNode.position.y;
      return {
        x: baseFromPosition.x + deltaX,
        y: baseFromPosition.y + deltaY,
      };
    }
    
    return baseFromPosition;
  }, [baseFromPosition, fromNode.position.x, fromNode.position.y, fromNodePosition?.x, fromNodePosition?.y]);

  const toPosition = React.useMemo(() => {
    if (!baseToPosition) {
      // Fallback if position not found
      return { x: toNode.position.x, y: toNode.position.y };
    }
    
    // Apply drag offset if dragging
    if (toNodePosition) {
      const deltaX = toNodePosition.x - toNode.position.x;
      const deltaY = toNodePosition.y - toNode.position.y;
      return {
        x: baseToPosition.x + deltaX,
        y: baseToPosition.y + deltaY,
      };
    }
    
    return baseToPosition;
  }, [baseToPosition, toNode.position.x, toNode.position.y, toNodePosition?.x, toNodePosition?.y]);

  // Calculate bezier path (recalculate when positions change)
  const pathData = React.useMemo(
    () => calculateBezierPath(fromPosition, toPosition, fromPort.position, toPort.position),
    [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPort.position, toPort.position]
  );
  // Compute mid-point and angle along the bezier at t=0.5
  const midAndAngle = React.useMemo(() => {
    const { cp1, cp2 } = calculateBezierControlPoints(
      fromPosition,
      toPosition,
      fromPort.position,
      toPort.position
    );
    const t = 0.5;
    const pt = cubicBezierPoint(fromPosition, cp1, cp2, toPosition, t);
    const tan = cubicBezierTangent(fromPosition, cp1, cp2, toPosition, t);
    const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
    return { x: pt.x, y: pt.y, angle };
  }, [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y, fromPort.position, toPort.position]);
  // Visual state control
  // - Stripes appear when the connection itself is selected OR it is adjacent to a selected node.
  // - Color highlight responds to direct selection or hover of the connection itself.
  const stripesActive = isSelected || isAdjacentToSelectedNode;
  const colorActive = isSelected || isHovered;

  const strokeColor = React.useMemo(() => {
    if (isDragging && dragProgress > 0) {
      // Interpolate to warning color during drag
      const normalColor = "var(--connectionColor, #999)";
      const warningColor = "var(--cautionColor, #ff3b30)";
      return dragProgress > 0.5 ? warningColor : normalColor;
    }
    if (colorActive) {return "var(--accentColor, #0066cc)";}
    return "var(--connectionColor, #999)";
  }, [isDragging, dragProgress, colorActive]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerDown?.(e, connection.id);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    onPointerEnter?.(e, connection.id);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    onPointerLeave?.(e, connection.id);
  };

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
      className={classNames(
        styles.connectionGroup,
        isSelected && styles.connectionSelected,
        isHovered && styles.connectionHovered,
        isDragging && styles.connectionDragging
      )}
      shapeRendering="geometricPrecision"
      data-connection-id={connection.id}
    >
      {/* Base connection line (hit test only on stroke). Draw first, stripes overlay. */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected || isHovered ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{
          transition: "stroke 0.2s, stroke-width 0.2s",
          pointerEvents: "stroke",
        }}
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
      {stripesActive && (
        <>
          {/* Accent stripes */}
          <path
            d={pathData}
            fill="none"
            stroke={"var(--accentColor, #0066cc)"}
            strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={classNames(styles.connectionFlowStripe, styles.connectionStripeAccent)}
            style={{
              pointerEvents: "none",
              strokeDasharray: "10 14",
              strokeOpacity: stripesActive ? 0.9 : 0.7,
            }}
            data-testid="connection-flow-stripe"
          />
          {/* Background stripes, phase-shifted */}
          <path
            d={pathData}
            fill="none"
            stroke={"var(--controlBackground, #ffffff)"}
            strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={classNames(styles.connectionFlowStripe, styles.connectionStripeBg)}
            style={{
              pointerEvents: "none",
              strokeDasharray: "10 14",
              strokeDashoffset: -12,
              strokeOpacity: 0.6,
            }}
            data-testid="connection-flow-stripe"
          />
        </>
      )}

      {/* Direction chevron at mid-point, pointing to 'to' */}
      <g
        transform={`translate(${midAndAngle.x}, ${midAndAngle.y}) rotate(${midAndAngle.angle})`}
        style={{ pointerEvents: "none" }}
      >
        <path
          d="M -6 -4 L 0 0 L -6 4"
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Arrow marker at the end */}
      <defs>
        <marker
          id={`arrow-${connection.id}`}
          viewBox="0 0 10 10"
          refX="10"  
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} style={{ transition: "fill 0.2s" }} />
        </marker>
      </defs>

      {/* Apply arrow marker to the visible path */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        markerEnd={`url(#arrow-${connection.id})`}
        style={{ pointerEvents: "none" }}
        vectorEffect="non-scaling-stroke"
      />
    </g>
    ),
    [
      connection.id,
      pathData,
      midAndAngle,
      stripesActive,
      colorActive,
      strokeColor,
      isSelected,
      isHovered,
      isDragging,
      handlePointerDown,
      handlePointerEnter,
      handlePointerLeave,
      onContextMenu,
    ]
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
  if (prevProps.fromPort.position !== nextProps.fromPort.position || prevProps.toPort.position !== nextProps.toPort.position) {
    return false;
  }

  // Props are equal, skip re-render
  return true;
};

// Export memoized component
export const ConnectionView = React.memo(ConnectionViewComponent, areEqual);

ConnectionView.displayName = "ConnectionView";
