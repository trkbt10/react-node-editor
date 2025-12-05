/**
 * @file Node actions list component
 */
import * as React from "react";
import { DuplicateIcon, CopyIcon, CutIcon, PasteIcon, DeleteIcon } from "../elements/icons";
import { MenuItem } from "./MenuItem";
import { MenuSeparator } from "./MenuSeparator";
import { useI18n } from "../../i18n/context";
import { useEditorActionState } from "../../contexts/composed/EditorActionStateContext";
import { useInteractionSettings } from "../../contexts/interaction-settings/context";
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
  const { nodeOperations } = useEditorActionState();
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
    nodeOperations.duplicateNodes(targetNodeId);
    onAction?.();
  }, [nodeOperations, targetNodeId, onAction]);

  const handleCopy = React.useCallback(() => {
    nodeOperations.copyNodes(targetNodeId);
    onAction?.();
  }, [nodeOperations, targetNodeId, onAction]);

  const handleCut = React.useCallback(() => {
    nodeOperations.cutNodes(targetNodeId);
    onAction?.();
  }, [nodeOperations, targetNodeId, onAction]);

  const handlePaste = React.useCallback(() => {
    nodeOperations.pasteNodes();
    onAction?.();
  }, [nodeOperations, onAction]);

  const handleDelete = React.useCallback(() => {
    nodeOperations.deleteNodes(targetNodeId);
    onAction?.();
  }, [nodeOperations, targetNodeId, onAction]);

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
