/**
 * @file Node editor toolbar component
 */
import * as React from "react";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { Button } from "../elements/Button";
import styles from "./NodeEditorToolbar.module.css";
import { countNodesByType, canAddNodeType } from "../../contexts/node-definitions/utils/nodeTypeLimits";

export type NodeEditorToolbarProps = {
  children?: React.ReactNode;
};

export const NodeEditorToolbar: React.FC<NodeEditorToolbarProps> = React.memo(({ children }) => {
  const nodeDefinitions = useNodeDefinitionList();
  const { actions: actionActions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const { state: editorState, actions } = useNodeEditor();

  const commonNodeTypes = React.useMemo(() => {
    return nodeDefinitions
      .filter((definition) => ["standard", "input", "output", "process", "group"].includes(definition.type))
      .slice(0, 5);
  }, [nodeDefinitions]);

  const nodeTypeCounts = React.useMemo(() => countNodesByType(editorState), [editorState]);

  const handleToolbarNodeCreate = React.useCallback(
    (nodeType: string) => {
      const nodeDefinition = nodeDefinitions.find((definition) => definition.type === nodeType);
      if (!nodeDefinition) {
        console.warn(`Node definition not found for type: ${nodeType}`);
        return;
      }

      if (!canAddNodeType(nodeType, nodeDefinitions, nodeTypeCounts)) {
        return;
      }

      const viewport = canvasState.viewport;
      const centerX = (-viewport.offset.x + window.innerWidth / 2) / viewport.scale;
      const centerY = (-viewport.offset.y + window.innerHeight / 2) / viewport.scale;
      const nodeId = `${nodeType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newNode = {
        id: nodeId,
        type: nodeType,
        position: { x: centerX, y: centerY },
        size: nodeDefinition.defaultSize || { width: 150, height: 50 },
        // Use definition defaults but force empty title per requirements
        data: (() => {
          const base: Record<string, unknown> = nodeDefinition.defaultData
            ? { ...(nodeDefinition.defaultData as Record<string, unknown>) }
            : {};
          return { ...base, title: "" };
        })(),
      };

      actions.addNode(newNode);
      actionActions.setInteractionSelection([nodeId]);
      actionActions.setEditingSelection([nodeId]);
    },
    [nodeDefinitions, nodeTypeCounts, canvasState.viewport, actions, actionActions],
  );

  const showNodeSearchMenu = React.useCallback(() => {
    const viewport = canvasState.viewport;
    const centerScreenX = window.innerWidth / 2;
    const centerScreenY = window.innerHeight / 2;
    const canvasX = (-viewport.offset.x + centerScreenX) / viewport.scale;
    const canvasY = (-viewport.offset.y + centerScreenY) / viewport.scale;

    actionActions.showContextMenu({ x: centerScreenX, y: centerScreenY }, undefined, { x: canvasX, y: canvasY });
  }, [canvasState.viewport, actionActions]);

  const toolbarContent = (
    <>
      {commonNodeTypes.map((nodeType) => (
        <Button
          key={nodeType.type}
          className={styles.toolButton}
          disabled={!canAddNodeType(nodeType.type, nodeDefinitions, nodeTypeCounts)}
          onClick={() => handleToolbarNodeCreate(nodeType.type)}
          title={`Add ${nodeType.displayName}`}
          aria-label={`Add ${nodeType.displayName}`}
        >
          {nodeType.icon ? (
            <span className={styles.toolbarIcon}>{nodeType.icon}</span>
          ) : (
            <span className={styles.toolbarIconText}>{nodeType.displayName.charAt(0).toUpperCase()}</span>
          )}
        </Button>
      ))}

      {commonNodeTypes.length > 0 && <div className={styles.toolbarSeparator} />}

      <Button className={styles.toolButton} onClick={showNodeSearchMenu} title="Add Node..." aria-label="Add Node...">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2H9v3a1 1 0 1 1-2 0V9H4a1 1 0 0 1 0-2h3V4a1 1 0 0 1 1-1z" />
        </svg>
      </Button>
    </>
  );

  return (
    <div className={styles.topToolbar}>
      {toolbarContent}
      {children}
    </div>
  );
});

NodeEditorToolbar.displayName = "NodeEditorToolbar";

export type NodeEditorToolbarGroupProps = {
  children?: React.ReactNode;
};

export const NodeEditorToolbarGroup: React.FC<NodeEditorToolbarGroupProps> = React.memo(({ children }) => {
  return (
    <div className={styles.group}>
      {children}
    </div>
  );
});

NodeEditorToolbarGroup.displayName = "NodeEditorToolbarGroup";

export const NodeEditorToolbarSeparator: React.FC = React.memo(() => {
  return <div className={styles.separator} role="separator" />;
});

NodeEditorToolbarSeparator.displayName = "NodeEditorToolbarSeparator";
