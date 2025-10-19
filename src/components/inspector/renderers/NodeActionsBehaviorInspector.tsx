/**
 * @file Node actions behavior inspector component
 */
import * as React from "react";
import type { InspectorRenderProps } from "../../../types/NodeDefinition";
import { InspectorLabel } from "../parts/InspectorLabel";
import { InspectorButton } from "../parts/InspectorButton";
import styles from "./NodeActionsBehaviorInspector.module.css";
import { useI18n } from "../../../i18n/context";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeEditor, useNodeEditorActions } from "../../../contexts/node-editor/context";
import { useNodeDefinitionList } from "../../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { canAddNodeType, countNodesByType } from "../../../contexts/node-definitions/utils/nodeTypeLimits";
import { setClipboard } from "../../../utils/clipboard";
import { DuplicateIcon, CopyIcon, CutIcon, DeleteIcon } from "../../elements/icons";

/**
 * Inspector for node actions behavior
 * Provides duplicate, copy, cut, and delete operations
 */
export function NodeActionsBehaviorInspector({ node }: InspectorRenderProps): React.ReactElement {
  const { t } = useI18n();
  const editorActions = useNodeEditorActions();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();

  const handleDuplicate = React.useCallback(() => {
    const n = editorState.nodes[node.id];
    if (!n) {
      return;
    }
    const counts = countNodesByType(editorState);
    if (!canAddNodeType(n.type, nodeDefinitions, counts)) {
      return;
    }
    editorActions.duplicateNodes([node.id]);
  }, [node.id, editorState, nodeDefinitions, editorActions]);

  const handleCopy = React.useCallback(() => {
    const selected =
      actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(node.id)
        ? actionState.selectedNodeIds
        : [node.id];
    const nodes = selected
      .map((id) => editorState.nodes[id])
      .filter(Boolean)
      .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
    const selSet = new Set(selected);
    const connections = Object.values(editorState.connections)
      .filter((c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId))
      .map((c) => ({
        fromNodeId: c.fromNodeId,
        fromPortId: c.fromPortId,
        toNodeId: c.toNodeId,
        toPortId: c.toPortId,
      }));
    setClipboard({ nodes, connections });
  }, [node.id, actionState.selectedNodeIds, editorState]);

  const handleCut = React.useCallback(() => {
    const selected =
      actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(node.id)
        ? actionState.selectedNodeIds
        : [node.id];
    const nodes = selected
      .map((id) => editorState.nodes[id])
      .filter(Boolean)
      .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
    const selSet = new Set(selected);
    const connections = Object.values(editorState.connections)
      .filter((c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId))
      .map((c) => ({
        fromNodeId: c.fromNodeId,
        fromPortId: c.fromPortId,
        toNodeId: c.toNodeId,
        toPortId: c.toPortId,
      }));
    setClipboard({ nodes, connections });
    selected.forEach((id) => editorActions.deleteNode(id));
    actionActions.clearSelection();
  }, [node.id, actionState.selectedNodeIds, editorState, editorActions, actionActions]);

  const handleDelete = React.useCallback(() => {
    editorActions.deleteNode(node.id);
  }, [node.id, editorActions]);

  const duplicateLabel = t("contextMenuDuplicateNode") || "Duplicate";
  const copyLabel = t("copy") || "Copy";
  const cutLabel = t("cut") || "Cut";
  const deleteLabel = t("contextMenuDeleteNode") || "Delete";

  return (
    <div>
      <InspectorLabel>{t("inspectorActions") || "Actions"}</InspectorLabel>
      <div className={styles.actions}>
        <InspectorButton onClick={handleDuplicate} aria-label={duplicateLabel}>
          <span className={styles.buttonContent}>
            <DuplicateIcon size={14} />
            <span>{duplicateLabel}</span>
          </span>
        </InspectorButton>
        <InspectorButton onClick={handleCopy} aria-label={copyLabel}>
          <span className={styles.buttonContent}>
            <CopyIcon size={14} />
            <span>{copyLabel}</span>
          </span>
        </InspectorButton>
        <InspectorButton onClick={handleCut} aria-label={cutLabel}>
          <span className={styles.buttonContent}>
            <CutIcon size={14} />
            <span>{cutLabel}</span>
          </span>
        </InspectorButton>
        <InspectorButton variant="danger" onClick={handleDelete} aria-label={deleteLabel}>
          <span className={styles.buttonContent}>
            <DeleteIcon size={14} />
            <span>{deleteLabel}</span>
          </span>
        </InspectorButton>
      </div>
    </div>
  );
}

NodeActionsBehaviorInspector.displayName = "NodeActionsBehaviorInspector";
