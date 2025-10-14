/**
 * @file Renderer component for standard nodes
 */
import * as React from "react";
import type { NodeRenderProps } from "../../types/NodeDefinition";
import { useI18n } from "../../i18n/context";
import { NodeResizer } from "../../components/node/NodeResizer";
import styles from "./standard.module.css";

/**
 * Standard node renderer
 */
export function StandardNodeRenderer({
  node,
  isSelected,
  isDragging,
  onStartEdit,
}: NodeRenderProps): React.ReactElement {
  const { t } = useI18n();
  return (
    <NodeResizer size={node.size} className={styles.standardNodeRenderer}>
      {() => (
        <div
          data-is-selected={isSelected}
          data-is-dragging={isDragging}
          onDoubleClick={onStartEdit}
          style={{ width: "100%", height: "100%" }}
        >
          <h3 className={styles.nodeTitle}>
            {node.data.title && node.data.title.trim().length > 0 ? node.data.title : t("untitled")}
          </h3>
          {node.data.content && <p className={styles.nodeContent}>{String(node.data.content)}</p>}
        </div>
      )}
    </NodeResizer>
  );
}
