import React, { type ReactNode, type ReactElement } from "react";
import type { Node, NodeId, Port, Connection, ConnectionId, NodeData } from "./core";
import type { NodeBehavior } from "./behaviors";

/**
 * Base node data type map interface
 * This can be extended through generic parameters instead of module augmentation
 * @example
 * // Instead of module augmentation, use as generic parameter:
 * type MyNodeTypes = {
 *   'my-custom-node': { title: string; value: number; };
 * };
 * // Then use with NodeDefinitionProvider<MyNodeTypes>
 */
export type NodeDataTypeMap = {
  // This interface is intentionally empty - users should use generic parameters
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
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export type NodeRenderProps<TNodeType extends string = string, TNodeDataTypeMap = NodeDataTypeMap> = {
  /** The node data with type-safe data property */
  node: TNodeType extends keyof TNodeDataTypeMap
    ? Node & {
        type: TNodeType;
        data: TNodeDataTypeMap[TNodeType];
      }
    : Node;
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
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export type InspectorRenderProps<TNodeType extends string = string, TNodeDataTypeMap = NodeDataTypeMap> = {
  /** The selected node with type-safe data property */
  node: TNodeType extends keyof TNodeDataTypeMap
    ? Node & {
        type: TNodeType;
        data: TNodeDataTypeMap[TNodeType];
      }
    : Node;
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
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export type NodeDefinition<TNodeType extends string = string, TNodeDataTypeMap = NodeDataTypeMap> = {
  /** Unique type identifier */
  type: TNodeType;
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
  defaultData?: TNodeType extends keyof TNodeDataTypeMap ? TNodeDataTypeMap[TNodeType] : Record<string, unknown>;
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
  renderNode?: (props: NodeRenderProps<TNodeType, TNodeDataTypeMap>) => ReactElement;
  /**
   * Custom render function for the inspector panel.
   * If the function name starts with an uppercase letter (React component convention),
   * it will be invoked as a JSX component, allowing the use of React hooks.
   * Otherwise, it will be called as a regular function for backwards compatibility.
   */
  renderInspector?: (props: InspectorRenderProps<TNodeType, TNodeDataTypeMap>) => ReactElement;
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
 * Node definitions registry
 * @template TNodeDataTypeMap - The node data type map
 */
export type NodeDefinitionRegistry<TNodeDataTypeMap = NodeDataTypeMap> = {
  /** Map of type to definition */
  definitions: Map<string, NodeDefinition<string, TNodeDataTypeMap>>;
  /** Register a new node type */
  register: (definition: NodeDefinition<string, TNodeDataTypeMap>) => void;
  /** Unregister a node type */
  unregister: (type: string) => void;
  /** Get a node definition by type */
  get: (type: string) => NodeDefinition<string, TNodeDataTypeMap> | undefined;
  /** Get all definitions */
  getAll: () => NodeDefinition<string, TNodeDataTypeMap>[];
  /** Get definitions by category */
  getByCategory: (category: string) => NodeDefinition<string, TNodeDataTypeMap>[];
};

/**
 * Create a node definition registry
 * @template TNodeDataTypeMap - The node data type map
 */
export function createNodeDefinitionRegistry<
  TNodeDataTypeMap extends NodeDataTypeMap,
>(): NodeDefinitionRegistry<TNodeDataTypeMap> {
  const definitions = new Map<string, NodeDefinition<string, TNodeDataTypeMap>>();

  return {
    definitions,
    register(definition: NodeDefinition<string, TNodeDataTypeMap>) {
      definitions.set(definition.type, definition);
    },
    unregister(type: string) {
      definitions.delete(type);
    },
    get(type: string) {
      return definitions.get(type);
    },
    getAll() {
      return Array.from(definitions.values());
    },
    getByCategory(category: string) {
      return Array.from(definitions.values()).filter((def) => def.category === category);
    },
  };
}

/**
 * Helper function to create a type-safe node definition
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export function createNodeDefinition<TNodeType extends string, TNodeDataTypeMap = NodeDataTypeMap>(
  definition: NodeDefinition<TNodeType, TNodeDataTypeMap>,
): NodeDefinition<TNodeType, TNodeDataTypeMap> {
  return definition;
}

/**
 * Helper function to get typed node data
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export function getTypedNodeData<TNodeType extends keyof TNodeDataTypeMap, TNodeDataTypeMap = NodeDataTypeMap>(
  node: Node & { type: TNodeType },
): TNodeDataTypeMap[TNodeType] {
  return node.data as TNodeDataTypeMap[TNodeType];
}

/**
 * Helper function to create a type-safe node data updater
 * @template TNodeType - The specific node type
 * @template TNodeDataTypeMap - The node data type map
 */
export function createNodeDataUpdater<TNodeType extends keyof TNodeDataTypeMap, TNodeDataTypeMap = NodeDataTypeMap>(
  onUpdateNode: (updates: Partial<Node>) => void,
) {
  return (data: Partial<TNodeDataTypeMap[TNodeType]>) => {
    onUpdateNode({ data: data as NodeData });
  };
}

/**
 * Compatibility bridge: Convert typed node render to original interface
 * @template TNodeType - The specific node type from NodeDataTypeMap
 */
export function asOriginalNodeRender<TNodeType extends string>(
  render: (props: NodeRenderProps<TNodeType>) => ReactElement,
): (props: NodeRenderProps) => ReactElement {
  return (props: NodeRenderProps) => render(props as NodeRenderProps<TNodeType>);
}

/**
 * Compatibility bridge: Convert typed inspector render to original interface
 * @template TNodeType - The specific node type from NodeDataTypeMap
 */
export function asOriginalInspectorRender<TNodeType extends string>(
  render: (props: InspectorRenderProps<TNodeType>) => ReactElement,
): (props: InspectorRenderProps) => ReactElement {
  return (props: InspectorRenderProps) => render(props as InspectorRenderProps<TNodeType>);
}

/**
 * Create a widened, untyped node definition suitable for heterogeneous registries.
 * This function performs a type-safe conversion without runtime type checking.
 */
export function toUntypedDefinition<TNodeType extends string, TMap = NodeDataTypeMap>(
  def: NodeDefinition<TNodeType, TMap>,
): NodeDefinition<string, NodeDataTypeMap> {
  // Simply cast the definition to the untyped version
  // Runtime type checking is handled by the renderers themselves
  return def as unknown as NodeDefinition<string, NodeDataTypeMap>;
}
