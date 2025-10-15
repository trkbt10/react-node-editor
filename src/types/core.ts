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

export type Port = {
  id: PortId;
  type: PortType;
  label: string;
  nodeId: NodeId;
  position: PortPosition;
  dataType?: string;
  maxConnections?: number | "unlimited";
  allowedNodeTypes?: string[];
  allowedPortTypes?: string[];
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
  /**
   * @deprecated Ports are now inferred from NodeDefinitions.
   * This field is only used for backward compatibility and will be removed in a future version.
   * Use NodeEditorContext.getNodePorts() instead.
   */
  _ports?: Port[];
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
