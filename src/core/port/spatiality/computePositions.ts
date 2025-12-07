/**
 * @file Port position computation utilities
 */
import type { Node, Port, Position, Size, PortPlacement, AbsolutePortPlacement } from "../../../types/core";
import type {
  PortPosition,
  NodePortPositions,
  EditorPortPositions,
  PortPositionConfig,
} from "../../../types/portPosition";
import type { ComputedPortPosition } from "../../../types/NodeDefinition";
import { DEFAULT_PORT_POSITION_CONFIG } from "../../../types/portPosition";
import { getNodeSize, getNodeBoundingBox } from "../../../utils/boundingBoxUtils";
import {
  isAbsolutePlacement,
  getPlacementAlign,
  getPlacementInset,
  getPortSide,
} from "./placement";

type PortSegmentGroup = {
  key: string;
  order: number;
  span: number;
  ports: Port[];
  placement: PortPlacement;
};

const DEFAULT_PLACEMENT: PortPlacement = { side: "right" };

const getPlacementForPort = (port: Port): PortPlacement | AbsolutePortPlacement => {
  if (port.placement) {
    return port.placement;
  }
  return port.position ? { side: port.position } : DEFAULT_PLACEMENT;
};

/**
 * Group ports by side and segment (excludes absolute positioned ports)
 * The key is the side (e.g., "left", "right", "top", "bottom")
 */
function groupPortsByPosition(ports: Port[]): Map<string, PortSegmentGroup[]> {
  const grouped = new Map<string, Map<string, PortSegmentGroup>>();

  for (const port of ports) {
    const placement = getPlacementForPort(port);
    // Skip absolute positioned ports - they are handled separately
    if (isAbsolutePlacement(placement)) {
      continue;
    }
    const side = placement.side || "right";
    const segmentKey = placement.segment ?? "default";
    if (!grouped.has(side)) {
      grouped.set(side, new Map<string, PortSegmentGroup>());
    }
    const sideGroups = grouped.get(side)!;
    if (!sideGroups.has(segmentKey)) {
      sideGroups.set(segmentKey, {
        key: segmentKey,
        order: placement.segmentOrder ?? 0,
        span: placement.segmentSpan ?? 1,
        ports: [],
        placement,
      });
    }
    const segment = sideGroups.get(segmentKey)!;
    // Prefer explicit order/span hints when present on any port within the segment
    if (placement.segmentOrder !== undefined) {
      segment.order = placement.segmentOrder;
    }
    if (placement.segmentSpan !== undefined) {
      segment.span = placement.segmentSpan;
    }
    segment.ports.push(port);
  }

  const orderedBySide = new Map<string, PortSegmentGroup[]>();
  grouped.forEach((segments, side) => {
    const orderedSegments = Array.from(segments.values()).sort((a, b) => {
      if (a.order === b.order) {
        return a.key.localeCompare(b.key);
      }
      return a.order - b.order;
    });
    orderedBySide.set(side, orderedSegments);
  });

  return orderedBySide;
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const computeSegmentOffsets = (ports: Port[], config: PortPositionConfig): number[] => {
  if (ports.length === 0) {
    return [];
  }
  if (ports.length === 1) {
    const align = getPlacementAlign(ports[0].placement);
    return [align !== undefined ? clamp(align, 0, 1) : 0.5];
  }

  const defaultOffsets = ports.map((_, index) => calculatePortRelativeOffset(index, ports.length, config));
  const desiredOffsets = ports.map((port, index) => {
    const align = getPlacementAlign(port.placement);
    return align !== undefined ? clamp(align, 0, 1) : defaultOffsets[index];
  });

  const orderedIndices = desiredOffsets
    .map((value, index) => ({ value, index }))
    .sort((a, b) => (a.value === b.value ? a.index - b.index : a.value - b.value));

  const minBound = 0.05;
  const maxBound = 0.95;
  const minGap = Math.min(0.14, 0.4 / Math.max(1, ports.length - 1));
  const adjusted: number[] = new Array(ports.length);

  let current = minBound;
  orderedIndices.forEach(({ value, index }) => {
    const clampedDesired = clamp(value, minBound, maxBound);
    const offset = Math.max(clampedDesired, current);
    adjusted[index] = offset;
    current = offset + minGap;
  });

  const lastOffset = Math.max(...adjusted);
  if (lastOffset > maxBound) {
    const overflow = lastOffset - maxBound;
    const denom = ports.length > 1 ? ports.length - 1 : 1;
    adjusted.forEach((offset, i) => {
      const factor = i / denom;
      adjusted[i] = clamp(offset - overflow * factor, minBound, maxBound);
    });
  }

  return adjusted;
};

/**
 * Calculate the render position for a port (relative to node)
 */
function calculatePortRenderPosition(
  port: Port,
  relativeOffset: number,
  nodeSize: Size,
  config: PortPositionConfig,
): Position & { transform?: string } {
  const halfPortSize = config.visualSize / 2;
  const side = getPortSide(port);
  const inset = getPlacementInset(port.placement);

  // Inset shifts port inside the node boundary
  const insetOffset = inset ? halfPortSize * 2 : 0;

  switch (side) {
    case "left":
      return {
        x: -halfPortSize + insetOffset,
        y: nodeSize.height * relativeOffset,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        x: nodeSize.width - halfPortSize - insetOffset,
        y: nodeSize.height * relativeOffset,
        transform: "translateY(-50%)",
      };
    case "top":
      return {
        x: nodeSize.width * relativeOffset,
        y: -halfPortSize + insetOffset,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        x: nodeSize.width * relativeOffset,
        y: nodeSize.height - halfPortSize - insetOffset,
        transform: "translateX(-50%)",
      };
    default:
      // Default to right
      return {
        x: nodeSize.width - halfPortSize - insetOffset,
        y: nodeSize.height * 0.5,
        transform: "translateY(-50%)",
      };
  }
}

/**
 * Calculate the connection point for a port (absolute canvas position).
 * Connection point is at the port visual center, derived directly from render position.
 * The bezier curve calculation in path.ts handles curve direction based on
 * geometric relationship between connected ports.
 */
function calculatePortConnectionPoint(
  renderPosition: Position & { transform?: string },
  node: Node,
  config: PortPositionConfig,
): Position {
  const { left, top } = getNodeBoundingBox(node);
  const halfPortSize = config.visualSize / 2;

  // The render position is the top-left corner of the port element.
  // CSS transform (translateX/Y) centers the port visually.
  // We need to calculate the visual center based on which axis is transformed.
  const transform = renderPosition.transform ?? "";

  if (transform.includes("translateY")) {
    // Left/Right ports: transform shifts vertically, so y-center is at renderPosition.y
    return {
      x: left + renderPosition.x + halfPortSize,
      y: top + renderPosition.y,
    };
  } else if (transform.includes("translateX")) {
    // Top/Bottom ports: transform shifts horizontally, so x-center is at renderPosition.x
    return {
      x: left + renderPosition.x,
      y: top + renderPosition.y + halfPortSize,
    };
  } else {
    // No transform: center is at renderPosition + halfPortSize
    return {
      x: left + renderPosition.x + halfPortSize,
      y: top + renderPosition.y + halfPortSize,
    };
  }
}

/**
 * Resolve absolute placement coordinates to pixel values
 * Handles both "px" (default) and "percent" units
 */
function resolveAbsoluteCoordinates(
  placement: AbsolutePortPlacement,
  nodeSize: Size,
): { x: number; y: number } {
  const unit = placement.unit ?? "px";

  if (unit === "percent") {
    // Percentage values: 0-100 relative to node dimensions
    return {
      x: (placement.x / 100) * nodeSize.width,
      y: (placement.y / 100) * nodeSize.height,
    };
  }

  // Default: pixel values
  return { x: placement.x, y: placement.y };
}

/**
 * Calculate positions for an absolute positioned port.
 * Connection point is at the port visual center, derived from render position.
 */
function calculateAbsolutePortPosition(
  port: Port,
  placement: AbsolutePortPlacement,
  node: Node,
  nodeSize: Size,
  config: PortPositionConfig,
): PortPosition {
  const halfPortSize = config.visualSize / 2;

  // Resolve coordinates to pixels (handles both px and percent units)
  const resolved = resolveAbsoluteCoordinates(placement, nodeSize);

  // Render position is the absolute position minus half port size for centering
  // No transform is used for absolute positioned ports
  const renderPosition: Position & { transform?: string } = {
    x: resolved.x - halfPortSize,
    y: resolved.y - halfPortSize,
  };

  // Connection point is derived from render position (no transform case)
  const connectionPoint = calculatePortConnectionPoint(renderPosition, node, config);

  return {
    portId: port.id,
    renderPosition,
    connectionPoint,
  };
}

/**
 * Options for computing node port positions
 */
export type ComputeNodePortPositionsOptions = {
  /** Port position configuration */
  config?: PortPositionConfig;
  /** Optional explicit port array */
  ports?: Port[];
};

/**
 * Compute all port positions for a single node
 * @param node - The node to compute port positions for (may include ports property from PortPositionNode)
 * @param configOrOptions - Port position configuration or options object
 * @param ports - Optional explicit port array (if not provided, uses node.ports or empty array)
 */
export function computeNodePortPositions(
  node: Node & { ports?: Port[] },
  configOrOptions: PortPositionConfig | ComputeNodePortPositionsOptions = DEFAULT_PORT_POSITION_CONFIG,
  ports?: Port[],
): NodePortPositions {
  // Handle both legacy (config, ports) and new (options) signatures
  let config: PortPositionConfig;
  let effectivePorts: Port[];

  if ("visualSize" in configOrOptions) {
    // Legacy signature: (node, config, ports)
    config = configOrOptions;
    effectivePorts = ports || node.ports || [];
  } else {
    // New signature: (node, options)
    config = configOrOptions.config ?? DEFAULT_PORT_POSITION_CONFIG;
    effectivePorts = configOrOptions.ports || node.ports || [];
  }

  const positions = new Map<string, PortPosition>();

  if (effectivePorts.length === 0) {
    return positions;
  }

  const nodeSize = getNodeSize(node);

  // First, handle absolute positioned ports
  for (const port of effectivePorts) {
    const placement = getPlacementForPort(port);
    if (isAbsolutePlacement(placement)) {
      const position = calculateAbsolutePortPosition(port, placement, node, nodeSize, config);
      positions.set(port.id, position);
    }
  }

  // Then, handle side-based positioned ports (grouped by side and segment)
  const portsByPosition = groupPortsByPosition(effectivePorts);

  for (const [_side, segments] of portsByPosition) {
    const totalSpan = segments.reduce((sum, segment) => {
      const span = segment.span && segment.span > 0 ? segment.span : 1;
      return sum + span;
    }, 0);
    let cursor = 0;

    segments.forEach((segment) => {
      const span = segment.span && segment.span > 0 ? segment.span : 1;
      const segmentLength = totalSpan > 0 ? span / totalSpan : 0;
      const segmentStart = cursor;
      const segmentEnd = segmentStart + segmentLength;
      const segmentRange = segmentEnd - segmentStart;

      const offsetsWithinSegment = computeSegmentOffsets(segment.ports, config);

      segment.ports.forEach((port, index) => {
        const relativeOffset = segmentStart + segmentRange * offsetsWithinSegment[index];
        const renderPosition = calculatePortRenderPosition(port, relativeOffset, nodeSize, config);
        const connectionPoint = calculatePortConnectionPoint(renderPosition, node, config);

        positions.set(port.id, {
          portId: port.id,
          renderPosition,
          connectionPoint,
        });
      });

      cursor = segmentEnd;
    });
  }

  return positions;
}

/**
 * Create a default compute function for use with custom computePortPositions in NodeDefinition
 */
export function createDefaultPortCompute(
  node: Node,
  config: PortPositionConfig = DEFAULT_PORT_POSITION_CONFIG,
): (ports: Port[]) => Map<string, ComputedPortPosition> {
  return (ports: Port[]) => {
    const result = new Map<string, ComputedPortPosition>();
    const nodeWithPorts = { ...node, ports };
    const positions = computeNodePortPositions(nodeWithPorts, config, ports);

    for (const [portId, pos] of positions) {
      result.set(portId, {
        renderPosition: pos.renderPosition,
        connectionPoint: pos.connectionPoint,
      });
    }

    return result;
  };
}

/**
 * Compute port positions for all nodes in the editor
 * @param nodes - Array of nodes (may include ports property from PortPositionNode)
 * @param config - Port position configuration
 */
export function computeAllPortPositions(
  nodes: Array<Node & { ports?: Port[] }>,
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
 * @param currentPositions - Current port positions map
 * @param nodesToUpdate - Array of nodes to update (may include ports property from PortPositionNode)
 * @param config - Port position configuration
 */
export function updatePortPositions(
  currentPositions: EditorPortPositions,
  nodesToUpdate: Array<Node & { ports?: Port[] }>,
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
