import * as React from "react";
import styles from "./NodeActionsList.module.css";
import { DuplicateIcon, CopyIcon, CutIcon, PasteIcon, DeleteIcon } from "../elements/icons";
import { useI18n } from "../../i18n";
import { useNodeEditorActions } from "../../hooks/useNodeEditorActions";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { useNodeDefinitionList } from "../../contexts/NodeDefinitionContext";
import { canAddNodeType, countNodesByType } from "../../utils/nodeTypeLimits";
import { getClipboard, setClipboard } from "../../utils/clipboard";

export type NodeActionsListProps = {
  targetNodeId: string;
  // Optional: called after an action completes (to close menus etc.)
  onAction?: () => void;
  includeDuplicate?: boolean;
  includeCopy?: boolean;
  includeCut?: boolean;
  includePaste?: boolean;
  includeDelete?: boolean;
}

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
    if (!node) {return;}
    const counts = countNodesByType(editorState);
    if (!canAddNodeType(node.type, nodeDefinitions, counts)) {return;}
    editorActions.duplicateNodes([targetNodeId]);
    onAction?.();
  }, [editorActions, editorState, nodeDefinitions, targetNodeId, onAction]);

  const handleCopy = React.useCallback(() => {
    const selected = actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(targetNodeId)
      ? actionState.selectedNodeIds
      : [targetNodeId];
    const nodes = selected
      .map((id) => editorState.nodes[id])
      .filter(Boolean)
      .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
    const selSet = new Set(selected);
    const connections = Object.values(editorState.connections)
      .filter((c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId))
      .map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
    setClipboard({ nodes, connections });
    onAction?.();
  }, [actionState.selectedNodeIds, editorState.nodes, editorState.connections, targetNodeId, onAction]);

  const handleCut = React.useCallback(() => {
    const selected = actionState.selectedNodeIds.length > 0 && actionState.selectedNodeIds.includes(targetNodeId)
      ? actionState.selectedNodeIds
      : [targetNodeId];
    const nodes = selected
      .map((id) => editorState.nodes[id])
      .filter(Boolean)
      .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
    const selSet = new Set(selected);
    const connections = Object.values(editorState.connections)
      .filter((c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId))
      .map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
    setClipboard({ nodes, connections });
    selected.forEach((nodeId) => editorActions.deleteNode(nodeId));
    actionDispatch(actionActions.clearSelection());
    onAction?.();
  }, [actionState.selectedNodeIds, editorActions, editorState.nodes, editorState.connections, actionDispatch, actionActions, targetNodeId, onAction]);

  const handlePaste = React.useCallback(() => {
    const clip = getClipboard();
    if (!clip || clip.nodes.length === 0) {return;}
    const idMap = new Map<string, string>();
    clip.nodes.forEach((n) => {
      const newId = Math.random().toString(36).slice(2, 10);
      idMap.set(n.id, newId);
      const newNode = {
        id: newId,
        type: n.type,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        size: n.size,
        data: { ...(n.data || {}), title: typeof n.data?.title === 'string' ? `${n.data.title} Copy` : n.data?.title },
      };
      editorActions.addNodeWithId(newNode);
    });
    clip.connections.forEach((c) => {
      const fromId = idMap.get(c.fromNodeId);
      const toId = idMap.get(c.toNodeId);
      if (fromId && toId) {
        editorActions.addConnection({ fromNodeId: fromId, fromPortId: c.fromPortId, toNodeId: toId, toPortId: c.toPortId });
      }
    });
    const newIds = Array.from(idMap.values());
    actionDispatch(actionActions.selectAllNodes(newIds));
    onAction?.();
  }, [editorActions, actionDispatch, actionActions]);

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
