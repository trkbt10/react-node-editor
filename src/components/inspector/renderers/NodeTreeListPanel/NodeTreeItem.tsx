/**
 * @file NodeTreeItem presentation component
 */
import * as React from "react";
import { hasGroupBehavior } from "../../../../types/behaviors";
import { getNodeIcon } from "../../../../contexts/node-definitions/utils/iconUtils";
import { CloseIcon, LockIcon, UnlockIcon } from "../../../elements/icons";
import { useNodeDefinitionList } from "../../../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useI18n } from "../../../../i18n/context";
import styles from "./NodeTreeItem.module.css";
import type { NodeTreeItemProps } from "./types";
import { ConnectedNodeTreeItem } from "./ConnectedNodeTreeItem";

const NodeTreeItemComponent: React.FC<NodeTreeItemProps> = ({
  node,
  level,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleExpand,
  onDeleteNode,
  onUpdateTitle,
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

  const [isEditing, setIsEditing] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLSpanElement>(null);
  const isDraggingText = React.useRef(false);

  const isDragging = dragState.draggingNodeId === node.id;
  const isDragOver = dragState.dragOverNodeId === node.id;
  const dragOverPosition = isDragOver ? dragState.dragOverPosition : null;

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id, e.ctrlKey || e.metaKey);
    },
    [node.id, onSelect],
  );

  const handleToggleExpand = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleExpand && hasChildren) {
        onToggleExpand(node.id);
      }
    },
    [hasChildren, node.id, onToggleExpand],
  );

  const handleToggleVisibility = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleVisibility) {
        onToggleVisibility(node.id);
      }
    },
    [node.id, onToggleVisibility],
  );

  const handleToggleLock = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleLock) {
        onToggleLock(node.id);
      }
    },
    [node.id, onToggleLock],
  );

  const handleDeleteNode = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDeleteNode) {
        onDeleteNode(node.id);
      }
    },
    [node.id, onDeleteNode],
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onUpdateTitle) {
        return;
      }
      const currentTitle = node.data?.title && node.data.title.trim().length > 0 ? node.data.title : "";
      setEditingTitle(currentTitle);
      setIsEditing(true);
    },
    [node.data?.title, onUpdateTitle],
  );

  const handleNamePointerDown = React.useCallback(() => {
    // Track if user is trying to select text
    isDraggingText.current = true;
  }, []);

  const handleNamePointerUp = React.useCallback(() => {
    // Reset text dragging flag after a short delay
    setTimeout(() => {
      isDraggingText.current = false;
    }, 100);
  }, []);

  const handleTitleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  }, []);

  const handleTitleBlur = React.useCallback(() => {
    if (onUpdateTitle && editingTitle !== (node.data?.title || "")) {
      onUpdateTitle(node.id, editingTitle);
    }
    setIsEditing(false);
  }, [editingTitle, node.data?.title, node.id, onUpdateTitle]);

  const handleTitleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  }, []);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDragStart = React.useCallback(
    (e: React.DragEvent) => {
      // Prevent drag if user is selecting text
      if (isDraggingText.current) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("nodeId", node.id);
      onDragStateChange({ draggingNodeId: node.id });
    },
    [node.id, onDragStateChange],
  );

  const handleDragEnd = React.useCallback(() => {
    onDragStateChange({
      draggingNodeId: null,
      dragOverNodeId: null,
      dragOverPosition: null,
    });
  }, [onDragStateChange]);

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (dragState.draggingNodeId === node.id) {
        return;
      }

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
    },
    [dragState, isGroup, node.id, onDragStateChange],
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      if (e.currentTarget === e.target) {
        onDragStateChange({
          dragOverNodeId: null,
          dragOverPosition: null,
        });
      }
    },
    [onDragStateChange],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
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
    },
    [dragState.dragOverPosition, node.id, onDragStateChange, onNodeDrop],
  );

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
          <button
            className={styles.expandButton}
            onClick={handleToggleExpand}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
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

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.nodeNameInput}
            value={editingTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            ref={nameRef}
            className={styles.nodeName}
            onDoubleClick={handleDoubleClick}
            onPointerDown={handleNamePointerDown}
            onPointerUp={handleNamePointerUp}
          >
            {node.data?.title && node.data.title.trim().length > 0 ? node.data.title : t("untitled")}
          </span>
        )}

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

export const NodeTreeItem = React.memo(NodeTreeItemComponent);
