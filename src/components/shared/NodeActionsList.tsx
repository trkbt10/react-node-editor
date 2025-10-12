/**
 * @file Node actions list component
 */
import * as React from "react";
import styles from "./NodeActionsList.module.css";
import { DuplicateIcon, CopyIcon, CutIcon, PasteIcon, DeleteIcon } from "../elements/icons";
import { useI18n } from "../../i18n";
import { useNodeEditorActions } from "../../hooks/useNodeEditorActions";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { useNodeDefinitionList } from "../../contexts/node-definitions";
import { canAddNodeType, countNodesByType } from "../../contexts/node-definitions/utils/nodeTypeLimits";
import {
  copyNodesToClipboard,
  pasteNodesFromClipboard,
} from "../../contexts/node-editor/utils/nodeClipboardOperations";

export type NodeActionsListProps = {
  targetNodeId: string;
  // Optional: called after an action completes (to close menus etc.)
  onAction?: () => void;
  includeDuplicate?: boolean;
  includeCopy?: boolean;
  includeCut?: boolean;
  includePaste?: boolean;
  includeDelete?: boolean;
};

export const NodeActionsList: React.FC<NodeActionsListProps> = ({
  targetNodeId,
  onAction,
  includeDuplicate = true,
  includeCopy = true,
  includeCut = true,
  includePaste = true,
  includeDelete = true,
}) => {
  const { t } = useI18n();
  const editorActions = useNodeEditorActions();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();

  const handleDuplicate = React.useCallback(() => {
    const node = editorState.nodes[targetNodeId];
    if (!node) {
      return;
    }
    const counts = countNodesByType(editorState);
    if (!canAddNodeType(node.type, nodeDefinitions, counts)) {
      return;
    }
    editorActions.duplicateNodes([targetNodeId]);
    onAction?.();
  }, [editorActions, editorState, nodeDefinitions, targetNodeId, onAction]);

  const handleCopy = React.useCallback(() => {
    const selected =
      actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(targetNodeId)
        ? actionState.selectedNodeIds
        : [targetNodeId];
    copyNodesToClipboard(selected, editorState);
    onAction?.();
  }, [actionState.selectedNodeIds, editorState, targetNodeId, onAction]);

  const handleCut = React.useCallback(() => {
    const selected =
      actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(targetNodeId)
        ? actionState.selectedNodeIds
        : [targetNodeId];
    copyNodesToClipboard(selected, editorState);
    selected.forEach((nodeId) => editorActions.deleteNode(nodeId));
    actionDispatch(actionActions.clearSelection());
    onAction?.();
  }, [actionState.selectedNodeIds, editorActions, editorState, actionDispatch, actionActions, targetNodeId, onAction]);

  const handlePaste = React.useCallback(() => {
    const result = pasteNodesFromClipboard();
    if (!result) {
      return;
    }

    // Add nodes
    result.nodes.forEach((node) => {
      editorActions.addNodeWithId(node);
    });

    // Add connections
    result.connections.forEach((conn) => {
      editorActions.addConnection(conn);
    });

    // Select pasted nodes
    const newIds = Array.from(result.idMap.values());
    actionDispatch(actionActions.selectAllNodes(newIds));
    onAction?.();
  }, [editorActions, actionDispatch, actionActions, onAction]);

  const handleDelete = React.useCallback(() => {
    editorActions.deleteNode(targetNodeId);
    onAction?.();
  }, [editorActions, targetNodeId, onAction]);

  return (
    <>
      {includeDuplicate && (
        <li className={styles.actionItem} onClick={handleDuplicate}>
          <DuplicateIcon size={14} /> {t("contextMenuDuplicateNode")}
        </li>
      )}
      {includeCopy && (
        <li className={styles.actionItem} onClick={handleCopy}>
          <CopyIcon size={14} /> {t("copy")}
        </li>
      )}
      {includeCut && (
        <li className={styles.actionItem} onClick={handleCut}>
          <CutIcon size={14} /> {t("cut")}
        </li>
      )}
      {includePaste && (
        <li className={styles.actionItem} onClick={handlePaste}>
          <PasteIcon size={14} /> {t("paste")}
        </li>
      )}
      {includeDelete && (
        <li className={[styles.actionItem, styles.actionItemDanger].join(" ")} onClick={handleDelete}>
          <DeleteIcon size={14} /> {t("contextMenuDeleteNode")}
        </li>
      )}
    </>
  );
};

NodeActionsList.displayName = "NodeActionsList";
