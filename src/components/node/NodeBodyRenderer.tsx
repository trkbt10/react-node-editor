/**
 * @file Node body renderer component
 */
import * as React from "react";
import type { Node } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { CustomNodeRendererProps } from "./NodeView";
import { GroupNodeRenderer as GroupContent } from "../../node-definitions/group/node";
import { LockIcon } from "../elements/icons";
import { useI18n } from "../../i18n/context";
import styles from "./NodeBodyRenderer.module.css";
import { areExternalDataStatesEqual } from "../../contexts/external-data/useExternalData";
import { hasNodeStateChanged } from "../../core/node/comparators";

export type NodeBodyRendererProps = {
  node: Node;
  isSelected: boolean;
  nodeDefinition?: NodeDefinition;
  customRenderProps: CustomNodeRendererProps;
  isEditing: boolean;
  editingValue: string;
  isGroup: boolean;
  groupChildrenCount: number;
  groupTextColor?: string;
  onTitleDoubleClick: (e: React.MouseEvent) => void;
  onEditingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditingKeyDown: (e: React.KeyboardEvent) => void;
  onEditingBlur: () => void;
};

/**
 * Renders the main body of a node (header and content)
 */
const NodeBodyRendererComponent: React.FC<NodeBodyRendererProps> = ({
  node,
  isSelected,
  nodeDefinition,
  customRenderProps,
  isEditing,
  editingValue,
  isGroup,
  groupChildrenCount,
  groupTextColor,
  onTitleDoubleClick,
  onEditingChange,
  onEditingKeyDown,
  onEditingBlur,
}) => {
  const { t } = useI18n();

  // Use component invocation to properly support React hooks
  if (nodeDefinition?.renderNode) {
    const renderFn = nodeDefinition.renderNode;

    // If it looks like a React component, use as JSX to support hooks
    if (React.isValidElement(renderFn)) {
      const CustomNodeRenderer = renderFn;
      return (
        <div className={styles.customNodeContent}>
          <CustomNodeRenderer {...customRenderProps} />
        </div>
      );
    }

    // Otherwise, call as a regular function (legacy support)
    return <div className={styles.customNodeContent}>{renderFn(customRenderProps)}</div>;
  }

  return (
    <>
      <div
        className={styles.nodeHeader}
        data-drag-handle={nodeDefinition?.interactive ? "true" : "false"}
        data-interactive={nodeDefinition?.interactive ? "true" : "false"}
        data-selected={isSelected ? "true" : "false"}
        data-is-group={isGroup ? "true" : "false"}
      >
        {node.locked && (
          <span className={styles.lockIcon}>
            <LockIcon size={12} />
          </span>
        )}
        {isEditing ? (
          <input
            id={`node-title-${node.id}`}
            name="nodeTitle"
            className={styles.nodeTitleInput}
            type="text"
            value={editingValue}
            onChange={onEditingChange}
            onKeyDown={onEditingKeyDown}
            onBlur={onEditingBlur}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            aria-label="Node title"
          />
        ) : (
          <span
            className={styles.nodeTitle}
            onDoubleClick={onTitleDoubleClick}
            style={groupTextColor ? { color: groupTextColor } : undefined}
            data-is-group={isGroup ? "true" : "false"}
          >
            {node.data.title && node.data.title.trim().length > 0 ? node.data.title : t("untitled")}
          </span>
        )}
      </div>

      <div className={styles.nodeContent}>
        {isGroup ? <GroupContent node={node} childCount={groupChildrenCount} /> : node.data.content || "Empty node"}
      </div>
    </>
  );
};

// Temporary debug flag - set to true to enable detailed re-render logging
const DEBUG_NODEBODYRENDERER_RERENDERS = false;

// Memoized version with custom comparison
export const NodeBodyRenderer = React.memo(NodeBodyRendererComponent, (prevProps, nextProps) => {
  const nodeId = prevProps.node.id;
  const debugLog = (reason: string, details?: Record<string, unknown>) => {
    if (DEBUG_NODEBODYRENDERER_RERENDERS) {
      console.log(`[NodeBodyRenderer:${nodeId}] Re-rendering because:`, reason, details || "");
    }
  };

  // Check if basic props changed
  if (prevProps.node.id !== nextProps.node.id) {
    debugLog("node.id changed", { prev: prevProps.node.id, next: nextProps.node.id });
    return false;
  }
  if (prevProps.isSelected !== nextProps.isSelected) {
    debugLog("isSelected changed", { prev: prevProps.isSelected, next: nextProps.isSelected });
    return false;
  }
  if (prevProps.isEditing !== nextProps.isEditing) {
    debugLog("isEditing changed", { prev: prevProps.isEditing, next: nextProps.isEditing });
    return false;
  }
  if (prevProps.editingValue !== nextProps.editingValue) {
    debugLog("editingValue changed", { prev: prevProps.editingValue, next: nextProps.editingValue });
    return false;
  }
  if (prevProps.isGroup !== nextProps.isGroup) {
    debugLog("isGroup changed", { prev: prevProps.isGroup, next: nextProps.isGroup });
    return false;
  }
  if (prevProps.groupChildrenCount !== nextProps.groupChildrenCount) {
    debugLog("groupChildrenCount changed", { prev: prevProps.groupChildrenCount, next: nextProps.groupChildrenCount });
    return false;
  }
  if (prevProps.groupTextColor !== nextProps.groupTextColor) {
    debugLog("groupTextColor changed", { prev: prevProps.groupTextColor, next: nextProps.groupTextColor });
    return false;
  }

  // Check node state changes
  if (hasNodeStateChanged(prevProps.node, nextProps.node)) {
    debugLog("node.locked changed", { prev: prevProps.node.locked, next: nextProps.node.locked });
    return false;
  }
  if (prevProps.node.data.title !== nextProps.node.data.title) {
    debugLog("node.data.title changed", { prev: prevProps.node.data.title, next: nextProps.node.data.title });
    return false;
  }
  if (prevProps.node.data.content !== nextProps.node.data.content) {
    debugLog("node.data.content changed", { prev: prevProps.node.data.content, next: nextProps.node.data.content });
    return false;
  }

  // Check nodeDefinition changes
  if (prevProps.nodeDefinition?.interactive !== nextProps.nodeDefinition?.interactive) {
    debugLog("nodeDefinition.interactive changed", {
      prev: prevProps.nodeDefinition?.interactive,
      next: nextProps.nodeDefinition?.interactive,
    });
    return false;
  }
  if (prevProps.nodeDefinition?.renderNode !== nextProps.nodeDefinition?.renderNode) {
    debugLog("nodeDefinition.renderNode changed", {
      prev: prevProps.nodeDefinition?.renderNode,
      next: nextProps.nodeDefinition?.renderNode,
    });
    return false;
  }

  // Check customRenderProps (deep comparison of relevant fields)
  if (prevProps.customRenderProps !== nextProps.customRenderProps) {
    const prevCustom = prevProps.customRenderProps;
    const nextCustom = nextProps.customRenderProps;

    if (prevCustom.isDragging !== nextCustom.isDragging) {
      debugLog("customRenderProps.isDragging changed", {
        prev: prevCustom.isDragging,
        next: nextCustom.isDragging,
      });
      return false;
    }
    if (prevCustom.isResizing !== nextCustom.isResizing) {
      debugLog("customRenderProps.isResizing changed", {
        prev: prevCustom.isResizing,
        next: nextCustom.isResizing,
      });
      return false;
    }

    // Check external data related properties
    const prevExternalDataState = {
      data: prevCustom.externalData,
      isLoading: prevCustom.isLoadingExternalData,
      error: prevCustom.externalDataError,
      refresh: () => {},
      update: async () => {},
    };
    const nextExternalDataState = {
      data: nextCustom.externalData,
      isLoading: nextCustom.isLoadingExternalData,
      error: nextCustom.externalDataError,
      refresh: () => {},
      update: async () => {},
    };

    if (!areExternalDataStatesEqual(prevExternalDataState, nextExternalDataState)) {
      debugLog("customRenderProps.externalData* changed", {
        prevData: prevCustom.externalData,
        nextData: nextCustom.externalData,
        prevIsLoading: prevCustom.isLoadingExternalData,
        nextIsLoading: nextCustom.isLoadingExternalData,
        prevError: prevCustom.externalDataError,
        nextError: nextCustom.externalDataError,
      });
      return false;
    }
  }

  // Event handlers are assumed to be stable (useCallback)
  if (DEBUG_NODEBODYRENDERER_RERENDERS) {
    console.log(`[NodeBodyRenderer:${nodeId}] Skipped re-render (props are equal)`);
  }
  return true;
});
