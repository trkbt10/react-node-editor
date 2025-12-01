/**
 * @file Node actions list component
 */
import * as React from "react";
import { DuplicateIcon, CopyIcon, CutIcon, PasteIcon, DeleteIcon } from "../elements/icons";
import { MenuItem } from "./MenuItem";
import { MenuSeparator } from "./MenuSeparator";
import { useI18n } from "../../i18n/context";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor, useNodeEditorActions } from "../../contexts/node-editor/context";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { canAddNodeType, countNodesByType } from "../../contexts/node-definitions/utils/nodeTypeLimits";
import {
  copyNodesToClipboard,
  pasteNodesFromClipboard,
} from "../../contexts/node-editor/utils/nodeClipboardOperations";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import {
  detectShortcutDisplayPlatform,
  getShortcutLabelForAction,
} from "../../utils/shortcutDisplay";
import type { NodeEditorShortcutAction } from "../../types/interaction";

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
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();
  const interactionSettings = useInteractionSettings();
  const platform = React.useMemo(() => detectShortcutDisplayPlatform(), []);

  const shortcutFor = React.useCallback(
    (action: NodeEditorShortcutAction) => {
      return getShortcutLabelForAction(interactionSettings.keyboardShortcuts, action, platform);
    },
    [interactionSettings.keyboardShortcuts, platform],
  );

  const duplicateShortcut = shortcutFor("duplicate-selection");
  const copyShortcut = shortcutFor("copy");
  const cutShortcut = shortcutFor("cut");
  const pasteShortcut = shortcutFor("paste");
  const deleteShortcut = shortcutFor("delete-selection");

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
      actionState.selectedNodeIds.includes(targetNodeId) && actionState.selectedNodeIds.length > 0
        ? actionState.selectedNodeIds
        : [targetNodeId];
    copyNodesToClipboard(selected, editorState);
    onAction?.();
  }, [actionState.selectedNodeIds, editorState, targetNodeId, onAction]);

  const handleCut = React.useCallback(() => {
    const selected =
      actionState.selectedNodeIds.includes(targetNodeId) && actionState.selectedNodeIds.length > 0
        ? actionState.selectedNodeIds
        : [targetNodeId];
    copyNodesToClipboard(selected, editorState);
    selected.forEach((nodeId) => editorActions.deleteNode(nodeId));
    actionActions.clearSelection();
    onAction?.();
  }, [actionState.selectedNodeIds, editorActions, editorState, actionActions, targetNodeId, onAction]);

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
    actionActions.setInteractionSelection(newIds);
    actionActions.setEditingSelection(newIds);
    onAction?.();
  }, [editorActions, actionActions, onAction]);

  const handleDelete = React.useCallback(() => {
    editorActions.deleteNode(targetNodeId);
    onAction?.();
  }, [editorActions, targetNodeId, onAction]);

  return (
    <>
      {includeDuplicate && (
        <MenuItem
          icon={<DuplicateIcon size={14} />}
          label={t("contextMenuDuplicateNode")}
          shortcutHint={duplicateShortcut}
          onClick={handleDuplicate}
        />
      )}
      {includeCopy && (
        <MenuItem
          icon={<CopyIcon size={14} />}
          label={t("copy")}
          shortcutHint={copyShortcut}
          onClick={handleCopy}
        />
      )}
      {includeCut && (
        <MenuItem
          icon={<CutIcon size={14} />}
          label={t("cut")}
          shortcutHint={cutShortcut}
          onClick={handleCut}
        />
      )}
      {includePaste && (
        <MenuItem
          icon={<PasteIcon size={14} />}
          label={t("paste")}
          shortcutHint={pasteShortcut}
          onClick={handlePaste}
        />
      )}
      {includeDelete && (
        <>
          <MenuSeparator />
          <MenuItem
            icon={<DeleteIcon size={14} />}
            label={t("contextMenuDeleteNode")}
            shortcutHint={deleteShortcut}
            danger
            onClick={handleDelete}
          />
        </>
      )}
    </>
  );
};

NodeActionsList.displayName = "NodeActionsList";
