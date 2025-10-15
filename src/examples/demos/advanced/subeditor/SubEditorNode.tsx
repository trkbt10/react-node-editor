/**
 * @file Custom node definition that embeds a minimap preview of its nested editor
 */
import * as React from "react";
import { Button } from "../../../../components/elements/Button";
import { NodeMapRenderer } from "../../../../components/layers/NodeMapRenderer";
import type { NodeDefinition, NodeRenderProps, ExternalDataReference } from "../../../../types/NodeDefinition";
import { createNodeDefinition } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import { useSubEditorHost } from "./SubEditorHostContext";
import { createDefaultSubEditorData } from "./initialData";
import { createSubEditorRefId, ensureSubEditorData, setSubEditorData } from "./subEditorDataStore";
import { isSubEditorNodeData, type SubEditorNodeData } from "./types";
import styles from "./SubEditorNode.module.css";

const MIN_PREVIEW_WIDTH = 140;
const MIN_PREVIEW_HEIGHT = 100;

const SubEditorNodeRenderer = ({
  node,
  isDragging,
  externalData,
  isLoadingExternalData,
  onUpdateNode,
}: NodeRenderProps<SubEditorNodeData>): React.ReactElement => {
  const { openSubEditor } = useSubEditorHost();

  const nodeTitle = node.data.title ?? "Nested Flow";
  const refId = isSubEditorNodeData(node.data) ? node.data.nestedEditorRefId : undefined;

  React.useEffect(() => {
    if (!isSubEditorNodeData(node.data) || node.data.nestedEditorRefId) {
      return;
    }

    const generatedRefId = createSubEditorRefId(node.id);
    const defaultData = ensureSubEditorData(generatedRefId, () => createDefaultSubEditorData(node.id));
    setSubEditorData(generatedRefId, defaultData);

    onUpdateNode({
      data: {
        ...node.data,
        nestedEditorRefId: generatedRefId,
        lastUpdated: new Date().toISOString(),
      },
    });
  }, [node.data, node.id, onUpdateNode]);

  React.useEffect(() => {
    if (!refId) {
      return;
    }
    ensureSubEditorData(refId, () => createDefaultSubEditorData(node.id));
  }, [refId, node.id]);

  const nestedData = React.useMemo<NodeEditorData | null>(() => {
    if (externalData && typeof externalData === "object") {
      return externalData as NodeEditorData;
    }
    if (refId) {
      return ensureSubEditorData(refId, () => createDefaultSubEditorData(node.id));
    }
    return null;
  }, [externalData, refId, node.id]);

  const nodeCount = React.useMemo(() => (nestedData ? Object.keys(nestedData.nodes).length : 0), [nestedData]);
  const connectionCount = React.useMemo(
    () => (nestedData ? Object.keys(nestedData.connections).length : 0),
    [nestedData],
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
    if (!refId) {
      return;
    }
    openSubEditor({
      nodeId: node.id,
      title: nodeTitle,
      externalRefId: refId,
    });
    onUpdateNode({
      data: {
        ...node.data,
        lastUpdated: new Date().toISOString(),
      },
    });
  }, [node.id, nodeTitle, onUpdateNode, node.data, openSubEditor, refId]);

  return (
    <div
      className={styles.node}
      style={{ width: node.size?.width, height: node.size?.height }}
      data-is-dragging={isDragging}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{nodeTitle}</h3>
        <Button
          variant="secondary"
          size="small"
          className={styles.editButton}
          onClick={handleOpenEditor}
          disabled={!refId || isLoadingExternalData}
        >
          Edit
        </Button>
      </div>
      {node.data.description ? <p className={styles.description}>{node.data.description}</p> : null}
      <div className={styles.preview}>
        {isLoadingExternalData ? (
          <span className={styles.emptyState}>Loading nested editor…</span>
        ) : nestedData && nodeCount > 0 ? (
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
    nestedEditorRefId: "",
    lastUpdated: new Date().toISOString(),
  },
  ports: [
    { id: "input", type: "input", label: "Input", position: "left", maxConnections: "unlimited" },
    { id: "output", type: "output", label: "Output", position: "right", maxConnections: "unlimited" },
  ],
  renderNode: SubEditorNodeRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    const namespace =
      typeof ref.metadata?.namespace === "string" && ref.metadata.namespace.length > 0
        ? ref.metadata.namespace
        : ref.id;
    return ensureSubEditorData(ref.id, () => createDefaultSubEditorData(namespace));
  },
  updateExternalData: async (ref: ExternalDataReference, data: unknown) => {
    if (!data || typeof data !== "object") {
      throw new Error("SubEditorNodeDefinition expects NodeEditorData when updating external data");
    }
    setSubEditorData(ref.id, data as NodeEditorData);
  },
});

/*
debug-notes:
- Relied on NodeMapRenderer to display nested flow preview and Button component for consistent UI actions.
- Ensured external data references seed nested flows, enabling referential editing via shared store.
*/
