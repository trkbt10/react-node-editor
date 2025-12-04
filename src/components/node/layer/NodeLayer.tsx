/**
 * @file Main node layer rendering and interaction handler for the node editor canvas.
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { useGroupManagement } from "../../../hooks/useGroupManagement";
import { useNodeResize } from "../../../hooks/useNodeResize";
import { useVisibleNodes } from "../../../hooks/useVisibleNodes";
import styles from "./NodeLayer.module.css";
import { useRenderers } from "../../../contexts/RendererContext";
import { hasGroupBehavior } from "../../../types/behaviors";
import { useNodeLayerDrag } from "./useNodeLayerDrag";
import { useNodeLayerConnections } from "./useNodeLayerConnections";
import { useNodeLayerPorts } from "./useNodeLayerPorts";
import { useNodeSelectionInteractions } from "../hooks/useNodeSelectionInteractions";

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

  const { dragState, selectedNodeIds, connectionDragState, hoveredPort, connectablePorts } = actionState;

  // Convert selectedNodeIds to Set for O(1) lookup instead of O(n) includes
  const selectedNodeIdsSet = React.useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

  // Pre-compute drag state sets for O(1) lookup
  const draggedNodeIdsSet = React.useMemo(() => {
    if (!dragState) {
      return null;
    }
    return new Set(dragState.nodeIds);
  }, [dragState]);

  const affectedChildNodeIdsSet = React.useMemo(() => {
    if (!dragState) {
      return null;
    }
    const set = new Set<string>();
    for (const childIds of Object.values(dragState.affectedChildNodes)) {
      for (const id of childIds) {
        set.add(id);
      }
    }
    return set;
  }, [dragState]);

  return (
    <div className={styles.nodeLayer} data-node-layer>
      {sortedNodes.map((node) => {
        // O(1) lookup using Sets
        const isDirectlyDragging = draggedNodeIdsSet?.has(node.id) ?? false;
        const isInDragState = isDirectlyDragging || (affectedChildNodeIdsSet?.has(node.id) ?? false);
        const dragOffset = isInDragState && dragState ? dragState.offset : undefined;

        return (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeIdsSet.has(node.id)}
            isDragging={isDirectlyDragging}
            dragOffset={dragOffset}
            onPointerDown={handleNodePointerDown}
            onContextMenu={handleNodeContextMenu}
            onPortPointerDown={handlePortPointerDown}
            onPortPointerUp={handlePortPointerUp}
            onPortPointerEnter={handlePortPointerEnter}
            onPortPointerMove={handlePortPointerMove}
            onPortPointerLeave={handlePortPointerLeave}
            onPortPointerCancel={handlePortPointerCancel}
            connectablePorts={connectablePorts}
            connectingPort={
              connectionDragState?.fromPort
                ? {
                    id: connectionDragState.fromPort.id,
                    type: connectionDragState.fromPort.type,
                    label: connectionDragState.fromPort.label,
                    nodeId: connectionDragState.fromPort.nodeId,
                    position: connectionDragState.fromPort.position,
                  }
                : undefined
            }
            hoveredPort={
              hoveredPort
                ? {
                    id: hoveredPort.id,
                    type: hoveredPort.type,
                    label: hoveredPort.label,
                    nodeId: hoveredPort.nodeId,
                    position: hoveredPort.position,
                  }
                : undefined
            }
            connectedPorts={connectedPorts}
            candidatePortId={connectionDragState?.candidatePort?.id}
          />
        );
      })}
    </div>
  );
};

NodeLayer.displayName = "NodeLayer";
