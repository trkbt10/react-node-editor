import * as React from "react";
import type { Port } from "../../types/core";
import {
  DEFAULT_PORT_POSITION_CONFIG,
} from "../../types/portPosition";
import type {
  EditorPortPositions,
  NodePortPositions,
  PortPosition,
  PortPositionBehavior,
  PortPositionConfig,
  PortPositionNode,
} from "../../types/portPosition";
import { computeNodePortPositions } from "./utils/computePortPositions";
import { PortPositionContext } from "./context";
import type { PortPositionContextValue } from "./context";

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
