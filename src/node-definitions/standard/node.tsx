import * as React from "react";
import type { NodeRenderProps } from "../../types/NodeDefinition";
import { useI18n } from "../../i18n";
import styles from "./standard.module.css";

/**
 * Standard node renderer
 */
export function StandardNodeRenderer({ node, isSelected, isDragging, isEditing, onStartEdit }: NodeRenderProps): React.ReactElement {
  const { t } = useI18n();
  return (
    <div
      className={[
        styles.standardNodeRenderer,
        isSelected ? styles.standardNodeRendererSelected : "",
        isDragging ? styles.standardNodeRendererDragging : styles.standardNodeRendererNotDragging,
      ]
        .filter(Boolean)
        .join(" ")}
      onDoubleClick={onStartEdit}
    >
      <h3 className={styles.nodeTitle}>
        {node.data.title && node.data.title.trim().length > 0 ? node.data.title : t("untitled")}
      </h3>
      {node.data.content && <p className={styles.nodeContent}>{String(node.data.content)}</p>}
    </div>
  );
}
