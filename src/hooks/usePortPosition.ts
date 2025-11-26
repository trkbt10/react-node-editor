/**
 * @file Hooks for accessing dynamic port positions and connection points
 */
import * as React from "react";
import type { Position } from "../types/core";
import type { PortPosition, PortPositionNode } from "../types/portPosition";
import { useNodeEditor } from "../contexts/node-editor/context";
import { usePortPositions } from "../contexts/node-ports/context";
import { useEditorActionState } from "../contexts/EditorActionStateContext";

type PortPositionOptions = {
  positionOverride?: Position;
  sizeOverride?: { width: number; height: number };
  applyInteractionPreview?: boolean;
};

/**
 * Hook to get dynamic port position that updates with node position
 */
export function useDynamicPortPosition(
  nodeId: string,
  portId: string,
  options?: PortPositionOptions,
): PortPosition | undefined {
  const { state, getNodePorts } = useNodeEditor();
  const { calculateNodePortPositions } = usePortPositions();
  const { state: actionState } = useEditorActionState();
  const currentNode = React.useMemo(() => state.nodes[nodeId], [state.nodes, nodeId]);
  const nodePorts = React.useMemo(() => getNodePorts(nodeId), [getNodePorts, nodeId]);

  // Pre-compute sets for O(1) lookup instead of O(n) includes/some
  const draggedNodeIdsSet = React.useMemo(() => {
    const dragState = actionState.dragState;
    if (!dragState) {
      return null;
    }
    const set = new Set<string>(dragState.nodeIds);
    // Include affected children
    for (const childIds of Object.values(dragState.affectedChildNodes ?? {})) {
      for (const id of childIds) {
        set.add(id);
      }
    }
    return set;
  }, [actionState.dragState]);

  return React.useMemo(() => {
    if (!currentNode) {
      return undefined;
    }

    const { positionOverride, sizeOverride, applyInteractionPreview = true } = options ?? {};

    const previewPosition = (() => {
      if (!applyInteractionPreview) {
        return null;
      }
      const dragState = actionState.dragState;
      if (dragState && draggedNodeIdsSet?.has(nodeId)) {
        return { x: currentNode.position.x + dragState.offset.x, y: currentNode.position.y + dragState.offset.y };
      }
      const resizeState = actionState.resizeState;
      if (resizeState?.nodeId === nodeId) {
        return resizeState.currentPosition ?? currentNode.position;
      }
      return null;
    })();

    const previewSize = (() => {
      if (!applyInteractionPreview) {
        return null;
      }
      const resizeState = actionState.resizeState;
      if (resizeState?.nodeId === nodeId) {
        return resizeState.currentSize;
      }
      return null;
    })();

    const effectiveNode: PortPositionNode = {
      ...currentNode,
      position: positionOverride ?? previewPosition ?? currentNode.position,
      size: sizeOverride ?? previewSize ?? currentNode.size,
      ports: nodePorts,
    };

    return calculateNodePortPositions(effectiveNode).get(portId);
  }, [
    currentNode,
    nodeId,
    portId,
    nodePorts,
    calculateNodePortPositions,
    options?.positionOverride,
    options?.sizeOverride,
    options?.applyInteractionPreview,
    actionState.dragState,
    actionState.resizeState,
    draggedNodeIdsSet,
  ]);
}

/**
 * Hook to get dynamic connection point for a port
 */
export function useDynamicConnectionPoint(
  nodeId: string,
  portId: string,
  options?: PortPositionOptions,
): { x: number; y: number } | undefined {
  const position = useDynamicPortPosition(nodeId, portId, options);
  return position?.connectionPoint;
}
