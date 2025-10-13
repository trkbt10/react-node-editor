/**
 * @file Custom node definition that embeds a minimap preview of its nested editor
 */
import * as React from "react";
import { Button, classNames } from "../../../../components/elements";
import { NodeMapRenderer } from "../../../../components/layers/NodeMapRenderer";
import type { NodeDefinition, NodeRenderProps } from "../../../../types/NodeDefinition";
import { createNodeDefinition } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import { useSubEditorHost } from "./SubEditorHostContext";
import { createDefaultSubEditorData } from "./initialData";
import { isSubEditorNodeData, type SubEditorNodeData } from "./types";
import styles from "./SubEditorNode.module.css";

const MIN_PREVIEW_WIDTH = 140;
const MIN_PREVIEW_HEIGHT = 100;

const SubEditorNodeRenderer = ({
  node,
  isDragging,
  onUpdateNode,
}: NodeRenderProps<SubEditorNodeData>): React.ReactElement => {
  const { openSubEditor } = useSubEditorHost();

  const nodeTitle = node.data.title ?? "Nested Flow";
  const nestedData: NodeEditorData = React.useMemo(() => {
    if (isSubEditorNodeData(node.data) && node.data.nestedEditorData) {
      return node.data.nestedEditorData;
    }
    return createDefaultSubEditorData(node.id);
  }, [node.data, node.id]);

  React.useEffect(() => {
    if (!isSubEditorNodeData(node.data) || !node.data.nestedEditorData) {
      onUpdateNode({
        data: {
          ...node.data,
          nestedEditorData: nestedData,
          lastUpdated: new Date().toISOString(),
        },
      });
    }
  }, [node.data, nestedData, onUpdateNode]);

  const nodeCount = React.useMemo(() => Object.keys(nestedData.nodes).length, [nestedData.nodes]);
  const connectionCount = React.useMemo(
    () => Object.keys(nestedData.connections).length,
    [nestedData.connections],
  );

  const previewWidth = Math.max(MIN_PREVIEW_WIDTH, (node.size?.width ?? 320) - 36);
  const previewHeight = Math.max(MIN_PREVIEW_HEIGHT, (node.size?.height ?? 220) - 120);

  const lastUpdatedLabel = React.useMemo(() => {
    if (node.data.lastUpdated) {
      const date = new Date(node.data.lastUpdated);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString();
      }
    }
    return "never";
  }, [node.data.lastUpdated]);

  const handleOpenEditor = React.useCallback(() => {
    openSubEditor({
      nodeId: node.id,
      title: nodeTitle,
      data: nestedData,
    });
    onUpdateNode({
      data: {
        ...node.data,
        lastUpdated: new Date().toISOString(),
      },
    });
  }, [node.id, nodeTitle, nestedData, onUpdateNode, node.data, openSubEditor]);

  return (
    <div
      className={classNames(styles.node, isDragging && styles.dragging)}
      style={{ width: node.size?.width, height: node.size?.height }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{nodeTitle}</h3>
        <Button variant="secondary" size="small" className={styles.editButton} onClick={handleOpenEditor}>
          Edit
        </Button>
      </div>
      {node.data.description ? <p className={styles.description}>{node.data.description}</p> : null}
      <div className={styles.preview}>
        {nodeCount > 0 ? (
          <div className={styles.previewCanvas}>
            <NodeMapRenderer
              nodes={nestedData.nodes}
              connections={nestedData.connections}
              width={previewWidth}
              height={previewHeight}
              padding={{ top: 8, right: 8, bottom: 8, left: 8 }}
              filterHidden
            />
          </div>
        ) : (
          <span className={styles.emptyState}>No nested nodes yet</span>
        )}
      </div>
      <div className={styles.stats}>
        <span>
          {nodeCount} nodes · {connectionCount} connections
        </span>
        <span className={styles.timestamp}>updated {lastUpdatedLabel}</span>
      </div>
    </div>
  );
};

export const SubEditorNodeDefinition: NodeDefinition<SubEditorNodeData> = createNodeDefinition<SubEditorNodeData>({
  type: "sub-editor",
  displayName: "Nested Editor",
  description: "Wraps a full editor inside a node with quick preview.",
  defaultSize: { width: 320, height: 220 },
  defaultData: {
    title: "Nested Flow",
    description: "Open the sub-editor to customize this workflow.",
    nestedEditorData: createDefaultSubEditorData("sub-editor"),
    lastUpdated: new Date().toISOString(),
  },
  ports: [
    { id: "input", type: "input", label: "Input", position: "left", maxConnections: "unlimited" },
    { id: "output", type: "output", label: "Output", position: "right", maxConnections: "unlimited" },
  ],
  renderNode: SubEditorNodeRenderer,
});

/*
debug-notes:
- Relied on NodeMapRenderer to display nested flow preview and Button component for consistent UI actions.
- Ensured default nested data via createDefaultSubEditorData to keep node render resilient.
*/
