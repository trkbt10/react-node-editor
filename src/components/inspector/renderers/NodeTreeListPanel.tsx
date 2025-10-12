/**
 * @file Node tree list panel component
 */
import * as React from "react";
import { useNodeEditor } from "../../../contexts/node-editor";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeDefinitionList } from "../../../contexts/node-definitions";
import { hasGroupBehavior } from "../../../types/behaviors";
import { Node, NodeId } from "../../../types/core";
import { getNodeIcon } from "../../../contexts/node-definitions/utils/iconUtils";
import { CloseIcon, classNames, LockIcon, UnlockIcon } from "../../elements";
import { PropertySection } from "../parts/PropertySection";
import styles from "./NodeTreeListPanel.module.css";
import { useI18n } from "../../../i18n";

type DragState = {
  draggingNodeId: NodeId | null;
  dragOverNodeId: NodeId | null;
  dragOverPosition: "before" | "inside" | "after" | null;
}

type NodeTreeItemProps = {
  node: Node;
  level: number;
  isSelected: boolean;
  onSelect: (nodeId: NodeId, multiSelect: boolean) => void;
  onToggleVisibility?: (nodeId: NodeId) => void;
  onToggleLock?: (nodeId: NodeId) => void;
  onToggleExpand?: (nodeId: NodeId) => void;
  onDeleteNode?: (nodeId: NodeId) => void;
  childNodes: Node[];
  dragState: DragState;
  onNodeDrop: (draggedNodeId: NodeId, targetNodeId: NodeId, position: "before" | "inside" | "after") => void;
  onDragStateChange: (state: Partial<DragState>) => void;
}

const NodeTreeItem: React.FC<NodeTreeItemProps> = ({
  node,
  level,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleExpand,
  onDeleteNode,
  childNodes,
  dragState,
  onNodeDrop,
  onDragStateChange,
}) => {
  const { t } = useI18n();
  const nodeDefinitions = useNodeDefinitionList();
  const def = React.useMemo(() => nodeDefinitions.find((d) => d.type === node.type), [nodeDefinitions, node.type]);
  const isGroup = hasGroupBehavior(def);
  const hasChildren = isGroup && childNodes.length > 0;
  const isExpanded = isGroup && node.expanded !== false;

  const isDragging = dragState.draggingNodeId === node.id;
  const isDragOver = dragState.dragOverNodeId === node.id;
  const dragOverPosition = isDragOver ? dragState.dragOverPosition : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id, e.ctrlKey || e.metaKey);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand && hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(node.id);
    }
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(node.id);
    }
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteNode) {
      onDeleteNode(node.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("nodeId", node.id);
    onDragStateChange({ draggingNodeId: node.id });
  };

  const handleDragEnd = () => {
    onDragStateChange({
      draggingNodeId: null,
      dragOverNodeId: null,
      dragOverPosition: null,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.draggingNodeId === node.id) {return;}

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: "before" | "inside" | "after";

    if (isGroup && y > height * 0.25 && y < height * 0.75) {
      position = "inside";
    } else if (y < height / 2) {
      position = "before";
    } else {
      position = "after";
    }

    if (dragState.dragOverNodeId !== node.id || dragState.dragOverPosition !== position) {
      onDragStateChange({
        dragOverNodeId: node.id,
        dragOverPosition: position,
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      onDragStateChange({
        dragOverNodeId: null,
        dragOverPosition: null,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedNodeId = e.dataTransfer.getData("nodeId");
    if (draggedNodeId && dragState.dragOverPosition) {
      onNodeDrop(draggedNodeId, node.id, dragState.dragOverPosition);
    }

    onDragStateChange({
      draggingNodeId: null,
      dragOverNodeId: null,
      dragOverPosition: null,
    });
  };

  return (
    <>
      {isDragOver && dragOverPosition === "before" && (
        <div className={styles.dropIndicator} style={{ marginLeft: `${level * 16 + 8}px` }} />
      )}
      <div
        className={styles.treeItem}
        data-selected={isSelected}
        data-dragging={isDragging}
        data-drag-over-inside={isDragOver && dragOverPosition === "inside"}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <button className={styles.expandButton} onClick={handleToggleExpand} aria-label={isExpanded ? "Collapse" : "Expand"}>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="currentColor"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <path d="M2 1l4 3-4 3V1z" />
            </svg>
          </button>
        )}

        <span className={styles.nodeIcon}>{getNodeIcon(node.type, nodeDefinitions)}</span>

        <span className={styles.nodeName}>
          {node.data?.title && node.data.title.trim().length > 0 ? node.data.title : t("untitled")}
        </span>

        <button
          className={styles.lockButton}
          onClick={handleToggleLock}
          aria-label={node.locked ? "Unlock" : "Lock"}
          title={node.locked ? "Unlock" : "Lock"}
        >
          {node.locked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
        </button>

        <button
          className={styles.visibilityButton}
          onClick={handleToggleVisibility}
          aria-label={node.visible !== false ? "Hide" : "Show"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {node.visible !== false ? (
              <path d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            ) : (
              <>
                <path
                  d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
                  opacity="0.3"
                />
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        <button className={styles.deleteButton} onClick={handleDeleteNode} aria-label="Delete node">
          <CloseIcon size={12} />
        </button>
      </div>

      {hasChildren &&
        isExpanded &&
        childNodes.map((childNode) => (
          <ConnectedNodeTreeItem
            key={childNode.id}
            nodeId={childNode.id}
            level={level + 1}
            dragState={dragState}
            onNodeDrop={onNodeDrop}
            onDragStateChange={onDragStateChange}
          />
        ))}
      {isDragOver && dragOverPosition === "after" && (
        <div className={styles.dropIndicator} style={{ marginLeft: `${level * 16 + 8}px` }} />
      )}
    </>
  );
};

type ConnectedNodeTreeItemProps = {
  nodeId: NodeId;
  level: number;
  dragState: DragState;
  onNodeDrop: (draggedNodeId: NodeId, targetNodeId: NodeId, position: "before" | "inside" | "after") => void;
  onDragStateChange: (state: Partial<DragState>) => void;
}

const ConnectedNodeTreeItem: React.FC<ConnectedNodeTreeItemProps> = ({
  nodeId,
  level,
  dragState,
  onNodeDrop,
  onDragStateChange,
}) => {
  const { state: editorState, dispatch, actions } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const nodeDefinitions = useNodeDefinitionList();

  const node = editorState.nodes[nodeId];
  if (!node) {return null;}

  const isSelected = actionState.selectedNodeIds.includes(nodeId);
  const childNodes = React.useMemo(() => {
    const list = Object.values(editorState.nodes).filter((n) => n.parentId === nodeId);
    return list.sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
      const bo = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
      if (ao !== bo) {return ao - bo;}
      // fallback: stable by title
      const ta = a.data?.title || "";
      const tb = b.data?.title || "";
      return ta.localeCompare(tb);
    });
  }, [editorState.nodes, nodeId]);

  const handleSelect = React.useCallback(
    (nodeId: NodeId, multiSelect: boolean) => {
      actionDispatch(actionActions.selectNode(nodeId, multiSelect));
    },
    [actionDispatch, actionActions]
  );

  const handleToggleVisibility = React.useCallback(
    (nodeId: NodeId) => {
      const node = editorState.nodes[nodeId];
      if (node) {
        dispatch(actions.updateNode(nodeId, { visible: node.visible === false }));
      }
    },
    [editorState.nodes, dispatch, actions]
  );

  const handleToggleLock = React.useCallback(
    (nodeId: NodeId) => {
      const node = editorState.nodes[nodeId];
      if (node) {
        dispatch(actions.updateNode(nodeId, { locked: !node.locked }));
      }
    },
    [editorState.nodes, dispatch, actions]
  );

  const handleToggleExpand = React.useCallback(
    (nodeId: NodeId) => {
      const n = editorState.nodes[nodeId];
      if (!n) {return;}
      const d = nodeDefinitions.find((defn) => defn.type === n.type);
      if (hasGroupBehavior(d)) {
        dispatch(actions.updateNode(nodeId, { expanded: !n.expanded }));
      }
    },
    [editorState.nodes, dispatch, actions, nodeDefinitions]
  );

  const handleDeleteNode = React.useCallback(
    (nodeId: NodeId) => {
      dispatch(actions.deleteNode(nodeId));
    },
    [dispatch, actions]
  );

  return (
    <NodeTreeItem
      node={node}
      level={level}
      isSelected={isSelected}
      onSelect={handleSelect}
      onToggleVisibility={handleToggleVisibility}
      onToggleLock={handleToggleLock}
      onToggleExpand={handleToggleExpand}
      onDeleteNode={handleDeleteNode}
      childNodes={childNodes}
      dragState={dragState}
      onNodeDrop={onNodeDrop}
      onDragStateChange={onDragStateChange}
    />
  );
};

export type NodeTreeListPanelProps = {
  className?: string;
}

export const NodeTreeListPanel: React.FC<NodeTreeListPanelProps> = ({ className }) => {
  const { state: editorState, dispatch: editorDispatch, actions: editorActions } = useNodeEditor();
  const { dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const nodeDefinitions = useNodeDefinitionList();
  const { t } = useI18n();

  const [dragState, setDragState] = React.useState<DragState>({
    draggingNodeId: null,
    dragOverNodeId: null,
    dragOverPosition: null,
  });

  // Get root level nodes (nodes without parent)
  const rootNodes = React.useMemo(() => {
    return Object.values(editorState.nodes).filter((node) => !node.parentId);
  }, [editorState.nodes]);

  // Sort root nodes: groups first, then by explicit order, then title
  const sortedRootNodes = React.useMemo(() => {
    return [...rootNodes].sort((a, b) => {
      const aIsGroup = hasGroupBehavior(nodeDefinitions.find((d) => d.type === a.type));
      const bIsGroup = hasGroupBehavior(nodeDefinitions.find((d) => d.type === b.type));
      if (aIsGroup && !bIsGroup) {return -1;}
      if (!aIsGroup && bIsGroup) {return 1;}
      const ao = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
      const bo = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
      if (ao !== bo) {return ao - bo;}
      const titleA = a.data?.title && a.data.title.trim().length > 0 ? a.data.title : t("untitled");
      const titleB = b.data?.title && b.data.title.trim().length > 0 ? b.data.title : t("untitled");
      return titleA.localeCompare(titleB);
    });
  }, [rootNodes, t, nodeDefinitions]);

  const handleDeselectAll = React.useCallback(() => {
    actionDispatch(actionActions.clearSelection());
  }, [actionDispatch, actionActions]);

  const handleDragStateChange = React.useCallback((state: Partial<DragState>) => {
    setDragState((prev) => ({ ...prev, ...state }));
  }, []);

  const handleNodeDrop = React.useCallback(
    (draggedNodeId: NodeId, targetNodeId: NodeId, position: "before" | "inside" | "after") => {
      const draggedNode = editorState.nodes[draggedNodeId];
      const targetNode = editorState.nodes[targetNodeId];

      if (!draggedNode || !targetNode) {return;}

      // Prevent dropping a node onto itself or its children
      const isDescendant = (nodeId: NodeId, ancestorId: NodeId): boolean => {
        const node = editorState.nodes[nodeId];
        if (!node) {return false;}
        if (node.parentId === ancestorId) {return true;}
        if (node.parentId) {return isDescendant(node.parentId, ancestorId);}
        return false;
      };

      if (draggedNodeId === targetNodeId || isDescendant(targetNodeId, draggedNodeId)) {
        return;
      }

      // Helper to renumber orders for a parent's children
      const reorderSiblings = (parentId?: NodeId, insertAtIndex?: number) => {
        const siblings = Object.values(editorState.nodes)
          .filter((n) => (n.parentId || undefined) === (parentId || undefined) && n.id !== draggedNodeId)
          .sort((a, b) => {
            const ao = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
            const bo = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
            if (ao !== bo) {return ao - bo;}
            const ta = a.data?.title || "";
            const tb = b.data?.title || "";
            return ta.localeCompare(tb);
          });
        const list = [...siblings];
        const targetIndex = (() => {
          if (position === "before") {return siblings.findIndex((n) => n.id === targetNodeId);}
          if (position === "after") {return siblings.findIndex((n) => n.id === targetNodeId) + 1;}
          return typeof insertAtIndex === "number" ? insertAtIndex : siblings.length;
        })();
        list.splice(Math.max(0, targetIndex), 0, { ...draggedNode, parentId });
        list.forEach((n, idx) => {
          editorDispatch(
            editorActions.updateNode(n.id, { order: idx * 10, parentId: n.id === draggedNodeId ? parentId : n.parentId })
          );
        });
      };

      const targetIsGroup = hasGroupBehavior(nodeDefinitions.find((d) => d.type === targetNode.type));

      if (position === "inside" && targetIsGroup) {
        // Drop inside a group, append at end and expand group
        reorderSiblings(targetNodeId);
        if (!targetNode.expanded) {
          editorDispatch(editorActions.updateNode(targetNodeId, { expanded: true }));
        }
      } else {
        // Drop before or after target among same parent
        reorderSiblings(targetNode.parentId || undefined);
      }
    },
    [editorState.nodes, editorDispatch, editorActions]
  );

  const totalNodes = Object.keys(editorState.nodes).length;
  const layerTitleKey = t("inspectorTabLayers");
  const layerTitle = layerTitleKey === "inspectorTabLayers" ? "Layers" : layerTitleKey;
  const nodeCountKey = t("inspectorLayersNodeCount", { count: totalNodes });
  const nodeCountLabel = nodeCountKey === "inspectorLayersNodeCount" ? `${totalNodes} nodes` : nodeCountKey;

  return (
    <PropertySection
      title={layerTitle}
      headerRight={<span className={styles.nodeCount}>{nodeCountLabel}</span>}
      className={classNames(styles.nodeTreeList, className)}
      bodyClassName={styles.nodeTreeListBody}
    >
      <div className={styles.treeContainer} onClick={handleDeselectAll}>
        {sortedRootNodes.length === 0 ? (
          <div className={styles.emptyState}>No nodes yet</div>
        ) : (
          sortedRootNodes.map((node) => (
            <ConnectedNodeTreeItem
              key={node.id}
              nodeId={node.id}
              level={0}
              dragState={dragState}
              onNodeDrop={handleNodeDrop}
              onDragStateChange={handleDragStateChange}
            />
          ))
        )}
      </div>
    </PropertySection>
  );
};
