/**
 * @file Type definitions for port positioning and calculation behavior
 */
import type { Node, Port, NodeId, PortId, Position } from "./core";

/**
 * Computed position information for a port
 */
export type PortPosition = {
  /** Port identifier */
  portId: PortId;
  /** Position relative to the node (for rendering the port) */
  renderPosition: Position & {
    /** Optional CSS transform for fine positioning */
    transform?: string;
  };
  /** Absolute position on canvas (for drawing connections) */
  connectionPoint: Position;
};

/**
 * Map of port positions for a single node
 */
export type NodePortPositions = Map<PortId, PortPosition>;

/**
 * Map of all port positions in the editor
 * NodeId -> PortId -> PortPosition
 */
export type EditorPortPositions = Map<NodeId, NodePortPositions>;

/**
 * Helper type for nodes used during port position calculations
 */
export type PortPositionNode = Node & { ports?: Port[] };

/**
 * Configuration for port positioning
 */
export type PortPositionConfig = {
  /** Visual size of the port circle */
  visualSize: number;
  /** Distance beyond port's visual boundary for connections */
  connectionMargin: number;
  /** Padding from node edges when positioning multiple ports */
  edgePadding: number;
  /** Relative padding as fraction of total dimension (0-1) */
  relativePadding: number;
};

/**
 * Default port position configuration
 */
export const DEFAULT_PORT_POSITION_CONFIG: PortPositionConfig = {
  visualSize: 12,
  connectionMargin: 8,
  edgePadding: 20,
  relativePadding: 0.1,
};

/**
 * Allows customizing how port positions are calculated within the editor.
 */
export type PortPositionBehavior = {
  /** Optional overrides for the default position configuration */
  config?: Partial<PortPositionConfig>;
  /**
   * Custom computation for all node port positions.
   * Use `defaultCompute` to leverage the built-in algorithm when needed.
   */
  computeAll?: (options: {
    nodes: PortPositionNode[];
    previous: EditorPortPositions;
    config: PortPositionConfig;
    defaultCompute: (nodes: PortPositionNode[], config: PortPositionConfig) => EditorPortPositions;
  }) => EditorPortPositions;
  /**
   * Custom computation for a single node's port positions.
   * If `computeAll` is provided, it takes precedence over this callback.
   */
  computeNode?: (options: {
    node: PortPositionNode;
    config: PortPositionConfig;
    defaultCompute: (node: PortPositionNode, config: PortPositionConfig) => NodePortPositions;
  }) => NodePortPositions;
};
