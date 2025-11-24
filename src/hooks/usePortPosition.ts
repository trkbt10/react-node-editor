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

  return React.useMemo(() => {
    const currentNode = state.nodes[nodeId];
    if (!currentNode) {
      return undefined;
    }

    const { positionOverride, sizeOverride, applyInteractionPreview = true } = options ?? {};

    const previewPosition = (() => {
      if (!applyInteractionPreview) {
        return null;
      }
      const dragState = actionState.dragState;
      if (dragState) {
        if (dragState.nodeIds.includes(nodeId)) {
          return { x: currentNode.position.x + dragState.offset.x, y: currentNode.position.y + dragState.offset.y };
        }
        const isChild = Object.values(dragState.affectedChildNodes ?? {}).some((children) => children.includes(nodeId));
        if (isChild) {
          return { x: currentNode.position.x + dragState.offset.x, y: currentNode.position.y + dragState.offset.y };
        }
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
      ports: getNodePorts(nodeId),
    };

    return calculateNodePortPositions(effectiveNode).get(portId);
  }, [
    state.nodes,
    nodeId,
    portId,
    getNodePorts,
    calculateNodePortPositions,
    options?.positionOverride,
    options?.sizeOverride,
    options?.applyInteractionPreview,
    actionState.dragState,
    actionState.resizeState,
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
