/**
 * @file NodeEditorCanvas - Canvas component without layout dependencies
 * @description
 * This component provides port position management, settings application,
 * and context menu handling without depending on GridLayout.
 * Use this when you want to manage your own layout while still getting
 * core canvas functionality like port positions and context menus.
 */
import * as React from "react";
import { NodeEditorBase } from "../layout/NodeEditorBase";
import { ContextActionMenu } from "../shared/ContextActionMenu";
import { NodeSearchMenu } from "../panels/node-search/NodeSearchMenu";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { PortPositionProvider } from "../../contexts/node-ports/provider";
import { useSettings } from "../../hooks/useSettings";
import type { SettingsManager } from "../../settings/SettingsManager";
import type { Port as CorePort } from "../../types/core";
import {
  DEFAULT_PORT_POSITION_CONFIG,
  type EditorPortPositions,
  type PortPositionBehavior,
  type PortPositionConfig,
  type PortPositionNode,
} from "../../types/portPosition";
import { computeAllPortPositions, computeNodePortPositions } from "../../contexts/node-ports/utils/computePortPositions";
import { canConnectPorts } from "../../core/connection/validation";
import {
  canAddNodeType,
  countNodesByType,
  getDisabledNodeTypes,
} from "../../contexts/node-definitions/utils/nodeTypeLimits";
import { buildNodeFromDefinition } from "../../contexts/node-editor/utils/nodeFactory";
import { hasNodeGeometryChanged } from "../../core/node/comparators";

export type NodeEditorCanvasProps = {
  settingsManager?: SettingsManager;
  portPositionBehavior?: PortPositionBehavior;
  /** Children to render within the canvas (e.g., custom layout) */
  children?: React.ReactNode;
};

/**
 * NodeEditorCanvas - Provides core canvas functionality without layout dependencies
 *
 * This component handles:
 * - Port position calculation and management
 * - Settings application (theme, grid, etc.)
 * - Context menu rendering and node creation
 * - NodeEditorBase wrapper
 *
 * Use this when you want to provide your own layout system while still
 * getting all the canvas functionality.
 */
export const NodeEditorCanvas: React.FC<NodeEditorCanvasProps> = ({
  settingsManager,
  portPositionBehavior,
  children,
}) => {
  const { state: editorState, actions, getNodePorts } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();
  const settings = useSettings(settingsManager);

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

        if (!prevNode || hasNodeGeometryChanged(prevNode, node)) {
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

      // Enforce per-flow maximums if defined
      if (!canAddNodeType(nodeType, nodeDefinitions, nodeTypeCounts)) {
        return;
      }

      // Create new node with definition defaults
      const newNode = buildNodeFromDefinition({ nodeDefinition, canvasPosition });

      // Add node to editor with the predetermined id
      actions.addNodeWithId(newNode);

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
          const tempPort: CorePort = {
            id: p.id,
            definitionId: p.id,
            type: p.type,
            label: p.label,
            nodeId: newNode.id,
            position: typeof p.position === "string" ? p.position : p.position.side,
            placement: typeof p.position === "string" ? undefined : p.position,
          };
          return canConnectPorts(
            fromPort.type === "output" ? fromPort : tempPort,
            fromPort.type === "output" ? tempPort : fromPort,
            fromDef,
            toDef,
            editorState.connections,
            { nodes: editorState.nodes },
          );
        });
        if (targetPortDef) {
          const tempPort: CorePort = {
            id: targetPortDef.id,
            definitionId: targetPortDef.id,
            type: targetPortDef.type,
            label: targetPortDef.label,
            nodeId: newNode.id,
            position: typeof targetPortDef.position === "string" ? targetPortDef.position : targetPortDef.position.side,
            placement: typeof targetPortDef.position === "string" ? undefined : targetPortDef.position,
          };
          const connection =
            fromPort.type === "output"
              ? { fromNodeId: fromPort.nodeId, fromPortId: fromPort.id, toNodeId: newNode.id, toPortId: tempPort.id }
              : {
                  fromNodeId: newNode.id,
                  fromPortId: tempPort.id,
                  toNodeId: fromPort.nodeId,
                  toPortId: fromPort.id,
                };
          actions.addConnection(connection);
        }
      }

      // Hide context menu
      actionActions.hideContextMenu();
    },
    [
      nodeDefinitions,
      actions,
      actionActions,
      actionState.contextMenu.canvasPosition,
      actionState.contextMenu.fromPort,
      editorState.connections,
      editorState.nodes,
      utils,
      nodeTypeCounts,
    ],
  );

  return (
    <NodeEditorBase>
      <PortPositionProvider portPositions={portPositions} behavior={portPositionBehavior} config={portPositionConfig}>
        {children}
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
          onClose={() => actionActions.hideContextMenu()}
          visible={true}
          viewMode={settings.nodeSearchViewMode}
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
          onClose={() => actionActions.hideContextMenu()}
        />
      )}
    </NodeEditorBase>
  );
};
