/**
 * @file Context action menu component
 */
import * as React from "react";
import { EditIcon, PlusIcon, PasteIcon } from "../elements/icons";
import styles from "./ContextActionMenu.module.css";
import alignmentStyles from "../controls/alignments/AlignmentControls.module.css";
import { ALIGNMENT_ACTIONS, ALIGNMENT_GROUPS } from "../controls/alignments/constants";
import { calculateAlignmentPositions } from "../controls/alignments/utils";
import type { AlignmentActionConfig, AlignmentActionGroup, AlignmentActionType } from "../controls/alignments/types";
import type { Position, Node } from "../../types/core";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useI18n } from "../../i18n/context";
import { useNodeEditor, useNodeEditorActions } from "../../contexts/node-editor/context";
import { pasteNodesFromClipboard } from "../../contexts/node-editor/utils/nodeClipboardOperations";
import { NodeActionsList } from "./NodeActionsList";
import { ContextMenuOverlay } from "../layout/ContextMenuOverlay";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import {
  detectShortcutDisplayPlatform,
  getShortcutLabelForAction,
} from "../../utils/shortcutDisplay";

export type ContextTarget = { type: "node"; id: string } | { type: "connection"; id: string } | { type: "canvas" };

export type ContextActionMenuProps = {
  position: Position;
  target: ContextTarget;
  visible: boolean;
  onClose: () => void;
};

export const ContextActionMenu: React.FC<ContextActionMenuProps> = ({ position, target, visible, onClose }) => {
  const { t } = useI18n();
  const editorActions = useNodeEditorActions();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const interactionSettings = useInteractionSettings();
  const platform = React.useMemo(() => detectShortcutDisplayPlatform(), []);
  const [resolvedPosition, setResolvedPosition] = React.useState({ x: position.x, y: position.y });
  const selectedNodeIds = actionState.selectedNodeIds;
  const isTargetSelected = target.type === "node" && selectedNodeIds.includes(target.id);
  const isMultiSelect = isTargetSelected && selectedNodeIds.length > 1;
  const selectedNodes = React.useMemo<Node[]>(() => {
    if (!isMultiSelect) {
      return [];
    }
    return selectedNodeIds.map((id) => editorState.nodes[id]).filter((node): node is Node => Boolean(node));
  }, [isMultiSelect, selectedNodeIds, editorState.nodes]);
  const showAlignmentControls = isMultiSelect && selectedNodes.length > 1;
  const groupedAlignmentActions = React.useMemo(() => {
    return ALIGNMENT_GROUPS.reduce<Record<AlignmentActionGroup, AlignmentActionConfig[]>>(
      (acc, group) => {
        acc[group] = ALIGNMENT_ACTIONS.filter((action) => action.group === group);
        return acc;
      },
      { horizontal: [], vertical: [] },
    );
  }, []);

  React.useEffect(() => {
    if (visible) {
      setResolvedPosition({ x: position.x, y: position.y });
    }
  }, [visible, position.x, position.y]);

  const pasteShortcut = React.useMemo(() => {
    return getShortcutLabelForAction(interactionSettings.keyboardShortcuts, "paste", platform);
  }, [interactionSettings.keyboardShortcuts, platform]);

  if (!visible) {
    return null;
  }

  const handleAlignFromMenu = React.useCallback(
    (alignmentType: AlignmentActionType) => {
      if (!showAlignmentControls) {
        return;
      }
      const positionUpdates = calculateAlignmentPositions(selectedNodes, alignmentType);
      if (Object.keys(positionUpdates).length === 0) {
        onClose();
        return;
      }
      editorActions.moveNodes(positionUpdates);
      onClose();
    },
    [editorActions, onClose, selectedNodes, showAlignmentControls],
  );

  const handlePasteFromClipboard = React.useCallback(() => {
    const result = pasteNodesFromClipboard();
    if (!result) {
      return;
    }

    result.nodes.forEach((node) => {
      editorActions.addNodeWithId(node);
    });

    result.connections.forEach((connection) => {
      editorActions.addConnection(connection);
    });

    const newIds = Array.from(result.idMap.values());
    actionActions.setInteractionSelection(newIds);
    actionActions.setEditingSelection(newIds);
    onClose();
  }, [editorActions, actionActions, onClose]);

  const handleDeleteConnection = () => {
    if (target.type !== "connection") {
      return;
    }
    editorActions.deleteConnection(target.id);
    onClose();
  };

  return (
    <ContextMenuOverlay
      anchor={position}
      visible={visible}
      onClose={onClose}
      onPositionChange={setResolvedPosition}
      dataAttributes={{ "context-action-menu": true }}
    >
      <div className={styles.menu}>
        <ul className={styles.menuList}>
        {showAlignmentControls && (
          <li className={styles.alignmentControlsItem}>
            <div className={alignmentStyles.alignmentLabel}>Alignment ({selectedNodes.length} nodes)</div>
            <div className={alignmentStyles.alignmentGrid}>
              {ALIGNMENT_GROUPS.map((group) => (
                <div key={group} className={alignmentStyles.alignmentRow}>
                  {groupedAlignmentActions[group]?.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.type}
                        type="button"
                        onClick={() => handleAlignFromMenu(action.type)}
                        className={alignmentStyles.alignmentButton}
                        title={action.title}
                        aria-label={action.title}
                      >
                        <IconComponent size={14} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </li>
        )}
        {target.type === "node" && (
          <>
            <li className={styles.menuSectionTitle}>{t("inspectorNodeProperties")}</li>
            <li
              className={styles.menuItem}
              onClick={() => {
                if (target.type !== "node") {
                  return;
                }
                // Ensure node is selected and switch inspector to Properties tab
                actionActions.setInteractionSelection([target.id]);
                actionActions.setEditingSelection([target.id]);
                actionActions.setInspectorActiveTab(1);
                onClose();
              }}
            >
              <EditIcon size={14} /> {t("contextMenuEditNode")}
            </li>
            <NodeActionsList targetNodeId={target.type === "node" ? target.id : ""} onAction={onClose} />
          </>
        )}
        {target.type === "connection" && (
          <>
            <li className={styles.menuSectionTitle}>{t("inspectorConnectionProperties")}</li>
            <li className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleDeleteConnection}>
              {t("contextMenuDeleteConnection")}
            </li>
          </>
        )}
        {target.type === "canvas" && (
          <>
            <li
              className={styles.menuItem}
              onClick={() => {
                // Close this menu then open NodeSearch at the same screen position
                onClose();
                actionActions.showContextMenu(resolvedPosition, undefined, undefined, undefined, "search");
              }}
            >
              <PlusIcon size={14} /> {t("addConnection") || "Add Connection…"}
            </li>
            <li className={styles.menuItem} onClick={() => handlePasteFromClipboard()}>
              <PasteIcon size={14} /> {t("paste")}{" "}
              {pasteShortcut ? <span className={styles.shortcutHint}>{pasteShortcut}</span> : null}
            </li>
          </>
        )}
        </ul>
      </div>
    </ContextMenuOverlay>
  );
};

ContextActionMenu.displayName = "ContextActionMenu";
