/**
 * @file Core type definitions for the Node Editor.
 * These types are shared across all components and contexts.
 */

// ID types - using simple string types for compatibility
export type NodeId = string;
export type ConnectionId = string;
export type PortId = string;

// Basic geometry types
export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Port types
export type PortType = "input" | "output";
export type PortPosition = "left" | "right" | "top" | "bottom";

/**
 * Detailed placement hint for a port on a node edge.
 * Ports sharing the same segment are clustered together within that slice of the edge.
 */
export type PortPlacement = {
  /** Which edge the port belongs to */
  side: PortPosition;
  /** Optional segment identifier to split a side into multiple regions */
  segment?: string;
  /** Ordering used when stacking multiple segments on the same side (lowest first) */
  segmentOrder?: number;
  /** Relative space allocation for the segment when multiple segments exist (defaults to 1) */
  segmentSpan?: number;
  /** Preferred offset within the segment (0-1). Falls back to even spacing when undefined. */
  align?: number;
  /** When true, port is placed inside the node boundary instead of outside */
  inset?: boolean;
};

/**
 * Unit type for absolute positioning.
 * - "px": Pixel values (default)
 * - "percent": Percentage values (0-100) relative to node dimensions
 */
export type AbsolutePositionUnit = "px" | "percent";

/**
 * Absolute positioning for a port relative to the node's top-left corner.
 * Useful for custom node layouts where ports need precise placement.
 * Connection direction is automatically inferred from the nearest edge.
 */
export type AbsolutePortPlacement = {
  /** Absolute positioning mode */
  mode: "absolute";
  /** X offset from node's left edge */
  x: number;
  /** Y offset from node's top edge */
  y: number;
  /** Unit for x/y values. Defaults to "px" if not specified */
  unit?: AbsolutePositionUnit;
};

export type Port = {
  id: PortId;
  /** Identifier of the port definition this instance was created from */
  definitionId?: string;
  type: PortType;
  label: string;
  nodeId: NodeId;
  position: PortPosition;
  /** Optional placement details for segmented or absolute layouts */
  placement?: PortPlacement | AbsolutePortPlacement;
  dataType?: string | string[];
  maxConnections?: number | "unlimited";
  allowedNodeTypes?: string[];
  allowedPortTypes?: string[];
  /** Index of the port instance when generated from a multi-port definition */
  instanceIndex?: number;
  /** Total instances generated from the same definition */
  instanceTotal?: number;
};

// Node types
export type NodeVisualState = "info" | "success" | "warning" | "error" | "disabled";

export type NodeData = {
  title?: string;
  content?: string;
  visualState?: NodeVisualState;
  [key: string]: unknown;
};

export type Node = {
  id: NodeId;
  type: string;
  position: Position;
  size?: Size;
  data: NodeData;
  /** Optional ordering index for sibling sorting in Layers */
  order?: number;
  children?: NodeId[]; // For group nodes
  parentId?: NodeId; // Parent group node ID
  expanded?: boolean; // For group nodes
  visible?: boolean;
  locked?: boolean;
  resizable?: boolean;
  minSize?: Size;
  maxSize?: Size;
};

// Connection types
export type Connection = {
  id: ConnectionId;
  fromNodeId: NodeId;
  fromPortId: PortId;
  toNodeId: NodeId;
  toPortId: PortId;
  data?: Record<string, unknown>;
};

// Editor data types
export type NodeEditorData = {
  nodes: Record<NodeId, Node>;
  connections: Record<ConnectionId, Connection>;
  lastDuplicatedNodeIds?: NodeId[];
};

// Viewport types
export type Viewport = {
  offset: Position;
  scale: number;
};

// Selection types
export type SelectionState = {
  nodes: Set<NodeId>;
  connections: Set<ConnectionId>;
};

// Drag state types
export type DragState = {
  nodeIds: NodeId[];
  startPosition: Position;
  offset: Position;
  initialPositions: Record<NodeId, Position>;
  affectedChildNodes: Record<NodeId, NodeId[]>;
};

// Resize state types
export type ResizeState = {
  nodeId: NodeId;
  handle: ResizeHandle;
  startSize: Size;
  startPosition: Position;
  startNodePosition: Position;
  currentSize: Size;
  currentPosition: Position;
};

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// Connection drag state types
export type ConnectionDragState = {
  fromPort: Port;
  toPosition: Position;
  validTarget: Port | null;
  candidatePort: Port | null;
};

export type ConnectionDisconnectState = {
  connectionId: ConnectionId;
  fixedPort: Port;
  draggingEnd: "from" | "to";
  draggingPosition: Position;
  originalConnection: { id: ConnectionId; fromNodeId: NodeId; fromPortId: PortId; toNodeId: NodeId; toPortId: PortId };
  disconnectedEnd: "from" | "to";
  candidatePort: Port | null;
};

// Context menu types
export type ContextMenuState = {
  visible: boolean;
  position: Position;
  canvasPosition?: Position;
  nodeId?: NodeId;
  connectionId?: ConnectionId;
  mode?: "menu" | "search";
  allowedNodeTypes?: string[];
  fromPort?: Port;
};

// Grid settings
export type GridSettings = {
  enabled: boolean;
  size: number;
  showGrid: boolean;
  snapToGrid: boolean;
  snapThreshold: number; // Distance in pixels at which snapping occurs
};

// Editor settings
export type EditorSettings = {
  grid: GridSettings;
  showPorts: "always" | "hover" | "connected";
  connectionStyle: "bezier" | "straight" | "step";
  theme: "light" | "dark" | "auto";
};

// Event types
export type NodeEditorPointerEvent = {
  canvasPosition: Position;
  nodeId?: NodeId;
  portId?: PortId;
  connectionId?: ConnectionId;
} & PointerEvent;

// Utility type helpers
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
