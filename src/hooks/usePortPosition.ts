/**
 * @file Hooks for accessing dynamic port positions and connection points
 */
import * as React from "react";
import type { PortPosition } from "../types/portPosition";
import { useNodeEditor } from "../contexts/node-editor/context";
import { usePortPositions } from "../contexts/node-ports/context";

/**
 * Hook to get dynamic port position that updates with node position
 */
export function useDynamicPortPosition(nodeId: string, portId: string): PortPosition | undefined {
  const { state, getNodePorts } = useNodeEditor();
  const { calculateNodePortPositions } = usePortPositions();
  const node = React.useMemo(() => state.nodes[nodeId], [state.nodes, nodeId]);
  return React.useMemo(() => {
    if (!node) {
      return undefined;
    }

    // Create a node with ports for calculation
    const nodeWithPorts = {
      ...node,
      ports: getNodePorts(nodeId),
    };

    const positions = calculateNodePortPositions(nodeWithPorts);
    return positions.get(portId);
  }, [node, nodeId, portId, getNodePorts, calculateNodePortPositions]);
}

/**
 * Hook to get dynamic connection point for a port
 */
export function useDynamicConnectionPoint(nodeId: string, portId: string): { x: number; y: number } | undefined {
  const position = useDynamicPortPosition(nodeId, portId);
  return position?.connectionPoint;
}
