/**
 * @file Renderer component for error nodes displayed when node definition is not found
 */
import * as React from "react";
import type { NodeRendererProps } from "../../types/NodeDefinition";
import type { ErrorNodeData } from "./types";
import styles from "./error.module.css";

/**
 * Node renderer for error nodes.
 * Displays a visual indicator that the node type definition was not found,
 * along with the original type name and any preserved title data.
 */
export function ErrorNodeRenderer({ node }: NodeRendererProps<ErrorNodeData>): React.ReactElement {
  const d = node.data;
  const originalType = typeof d.originalType === "string" ? d.originalType : "unknown";
  const originalTitle = typeof d.title === "string" && d.title.trim().length > 0 ? d.title : undefined;

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <span className={styles.errorIcon} role="img" aria-label="error">
          ⚠️
        </span>
        <h3 className={styles.errorTitle}>Unknown Node</h3>
      </div>
      <div className={styles.errorContent}>
        <p className={styles.errorType}>
          Type: <code className={styles.errorTypeCode}>{originalType}</code>
        </p>
        {originalTitle && <p className={styles.originalTitle}>Title: {originalTitle}</p>}
      </div>
    </div>
  );
}

ErrorNodeRenderer.displayName = "ErrorNodeRenderer";
