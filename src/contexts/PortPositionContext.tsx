import * as React from "react";
import type { Port } from "../types/core";
import { computeNodePortPositions } from "../utils/computePortPositions";
import {
  DEFAULT_PORT_POSITION_CONFIG,
  type EditorPortPositions,
  type NodePortPositions,
  type PortPosition,
  type PortPositionBehavior,
  type PortPositionConfig,
  type PortPositionNode,
} from "../types/portPosition";

/**
 * Context value for port positions
 */
export type PortPositionContextValue = {
  /** All computed port positions */
  portPositions: EditorPortPositions;
  /** Effective configuration used for position calculations */
  config: PortPositionConfig;
  /** Optional behavior overrides supplied via props */
  behavior?: PortPositionBehavior;
  /** Get port position for a specific port */
  getPortPosition: (nodeId: string, portId: string) => PortPosition | undefined;
  /** Get all port positions for a node */
  getNodePortPositions: (nodeId: string) => NodePortPositions | undefined;
  /** Compute port position dynamically */
  computePortPosition: (node: PortPositionNode, port: Port) => PortPosition;
  /** Calculate port positions for a node on demand */
  calculateNodePortPositions: (node: PortPositionNode) => NodePortPositions;
}

/**
 * Context for accessing pre-computed port positions
 */
export const PortPositionContext = React.createContext<PortPositionContextValue | null>(null);

/**
 * Provider component for port positions
 */
export type PortPositionProviderProps = {
  portPositions: EditorPortPositions;
  behavior?: PortPositionBehavior;
  config?: PortPositionConfig;
  children: React.ReactNode;
}

export const PortPositionProvider: React.FC<PortPositionProviderProps> = ({
  portPositions,
  behavior,
  config,
  children,
}) => {
  const effectiveConfig = config ?? DEFAULT_PORT_POSITION_CONFIG;

  const value = React.useMemo<PortPositionContextValue>(() => {
    const calculateNodePortPositions = (node: PortPositionNode): NodePortPositions => {
      if (behavior?.computeNode) {
        return behavior.computeNode({
          node,
          config: effectiveConfig,
          defaultCompute: computeNodePortPositions,
        });
      }

      return computeNodePortPositions(node, effectiveConfig);
    };

    return {
      portPositions,
      config: effectiveConfig,
      behavior,
      getPortPosition: (nodeId: string, portId: string) => {
        return portPositions.get(nodeId)?.get(portId);
      },
      getNodePortPositions: (nodeId: string) => {
        return portPositions.get(nodeId);
      },
      computePortPosition: (node: PortPositionNode, port: Port) => {
        const stored = portPositions.get(node.id)?.get(port.id);
        if (stored) {return stored;}

        const calculated = calculateNodePortPositions(node).get(port.id);
        if (calculated) {return calculated;}

        // Simple fallback aligned to node position
        return {
          portId: port.id,
          renderPosition: { x: 0, y: 0 },
          connectionPoint: { x: node.position.x, y: node.position.y },
        };
      },
      calculateNodePortPositions,
    };
  }, [portPositions, behavior, effectiveConfig]);

  return (
    <PortPositionContext.Provider value={value}>
      {children}
    </PortPositionContext.Provider>
  );
};

/**
 * Hook to access port positions
 */
export function usePortPositions(): PortPositionContextValue {
  const context = React.useContext(PortPositionContext);
  if (!context) {
    throw new Error("usePortPositions must be used within a PortPositionProvider");
  }
  return context;
}

/**
 * Hook to get a specific port position
 */
export function usePortPosition(nodeId: string, portId: string): PortPosition | undefined {
  const { getPortPosition } = usePortPositions();
  return React.useMemo(
    () => getPortPosition(nodeId, portId),
    [getPortPosition, nodeId, portId]
  );
}

/**
 * Hook to get all port positions for a node
 */
export function useNodePortPositions(nodeId: string): NodePortPositions | undefined {
  const { getNodePortPositions } = usePortPositions();
  return React.useMemo(
    () => getNodePortPositions(nodeId),
    [getNodePortPositions, nodeId]
  );
}
