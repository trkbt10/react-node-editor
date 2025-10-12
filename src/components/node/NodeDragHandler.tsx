import * as React from "react";
import { NodeId, Position } from "../../types/core";
import { usePointerDrag } from "../../hooks/usePointerDrag";
import { useNodeEditor } from "../../contexts/node-editor";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { useNodeDefinitionList } from "../../contexts/node-definitions";
import { nodeHasGroupBehavior } from "../../types/behaviors";

export type NodeDragHandlerProps = {
  nodeId: NodeId;
  children: (props: {
    onPointerDown: (e: React.PointerEvent) => void;
    isDragging: boolean;
  }) => React.ReactNode;
}

/**
 * Handles drag operations for individual nodes
 * Extracts drag logic from NodeLayer for better separation of concerns
 */
export const NodeDragHandler: React.FC<NodeDragHandlerProps> = ({
  nodeId,
  children,
}) => {
  const { state: nodeEditorState, actions, dispatch } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const nodeDefinitions = useNodeDefinitionList();

  const node = nodeEditorState.nodes[nodeId];
  const isDragging = actionState.dragState?.nodeIds.includes(nodeId) || false;

  // Create drag data for the pointer drag hook
  const createDragData = React.useCallback(() => {
    const selectedNodes = actionState.selectedNodeIds.includes(nodeId)
      ? actionState.selectedNodeIds
      : [nodeId];

    // Collect all affected nodes (including children of groups)
    const affectedChildNodes: Record<NodeId, NodeId[]> = {};
    const allDraggedNodes = new Set<NodeId>(selectedNodes);

    selectedNodes.forEach(draggedId => {
      const draggedNode = nodeEditorState.nodes[draggedId];
      if (draggedNode && nodeHasGroupBehavior(draggedNode, nodeDefinitions)) {
        const childIds = Object.values(nodeEditorState.nodes)
          .filter(n => n.parentId === draggedId)
          .map(n => n.id);
        affectedChildNodes[draggedId] = childIds;
        childIds.forEach(id => allDraggedNodes.add(id));
      }
    });

    // Store initial positions
    const initialPositions: Record<NodeId, Position> = {};
    allDraggedNodes.forEach(id => {
      const n = nodeEditorState.nodes[id];
      if (n) {
        initialPositions[id] = { ...n.position };
      }
    });

    return {
      nodeIds: selectedNodes,
      initialPositions,
      affectedChildNodes,
    };
  }, [nodeId, nodeEditorState.nodes, actionState.selectedNodeIds, nodeDefinitions]);

  const handleDragStart = React.useCallback((event: PointerEvent, data: ReturnType<typeof createDragData>) => {
    // Select node if not already selected
    if (!actionState.selectedNodeIds.includes(nodeId)) {
      actionDispatch(actionActions.selectNode(nodeId, event.shiftKey || event.metaKey || event.ctrlKey));
    }

    // Start drag state
    actionDispatch(actionActions.startNodeDrag(
      data.nodeIds,
      { x: event.clientX, y: event.clientY },
      data.initialPositions,
      data.affectedChildNodes
    ));
  }, [nodeId, actionState.selectedNodeIds, actionDispatch, actionActions]);

  const handleDragMove = React.useCallback((_event: PointerEvent, delta: Position) => {
    actionDispatch(actionActions.updateNodeDrag({
      x: delta.x / canvasState.viewport.scale,
      y: delta.y / canvasState.viewport.scale,
    }));
  }, [actionDispatch, actionActions, canvasState.viewport.scale]);

  const handleDragEnd = React.useCallback((_event: PointerEvent, delta: Position) => {
    if (!actionState.dragState) {return;}

    const scaledDelta = {
      x: delta.x / canvasState.viewport.scale,
      y: delta.y / canvasState.viewport.scale,
    };

    // Apply final positions
    const updates: Record<NodeId, Position> = {};

    // Update dragged nodes
    actionState.dragState.nodeIds.forEach(id => {
      const initialPos = actionState.dragState!.initialPositions[id];
      if (initialPos) {
        updates[id] = {
          x: initialPos.x + scaledDelta.x,
          y: initialPos.y + scaledDelta.y,
        };
      }
    });

    // Update child nodes of dragged groups
    Object.entries(actionState.dragState.affectedChildNodes).forEach(([_groupId, childIds]) => {
      childIds.forEach(childId => {
        const initialPos = actionState.dragState!.initialPositions[childId];
        if (initialPos) {
          updates[childId] = {
            x: initialPos.x + scaledDelta.x,
            y: initialPos.y + scaledDelta.y,
          };
        }
      });
    });

    // Apply all position updates
    dispatch(actions.moveNodes(updates));

    // End drag state
    actionDispatch(actionActions.endNodeDrag());
  }, [actionState.dragState, canvasState.viewport.scale, dispatch, actions, actionDispatch, actionActions]);

  const { startDrag } = usePointerDrag({
    onStart: handleDragStart,
    onMove: handleDragMove,
    onEnd: handleDragEnd,
    disabled: node?.locked || false,
    threshold: 2,
  });

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (node?.locked) {return;}
    
    // Prevent drag if clicking on a port or resize handle
    const target = e.target as HTMLElement;
    if (target.closest('[data-port-id]') || target.closest('[data-resize-handle]')) {
      return;
    }

    e.stopPropagation();
    startDrag(e, createDragData());
  }, [node?.locked, startDrag, createDragData]);

  return (
    <>
      {children({
        onPointerDown: handlePointerDown,
        isDragging,
      })}
    </>
  );
};
