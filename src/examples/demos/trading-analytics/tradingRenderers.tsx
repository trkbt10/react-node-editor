/**
 * @file Custom renderers for trading analytics dashboard connections and ports
 */
import * as React from "react";
import type { ConnectionRenderContext, PortRenderContext } from "../../../types/NodeDefinition";
import {
  calculateBezierPath,
  calculateBezierControlPoints,
  cubicBezierPoint,
} from "../../../components/connection/utils/connectionUtils";

/**
 * Custom connection renderer with dotted curved lines and correlation coefficient badges
 */
export const renderTradingConnection = (
  context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const { connection, fromPosition, toPosition, fromPort, toPort, handlers, isSelected, isHovered } = context;

  // If no connection exists yet (preview mode), use default
  if (!connection) {
    return defaultRender();
  }

  // Get correlation coefficient from connection data
  const correlation = connection.data?.correlation as number | undefined;

  // Fallback to default if toPort is undefined (should not happen in connected state)
  if (!toPort) {
    return defaultRender();
  }

  // Calculate bezier path for curved connection
  const pathData = calculateBezierPath(fromPosition, toPosition, fromPort.position, toPort.position);

  // Calculate midpoint for badge placement
  const { cp1, cp2 } = calculateBezierControlPoints(fromPosition, toPosition, fromPort.position, toPort.position);
  const midPoint = cubicBezierPoint(fromPosition, cp1, cp2, toPosition, 0.5);

  // Determine colors based on correlation coefficient - matching reference image
  const getCorrelationColor = (coeff: number | undefined): string => {
    if (coeff === undefined) {return "#94a3b8";}
    if (coeff >= 0.9) {return "#34d399";} // Strong positive - green-400
    if (coeff >= 0.7) {return "#34d399";} // Moderate positive - green-400
    if (coeff >= 0.3) {return "#34d399";} // Weak positive - green-400
    if (coeff >= -0.3) {return "#fbbf24";} // No correlation - amber-400
    if (coeff >= -0.7) {return "#fb923c";} // Weak negative - orange-400
    return "#ef4444"; // Strong negative correlation - red-500
  };

  const correlationColor = getCorrelationColor(correlation);
  // Use the correlation color for the connection line
  const strokeColor = isSelected || isHovered ? correlationColor : correlationColor;
  const strokeWidth = 3;

  return (
    <g
      data-connection-id={connection.id}
      onPointerDown={handlers.onPointerDown}
      onPointerEnter={handlers.onPointerEnter}
      onPointerLeave={handlers.onPointerLeave}
      onContextMenu={handlers.onContextMenu}
    >
      {/* Dotted connection path */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray="2 8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        pointerEvents="stroke"
        style={{
          transition: "stroke 0.2s ease",
          vectorEffect: "non-scaling-stroke",
        }}
      />

      {/* Correlation coefficient badge at midpoint */}
      {correlation !== undefined && (
        <g transform={`translate(${midPoint.x}, ${midPoint.y})`}>
          {/* Badge background rounded rectangle */}
          <rect
            x={-28}
            y={-18}
            width={56}
            height={36}
            rx={18}
            ry={18}
            fill={correlationColor}
            filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
          />
          {/* Correlation coefficient text */}
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="16"
            fontWeight="700"
            letterSpacing="-0.02em"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {correlation.toFixed(3)}
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * Custom port renderer with circular dots (hidden by default, visible on interaction)
 */
export const renderTradingPort = (
  context: PortRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const { port, isConnecting, isConnectable, isCandidate, isHovered, position, handlers } = context;

  if (!position) {
    return defaultRender();
  }

  // Determine port appearance based on state - completely hidden to match reference image
  const getPortSize = (): number => {
    if (isConnecting && isCandidate) {return 6;}
    if (isHovered) {return 4;}
    return 0; // Hidden by default
  };

  const getPortColor = (): string => {
    if (isConnecting && isConnectable) {return "#10b981";} // Emerald green when connectable
    if (isConnecting) {return "#ef4444";} // Red when not connectable
    if (isHovered) {return "#94a3b8";} // Subtle gray when hovered
    return "transparent";
  };

  const portSize = getPortSize();
  const portColor = getPortColor();

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: position.transform || "translate(-50%, -50%)",
        width: 12,
        height: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isConnecting ? (isConnectable ? "pointer" : "not-allowed") : "crosshair",
        pointerEvents: "auto",
      }}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerEnter={handlers.onPointerEnter}
      onPointerMove={handlers.onPointerMove}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
      data-port-id={port.id}
      data-port-type={port.type}
      data-port-position={port.position}
      data-node-id={port.nodeId}
    >
      {portSize > 0 && (
        <div
          style={{
            width: portSize,
            height: portSize,
            borderRadius: "50%",
            backgroundColor: portColor,
            border: "1px solid white",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            transition: "all 0.15s ease",
          }}
        />
      )}
    </div>
  );
};
