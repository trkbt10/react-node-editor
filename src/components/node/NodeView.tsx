/**
 * @file Node view component
 */
import * as React from "react";
import type { Node, Position, Port, ResizeHandle as NodeResizeHandle } from "../../types/core";
import { useInlineEditing } from "../../contexts/InlineEditingContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useNodeDefinition } from "../../contexts/node-definitions/hooks/useNodeDefinition";
import { useExternalDataRef } from "../../contexts/external-data/ExternalDataContext";
import { useExternalData } from "../../contexts/external-data/useExternalData";
import styles from "./NodeView.module.css";
import type { ConnectablePortsResult } from "../../contexts/node-ports/utils/connectablePortPlanner";
import { ResizeHandles } from "./ResizeHandles";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeResize } from "../../hooks/useNodeResize";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { hasAppearanceBehavior, hasGroupBehavior } from "../../types/behaviors";
import { getReadableTextColor, applyOpacity } from "../../utils/colorUtils";
import { NodeBodyRenderer } from "./NodeBodyRenderer";
import { NodePortsRenderer } from "./NodePortsRenderer";
import { compareExternalDataStates } from "../../contexts/external-data/useExternalData";

export type CustomNodeRendererProps = {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
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
  onPortPointerMove?: (e: React.PointerEvent, port: Port) => void;
  onPortPointerLeave?: (e: React.PointerEvent, port: Port) => void;
  onPortPointerCancel?: (e: React.PointerEvent, port: Port) => void;
  connectingPort?: Port;
  hoveredPort?: Port;
  connectedPorts?: Set<string>;
  connectablePorts?: ConnectablePortsResult;
  nodeRenderer?: (props: CustomNodeRendererProps) => React.ReactNode;
  externalData?: unknown;
  onUpdateNode?: (updates: Partial<Node>) => void;
};

// Temporary debug flag for context changes
const DEBUG_NODEVIEW_CONTEXT_CHANGES = false;

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
  onPortPointerMove,
  onPortPointerLeave,
  onPortPointerCancel,
  hoveredPort,
  connectedPorts,
  connectablePorts,
}) => {
  const { actions: nodeEditorActions, getNodePorts } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { isEditing, startEditing, updateValue, confirmEdit, cancelEdit, state: editingState } = useInlineEditing();
  const {
    startResize,
    isResizing: isNodeResizing,
    getResizeHandle,
    getCurrentSize,
    getCurrentPosition,
  } = useNodeResize();
  const groupManager = useGroupManagement({ autoUpdateMembership: false });
  const nodeDefinition = useNodeDefinition(node.type);
  const externalDataRef = useExternalDataRef(node.id);
  const externalDataState = useExternalData(node, externalDataRef);

  // Debug: Log component render
  if (DEBUG_NODEVIEW_CONTEXT_CHANGES) {
    console.log(`[NodeView:${node.id}] NodeViewComponent is rendering`);
  }

  // Debug: Track context changes
  const prevActionStateRef = React.useRef(actionState);
  const prevEditingStateRef = React.useRef(editingState);
  const prevNodeDefinitionRef = React.useRef(nodeDefinition);
  const prevExternalDataStateRef = React.useRef(externalDataState);

  React.useEffect(() => {
    if (DEBUG_NODEVIEW_CONTEXT_CHANGES) {
      if (prevActionStateRef.current !== actionState) {
        console.log(`[NodeView:${node.id}] Context changed: actionState`, {
          prevDragState: prevActionStateRef.current?.dragState,
          nextDragState: actionState?.dragState,
          prevConnectionDragState: prevActionStateRef.current?.connectionDragState,
          nextConnectionDragState: actionState?.connectionDragState,
          prevSelectionBox: prevActionStateRef.current?.selectionBox,
          nextSelectionBox: actionState?.selectionBox,
        });
        prevActionStateRef.current = actionState;
      }
      if (prevEditingStateRef.current !== editingState) {
        console.log(`[NodeView:${node.id}] Context changed: editingState`, {
          prev: prevEditingStateRef.current,
          next: editingState,
        });
        prevEditingStateRef.current = editingState;
      }
      if (prevNodeDefinitionRef.current !== nodeDefinition) {
        console.log(`[NodeView:${node.id}] Context changed: nodeDefinition`, {
          prev: prevNodeDefinitionRef.current,
          next: nodeDefinition,
        });
        prevNodeDefinitionRef.current = nodeDefinition;
      }
      if (prevExternalDataStateRef.current !== externalDataState) {
        const comparison = compareExternalDataStates(prevExternalDataStateRef.current, externalDataState);
        console.log(`[NodeView:${node.id}] Context changed: externalDataState`, {
          ...comparison,
          prev: {
            data: prevExternalDataStateRef.current?.data,
            isLoading: prevExternalDataStateRef.current?.isLoading,
            error: prevExternalDataStateRef.current?.error,
          },
          next: { data: externalDataState?.data, isLoading: externalDataState?.isLoading, error: externalDataState?.error },
        });
        prevExternalDataStateRef.current = externalDataState;
      }
    }
  });

  // Reference to the DOM element for direct transform updates
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Check if this node is being resized
  const isResizing = isNodeResizing(node.id);
  const currentResizeHandle = getResizeHandle(node.id);

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

    if (isResizing) {
      const resizePosition = getCurrentPosition(node.id);
      if (resizePosition) {
        transformX = resizePosition.x;
        transformY = resizePosition.y;
      }
    }

    // Apply drag offset if dragging
    if (!isResizing) {
      if (isDragging && dragOffset) {
        transformX += dragOffset.x;
        transformY += dragOffset.y;
      } else if (actionState.dragState) {
        // Check if this is a child being dragged
        const { affectedChildNodes, offset } = actionState.dragState;
        const isChildOfDraggingGroup = Object.entries(affectedChildNodes).some(([_groupId, childIds]) =>
          childIds.includes(node.id),
        );

        if (isChildOfDraggingGroup) {
          transformX += offset.x;
          transformY += offset.y;
        }
      }
    }

    // Apply transform directly to DOM for performance
    nodeRef.current.style.transform = `translate(${transformX}px, ${transformY}px)`;
  }, [basePosition, isDragging, dragOffset, actionState.dragState, node.id, isResizing, getCurrentPosition]);

  // Calculate actual size including resize state
  const size = React.useMemo(() => {
    const baseSize = {
      width: node.size?.width || 150,
      height: node.size?.height || 50,
    };
    const currentSize = getCurrentSize(node.id);
    if (isResizing && currentSize) {
      return currentSize;
    }
    return baseSize;
  }, [node.size, isResizing, getCurrentSize, node.id]);

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
        nodeEditorActions.updateNode(node.id, {
          data: {
            ...node.data,
            title: editingState.currentValue,
          },
        });
        confirmEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelEdit();
      }
    },
    [editingState.currentValue, node.id, node.data, nodeEditorActions, confirmEdit, cancelEdit],
  );

  const handleEditingBlur = React.useCallback(() => {
    nodeEditorActions.updateNode(node.id, {
      data: {
        ...node.data,
        title: editingState.currentValue,
      },
    });
    confirmEdit();
  }, [editingState.currentValue, node.id, node.data, nodeEditorActions, confirmEdit]);

  const handleUpdateNode = React.useCallback(
    (updates: Partial<Node>) => {
      nodeEditorActions.updateNode(node.id, updates);
    },
    [node.id, nodeEditorActions],
  );

  const handleResizeStart = React.useCallback(
    (e: React.PointerEvent, handle: NodeResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      if (node.locked) {
        return;
      }

      const currentSize = {
        width: node.size?.width || 150,
        height: node.size?.height || 50,
      };

      startResize(node.id, handle, { x: e.clientX, y: e.clientY }, currentSize, {
        x: node.position.x,
        y: node.position.y,
      });
    },
    [node.id, node.size, node.locked, startResize, node.position.x, node.position.y],
  );

  // Extract port connection state for memoization
  const connectingPortId = React.useMemo(
    () => actionState.connectionDragState?.fromPort.id,
    [actionState.connectionDragState?.fromPort.id],
  );

  const candidatePortId = React.useMemo(
    () => actionState.connectionDragState?.candidatePort?.id,
    [actionState.connectionDragState?.candidatePort?.id],
  );

  // Custom renderer props - memoized with granular dependencies
  const isEditingTitle = isEditing(node.id, "title");
  const customRenderProps = React.useMemo(() => {
    // Create a node object with the current resize size if resizing
    const nodeWithCurrentSize: Node = isResizing ? { ...node, size } : node;

    return {
      node: nodeWithCurrentSize,
      isSelected,
      isDragging,
      isResizing,
      isEditing: isEditingTitle,
      externalData: externalDataState.data,
      isLoadingExternalData: externalDataState.isLoading,
      externalDataError: externalDataState.error,
      onStartEdit: () => startEditing(node.id, "title", node.data.title || ""),
      onUpdateNode: handleUpdateNode,
    };
  }, [
    node,
    size,
    isSelected,
    isDragging,
    isResizing,
    isEditingTitle,
    externalDataState.data,
    externalDataState.isLoading,
    externalDataState.error,
    startEditing,
    handleUpdateNode,
  ]);

  // Calculate child dragging state
  const isChildDragging = React.useMemo(() => {
    if (!actionState.dragState) {
      return false;
    }
    const { affectedChildNodes } = actionState.dragState;
    return Object.entries(affectedChildNodes).some(([_groupId, childIds]) => childIds.includes(node.id));
  }, [actionState.dragState, node.id]);

  // Get ports for this node
  const ports = React.useMemo(() => getNodePorts(node.id) || [], [getNodePorts, node.id]);

  // Handle pointer down on node
  const handleNodePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;

      // Prevent dragging when clicking on input elements
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Check if this is an interactive node from the definition
      const isInteractive = nodeDefinition?.interactive;

      // For interactive nodes, check if we're clicking on the drag handle area
      if (isInteractive && !isSelected) {
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

  const isVisuallyDragging = isDragging || isChildDragging;

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
        opacity: isVisuallyDragging ? "var(--node-editor-opacity-dragging)" : undefined,
      }}
      onPointerDown={handleNodePointerDown}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      data-node-id={node.id}
      data-selected={isSelected}
      data-dragging={isVisuallyDragging}
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
        isEditing={isEditingTitle}
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
        onPortPointerMove={onPortPointerMove}
        onPortPointerLeave={onPortPointerLeave}
        onPortPointerCancel={onPortPointerCancel}
        hoveredPort={hoveredPort}
        connectedPorts={connectedPorts}
        connectablePorts={connectablePorts}
        connectingPortId={connectingPortId}
        candidatePortId={candidatePortId}
      />

      {/* Render resize handles when selected and not locked */}
      {isSelected && !node.locked && (
        <ResizeHandles size={size} activeHandle={currentResizeHandle} onResizeStart={handleResizeStart} />
      )}
    </div>
  );
};

// Temporary debug flag - set to true to enable detailed re-render logging
const DEBUG_NODEVIEW_RERENDERS = false;

// Custom comparison function for memo
const areEqual = (prevProps: NodeViewProps, nextProps: NodeViewProps): boolean => {
  const nodeId = prevProps.node.id;
  const debugLog = (reason: string, details?: Record<string, unknown>) => {
    if (DEBUG_NODEVIEW_RERENDERS) {
      console.log(`[NodeView:${nodeId}] Re-rendering because:`, reason, details || "");
    }
  };

  // Always re-render if basic properties change
  if (prevProps.node.id !== nextProps.node.id) {
    debugLog("node.id changed", { prev: prevProps.node.id, next: nextProps.node.id });
    return false;
  }
  if (prevProps.isSelected !== nextProps.isSelected) {
    debugLog("isSelected changed", { prev: prevProps.isSelected, next: nextProps.isSelected });
    return false;
  }
  if (prevProps.isDragging !== nextProps.isDragging) {
    debugLog("isDragging changed", { prev: prevProps.isDragging, next: nextProps.isDragging });
    return false;
  }
  if (prevProps.isResizing !== nextProps.isResizing) {
    debugLog("isResizing changed", { prev: prevProps.isResizing, next: nextProps.isResizing });
    return false;
  }
  if (prevProps.connectablePorts !== nextProps.connectablePorts) {
    debugLog("connectablePorts reference changed", {
      prev: prevProps.connectablePorts,
      next: nextProps.connectablePorts,
    });
    return false;
  }

  // Check node data changes
  if (prevProps.node.position.x !== nextProps.node.position.x) {
    debugLog("node.position.x changed", { prev: prevProps.node.position.x, next: nextProps.node.position.x });
    return false;
  }
  if (prevProps.node.position.y !== nextProps.node.position.y) {
    debugLog("node.position.y changed", { prev: prevProps.node.position.y, next: nextProps.node.position.y });
    return false;
  }
  if (prevProps.node.size?.width !== nextProps.node.size?.width) {
    debugLog("node.size.width changed", { prev: prevProps.node.size?.width, next: nextProps.node.size?.width });
    return false;
  }
  if (prevProps.node.size?.height !== nextProps.node.size?.height) {
    debugLog("node.size.height changed", { prev: prevProps.node.size?.height, next: nextProps.node.size?.height });
    return false;
  }
  if (prevProps.node.locked !== nextProps.node.locked) {
    debugLog("node.locked changed", { prev: prevProps.node.locked, next: nextProps.node.locked });
    return false;
  }
  if (prevProps.node.data !== nextProps.node.data) {
    debugLog("node.data reference changed", {
      prev: prevProps.node.data,
      next: nextProps.node.data,
    });
    return false;
  }

  // Check drag offset changes
  if (prevProps.dragOffset?.x !== nextProps.dragOffset?.x) {
    debugLog("dragOffset.x changed", { prev: prevProps.dragOffset?.x, next: nextProps.dragOffset?.x });
    return false;
  }
  if (prevProps.dragOffset?.y !== nextProps.dragOffset?.y) {
    debugLog("dragOffset.y changed", { prev: prevProps.dragOffset?.y, next: nextProps.dragOffset?.y });
    return false;
  }

  // Check port-related changes
  if (prevProps.connectingPort?.id !== nextProps.connectingPort?.id) {
    debugLog("connectingPort.id changed", {
      prev: prevProps.connectingPort?.id,
      next: nextProps.connectingPort?.id,
    });
    return false;
  }
  if (prevProps.hoveredPort?.id !== nextProps.hoveredPort?.id) {
    debugLog("hoveredPort.id changed", { prev: prevProps.hoveredPort?.id, next: nextProps.hoveredPort?.id });
    return false;
  }

  // Props are equal, skip re-render
  if (DEBUG_NODEVIEW_RERENDERS) {
    console.log(`[NodeView:${nodeId}] Skipped re-render (props are equal)`);
  }
  return true;
};

// Export memoized component
export const NodeView = React.memo(NodeViewComponent, areEqual);

NodeView.displayName = "NodeView";
