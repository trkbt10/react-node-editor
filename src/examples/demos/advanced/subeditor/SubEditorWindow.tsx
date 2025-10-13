/**
 * @file Floating window that hosts the nested node editor for a sub-editor node
 */
import * as React from "react";
import { Button } from "../../../../components/elements";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import {
  FloatingPanelFrame,
  FloatingPanelHeader,
  FloatingPanelTitle,
  FloatingPanelMeta,
  FloatingPanelControls,
  FloatingPanelContent,
} from "../../../../components/panels/FloatingPanelFrame";
import { NodeEditor } from "../../../../index";
import { StandardNodeDefinition } from "../../../../node-definitions/standard";
import { toUntypedDefinition, type ExternalDataReference } from "../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../types/core";
import type { GridLayoutConfig, LayerDefinition } from "../../../../types/panels";
import { useNodeEditor } from "../../../../contexts/node-editor";
import { createDefaultSubEditorData } from "./initialData";
import { ensureSubEditorData, getSubEditorData, setSubEditorData } from "./subEditorDataStore";
import { isSubEditorNodeData } from "./types";
import styles from "./SubEditorWindow.module.css";

export type SubEditorWindowProps = {
  nodeId: string;
  title: string;
  externalRef: ExternalDataReference;
  onClose: (nodeId: string) => void;
};

export const SubEditorWindow: React.FC<SubEditorWindowProps> = ({ nodeId, title, externalRef, onClose }) => {
  const { state, dispatch, actions } = useNodeEditor();
  const [editorData, setEditorData] = React.useState<NodeEditorData>(() => {
    const namespace =
      typeof externalRef.metadata?.namespace === "string" && externalRef.metadata.namespace.length > 0
        ? externalRef.metadata.namespace
        : nodeId;
    return ensureSubEditorData(externalRef.id, () => createDefaultSubEditorData(namespace));
  });
  const editorDataRef = React.useRef(editorData);
  editorDataRef.current = editorData;

  const metadataNamespace =
    typeof externalRef.metadata?.namespace === "string" && externalRef.metadata.namespace.length > 0
      ? externalRef.metadata.namespace
      : undefined;

  React.useEffect(() => {
    const namespace = metadataNamespace ?? nodeId;
    const synced =
      getSubEditorData(externalRef.id) ??
      ensureSubEditorData(externalRef.id, () => createDefaultSubEditorData(namespace));
    setEditorData(synced);
    editorDataRef.current = synced;
  }, [externalRef.id, metadataNamespace, nodeId]);

  const nodeCount = React.useMemo(() => Object.keys(editorData.nodes).length, [editorData.nodes]);
  const connectionCount = React.useMemo(() => Object.keys(editorData.connections).length, [editorData.connections]);

  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [["canvas"]],
      rows: [{ size: "1fr" }],
      columns: [{ size: "1fr" }],
      gap: "0",
    }),
    [],
  );

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
    ],
    [],
  );

  const nestedDefinitions = React.useMemo(() => [toUntypedDefinition(StandardNodeDefinition)], []);

  const handleClose = React.useCallback(() => {
    onClose(nodeId);
  }, [onClose, nodeId]);

  const handleDataChange = React.useCallback(
    (nextData: NodeEditorData) => {
      if (editorDataRef.current === nextData) {
        return;
      }

      setEditorData(nextData);
      editorDataRef.current = nextData;
      setSubEditorData(externalRef.id, nextData);

      const node = state.nodes[nodeId];
      if (node && isSubEditorNodeData(node.data)) {
        dispatch(
          actions.updateNode(nodeId, {
            data: {
              ...node.data,
              lastUpdated: new Date().toISOString(),
            },
          }),
        );
      }
    },
    [actions, dispatch, externalRef.id, nodeId, state.nodes],
  );

  return (
    <FloatingPanelFrame>
      <FloatingPanelHeader>
        <FloatingPanelTitle>{title}</FloatingPanelTitle>
        <FloatingPanelMeta>
          {nodeCount} nodes · {connectionCount} connections
        </FloatingPanelMeta>
        <FloatingPanelControls className={styles.controls}>
          <Button variant="ghost" size="small" onClick={handleClose} aria-label={`Close ${title} window`}>
            Close
          </Button>
        </FloatingPanelControls>
      </FloatingPanelHeader>
      <FloatingPanelContent className={styles.windowContent}>
        <div className={styles.summary}>
          <span>
            Node <strong>{nodeId}</strong>
          </span>
          <span>Nested editor is fully interactive.</span>
        </div>
        <div
          className={styles.editorShell}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <NodeEditor
            className={styles.editorMain}
            initialData={editorData}
            nodeDefinitions={nestedDefinitions}
            includeDefaultDefinitions={false}
            gridConfig={gridConfig}
            gridLayers={gridLayers}
            onDataChange={handleDataChange}
          />
        </div>
      </FloatingPanelContent>
    </FloatingPanelFrame>
  );
};

/*
debug-notes:
- Embeds a secondary NodeEditor with its own GridLayout so nested flows remain isolated.
- Syncs nested edits back to main node via shared external data store and updateNode dispatch.
*/
