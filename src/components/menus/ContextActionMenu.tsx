/**
 * @file Context action menu component
 */
import * as React from "react";
import { EditIcon, PasteIcon } from "../elements/icons";
import { MenuItem } from "./MenuItem";
import { NodeAddMenu } from "./NodeAddMenu";
import { SearchIcon } from "../elements/icons";
import styles from "./ContextActionMenu.module.css";
import { ALIGNMENT_ACTIONS, ALIGNMENT_GROUPS } from "../controls/alignments/constants";
import { calculateAlignmentPositions } from "../controls/alignments/utils";
import type { AlignmentActionConfig, AlignmentActionGroup, AlignmentActionType } from "../controls/alignments/types";
import type { Position, Node } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useI18n } from "../../i18n/context";
import { useNodeEditor, useNodeEditorActions } from "../../contexts/node-editor/context";
import { useNodeOperations } from "../../contexts/NodeOperationsContext";
import { NodeActionsList } from "./NodeActionsList";
import { ContextMenuOverlay } from "../layout/ContextMenuOverlay";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import { detectShortcutDisplayPlatform, getShortcutLabelForAction } from "../../utils/shortcutDisplay";

export type ContextTarget = { type: "node"; id: string } | { type: "connection"; id: string } | { type: "canvas" };

export type ContextActionMenuProps = {
  position: Position;
  target: ContextTarget;
  visible: boolean;
  onClose: () => void;
  nodeDefinitions?: NodeDefinition[];
  onCreateNode?: (nodeType: string, position: Position) => void;
  canvasPosition?: Position;
  disabledNodeTypes?: string[];
};

export const ContextActionMenu: React.FC<ContextActionMenuProps> = ({
  position,
  target,
  visible,
  onClose,
  nodeDefinitions,
  onCreateNode,
  canvasPosition,
  disabledNodeTypes,
}) => {
  const { t } = useI18n();
  const editorActions = useNodeEditorActions();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const nodeOperations = useNodeOperations();
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
    nodeOperations.pasteNodes();
    onClose();
  }, [nodeOperations, onClose]);

  const handleDeleteConnection = React.useCallback(() => {
    if (target.type !== "connection") {
      return;
    }
    editorActions.deleteConnection(target.id);
    onClose();
  }, [editorActions, onClose, target]);

  if (!visible) {
    return null;
  }

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
              <div className={styles.alignmentLabel}>Alignment ({selectedNodes.length} nodes)</div>
              <div className={styles.alignmentGrid}>
                {ALIGNMENT_GROUPS.map((group) => (
                  <div key={group} className={styles.alignmentRow}>
                    {groupedAlignmentActions[group]?.map((action) => {
                      const IconComponent = action.icon;
                      return (
                        <button
                          key={action.type}
                          type="button"
                          onClick={() => handleAlignFromMenu(action.type)}
                          className={styles.alignmentButton}
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
              <MenuItem
                icon={<EditIcon size={14} />}
                label={t("contextMenuEditNode")}
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
              />
              <NodeActionsList targetNodeId={target.type === "node" ? target.id : ""} onAction={onClose} />
            </>
          )}
          {target.type === "connection" && (
            <>
              <li className={styles.menuSectionTitle}>{t("inspectorConnectionProperties")}</li>
              <MenuItem label={t("contextMenuDeleteConnection")} danger onClick={handleDeleteConnection} />
            </>
          )}
          {target.type === "canvas" && (
            <>
              {nodeDefinitions && nodeDefinitions.length > 0 && onCreateNode && canvasPosition && (
                <>
                  <NodeAddMenu
                    label={t("addNode") || "Add Node"}
                    nodeDefinitions={nodeDefinitions}
                    onSelectNode={onCreateNode}
                    canvasPosition={canvasPosition}
                    disabledNodeTypes={disabledNodeTypes}
                    onClose={onClose}
                  />
                  <MenuItem
                    icon={<SearchIcon size={14} />}
                    label={t("nodeSearchPlaceholder") || "Search Nodes…"}
                    onClick={() => {
                      onClose();
                      actionActions.showContextMenu({ position: resolvedPosition, canvasPosition, mode: "search" });
                    }}
                  />
                </>
              )}
              <MenuItem
                icon={<PasteIcon size={14} />}
                label={t("paste")}
                shortcutHint={pasteShortcut}
                onClick={handlePasteFromClipboard}
              />
            </>
          )}
        </ul>
      </div>
    </ContextMenuOverlay>
  );
};

ContextActionMenu.displayName = "ContextActionMenu";
