/**
 * @file Hook for handling node drag operations
 * Extracted from NodeDragHandler component for better render optimization
 */
import * as React from "react";
import { NodeId, Position } from "../../../../types/core";
import { usePointerDrag } from "../../../../hooks/usePointerDrag";
import { useNodeEditor } from "../../node-editor/context";
import { useEditorActionState, useSelectedNodeIdsSet } from "../../EditorActionStateContext";
import { useNodeCanvas } from "../viewport/context";
import { useCanvasInteraction, useDragNodeIdsSets } from "./context";
import { useNodeDefinitionList } from "../../../node-definitions/hooks/useNodeDefinitionList";
import { nodeHasGroupBehavior } from "../../../../types/behaviors";
import { usePointerShortcutMatcher } from "../../../interaction-settings/hooks/usePointerShortcutMatcher";
import { addUniqueIds } from "./utils/selectionOperations";

export type UseNodeDragResult = {
  onPointerDown: (e: React.PointerEvent) => void;
  isDragging: boolean;
};

/**
 * Hook for handling drag operations for individual nodes
 * Replaces NodeDragHandler component for better memoization
 */
export function useNodeDrag(nodeId: NodeId): UseNodeDragResult {
  const { state: nodeEditorState, actions } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: interactionState, actions: interactionActions } = useCanvasInteraction();
  const { state: canvasState } = useNodeCanvas();
  const nodeDefinitions = useNodeDefinitionList();
  const matchesPointerAction = usePointerShortcutMatcher();

  const node = nodeEditorState.nodes[nodeId];

  // Use shared memoized Sets from context
  const dragNodeIdsSets = useDragNodeIdsSets();
  const isDragging = dragNodeIdsSets?.directlyDraggedNodeIds.has(nodeId) ?? false;

  // Store latest values in refs for useEffectEvent handlers
  const nodesRef = React.useRef(nodeEditorState.nodes);
  const nodeDefinitionsRef = React.useRef(nodeDefinitions);
  const selectedNodeIdsRef = React.useRef(actionState.selectedNodeIds);
  const dragStateRef = React.useRef(interactionState.dragState);
  const scaleRef = React.useRef(canvasState.viewport.scale);

  React.useEffect(() => {
    nodesRef.current = nodeEditorState.nodes;
  }, [nodeEditorState.nodes]);

  React.useEffect(() => {
    nodeDefinitionsRef.current = nodeDefinitions;
  }, [nodeDefinitions]);

  React.useEffect(() => {
    selectedNodeIdsRef.current = actionState.selectedNodeIds;
  }, [actionState.selectedNodeIds]);

  React.useEffect(() => {
    dragStateRef.current = interactionState.dragState;
  }, [interactionState.dragState]);

  React.useEffect(() => {
    scaleRef.current = canvasState.viewport.scale;
  }, [canvasState.viewport.scale]);

  // Create drag data without callback recreation on every nodes change
  const createDragData = React.useEffectEvent((selectedNodeIds: NodeId[]) => {
    const nodes = nodesRef.current;
    const definitions = nodeDefinitionsRef.current;
    const effectiveSelection = selectedNodeIds.length > 0 ? selectedNodeIds : [nodeId];

    // Collect all affected nodes (including children of groups)
    const affectedChildNodes: Record<NodeId, NodeId[]> = {};
    const allDraggedNodes = new Set<NodeId>(effectiveSelection);

    effectiveSelection.forEach((draggedId) => {
      const draggedNode = nodes[draggedId];
      if (draggedNode && nodeHasGroupBehavior(draggedNode, definitions)) {
        const childIds = Object.values(nodes)
          .filter((n) => n.parentId === draggedId)
          .map((n) => n.id);
        affectedChildNodes[draggedId] = childIds;
        childIds.forEach((id) => allDraggedNodes.add(id));
      }
    });

    // Store initial positions
    const initialPositions: Record<NodeId, Position> = {};
    allDraggedNodes.forEach((id) => {
      const n = nodes[id];
      if (n) {
        initialPositions[id] = { ...n.position };
      }
    });

    return {
      nodeIds: effectiveSelection,
      initialPositions,
      affectedChildNodes,
    };
  });

  // Use useEffectEvent for stable callback references
  const handleDragStart = React.useEffectEvent(
    (event: PointerEvent, data: ReturnType<typeof createDragData>) => {
      interactionActions.startNodeDrag(
        data.nodeIds,
        { x: event.clientX, y: event.clientY },
        data.initialPositions,
        data.affectedChildNodes,
      );
    },
  );

  const handleDragMove = React.useEffectEvent((_event: PointerEvent, delta: Position) => {
    const scale = scaleRef.current;
    interactionActions.updateNodeDrag({
      x: delta.x / scale,
      y: delta.y / scale,
    });
  });

  const handleDragEnd = React.useEffectEvent((_event: PointerEvent, delta: Position) => {
    const dragState = dragStateRef.current;
    const scale = scaleRef.current;

    if (!dragState) {
      return;
    }

    const scaledDelta = {
      x: delta.x / scale,
      y: delta.y / scale,
    };

    // Apply final positions
    const updates: Record<NodeId, Position> = {};

    // Update dragged nodes
    dragState.nodeIds.forEach((id) => {
      const initialPos = dragState.initialPositions[id];
      if (initialPos) {
        updates[id] = {
          x: initialPos.x + scaledDelta.x,
          y: initialPos.y + scaledDelta.y,
        };
      }
    });

    // Update child nodes of dragged groups
    Object.entries(dragState.affectedChildNodes).forEach(([_groupId, childIds]) => {
      childIds.forEach((childId) => {
        const initialPos = dragState.initialPositions[childId];
        if (initialPos) {
          updates[childId] = {
            x: initialPos.x + scaledDelta.x,
            y: initialPos.y + scaledDelta.y,
          };
        }
      });
    });

    // Apply all position updates
    actions.moveNodes(updates);

    // End drag state
    interactionActions.endNodeDrag();
  });

  const { startDrag } = usePointerDrag({
    onStart: handleDragStart,
    onMove: handleDragMove,
    onEnd: handleDragEnd,
    disabled: node?.locked || false,
    threshold: 2,
  });

  // Use shared memoized Set from context
  const selectedNodeIdsSet = useSelectedNodeIdsSet();

  // Use useEffectEvent for stable handler reference that always accesses latest state
  const handlePointerDown = React.useEffectEvent((e: React.PointerEvent) => {
    if (node?.locked) {
      return;
    }

    // Prevent drag if clicking on a port or resize handle
    const target = e.target as HTMLElement;
    if (target.closest("[data-port-id]") || target.closest("[data-resize-handle]")) {
      return;
    }

    const nativeEvent = e.nativeEvent;
    const matchesMultiSelect = matchesPointerAction("node-add-to-selection", nativeEvent);
    const matchesSelect = matchesPointerAction("node-select", nativeEvent) || matchesMultiSelect;

    if (!matchesSelect && !matchesMultiSelect) {
      return;
    }

    e.stopPropagation();

    // O(1) lookup using Set
    const wasSelected = selectedNodeIdsSet.has(nodeId);
    const currentSelectedIds = selectedNodeIdsRef.current;
    const hadMultipleSelection = currentSelectedIds.length > 1;

    if (matchesMultiSelect) {
      actionActions.selectEditingNode(nodeId, true);
      actionActions.selectInteractionNode(nodeId, true);
      if (wasSelected) {
        return;
      }
    } else if (!wasSelected || !hadMultipleSelection) {
      actionActions.selectEditingNode(nodeId, false);
      actionActions.selectInteractionNode(nodeId, false);
    }

    const selectionForDrag = matchesMultiSelect
      ? addUniqueIds(currentSelectedIds, [nodeId])
      : wasSelected && hadMultipleSelection
        ? currentSelectedIds
        : [nodeId];

    startDrag(e, createDragData(selectionForDrag));
  });

  return {
    onPointerDown: handlePointerDown,
    isDragging,
  };
}
