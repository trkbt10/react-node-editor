/**
 * @file NodeEditorCanvas - Canvas component without layout dependencies
 * @description
 * This component provides context menu handling without depending on GridLayout.
 * Port position management is now handled by PortPositionProvider in the provider hierarchy.
 * Use this when you want to manage your own layout while still getting
 * core canvas functionality like context menus.
 */
import * as React from "react";
import { NodeEditorBase } from "../layout/NodeEditorBase";
import { ContextActionMenu, type ContextTarget } from "../menus/ContextActionMenu";
import { NodeSearchMenu } from "../panels/node-search/NodeSearchMenu";
import { useEditorActionState } from "../../contexts/composed/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useDisabledNodeTypes } from "../../contexts/node-definitions/hooks/useDisabledNodeTypes";
import { useSettings } from "../../hooks/useSettings";
import type { SettingsManager } from "../../settings/SettingsManager";

export type NodeEditorCanvasProps = {
  settingsManager?: SettingsManager;
  /** Children to render within the canvas (e.g., custom layout) */
  children?: React.ReactNode;
};

/**
 * NodeEditorCanvas - Provides core canvas functionality without layout dependencies
 *
 * This component handles:
 * - Settings application (theme, grid, etc.)
 * - Context menu rendering and node creation
 * - NodeEditorBase wrapper
 *
 * Port position management is handled by PortPositionProvider in the provider hierarchy
 * (set up via NodeEditorCore).
 *
 * Use this when you want to provide your own layout system while still
 * getting all the canvas functionality.
 */
export const NodeEditorCanvas: React.FC<NodeEditorCanvasProps> = ({
  settingsManager,
  children,
}) => {
  const { settingsManager: contextSettingsManager } = useNodeEditor();
  const { state: actionState, actions: actionActions, nodeOperations } = useEditorActionState();
  const effectiveSettingsManager = settingsManager ?? contextSettingsManager;
  const settings = useSettings(effectiveSettingsManager);

  const nodeDefinitions = useNodeDefinitionList();
  const disabledNodeTypes = useDisabledNodeTypes();

  // Node creation handler for context menu - delegates to nodeOperations
  const handleCreateNode = React.useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      nodeOperations.createNodeFromContextMenu(nodeType, position);
    },
    [nodeOperations],
  );

  // Memoized close handler
  const handleCloseContextMenu = React.useCallback(() => {
    actionActions.hideContextMenu();
  }, [actionActions]);

  // Memoized disabled node types for search menu (combines flow-level and allowed-type restrictions)
  const searchMenuDisabledNodeTypes = React.useMemo(() => {
    const allowed = actionState.contextMenu.allowedNodeTypes;
    if (!allowed) {
      return disabledNodeTypes;
    }
    const allowedSet = new Set(allowed);
    const flowDisabled = new Set(disabledNodeTypes);
    const extraDisabled = nodeDefinitions.map((d) => d.type).filter((t) => !allowedSet.has(t));
    return Array.from(new Set([...Array.from(flowDisabled), ...extraDisabled]));
  }, [actionState.contextMenu.allowedNodeTypes, disabledNodeTypes, nodeDefinitions]);

  // Memoized context menu target
  const contextMenuTarget = React.useMemo<ContextTarget>(() => {
    if (actionState.contextMenu.nodeId) {
      return { type: "node", id: actionState.contextMenu.nodeId };
    }
    if (actionState.contextMenu.connectionId) {
      return { type: "connection", id: actionState.contextMenu.connectionId };
    }
    return { type: "canvas" };
  }, [actionState.contextMenu.nodeId, actionState.contextMenu.connectionId]);

  // Memoized canvas position for context action menu
  const contextMenuCanvasPosition = React.useMemo(
    () => actionState.contextMenu.canvasPosition ?? actionState.contextMenu.position,
    [actionState.contextMenu.canvasPosition, actionState.contextMenu.position],
  );

  return (
    <NodeEditorBase>
      {children}

      {/* Context Menus */}
      {actionState.contextMenu.visible && actionState.contextMenu.mode === "search" && (
        <NodeSearchMenu
          position={actionState.contextMenu.position}
          nodeDefinitions={nodeDefinitions}
          disabledNodeTypes={searchMenuDisabledNodeTypes}
          onCreateNode={handleCreateNode}
          onClose={handleCloseContextMenu}
          visible={true}
          viewMode={settings.nodeSearchViewMode}
          filterMode={settings.nodeSearchFilterMode}
          menuWidth={settings.nodeSearchMenuWidth}
        />
      )}

      {actionState.contextMenu.visible && actionState.contextMenu.mode !== "search" && (
        <ContextActionMenu
          position={actionState.contextMenu.position}
          target={contextMenuTarget}
          visible={true}
          onClose={handleCloseContextMenu}
          nodeDefinitions={nodeDefinitions}
          onCreateNode={handleCreateNode}
          canvasPosition={contextMenuCanvasPosition}
          disabledNodeTypes={disabledNodeTypes}
        />
      )}
    </NodeEditorBase>
  );
};
