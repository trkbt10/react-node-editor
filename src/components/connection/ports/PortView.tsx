import * as React from "react";
import type { Port } from "../../../types/core";
import { classNames } from "../../elements";
import { useDynamicPortPosition } from "../../../hooks/usePortPosition";
import { useNodeEditor } from "../../../contexts/node-editor";
import { useNodeDefinition } from "../../../contexts/node-definitions";
import type { PortRenderContext } from "../../../types/NodeDefinition";
import styles from "./PortView.module.css";

export type PortViewProps = {
  port: Port;
  onPointerDown?: (e: React.PointerEvent, port: Port) => void;
  onPointerUp?: (e: React.PointerEvent, port: Port) => void;
  onPointerEnter?: (e: React.PointerEvent, port: Port) => void;
  onPointerLeave?: (e: React.PointerEvent, port: Port) => void;
  isConnecting?: boolean;
  isConnectable?: boolean;
  isCandidate?: boolean;
  isHovered?: boolean;
  isConnected?: boolean;
}

/**
 * PortView - Renders a connection port on a node
 * Handles port interactions for creating connections
 */
export const PortView: React.FC<PortViewProps> = ({
  port,
  onPointerDown,
  onPointerUp,
  onPointerEnter,
  onPointerLeave,
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

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerDown?.(e, port);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerUp?.(e, port);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    onPointerEnter?.(e, port);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    onPointerLeave?.(e, port);
  };

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
        className={classNames(
          styles.port,
          styles[`port${port.type.charAt(0).toUpperCase()}${port.type.slice(1)}`],
          styles[`port${port.position.charAt(0).toUpperCase()}${port.position.slice(1)}`],
          isConnecting && styles.portConnecting,
          isConnectable && styles.portConnectable,
          isCandidate && styles.portCandidate,
          isHovered && styles.portHovered,
          isConnected && styles.portConnected
        )}
        style={getPortPosition()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        data-port-id={port.id}
        data-port-type={port.type}
        data-node-id={port.nodeId}
        title={port.label}
      >
        <div className={styles.portInner} />
        {port.label && (
          <span
            className={classNames(
              styles.portLabel,
              styles[`portLabel${port.position.charAt(0).toUpperCase()}${port.position.slice(1)}`]
            )}
          >
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
    ]
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
      },
    };

    return portDefinition.renderPort(context, defaultRender);
  }

  // Use default rendering
  return defaultRender();
};

PortView.displayName = "PortView";
