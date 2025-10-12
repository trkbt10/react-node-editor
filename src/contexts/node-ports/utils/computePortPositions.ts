import type { Node, Port, Position, Size } from "../../../types/core";
import type { PortPosition, NodePortPositions, EditorPortPositions, PortPositionConfig } from "../../../types/portPosition";
import { DEFAULT_PORT_POSITION_CONFIG } from "../../../types/portPosition";
import { getNodeSize, getNodeBoundingBox } from "../../../utils/boundingBoxUtils";

/**
 * Group ports by their position (left, right, top, bottom)
 */
function groupPortsByPosition(ports: Port[]): Map<string, Port[]> {
  const grouped = new Map<string, Port[]>();

  for (const port of ports) {
    const position = port.position || "right";
    if (!grouped.has(position)) {
      grouped.set(position, []);
    }
    grouped.get(position)!.push(port);
  }

  return grouped;
}

/**
 * Calculate the relative offset for a port among multiple ports on the same side
 * Returns a value between 0 and 1 representing the position along the side
 */
function calculatePortRelativeOffset(portIndex: number, totalPorts: number, config: PortPositionConfig): number {
  if (totalPorts === 1) {
    return 0.5; // Center position
  }

  if (totalPorts === 2) {
    // Use consistent positions for 2 ports
    const positions = [0.3333, 0.6667];
    return positions[portIndex] || 0.5;
  }

  // For 3+ ports, distribute evenly with padding
  const availableSpace = 1 - config.relativePadding * 2;
  const step = availableSpace / (totalPorts - 1);
  const relativePosition = config.relativePadding + step * portIndex;

  // Clamp to reasonable bounds
  return Math.max(0.1, Math.min(0.9, relativePosition));
}

/**
 * Calculate the render position for a port (relative to node)
 */
function calculatePortRenderPosition(
  port: Port,
  portIndex: number,
  totalPortsOnSide: number,
  nodeSize: Size,
  config: PortPositionConfig,
): Position & { transform?: string } {
  const relativeOffset = calculatePortRelativeOffset(portIndex, totalPortsOnSide, config);
  const halfPortSize = config.visualSize / 2;

  switch (port.position) {
    case "left":
      return {
        x: -halfPortSize,
        y: nodeSize.height * relativeOffset,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        x: nodeSize.width - halfPortSize,
        y: nodeSize.height * relativeOffset,
        transform: "translateY(-50%)",
      };
    case "top":
      return {
        x: nodeSize.width * relativeOffset,
        y: -halfPortSize,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        x: nodeSize.width * relativeOffset,
        y: nodeSize.height - halfPortSize,
        transform: "translateX(-50%)",
      };
    default:
      // Default to right
      return {
        x: nodeSize.width - halfPortSize,
        y: nodeSize.height * 0.5,
        transform: "translateY(-50%)",
      };
  }
}

/**
 * Calculate the connection point for a port (absolute canvas position)
 */
function calculatePortConnectionPoint(
  port: Port,
  portIndex: number,
  totalPortsOnSide: number,
  node: Node,
  config: PortPositionConfig,
): Position {
  const nodeSize = getNodeSize(node);
  const { left, top } = getNodeBoundingBox(node);
  const relativeOffset = calculatePortRelativeOffset(portIndex, totalPortsOnSide, config);

  switch (port.position) {
    case "left":
      return {
        x: left - config.connectionMargin,
        y: top + nodeSize.height * relativeOffset,
      };
    case "right":
      return {
        x: left + nodeSize.width + config.connectionMargin,
        y: top + nodeSize.height * relativeOffset,
      };
    case "top":
      return {
        x: left + nodeSize.width * relativeOffset,
        y: top - config.connectionMargin,
      };
    case "bottom":
      return {
        x: left + nodeSize.width * relativeOffset,
        y: top + nodeSize.height + config.connectionMargin,
      };
    default:
      // Default to right
      return {
        x: left + nodeSize.width + config.connectionMargin,
        y: top + nodeSize.height * 0.5,
      };
  }
}

/**
 * Compute all port positions for a single node
 */
export function computeNodePortPositions(
  node: Node,
  config: PortPositionConfig = DEFAULT_PORT_POSITION_CONFIG,
): NodePortPositions {
  const positions = new Map<string, PortPosition>();
  const ports = node._ports || [];

  if (ports.length === 0) {
    return positions;
  }

  const nodeSize = getNodeSize(node);
  const portsByPosition = groupPortsByPosition(ports);

  // Calculate positions for each port
  for (const [position, portsOnSide] of portsByPosition) {
    portsOnSide.forEach((port, index) => {
      const renderPosition = calculatePortRenderPosition(port, index, portsOnSide.length, nodeSize, config);

      const connectionPoint = calculatePortConnectionPoint(port, index, portsOnSide.length, node, config);

      positions.set(port.id, {
        portId: port.id,
        renderPosition,
        connectionPoint,
      });
    });
  }

  return positions;
}

/**
 * Compute port positions for all nodes in the editor
 */
export function computeAllPortPositions(
  nodes: Node[],
  config: PortPositionConfig = DEFAULT_PORT_POSITION_CONFIG,
): EditorPortPositions {
  const allPositions = new Map<string, NodePortPositions>();

  for (const node of nodes) {
    const nodePositions = computeNodePortPositions(node, config);
    if (nodePositions.size > 0) {
      allPositions.set(node.id, nodePositions);
    }
  }

  return allPositions;
}

/**
 * Update port positions for specific nodes
 */
export function updatePortPositions(
  currentPositions: EditorPortPositions,
  nodesToUpdate: Node[],
  config: PortPositionConfig = DEFAULT_PORT_POSITION_CONFIG,
): EditorPortPositions {
  const updated = new Map(currentPositions);

  for (const node of nodesToUpdate) {
    const nodePositions = computeNodePortPositions(node, config);
    if (nodePositions.size > 0) {
      updated.set(node.id, nodePositions);
    } else {
      updated.delete(node.id);
    }
  }

  return updated;
}
