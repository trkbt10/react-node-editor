/**
 * @file EditorDataPreview component - Shows a preview of editor state
 */
import * as React from "react";
import { useNodeEditor } from "../../../../contexts/node-editor";
import type { NodeEditorData } from "../../../../types/core";
import styles from "./EditorDataPreview.module.css";

export type EditorDataPreviewProps = {
  /** Width of the preview panel (in pixels) */
  width?: number;
  /** Height of the preview panel (in pixels) */
  height?: number;
};

export const EditorDataPreview: React.FC<EditorDataPreviewProps> = ({ width = 300, height = 400 }) => {
  const { state } = useNodeEditor();

  const previewData: NodeEditorData = React.useMemo(
    () => ({
      nodes: state.nodes,
      connections: state.connections,
    }),
    [state.nodes, state.connections],
  );

  const jsonString = React.useMemo(() => {
    return JSON.stringify(previewData, null, 2);
  }, [previewData]);

  const nodeCount = Object.keys(state.nodes).length;
  const connectionCount = Object.keys(state.connections).length;

  return (
    <div className={styles.previewContainer} style={{ width, height }}>
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>Editor State</span>
        <span className={styles.previewStats}>
          {nodeCount} nodes · {connectionCount} connections
        </span>
      </div>
      <div className={styles.previewContent}>
        <pre className={styles.jsonDisplay}>{jsonString}</pre>
      </div>
    </div>
  );
};

EditorDataPreview.displayName = "EditorDataPreview";
