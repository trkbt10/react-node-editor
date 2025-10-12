import * as React from "react";
import { classNames, calculateContextMenuPosition, getViewportInfo } from "../elements";
import { EditIcon, PlusIcon, PasteIcon } from "../elements/icons";
import styles from "./ContextActionMenu.module.css";
import alignmentStyles from "../controls/alignments/AlignmentControls.module.css";
import {
  ALIGNMENT_ACTIONS,
  ALIGNMENT_GROUPS,
  calculateAlignmentPositions,
  type AlignmentActionConfig,
  type AlignmentActionGroup,
  type AlignmentActionType,
} from "../controls/alignments";
import type { Position, Node } from "../../types/core";
import { useNodeEditorActions } from "../../hooks/useNodeEditorActions";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useI18n } from "../../i18n";
import { useNodeEditor } from "../../contexts/node-editor";
import { useNodeDefinitionList } from "../../contexts/node-definitions";
import { canAddNodeType, countNodesByType } from "../../contexts/node-definitions/utils/nodeTypeLimits";
import { getClipboard, setClipboard } from "../../utils/clipboard";
import { NodeActionsList } from "./NodeActionsList";

export type ContextTarget =
  | { type: "node"; id: string }
  | { type: "connection"; id: string }
  | { type: "canvas" };

export type ContextActionMenuProps = {
  position: Position;
  target: ContextTarget;
  visible: boolean;
  onClose: () => void;
}

export const ContextActionMenu: React.FC<ContextActionMenuProps> = ({ position, target, visible, onClose }) => {
  const { t } = useI18n();
  const editorActions = useNodeEditorActions();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: editorState } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();
  const [menuPosition, setMenuPosition] = React.useState({ x: position.x, y: position.y });
  const menuRef = React.useRef<HTMLDivElement>(null);
  const selectedNodeIds = actionState.selectedNodeIds;
  const isTargetSelected = target.type === "node" && selectedNodeIds.includes(target.id);
  const isMultiSelect = isTargetSelected && selectedNodeIds.length > 1;
  const selectedNodes = React.useMemo<Node[]>(() => {
    if (!isMultiSelect) {
      return [];
    }
    return selectedNodeIds
      .map((id) => editorState.nodes[id])
      .filter((node): node is Node => Boolean(node));
  }, [isMultiSelect, selectedNodeIds, editorState.nodes]);
  const showAlignmentControls = isMultiSelect && selectedNodes.length > 1;
  const groupedAlignmentActions = React.useMemo(() => {
    return ALIGNMENT_GROUPS.reduce<Record<AlignmentActionGroup, AlignmentActionConfig[]>>(
      (acc, group) => {
        acc[group] = ALIGNMENT_ACTIONS.filter((action) => action.group === group);
        return acc;
      },
      { horizontal: [], vertical: [] }
    );
  }, []);

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          const viewport = getViewportInfo();
          const calculated = calculateContextMenuPosition(position.x, position.y, rect.width, rect.height, viewport);
          setMenuPosition(calculated);
        }
      }, 0);
    }
  }, [visible, position.x, position.y]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visible && e.target instanceof Element) {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          onClose();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, onClose]);

  if (!visible) {return null;}

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcut = (mac: string, win: string) => (
    <span className={styles.shortcutHint}>{isMac ? mac : win}</span>
  );

  const handleAlignFromMenu = React.useCallback(
    (alignmentType: AlignmentActionType) => {
      if (!showAlignmentControls) {return;}
      const positionUpdates = calculateAlignmentPositions(selectedNodes, alignmentType);
      if (Object.keys(positionUpdates).length === 0) {
        onClose();
        return;
      }
      editorActions.moveNodes(positionUpdates);
      onClose();
    },
    [editorActions, onClose, selectedNodes, showAlignmentControls]
  );

  const _handleDuplicateNode = () => {
    if (target.type !== "node") {return;}
    const node = editorState.nodes[target.id];
    if (!node) {return;}
    const counts = countNodesByType(editorState);
    if (!canAddNodeType(node.type, nodeDefinitions, counts)) {
      onClose();
      return;
    }
    editorActions.duplicateNodes([target.id]);
    onClose();
  };

  const _handleCutSelected = () => {
    let selected = actionState.selectedNodeIds;
    if (target.type === 'node' && !selected.includes(target.id)) {
      selected = [target.id];
    }
    if (selected.length === 0) {return;}
    const nodes = selected
      .map((id) => editorState.nodes[id])
      .filter(Boolean)
      .map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, data: n.data }));
    const selSet = new Set(selected);
    const connections = Object.values(editorState.connections).filter(
      (c) => selSet.has(c.fromNodeId) && selSet.has(c.toNodeId)
    ).map((c) => ({ fromNodeId: c.fromNodeId, fromPortId: c.fromPortId, toNodeId: c.toNodeId, toPortId: c.toPortId }));
    setClipboard({ nodes, connections });
    selected.forEach((nodeId) => editorActions.deleteNode(nodeId));
    actionDispatch(actionActions.clearSelection());
    onClose();
  };

  const handlePasteFromClipboard = () => {
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
        editorActions.addConnection({
          fromNodeId: fromId,
          fromPortId: c.fromPortId,
          toNodeId: toId,
          toPortId: c.toPortId,
        });
      }
    });
    const newIds = Array.from(idMap.values());
    actionDispatch(actionActions.selectAllNodes(newIds));
    onClose();
  };

  const handleDeleteConnection = () => {
    if (target.type !== "connection") {return;}
    editorActions.deleteConnection(target.id);
    onClose();
  };

  // Optional: Start a disconnect drag from context menu
  const _handleDisconnectFrom = (_end: "from" | "to") => {
    if (target.type !== "connection") {return;}
    // We only implement Delete here to keep logic simple and safe.
    // Future: implement startConnectionDisconnect with fixedPort using portLookupMap.
    editorActions.deleteConnection(target.id);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={classNames(styles.menu, styles.menuContainer)}
      style={{ left: menuPosition.x, top: menuPosition.y }}
    >
      <ul className={styles.menuList}>
        {showAlignmentControls && (
          <li className={styles.alignmentControlsItem}>
            <div className={alignmentStyles.alignmentLabel}>
              Alignment ({selectedNodes.length} nodes)
            </div>
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
                if (target.type !== "node") {return;}
                // Ensure node is selected and switch inspector to Properties tab
                actionDispatch(actionActions.selectNode(target.id, false));
                actionDispatch(actionActions.setInspectorActiveTab(1));
                onClose();
              }}
            >
              <EditIcon size={14} /> {t("contextMenuEditNode")}
            </li>
            <NodeActionsList targetNodeId={target.type === 'node' ? target.id : ''} onAction={onClose} />
          </>
        )}
        {target.type === "connection" && (
          <>
            <li className={styles.menuSectionTitle}>{t("inspectorConnectionProperties")}</li>
            <li className={classNames(styles.menuItem, styles.menuItemDanger)} onClick={handleDeleteConnection}>{t("contextMenuDeleteConnection")}</li>
          </>
        )}
        {target.type === 'canvas' && (
          <>
            <li
              className={styles.menuItem}
              onClick={() => {
                // Close this menu then open NodeSearch at the same screen position
                onClose();
                actionDispatch(actionActions.showContextMenu(menuPosition, undefined, undefined, undefined, 'search'));
              }}
            >
              <PlusIcon size={14} /> {t('addConnection') || 'Add Connection…'}
            </li>
            <li className={styles.menuItem} onClick={() => handlePasteFromClipboard()}>
              <PasteIcon size={14} /> {t('paste')} {shortcut('⌘V', 'Ctrl+V')}
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

ContextActionMenu.displayName = "ContextActionMenu";
