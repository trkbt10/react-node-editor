/**
 * @file EditorDataPreview component - Shows a preview of editor state
 */
import * as React from "react";
import { useNodeEditor } from "../../../../../contexts/node-editor/context";
import type { NodeEditorData } from "../../../../../types/core";
import {
  FloatingPanelFrame,
  FloatingPanelHeader,
  FloatingPanelTitle,
  FloatingPanelMeta,
  FloatingPanelContent,
} from "../../../../../components/panels/FloatingPanelFrame";
import styles from "./EditorDataPreview.module.css";

export type EditorDataPreviewProps = {
  /** Width of the preview panel (in pixels) */
  width?: number;
  /** Height of the preview panel (in pixels) */
  height?: number;
};

export const EditorDataPreview: React.FC<EditorDataPreviewProps> = ({ width: _width = 300, height: _height = 400 }) => {
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
    <FloatingPanelFrame>
      <FloatingPanelHeader>
        <FloatingPanelTitle>Editor State</FloatingPanelTitle>
        <FloatingPanelMeta>
          {nodeCount} nodes · {connectionCount} connections
        </FloatingPanelMeta>
      </FloatingPanelHeader>
      <FloatingPanelContent className={styles.previewContent}>
        <pre className={styles.jsonDisplay}>{jsonString}</pre>
      </FloatingPanelContent>
    </FloatingPanelFrame>
  );
};

EditorDataPreview.displayName = "EditorDataPreview";

/*
debug-notes:
- Reviewed src/components/panels/FloatingPanelFrame.tsx to migrate container/header composition.
- Reviewed src/examples/demos/AdvancedNodeExample.tsx to ensure grid layer sizing drives width/height.
- Reviewed src/examples/demos/advanced/layout/EditorDataPreview.module.css to retain content padding and scrolling behaviour.
*/
