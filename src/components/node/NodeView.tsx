import * as React from "react";
import type { Node, Position, Port } from "../../types/core";
import { useInlineEditing } from "../../contexts/InlineEditingContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { useNodeDefinition } from "../../contexts/NodeDefinitionContext";
import { useExternalDataRef } from "../../contexts/ExternalDataContext";
import { useExternalData } from "../../hooks/useExternalData";
import styles from "./NodeView.module.css";
import type { ConnectablePortsResult } from "../../contexts/node-ports";
import { ResizeHandle } from "./ResizeHandle";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeResize } from "../../hooks/useNodeResize";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { hasAppearanceBehavior, hasGroupBehavior } from "../../types/behaviors";
import { getReadableTextColor, applyOpacity } from "../../utils/colorUtils";
import { NodeBodyRenderer } from "./NodeBodyRenderer";
import { NodePortsRenderer } from "./NodePortsRenderer";

export type CustomNodeRendererProps = {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  isEditing: boolean;
  externalData: unknown;
  isLoadingExternalData: boolean;
  externalDataError: Error | null;
  onStartEdit: () => void;
  onUpdateNode: (updates: Partial<Node>) => void;
};

export type NodeViewProps = {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  isResizing?: boolean;
  dragOffset?: Position;
  onPointerDown: (e: React.PointerEvent, nodeId: string, isDragAllowed?: boolean) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onPortPointerDown?: (e: React.PointerEvent, port: Port) => void;
  onPortPointerUp?: (e: React.PointerEvent, port: Port) => void;
  onPortPointerEnter?: (e: React.PointerEvent, port: Port) => void;
  onPortPointerLeave?: (e: React.PointerEvent, port: Port) => void;
  connectingPort?: Port;
  hoveredPort?: Port;
  connectedPorts?: Set<string>;
  connectablePorts?: ConnectablePortsResult;
  nodeRenderer?: (props: CustomNodeRendererProps) => React.ReactNode;
  externalData?: unknown;
  onUpdateNode?: (updates: Partial<Node>) => void;
};

// Optimized NodeView component with CSS transform for dragging
const NodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  isSelected,
  isDragging,
  dragOffset,
  onPointerDown,
  onContextMenu,
  onPortPointerDown,
  onPortPointerUp,
  onPortPointerEnter,
  onPortPointerLeave,
  connectingPort,
  hoveredPort,
  connectedPorts,
  connectablePorts,
  nodeRenderer,
  externalData,
  onUpdateNode,
}) => {
  const { dispatch: nodeEditorDispatch, actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { isEditing, startEditing, updateValue, confirmEdit, cancelEdit, state: editingState } = useInlineEditing();
  const nodeResize = useNodeResize();
  const groupManager = useGroupManagement({ autoUpdateMembership: false });
  const nodeDefinition = useNodeDefinition(node.type);
  const externalDataRef = useExternalDataRef(node.id);
  const externalDataState = useExternalData(node, externalDataRef);

  // Reference to the DOM element for direct transform updates
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Check if this node is being resized
  const isResizing = nodeResize.isResizing(node.id);
  const currentResizeHandle = nodeResize.getResizeHandle(node.id);

  // Group-related state (behavior-driven)
  const isGroupBehavior = hasGroupBehavior(nodeDefinition);
  const isAppearanceBehavior = hasAppearanceBehavior(nodeDefinition);
  const groupChildren = isGroupBehavior ? groupManager.getGroupChildren(node.id) : [];
  const hasChildren = groupChildren.length > 0;

  // Base position (without drag offset)
  const basePosition = React.useMemo(
    () => ({
      x: node.position.x,
      y: node.position.y,
    }),
    [node.position.x, node.position.y],
  );

  // Apply drag transform via CSS for performance
  React.useLayoutEffect(() => {
    if (!nodeRef.current) {
      return;
    }

    let transformX = basePosition.x;
    let transformY = basePosition.y;

    // Apply drag offset if dragging
    if (isDragging && dragOffset) {
      transformX += dragOffset.x;
      transformY += dragOffset.y;
    } else if (actionState.dragState) {
      // Check if this is a child being dragged
      const { affectedChildNodes, offset } = actionState.dragState;
      const isChildOfDraggingGroup = Object.entries(affectedChildNodes).some(([groupId, childIds]) =>
        childIds.includes(node.id),
      );

      if (isChildOfDraggingGroup) {
        transformX += offset.x;
        transformY += offset.y;
      }
    }

    // Apply transform directly to DOM for performance
    nodeRef.current.style.transform = `translate(${transformX}px, ${transformY}px)`;
  }, [basePosition, isDragging, dragOffset, actionState.dragState, node.id]);

  // Calculate actual size including resize state
  const size = React.useMemo(() => {
    const baseSize = {
      width: node.size?.width || 150,
      height: node.size?.height || 50,
    };
    const currentSize = nodeResize.getCurrentSize(node.id);
    if (isResizing && currentSize) {
      return currentSize;
    }
    return baseSize;
  }, [node.size, isResizing, nodeResize, node.id]);

  // Memoized event handlers
  const handleTitleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.locked) {
        // Start editing with raw current title (blank if unset)
        const currentTitle = node.data.title || "";
        startEditing(node.id, "title", currentTitle);
      }
    },
    [node.id, node.data.title, node.locked, startEditing],
  );

  const handleEditingChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateValue(e.target.value);
    },
    [updateValue],
  );

  const handleEditingKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        nodeEditorDispatch(
          nodeEditorActions.updateNode(node.id, {
            data: {
              ...node.data,
              title: editingState.currentValue,
            },
          }),
        );
        confirmEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelEdit();
      }
    },
    [editingState.currentValue, node.id, node.data, nodeEditorDispatch, nodeEditorActions, confirmEdit, cancelEdit],
  );

  const handleEditingBlur = React.useCallback(() => {
    nodeEditorDispatch(
      nodeEditorActions.updateNode(node.id, {
        data: {
          ...node.data,
          title: editingState.currentValue,
        },
      }),
    );
    confirmEdit();
  }, [editingState.currentValue, node.id, node.data, nodeEditorDispatch, nodeEditorActions, confirmEdit]);

  const handleUpdateNode = React.useCallback(
    (updates: Partial<Node>) => {
      nodeEditorDispatch(nodeEditorActions.updateNode(node.id, updates));
    },
    [node.id, nodeEditorDispatch, nodeEditorActions],
  );

  const handleResizeStart = React.useCallback(
    (e: React.PointerEvent, handle: "se") => {
      e.stopPropagation();
      e.preventDefault();

      if (node.locked) {
        return;
      }

      const currentSize = {
        width: node.size?.width || 150,
        height: node.size?.height || 50,
      };

      nodeResize.startResize(node.id, handle, { x: e.clientX, y: e.clientY }, currentSize);
    },
    [node.id, node.size, node.locked, nodeResize],
  );

  // Custom renderer props
  const customRenderProps = React.useMemo(
    () => ({
      node,
      isSelected,
      isDragging,
      isEditing: isEditing(node.id, "title"),
      externalData: externalDataState.data,
      isLoadingExternalData: externalDataState.isLoading,
      externalDataError: externalDataState.error,
      onStartEdit: () => startEditing(node.id, "title", node.data.title || ""),
      onUpdateNode: handleUpdateNode,
    }),
    [node, isSelected, isDragging, externalDataState, startEditing, handleUpdateNode, isEditing],
  );

  // Calculate child dragging state
  const isChildDragging = React.useMemo(() => {
    if (!actionState.dragState) {
      return false;
    }
    const { affectedChildNodes } = actionState.dragState;
    return Object.entries(affectedChildNodes).some(([groupId, childIds]) => childIds.includes(node.id));
  }, [actionState.dragState, node.id]);

  // Get ports for this node
  const ports = React.useMemo(() => getNodePorts(node.id) || [], [getNodePorts, node.id]);

  // Handle pointer down on node
  const handleNodePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      // Check if this is an interactive node from the definition
      const isInteractive = nodeDefinition?.interactive;

      // For interactive nodes, check if we're clicking on the drag handle area
      if (isInteractive && !isSelected) {
        const target = e.target as HTMLElement;
        const isDragHandle = target.closest('[data-drag-handle="true"]');

        // Only allow dragging from drag handle for interactive nodes when not multi-selected
        onPointerDown(e, node.id, !!isDragHandle);
      } else {
        // For non-interactive nodes or when selected, allow dragging from anywhere
        onPointerDown(e, node.id, true);
      }
    },
    [nodeDefinition?.interactive, node.id, isSelected, onPointerDown],
  );

  // Dynamic styling for group nodes (minimize explicit branching)
  const isGroup = isGroupBehavior;
  const groupBackground =
    isGroup && typeof (node.data as Record<string, unknown>).groupBackground === "string"
      ? String((node.data as Record<string, unknown>).groupBackground)
      : undefined;
  const groupOpacity =
    isGroup && typeof (node.data as Record<string, unknown>).groupOpacity === "number"
      ? ((node.data as Record<string, unknown>).groupOpacity as number)
      : undefined;

  const groupTextColor = isGroup ? getReadableTextColor(groupBackground) : undefined;
  const backgroundWithOpacity = React.useMemo(() => {
    if (!isGroup) {
      return undefined;
    }
    if (!groupBackground) {
      return undefined;
    }
    if (typeof groupOpacity !== "number") {
      return groupBackground;
    }
    return applyOpacity(groupBackground, groupOpacity);
  }, [isGroup, groupBackground, groupOpacity]);

  return (
    <div
      ref={nodeRef}
      className={styles.nodeView}
      style={{
        width: size.width,
        height: size.height,
        zIndex: isGroup ? 1 : isDragging || isResizing ? 1000 : 2,
        backgroundColor: backgroundWithOpacity ?? groupBackground,
        color: groupTextColor,
      }}
      onPointerDown={handleNodePointerDown}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      data-node-id={node.id}
      data-selected={isSelected}
      data-dragging={isDragging || isChildDragging}
      data-resizing={isResizing}
      data-locked={node.locked}
      data-visual-state={node.data.visualState || undefined}
      data-is-group={isGroup}
      data-has-children={hasChildren}
      data-plain-node={isAppearanceBehavior}
    >
      <NodeBodyRenderer
        node={node}
        isSelected={isSelected}
        nodeDefinition={nodeDefinition}
        customRenderProps={customRenderProps}
        isEditing={isEditing(node.id, "title")}
        editingValue={editingState.currentValue}
        isGroup={isGroup}
        groupChildrenCount={groupChildren.length}
        groupTextColor={groupTextColor}
        onTitleDoubleClick={handleTitleDoubleClick}
        onEditingChange={handleEditingChange}
        onEditingKeyDown={handleEditingKeyDown}
        onEditingBlur={handleEditingBlur}
      />

      <NodePortsRenderer
        ports={ports}
        onPortPointerDown={onPortPointerDown}
        onPortPointerUp={onPortPointerUp}
        onPortPointerEnter={onPortPointerEnter}
        onPortPointerLeave={onPortPointerLeave}
        hoveredPort={hoveredPort}
        connectedPorts={connectedPorts}
        connectablePorts={connectablePorts}
      />

      {/* Render resize handle when selected and not locked */}
      {isSelected && !node.locked && (
        <ResizeHandle
          position="se"
          onResizeStart={handleResizeStart}
          isResizing={currentResizeHandle === "se"}
          isVisible={true}
        />
      )}
    </div>
  );
};

// Custom comparison function for memo
const areEqual = (prevProps: NodeViewProps, nextProps: NodeViewProps): boolean => {
  // Always re-render if basic properties change
  if (
    prevProps.node.id !== nextProps.node.id ||
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isDragging !== nextProps.isDragging ||
    prevProps.isResizing !== nextProps.isResizing ||
    prevProps.connectablePorts !== nextProps.connectablePorts
  ) {
    return false;
  }

  // Check node data changes
  if (
    prevProps.node.position.x !== nextProps.node.position.x ||
    prevProps.node.position.y !== nextProps.node.position.y ||
    prevProps.node.size?.width !== nextProps.node.size?.width ||
    prevProps.node.size?.height !== nextProps.node.size?.height ||
    prevProps.node.locked !== nextProps.node.locked ||
    prevProps.node.data !== nextProps.node.data
  ) {
    return false;
  }

  // Check drag offset changes
  if (prevProps.dragOffset?.x !== nextProps.dragOffset?.x || prevProps.dragOffset?.y !== nextProps.dragOffset?.y) {
    return false;
  }

  // Check port-related changes
  if (
    prevProps.connectingPort?.id !== nextProps.connectingPort?.id ||
    prevProps.hoveredPort?.id !== nextProps.hoveredPort?.id
  ) {
    return false;
  }

  // Props are equal, skip re-render
  return true;
};

// Export memoized component
export const NodeView = React.memo(NodeViewComponent, areEqual);

NodeView.displayName = "NodeView";
