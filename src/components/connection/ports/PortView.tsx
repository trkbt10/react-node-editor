/**
 * @file PortView component for rendering connection ports on nodes
 */
import * as React from "react";
import type { Port } from "../../../types/core";
import { useDynamicPortPosition } from "../../../hooks/usePortPosition";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { useNodeDefinition } from "../../../contexts/node-definitions/hooks/useNodeDefinition";
import type { PortRenderContext } from "../../../types/NodeDefinition";
import styles from "./PortView.module.css";

export type PortViewProps = {
  port: Port;
  onPointerDown?: (e: React.PointerEvent, port: Port) => void;
  onPointerUp?: (e: React.PointerEvent, port: Port) => void;
  onPointerEnter?: (e: React.PointerEvent, port: Port) => void;
  onPointerMove?: (e: React.PointerEvent, port: Port) => void;
  onPointerLeave?: (e: React.PointerEvent, port: Port) => void;
  onPointerCancel?: (e: React.PointerEvent, port: Port) => void;
  isConnecting?: boolean;
  isConnectable?: boolean;
  isCandidate?: boolean;
  isHovered?: boolean;
  isConnected?: boolean;
};

/**
 * PortView - Renders a connection port on a node
 * Handles port interactions for creating connections
 */
export const PortView: React.FC<PortViewProps> = ({
  port,
  onPointerDown,
  onPointerUp,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  isConnecting = false,
  isConnectable = false,
  isCandidate = false,
  isHovered = false,
  isConnected = false,
}) => {
  // Get dynamic port position
  const portPosition = useDynamicPortPosition(port.nodeId, port.id);

  const getPortPosition = (): React.CSSProperties => {
    if (!portPosition) {
      // Fallback position if not found
      return {
        left: 0,
        top: 0,
        position: "absolute",
      };
    }

    const { renderPosition } = portPosition;
    return {
      left: renderPosition.x,
      top: renderPosition.y,
      transform: renderPosition.transform,
      position: "absolute",
    };
  };

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onPointerDown?.(e, port);
    },
    [onPointerDown, port],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onPointerUp?.(e, port);
    },
    [onPointerUp, port],
  );

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent) => {
      onPointerEnter?.(e, port);
    },
    [onPointerEnter, port],
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent) => {
      onPointerLeave?.(e, port);
    },
    [onPointerLeave, port],
  );

  // Get node editor state for custom renderer context
  const { state } = useNodeEditor();
  const node = state.nodes[port.nodeId];

  // Get node definition to check for custom port renderer
  const nodeDefinition = useNodeDefinition(node?.type);
  const portDefinition = nodeDefinition?.ports?.find((p) => p.id === port.id);

  // Default render function
  const defaultRender = React.useCallback(
    () => (
      <div
        className={styles.port}
        style={getPortPosition()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerMove={(e) => onPointerMove?.(e, port)}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={(e) => {
          onPointerCancel?.(e, port);
        }}
        data-port-id={port.id}
        data-port-type={port.type}
        data-port-position={port.position}
        data-node-id={port.nodeId}
        data-port-connecting={isConnecting}
        data-port-connectable={isConnectable}
        data-port-candidate={isCandidate}
        data-port-hovered={isHovered}
        data-port-connected={isConnected}
        title={port.label}
      >
        <div className={styles.portInner} />
        {port.label && (
          <span className={styles.portLabel} data-port-label-position={port.position}>
            {port.label}
          </span>
        )}
      </div>
    ),
    [
      port,
      isConnecting,
      isConnectable,
      isCandidate,
      isHovered,
      isConnected,
      getPortPosition,
      handlePointerDown,
      handlePointerUp,
      handlePointerEnter,
      handlePointerLeave,
      onPointerCancel,
    ],
  );

  // Check if there's a custom renderer
  if (portDefinition?.renderPort && node) {
    // Build context for custom renderer
    const context: PortRenderContext = {
      port,
      node,
      allNodes: state.nodes,
      allConnections: state.connections,
      isConnecting,
      isConnectable,
      isCandidate,
      isHovered,
      isConnected,
      position: portPosition
        ? {
            x: portPosition.renderPosition.x,
            y: portPosition.renderPosition.y,
            transform: portPosition.renderPosition.transform,
          }
        : undefined,
      handlers: {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        onPointerCancel: (e: React.PointerEvent) => onPointerCancel?.(e, port),
      },
    };

    return portDefinition.renderPort(context, defaultRender);
  }

  // Use default rendering
  return defaultRender();
};

PortView.displayName = "PortView";
