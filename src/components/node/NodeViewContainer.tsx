/**
 * @file Container component that handles context subscriptions for NodeView
 * Computes derived state and passes it to the pure NodeViewPresenter
 */
import * as React from "react";
import type { Node, Position, Port, ResizeHandle as NodeResizeHandle } from "../../types/core";
import type { ConnectablePortsResult } from "../../contexts/node-ports/utils/connectablePortPlanner";
import { useInlineEditing } from "../../contexts/InlineEditingContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useNodeDefinition } from "../../contexts/node-definitions/hooks/useNodeDefinition";
import { useExternalDataRef } from "../../contexts/external-data/ExternalDataContext";
import { useExternalData } from "../../contexts/external-data/useExternalData";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { computeNodeBehaviorState, computeNodeResizeState } from "../../core/node/nodeState";
import { computeNodeAppearance } from "../../core/node/nodeAppearance";
import { DEFAULT_NODE_SIZE } from "../../core/node/comparators";
import { NodeViewPresenter } from "./NodeViewPresenter";
import type { CustomNodeRendererProps } from "./NodeViewPresenter";

export type NodeViewContainerProps = {
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
  candidatePortId?: string;
  nodeRenderer?: (props: CustomNodeRendererProps) => React.ReactNode;
  externalData?: unknown;
  onUpdateNode?: (updates: Partial<Node>) => void;
};

const NodeViewContainerComponent: React.FC<NodeViewContainerProps> = ({
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
  connectingPort,
  hoveredPort,
  connectedPorts,
  connectablePorts,
  candidatePortId,
}) => {
  const { actions: nodeEditorActions, getNodePorts, getNodeById } = useNodeEditor();
  const { isEditing, startEditing, updateValue, confirmEdit, cancelEdit, state: editingState } = useInlineEditing();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const groupManager = useGroupManagement({ autoUpdateMembership: false });
  const nodeDefinition = useNodeDefinition(node.type);
  const externalDataRef = useExternalDataRef(node.id);
  const externalDataState = useExternalData(node, externalDataRef);

  const behaviorState = React.useMemo(() => computeNodeBehaviorState(nodeDefinition), [nodeDefinition]);

  const appearance = React.useMemo(
    () => computeNodeAppearance(node, behaviorState.isGroup),
    [node, behaviorState.isGroup],
  );

  const resizeState = React.useMemo(
    () => computeNodeResizeState(node.id, actionState.resizeState),
    [node.id, actionState.resizeState],
  );

  const groupChildren = React.useMemo(
    () => (behaviorState.isGroup ? groupManager.getGroupChildren(node.id) : []),
    [behaviorState.isGroup, groupManager, node.id],
  );

  const displaySize = React.useMemo(() => {
    if (resizeState.isResizing && resizeState.currentSize) {
      return resizeState.currentSize;
    }
    return node.size ?? DEFAULT_NODE_SIZE;
  }, [node.size, resizeState.isResizing, resizeState.currentSize]);

  const isVisuallyDragging = isDragging || dragOffset !== undefined;
  const hasChildren = groupChildren.length > 0;

  const ports = React.useMemo(() => getNodePorts(node.id) || [], [getNodePorts, node.id]);

  const isEditingTitle = isEditing(node.id, "title");

  const handleTitleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.locked) {
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

  const handleStartEdit = React.useCallback(() => {
    startEditing(node.id, "title", node.data.title || "");
  }, [node.id, node.data.title, startEditing]);

  const handleResizeStart = React.useCallback(
    (e: React.PointerEvent, handle: NodeResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      if (node.locked) {
        return;
      }

      const liveNode = getNodeById(node.id) || node;
      const currentSize = {
        width: liveNode.size?.width || 150,
        height: liveNode.size?.height || 50,
      };

      actionActions.startNodeResize(node.id, { x: e.clientX, y: e.clientY }, currentSize, handle, {
        x: liveNode.position.x,
        y: liveNode.position.y,
      });
    },
    [node.id, node.locked, actionActions, getNodeById],
  );

  return (
    <NodeViewPresenter
      node={node}
      isSelected={isSelected}
      isDragging={isDragging}
      dragOffset={dragOffset}
      behaviorState={behaviorState}
      appearance={appearance}
      resizeState={resizeState}
      displaySize={displaySize}
      isVisuallyDragging={isVisuallyDragging}
      hasChildren={hasChildren}
      groupChildrenCount={groupChildren.length}
      nodeDefinition={nodeDefinition}
      externalDataState={externalDataState}
      ports={ports}
      isEditingTitle={isEditingTitle}
      editingValue={editingState.currentValue}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onTitleDoubleClick={handleTitleDoubleClick}
      onEditingChange={handleEditingChange}
      onEditingKeyDown={handleEditingKeyDown}
      onEditingBlur={handleEditingBlur}
      onResizeStart={handleResizeStart}
      onUpdateNode={handleUpdateNode}
      onStartEdit={handleStartEdit}
      onPortPointerDown={onPortPointerDown}
      onPortPointerUp={onPortPointerUp}
      onPortPointerEnter={onPortPointerEnter}
      onPortPointerMove={onPortPointerMove}
      onPortPointerLeave={onPortPointerLeave}
      onPortPointerCancel={onPortPointerCancel}
      connectingPort={connectingPort}
      hoveredPort={hoveredPort}
      connectedPorts={connectedPorts}
      connectablePorts={connectablePorts}
      candidatePortId={candidatePortId}
    />
  );
};

export const NodeViewContainer = React.memo(NodeViewContainerComponent);

NodeViewContainer.displayName = "NodeViewContainer";
