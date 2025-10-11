import * as React from "react";
import { useNodeDefinitionList } from "../../contexts/NodeDefinitionContext";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeEditor } from "../../contexts/node-editor";
import { FloatingContainer } from "../shared/FloatingContainer";
import { Button } from "../elements/Button";
import styles from "./NodeEditorToolbar.module.css";
import { countNodesByType, canAddNodeType } from "../../utils/nodeTypeLimits";

export type NodeEditorToolbarProps = {
  floating?: boolean;
  position?: "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
} & React.HTMLAttributes<HTMLDivElement>

export const NodeEditorToolbar: React.FC<NodeEditorToolbarProps> = ({
  className,
  floating = false,
  position = "top",
  children,
  ...rest
}) => {
  const nodeDefinitions = useNodeDefinitionList();
  const { actions: actionActions, dispatch: actionDispatch } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const { state: editorState, dispatch, actions } = useNodeEditor();

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
          const base: Record<string, unknown> = nodeDefinition.defaultData ? { ...(nodeDefinition.defaultData as Record<string, unknown>) } : {};
          return { ...base, title: "" };
        })(),
      };

      dispatch(actions.addNode(newNode));
      actionDispatch(actionActions.selectNode(nodeId, false));
    },
    [nodeDefinitions, nodeTypeCounts, canvasState.viewport, dispatch, actions, actionDispatch, actionActions]
  );

  const showNodeSearchMenu = React.useCallback(() => {
    const viewport = canvasState.viewport;
    const centerScreenX = window.innerWidth / 2;
    const centerScreenY = window.innerHeight / 2;
    const canvasX = (-viewport.offset.x + centerScreenX) / viewport.scale;
    const canvasY = (-viewport.offset.y + centerScreenY) / viewport.scale;

    actionDispatch(
      actionActions.showContextMenu({ x: centerScreenX, y: centerScreenY }, undefined, { x: canvasX, y: canvasY })
    );
  }, [canvasState.viewport, actionDispatch, actionActions]);

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

  const toolbarClassName = React.useMemo(() => {
    return [styles.topToolbar, className].filter(Boolean).join(" ");
  }, [className]);

  if (floating) {
    return (
      <FloatingContainer position={position} className={className}>
        <div className={styles.topToolbar} {...rest}>
          {toolbarContent}
          {children}
        </div>
      </FloatingContainer>
    );
  }

  return (
    <div className={toolbarClassName} {...rest}>
      {toolbarContent}
      {children}
    </div>
  );
};

export type NodeEditorToolbarGroupProps = {} & React.HTMLAttributes<HTMLDivElement>

export const NodeEditorToolbarGroup: React.FC<NodeEditorToolbarGroupProps> = ({
  className = "",
  children,
  ...props
}) => {
  const classes = [styles.group, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export type NodeEditorToolbarSeparatorProps = {} & React.HTMLAttributes<HTMLDivElement>

export const NodeEditorToolbarSeparator: React.FC<NodeEditorToolbarSeparatorProps> = ({
  className = "",
  ...props
}) => {
  const classes = [styles.separator, className].filter(Boolean).join(" ");

  return <div className={classes} role="separator" {...props} />;
};
