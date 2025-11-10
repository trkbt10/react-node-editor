/**
 * @file Main node layer rendering and interaction handler for the node editor canvas.
 */
import * as React from "react";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../contexts/node-definitions/context";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useGroupManagement } from "../../hooks/useGroupManagement";
import { useNodeResize } from "../../hooks/useNodeResize";
import { useVisibleNodes } from "../../hooks/useVisibleNodes";
import styles from "./NodeLayer.module.css";
import { useRenderers } from "../../contexts/RendererContext";
import { hasGroupBehavior } from "../../types/behaviors";
import { useNodeLayerDrag, useNodeLayerConnections, useNodeLayerPorts } from "./NodeLayerInteractions";
import { useNodeSelectionInteractions } from "./hooks/useNodeSelectionInteractions";

export type NodeLayerProps = {
  doubleClickToEdit?: boolean;
};

/**
 * NodeLayer - Renders all nodes with optimized performance
 */
export const NodeLayer: React.FC<NodeLayerProps> = ({ doubleClickToEdit }) => {
  void doubleClickToEdit;
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const { node: NodeComponent } = useRenderers();
  const nodeDefinitionRegistry = useNodeDefinitions();

  // Initialize hooks
  useNodeResize({
    minWidth: 100,
    minHeight: 40,
    snapToGrid: canvasState.gridSettings.snapToGrid,
    gridSize: canvasState.gridSettings.size,
  });

  const groupManager = useGroupManagement({
    autoUpdateMembership: true,
    membershipUpdateDelay: 200,
  });

  // Get only visible nodes for virtualization
  const visibleNodes = useVisibleNodes(nodeEditorState.nodes);

  // Memoize sorted visible nodes
  const sortedNodes = React.useMemo(() => {
    // Nodes with group behavior render first (lower z-index)
    return visibleNodes.sort((a, b) => {
      const aDef = nodeDefinitionRegistry.registry.get(a.type);
      const bDef = nodeDefinitionRegistry.registry.get(b.type);
      const aGroup = hasGroupBehavior(aDef);
      const bGroup = hasGroupBehavior(bDef);
      if (aGroup && !bGroup) {
        return -1;
      }
      if (!aGroup && bGroup) {
        return 1;
      }
      return 0;
    });
  }, [visibleNodes, nodeDefinitionRegistry.registry]);

  // Calculate connected ports once
  const connectedPorts = React.useMemo(() => {
    const ports = new Set<string>();
    Object.values(nodeEditorState.connections).forEach((connection) => {
      ports.add(connection.fromPortId);
      ports.add(connection.toPortId);
    });
    return ports;
  }, [nodeEditorState.connections]);

  // Update connected ports in action state only when changed
  React.useEffect(() => {
    actionActions.updateConnectedPorts(connectedPorts);
  }, [connectedPorts, actionActions]);

  const { handleNodePointerDown, handleNodeContextMenu } = useNodeSelectionInteractions({
    getGroupChildren: groupManager.getGroupChildren,
  });

  // Port event handlers
  const {
    handlePortPointerDown,
    handlePortPointerUp,
    handlePortPointerEnter,
    handlePortPointerMove,
    handlePortPointerLeave,
    handlePortPointerCancel,
  } = useNodeLayerPorts();

  useNodeLayerDrag(groupManager.moveGroupWithChildren);

  useNodeLayerConnections();

  return (
    <div className={styles.nodeLayer} data-node-layer>
      {sortedNodes.map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={actionState.selectedNodeIds.includes(node.id)}
          isDragging={actionState.dragState?.nodeIds.includes(node.id) ?? false}
          dragOffset={actionState.dragState?.nodeIds.includes(node.id) ? actionState.dragState.offset : undefined}
          onPointerDown={handleNodePointerDown}
          onContextMenu={handleNodeContextMenu}
          onPortPointerDown={handlePortPointerDown}
          onPortPointerUp={handlePortPointerUp}
          onPortPointerEnter={handlePortPointerEnter}
          onPortPointerMove={handlePortPointerMove}
          onPortPointerLeave={handlePortPointerLeave}
          onPortPointerCancel={handlePortPointerCancel}
          connectablePorts={actionState.connectablePorts}
          connectingPort={
            actionState.connectionDragState?.fromPort
              ? {
                  id: actionState.connectionDragState.fromPort.id,
                  type: actionState.connectionDragState.fromPort.type,
                  label: actionState.connectionDragState.fromPort.label,
                  nodeId: actionState.connectionDragState.fromPort.nodeId,
                  position: actionState.connectionDragState.fromPort.position,
                }
              : undefined
          }
          hoveredPort={
            actionState.hoveredPort
              ? {
                  id: actionState.hoveredPort.id,
                  type: actionState.hoveredPort.type,
                  label: actionState.hoveredPort.label,
                  nodeId: actionState.hoveredPort.nodeId,
                  position: actionState.hoveredPort.position,
                }
              : undefined
          }
          connectedPorts={connectedPorts}
        />
      ))}
    </div>
  );
};

NodeLayer.displayName = "NodeLayer";

// Reference note: Reviewed connectionCandidate.ts, PortInteractionHandler.tsx, nodeDragHelpers.ts, and NodeDragHandler.tsx to coordinate selection toggling.
