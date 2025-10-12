import React, { type ReactNode, type ReactElement } from "react";
import type { Node, NodeId, Port, Connection, ConnectionId, NodeData } from "./core";
import type { NodeBehavior } from "./behaviors";

/**
 * @deprecated NodeDataTypeMap is no longer used. Node data defaults to Record<string, unknown>.
 * This type is kept for backward compatibility only.
 */
export type NodeDataTypeMap = {
  [key: string]: Record<string, unknown>;
};

/**
 * External data reference for nodes
 * Supports both synchronous and asynchronous data loading
 */
export type ExternalDataReference = {
  /** Unique identifier for the external data */
  id: string;
  /** Type of the external data (e.g., "section", "plot", "layer") */
  type: string;
  /** Optional version for optimistic locking */
  version?: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Node render props for custom node visualization
 * @template TData - The node data type (defaults to Record<string, unknown>)
 */
export type NodeRenderProps<TData extends Record<string, unknown> = Record<string, unknown>> = {
  /** The node data */
  node: Node & { data: TData };
  /** Whether the node is selected */
  isSelected: boolean;
  /** Whether the node is being dragged */
  isDragging: boolean;
  /** Whether the node is being edited inline */
  isEditing: boolean;
  /** External data if loaded */
  externalData: unknown;
  /** Loading state for external data */
  isLoadingExternalData: boolean;
  /** Error state for external data */
  externalDataError: Error | null;
  /** Callback to trigger inline editing */
  onStartEdit: () => void;
  /** Callback to update node data */
  onUpdateNode: (updates: Partial<Node>) => void;
};

/**
 * Inspector panel render props
 * @template TData - The node data type (defaults to Record<string, unknown>)
 */
export type InspectorRenderProps<TData extends Record<string, unknown> = Record<string, unknown>> = {
  /** The selected node */
  node: Node & { data: TData };
  /** External data if loaded */
  externalData: unknown;
  /** Loading state for external data */
  isLoadingExternalData: boolean;
  /** Error state for external data */
  externalDataError: Error | null;
  /** Callback to update node data */
  onUpdateNode: (updates: Partial<Node>) => void;
  /** Callback to update external data */
  onUpdateExternalData: (data: unknown) => Promise<void>;
  /** Callback to delete the node */
  onDeleteNode: () => void;
};

/**
 * Context provided to port render functions
 */
export type PortRenderContext = {
  /** The port being rendered */
  port: Port;
  /** The node that owns this port */
  node: Node;
  /** All nodes in the editor */
  allNodes: Record<NodeId, Node>;
  /** All connections in the editor */
  allConnections: Record<ConnectionId, Connection>;
  /** Whether a connection is being dragged */
  isConnecting: boolean;
  /** Whether this port can accept the current connection */
  isConnectable: boolean;
  /** Whether this port is a candidate for the current connection */
  isCandidate: boolean;
  /** Whether this port is hovered */
  isHovered: boolean;
  /** Whether this port has any connections */
  isConnected: boolean;
  /** Port position information */
  position?: {
    x: number;
    y: number;
    transform?: string;
  };
  /** Event handlers */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
};

/**
 * Context provided to connection render functions
 */
export type ConnectionRenderContext = {
  /** The connection being rendered */
  connection: Connection;
  /** The source port */
  fromPort: Port;
  /** The target port */
  toPort: Port;
  /** The source node */
  fromNode: Node;
  /** The target node */
  toNode: Node;
  /** Absolute position of the source port */
  fromPosition: { x: number; y: number };
  /** Absolute position of the target port */
  toPosition: { x: number; y: number };
  /** Whether this connection is selected */
  isSelected: boolean;
  /** Whether this connection is hovered */
  isHovered: boolean;
  /** Whether this connection touches a selected node */
  isAdjacentToSelectedNode: boolean;
  /** Whether this connection is being dragged */
  isDragging?: boolean;
  /** Drag progress (0-1) for visual feedback */
  dragProgress?: number;
};

/**
 * Port configuration for a node type
 */
export type PortDefinition = {
  /** Port identifier */
  id: string;
  /** Port type */
  type: "input" | "output";
  /** Display label */
  label: string;
  /** Position on the node */
  position: "left" | "right" | "top" | "bottom";
  /** Optional data type for validation */
  dataType?: string;
  /** Whether this port is required */
  required?: boolean;
  /** Maximum number of connections (default: 1 for input, unlimited for output) */
  maxConnections?: number | "unlimited";

  /**
   * Custom port renderer (complete control over port appearance)
   * @param context - Rendering context with port state and editor state
   * @param defaultRender - Function to render the default port appearance
   * @returns React element to render
   */
  renderPort?: (context: PortRenderContext, defaultRender: () => ReactElement) => ReactElement;

  /**
   * Custom connection renderer (complete control over connection appearance)
   * @param context - Rendering context with connection state and editor state
   * @param defaultRender - Function to render the default connection appearance
   * @returns React element to render (should be SVG)
   */
  renderConnection?: (context: ConnectionRenderContext, defaultRender: () => ReactElement) => ReactElement;
};

/**
 * Constraint violation information
 */
export type ConstraintViolation = {
  /** Type of constraint that was violated */
  type: string;
  /** Human-readable description of the violation */
  message: string;
  /** Severity level */
  severity: "error" | "warning" | "info";
  /** Related node IDs */
  nodeIds?: NodeId[];
  /** Related port IDs */
  portIds?: string[];
  /** Related connection IDs */
  connectionIds?: string[];
};

/**
 * Constraint validation context
 */
export type ConstraintContext = {
  /** Current node being validated */
  node: Node;
  /** All nodes in the editor */
  allNodes: Record<NodeId, Node>;
  /** All connections in the editor */
  allConnections: Record<string, Connection>;
  /** Node definition for the current node */
  nodeDefinition: NodeDefinition;
  /** Operation being performed */
  operation: "create" | "update" | "delete" | "connect" | "disconnect" | "move";
  /** Additional context data */
  context?: Record<string, unknown>;
};

/**
 * Constraint validation result
 */
export type ConstraintValidationResult = {
  /** Whether the constraint is satisfied */
  isValid: boolean;
  /** List of violations (if any) */
  violations: ConstraintViolation[];
};

/**
 * Node constraint definition
 */
export type NodeConstraint = {
  /** Unique identifier for the constraint */
  id: string;
  /** Display name for the constraint */
  name: string;
  /** Description of what the constraint does */
  description?: string;
  /** Constraint validation function */
  validate: (context: ConstraintContext) => ConstraintValidationResult;
  /** Whether this constraint should block operations when violated */
  blocking?: boolean;
  /** Operations this constraint applies to */
  appliesTo?: ("create" | "update" | "delete" | "connect" | "disconnect" | "move")[];
};

/**
 * Node type definition
 * @template TData - The node data type (defaults to Record<string, unknown>)
 */
export type NodeDefinition<TData extends Record<string, unknown> = Record<string, unknown>> = {
  /** Unique type identifier */
  type: string;
  /** Display name for the node type */
  displayName: string;
  /** Description of the node type */
  description?: string;
  /** Icon or visual identifier */
  icon?: ReactNode;
  /** Category for grouping in UI */
  category?: string;
  /**
   * Maximum number of nodes of this type allowed within a single flow/editor.
   * If undefined, no limit is enforced.
   */
  maxPerFlow?: number;
  /** Default data when creating a new node */
  defaultData?: TData;
  /** Default size for new nodes */
  defaultSize?: { width: number; height: number };
  /** Port definitions */
  ports?: PortDefinition[];
  /** Behaviors that this node exhibits (appearance/node/group). Defaults to ['node'] */
  behaviors?: NodeBehavior[];
  /** When true, node can only be moved by dragging title or when multi-selected */
  interactive?: boolean;
  /**
   * Custom render function for the node.
   * If the function name starts with an uppercase letter (React component convention),
   * it will be invoked as a JSX component, allowing the use of React hooks.
   * Otherwise, it will be called as a regular function for backwards compatibility.
   */
  renderNode?: (props: NodeRenderProps<TData>) => ReactElement;
  /**
   * Custom render function for the inspector panel.
   * If the function name starts with an uppercase letter (React component convention),
   * it will be invoked as a JSX component, allowing the use of React hooks.
   * Otherwise, it will be called as a regular function for backwards compatibility.
   */
  renderInspector?: (props: InspectorRenderProps<TData>) => ReactElement;
  /** External data loader */
  loadExternalData?: (ref: ExternalDataReference) => unknown | Promise<unknown>;
  /** External data updater */
  updateExternalData?: (ref: ExternalDataReference, data: unknown) => void | Promise<void>;
  /** Validation function for connections */
  validateConnection?: (fromPort: Port, toPort: Port) => boolean;
  /** Custom color or visual state */
  visualState?: "info" | "success" | "warning" | "error" | "disabled";
  /** Node constraints */
  constraints?: NodeConstraint[];
};

/**
 * Helper function to create a type-safe node definition
 * @template TData - The node data type
 */
export function createNodeDefinition<TData extends Record<string, unknown> = Record<string, unknown>>(
  definition: NodeDefinition<TData>,
): NodeDefinition<TData> {
  return definition;
}

/**
 * Helper function to get typed node data
 * @template TData - The node data type
 * @deprecated Use node.data directly with type assertion if needed
 */
export function getTypedNodeData<TData extends Record<string, unknown> = Record<string, unknown>>(
  node: Node,
): TData {
  return node.data as TData;
}

/**
 * Helper function to create a type-safe node data updater
 * @template TData - The node data type
 */
export function createNodeDataUpdater<TData extends Record<string, unknown> = Record<string, unknown>>(
  onUpdateNode: (updates: Partial<Node>) => void,
) {
  return (data: Partial<TData>) => {
    onUpdateNode({ data: data as NodeData });
  };
}

/**
 * @deprecated No longer needed - NodeDefinition is already compatible
 */
export function toUntypedDefinition<TData extends Record<string, unknown> = Record<string, unknown>>(
  def: NodeDefinition<TData>,
): NodeDefinition {
  return def as NodeDefinition<Record<string, unknown>>;
}
