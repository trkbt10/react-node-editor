/**
 * @file Main node editor content component with port position management and grid layout
 */
import * as React from "react";
import { classNames } from "./components/elements/classNames";
import { GridLayout } from "./components/layout/GridLayout";
import { NodeEditorBase } from "./components/layout/NodeEditorBase";
import { ContextActionMenu } from "./components/shared/ContextActionMenu";
import { NodeSearchMenu } from "./components/shared/NodeSearchMenu";
import { defaultEditorGridConfig, defaultEditorGridLayers } from "./config/defaultLayout";
import { useEditorActionState } from "./contexts/EditorActionStateContext";
import { useNodeEditor } from "./contexts/node-editor/context";
import { useNodeCanvas } from "./contexts/NodeCanvasContext";
import { useNodeDefinitionList } from "./contexts/node-definitions/hooks/useNodeDefinitionList";
import { PortPositionProvider } from "./contexts/node-ports/provider";
import { useSettings } from "./hooks/useSettings";
import styles from "./NodeEditorContent.module.css";
import type { SettingsManager } from "./settings/SettingsManager";
import type { Port as CorePort } from "./types/core";
import type { GridLayoutConfig, LayerDefinition } from "./types/panels";
import {
  DEFAULT_PORT_POSITION_CONFIG,
  type EditorPortPositions,
  type PortPositionBehavior,
  type PortPositionConfig,
  type PortPositionNode,
} from "./types/portPosition";
import { computeAllPortPositions, computeNodePortPositions } from "./contexts/node-ports/utils/computePortPositions";
import { canConnectPorts } from "./contexts/node-ports/utils/connectionValidation";
import {
  canAddNodeType,
  countNodesByType,
  getDisabledNodeTypes,
} from "./contexts/node-definitions/utils/nodeTypeLimits";

export const NodeEditorContent: React.FC<{
  className?: string;
  settingsManager?: SettingsManager;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  portPositionBehavior?: PortPositionBehavior;
  /** Grid layout configuration */
  gridConfig?: GridLayoutConfig;
  /** Grid layer definitions */
  gridLayers?: LayerDefinition[];
}> = ({ className, settingsManager, portPositionBehavior, gridConfig, gridLayers }) => {
  const { state: editorState, dispatch, actions, getNodePorts } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();

  const portPositionConfig = React.useMemo<PortPositionConfig>(
    () => ({ ...DEFAULT_PORT_POSITION_CONFIG, ...portPositionBehavior?.config }),
    [portPositionBehavior?.config],
  );

  const computePositionsForNodes = React.useCallback(
    (nodes: PortPositionNode[], previousPositions: EditorPortPositions): EditorPortPositions => {
      const defaultComputeAll = (nodesArg: PortPositionNode[], configArg: PortPositionConfig) =>
        computeAllPortPositions(nodesArg, configArg);

      if (portPositionBehavior?.computeAll) {
        return portPositionBehavior.computeAll({
          nodes,
          previous: previousPositions,
          config: portPositionConfig,
          defaultCompute: defaultComputeAll,
        });
      }

      if (portPositionBehavior?.computeNode) {
        const defaultComputeNode = (nodeArg: PortPositionNode, configArg: PortPositionConfig) =>
          computeNodePortPositions(nodeArg, configArg);

        const result: EditorPortPositions = new Map();
        nodes.forEach((node) => {
          const positions = portPositionBehavior.computeNode!({
            node,
            config: portPositionConfig,
            defaultCompute: defaultComputeNode,
          });

          if (positions.size > 0) {
            result.set(node.id, positions);
          }
        });
        return result;
      }

      return defaultComputeAll(nodes, portPositionConfig);
    },
    [portPositionBehavior, portPositionConfig],
  );

  const nodeDefinitions = useNodeDefinitionList();

  // Count nodes by type for max-per-flow enforcement
  const nodeTypeCounts = React.useMemo(() => countNodesByType(editorState), [editorState]);

  // Determine which node types should be disabled in palette based on maxPerFlow
  const disabledNodeTypes = React.useMemo(
    () => getDisabledNodeTypes(nodeDefinitions, nodeTypeCounts),
    [nodeDefinitions, nodeTypeCounts],
  );

  // Compute port positions whenever nodes change
  const [portPositions, setPortPositions] = React.useState<EditorPortPositions>(() => new Map());

  // Track previous nodes state for change detection
  const prevNodesRef = React.useRef<typeof editorState.nodes>(editorState.nodes);
  const prevBehaviorRef = React.useRef<PortPositionBehavior | undefined>(portPositionBehavior);
  const prevConfigRef = React.useRef<PortPositionConfig>(portPositionConfig);
  const prevPortPositionsRef = React.useRef<EditorPortPositions>(portPositions);

  React.useEffect(() => {
    if (!editorState.nodes) {
      return;
    }

    const prevNodes = prevNodesRef.current;
    let shouldRecompute = false;

    if (!prevNodes || Object.keys(prevNodes).length !== Object.keys(editorState.nodes).length) {
      shouldRecompute = true;
    } else {
      for (const nodeId in editorState.nodes) {
        const node = editorState.nodes[nodeId];
        const prevNode = prevNodes[nodeId];

        if (
          !prevNode ||
          node.position.x !== prevNode.position.x ||
          node.position.y !== prevNode.position.y ||
          node.size?.width !== prevNode.size?.width ||
          node.size?.height !== prevNode.size?.height
        ) {
          shouldRecompute = true;
          break;
        }
      }
    }

    if (!shouldRecompute) {
      if (prevBehaviorRef.current !== portPositionBehavior) {
        shouldRecompute = true;
      } else if (prevConfigRef.current !== portPositionConfig) {
        shouldRecompute = true;
      }
    }

    if (shouldRecompute) {
      const nodes = Object.values(editorState.nodes).map((node) => ({
        ...node,
        ports: getNodePorts(node.id),
      })) as PortPositionNode[];

      const newPortPositions = computePositionsForNodes(nodes, prevPortPositionsRef.current);
      setPortPositions(newPortPositions);
      prevPortPositionsRef.current = newPortPositions;

      prevNodesRef.current = editorState.nodes;
      prevBehaviorRef.current = portPositionBehavior;
      prevConfigRef.current = portPositionConfig;
    } else {
      prevBehaviorRef.current = portPositionBehavior;
      prevConfigRef.current = portPositionConfig;
    }
  }, [editorState.nodes, portPositionBehavior, portPositionConfig, getNodePorts, computePositionsForNodes]);

  // Use settings hook for clean state management
  const settings = useSettings(settingsManager);
  const { theme, smoothAnimations, fontSize, gridSize, gridOpacity, canvasBackground } = settings;
  // Apply settings-based CSS custom properties
  const editorStyles = React.useMemo(
    () =>
      ({
        "--editor-font-size": `${fontSize}px`,
        "--editor-grid-size": `${gridSize}px`,
        "--editor-grid-opacity": `${gridOpacity}`,
        "--editor-canvas-background": canvasBackground,
      }) as React.CSSProperties,
    [fontSize, gridSize, gridOpacity, canvasBackground],
  );

  // Node creation handler for context menu
  const handleCreateNode = React.useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      const nodeDefinition = nodeDefinitions.find((def) => def.type === nodeType);
      if (!nodeDefinition) {
        console.warn(`Node definition not found for type: ${nodeType}`);
        return;
      }

      // Use canvas position from context menu state (preferred)
      // If not available, use canvas utils to convert screen coordinates
      let canvasPosition = actionState.contextMenu.canvasPosition;

      if (!canvasPosition) {
        // Convert screen coordinates to canvas coordinates using canvas utils
        canvasPosition = utils.screenToCanvas(position.x, position.y);
      }

      // Create unique node ID
      const nodeId = `${nodeType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Get node size
      const nodeSize = nodeDefinition.defaultSize || { width: 150, height: 50 };

      // Adjust position so node center is at click position
      const centeredPosition = {
        x: canvasPosition.x - nodeSize.width / 2,
        y: canvasPosition.y - nodeSize.height / 2,
      };

      // Enforce per-flow maximums if defined
      if (!canAddNodeType(nodeType, nodeDefinitions, nodeTypeCounts)) {
        return;
      }

      // Create new node with definition defaults
      const newNode = {
        id: nodeId,
        type: nodeType,
        position: centeredPosition,
        size: nodeSize,
        // Use definition defaults but force empty title per requirements
        data: (() => {
          const base: Record<string, unknown> = nodeDefinition.defaultData
            ? { ...(nodeDefinition.defaultData as Record<string, unknown>) }
            : {};
          return { ...base, title: "" };
        })(),
        // Ports are no longer assigned here - they will be inferred from NodeDefinition
      };

      // Add node to editor with the predetermined id
      dispatch(actions.addNodeWithId(newNode));

      // Do not auto-select the new node to avoid unintended adjacent highlighting

      // If creation was triggered from connection drag, try to connect
      const fromPort = actionState.contextMenu.fromPort;
      if (fromPort) {
        const fromNode = editorState.nodes[fromPort.nodeId];
        const fromDef = fromNode ? nodeDefinitions.find((d) => d.type === fromNode.type) : undefined;
        const toDef = nodeDefinition;
        const toPorts = toDef.ports || [];
        const targetPortDef = toPorts.find((p) => {
          if (p.type === fromPort.type) {
            return false;
          }
          const tempPort: CorePort = { id: p.id, type: p.type, label: p.label, nodeId, position: p.position };
          return canConnectPorts(
            fromPort.type === "output" ? fromPort : tempPort,
            fromPort.type === "output" ? tempPort : fromPort,
            fromDef,
            toDef,
            editorState.connections,
          );
        });
        if (targetPortDef) {
          const tempPort: CorePort = {
            id: targetPortDef.id,
            type: targetPortDef.type,
            label: targetPortDef.label,
            nodeId,
            position: targetPortDef.position,
          };
          const connection =
            fromPort.type === "output"
              ? { fromNodeId: fromPort.nodeId, fromPortId: fromPort.id, toNodeId: nodeId, toPortId: tempPort.id }
              : { fromNodeId: nodeId, fromPortId: tempPort.id, toNodeId: fromPort.nodeId, toPortId: fromPort.id };
          dispatch(actions.addConnection(connection));
        }
      }

      // Hide context menu
      actionDispatch(actionActions.hideContextMenu());
    },
    [
      nodeDefinitions,
      dispatch,
      actions,
      actionDispatch,
      actionActions,
      actionState.contextMenu.canvasPosition,
      actionState.contextMenu.fromPort,
      editorState.connections,
      editorState.nodes,
      utils,
    ],
  );

  // Track grid changes to force GridLayout re-render when needed
  const gridLayoutVersionRef = React.useRef(0);
  const prevGridConfigRef = React.useRef(gridConfig);
  const prevGridLayersRef = React.useRef(gridLayers);

  React.useEffect(() => {
    if (prevGridConfigRef.current !== gridConfig || prevGridLayersRef.current !== gridLayers) {
      gridLayoutVersionRef.current++;
      prevGridConfigRef.current = gridConfig;
      prevGridLayersRef.current = gridLayers;
    }
  }, [gridConfig, gridLayers]);

  // Use provided grid config/layers or build default
  const effectiveGridConfig = React.useMemo((): GridLayoutConfig => {
    if (gridConfig) {
      return gridConfig;
    }

    // No gridConfig provided - use default layout with status bar and resizable inspector
    return defaultEditorGridConfig;
  }, [gridConfig]);

  const effectiveGridLayers = React.useMemo((): LayerDefinition[] => {
    if (gridLayers) {
      return gridLayers;
    }

    // No gridLayers provided - use default layers
    return defaultEditorGridLayers;
  }, [gridLayers]);

  // Generate unique key for GridLayout to force re-render when grid changes
  const gridLayoutKey = gridConfig || gridLayers ? `custom-${gridLayoutVersionRef.current}` : "default";

  return (
    <NodeEditorBase
      className={classNames(
        className,
        theme === "dark" && styles.darkTheme,
        smoothAnimations && styles.smoothAnimations,
      )}
      style={editorStyles}
      data-theme={theme}
    >
      <PortPositionProvider portPositions={portPositions} behavior={portPositionBehavior} config={portPositionConfig}>
        <GridLayout
          key={gridLayoutKey}
          config={effectiveGridConfig}
          layers={effectiveGridLayers}
          className={styles.gridLayoutContainer}
        />
      </PortPositionProvider>

      {/* Context Menus */}
      {actionState.contextMenu.visible && actionState.contextMenu.mode === "search" && (
        <NodeSearchMenu
          position={actionState.contextMenu.position}
          nodeDefinitions={nodeDefinitions}
          disabledNodeTypes={(() => {
            const allowed = actionState.contextMenu.allowedNodeTypes;
            if (!allowed) {
              return disabledNodeTypes;
            }
            const allowedSet = new Set(allowed);
            const flowDisabled = new Set(disabledNodeTypes);
            const extraDisabled = nodeDefinitions.map((d) => d.type).filter((t) => !allowedSet.has(t));
            return Array.from(new Set([...Array.from(flowDisabled), ...extraDisabled]));
          })()}
          onCreateNode={handleCreateNode}
          onClose={() => actionDispatch(actionActions.hideContextMenu())}
          visible={true}
        />
      )}

      {actionState.contextMenu.visible && actionState.contextMenu.mode !== "search" && (
        <ContextActionMenu
          position={actionState.contextMenu.position}
          target={
            actionState.contextMenu.nodeId
              ? { type: "node", id: actionState.contextMenu.nodeId }
              : actionState.contextMenu.connectionId
                ? { type: "connection", id: actionState.contextMenu.connectionId }
                : { type: "canvas" }
          }
          visible={true}
          onClose={() => actionDispatch(actionActions.hideContextMenu())}
        />
      )}
    </NodeEditorBase>
  );
};
