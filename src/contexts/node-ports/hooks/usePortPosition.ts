/**
 * @file Hooks for accessing dynamic port positions and connection points
 */
import * as React from "react";
import type { Position, Size } from "../../../types/core";
import type { PortPosition, PortPositionNode } from "../../../types/portPosition";
import type { ComputedPortPosition } from "../../../types/NodeDefinition";
import { useNodeEditor } from "../../composed/node-editor/context";
import { usePortPositions } from "../context";
import { useCanvasInteraction } from "../../composed/canvas/interaction/context";
import { useNodeDefinitions } from "../../node-definitions/context";
import { computeNodePortPositions, createDefaultPortCompute } from "../utils/computePortPositions";
import { getNodeSize } from "../../../utils/boundingBoxUtils";

type PortPositionOptions = {
  positionOverride?: Position;
  sizeOverride?: { width: number; height: number };
  applyInteractionPreview?: boolean;
};

/**
 * Cache key for custom port position computation
 * Only recompute when size or ports change, not position
 */
type ComputeCacheKey = {
  nodeId: string;
  sizeWidth: number;
  sizeHeight: number;
  portsKey: string;
};

const computeCacheKeyEquals = (a: ComputeCacheKey | null, b: ComputeCacheKey): boolean => {
  if (!a) {
    return false;
  }
  return (
    a.nodeId === b.nodeId && a.sizeWidth === b.sizeWidth && a.sizeHeight === b.sizeHeight && a.portsKey === b.portsKey
  );
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
  const { config, behavior } = usePortPositions();
  const { state: interactionState } = useCanvasInteraction();
  const { registry } = useNodeDefinitions();
  const currentNode = React.useMemo(() => state.nodes[nodeId], [state.nodes, nodeId]);
  const nodePorts = React.useMemo(() => getNodePorts(nodeId), [getNodePorts, nodeId]);
  const nodeDefinition = React.useMemo(
    () => (currentNode ? registry.get(currentNode.type) : undefined),
    [registry, currentNode],
  );

  // Cache for custom computePortPositions results (only recompute on size/ports change)
  const customComputeCache = React.useRef<{
    key: ComputeCacheKey | null;
    basePosition: Position;
    result: Map<string, ComputedPortPosition>;
  }>({ key: null, basePosition: { x: 0, y: 0 }, result: new Map() });

  // Pre-compute sets for O(1) lookup instead of O(n) includes/some
  const draggedNodeIdsSet = React.useMemo(() => {
    const dragState = interactionState.dragState;
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
  }, [interactionState.dragState]);

  // Compute effective size (may change during resize)
  const effectiveSize = React.useMemo((): Size | undefined => {
    const { sizeOverride, applyInteractionPreview = true } = options ?? {};
    if (sizeOverride) {
      return sizeOverride;
    }
    if (applyInteractionPreview) {
      const resizeState = interactionState.resizeState;
      if (resizeState?.nodeId === nodeId && resizeState.currentSize) {
        return resizeState.currentSize;
      }
    }
    return currentNode?.size;
  }, [currentNode?.size, nodeId, interactionState.resizeState, options?.sizeOverride, options?.applyInteractionPreview]);

  // Compute effective position (changes during drag/resize)
  const effectivePosition = React.useMemo((): Position | undefined => {
    if (!currentNode) {
      return undefined;
    }
    const { positionOverride, applyInteractionPreview = true } = options ?? {};
    if (positionOverride) {
      return positionOverride;
    }
    if (applyInteractionPreview) {
      const dragState = interactionState.dragState;
      if (dragState && draggedNodeIdsSet?.has(nodeId)) {
        return { x: currentNode.position.x + dragState.offset.x, y: currentNode.position.y + dragState.offset.y };
      }
      const resizeState = interactionState.resizeState;
      if (resizeState?.nodeId === nodeId && resizeState.currentPosition) {
        return resizeState.currentPosition;
      }
    }
    return currentNode.position;
  }, [
    currentNode,
    nodeId,
    interactionState.dragState,
    interactionState.resizeState,
    draggedNodeIdsSet,
    options?.positionOverride,
    options?.applyInteractionPreview,
  ]);

  // Stable ports key for cache comparison
  const portsKey = React.useMemo(() => nodePorts.map((p) => p.id).join(","), [nodePorts]);

  return React.useMemo(() => {
    if (!currentNode || !effectivePosition) {
      return undefined;
    }

    const effectiveNode: PortPositionNode = {
      ...currentNode,
      position: effectivePosition,
      size: effectiveSize,
      ports: nodePorts,
    };

    // Use behavior's computeNode if available
    if (behavior?.computeNode) {
      return behavior
        .computeNode({
          node: effectiveNode,
          config,
          defaultCompute: (node) => computeNodePortPositions(node, { config }),
        })
        .get(portId);
    }

    // Use custom computePortPositions from NodeDefinition if available
    const customCompute = nodeDefinition?.computePortPositions;
    if (customCompute) {
      const nodeSize = getNodeSize(effectiveNode);
      const cacheKey: ComputeCacheKey = {
        nodeId,
        sizeWidth: nodeSize.width,
        sizeHeight: nodeSize.height,
        portsKey,
      };

      // Check cache - only recompute if size or ports changed
      if (!computeCacheKeyEquals(customComputeCache.current.key, cacheKey)) {
        const defaultCompute = createDefaultPortCompute(effectiveNode, config);
        customComputeCache.current = {
          key: cacheKey,
          basePosition: { x: effectivePosition.x, y: effectivePosition.y },
          result: customCompute({
            node: effectiveNode,
            ports: nodePorts,
            nodeSize,
            defaultCompute,
          }),
        };
      }

      const cachedPos = customComputeCache.current.result.get(portId);
      if (cachedPos) {
        // Adjust connection point based on position change since cache was created
        // renderPosition is relative to node, so stays the same
        // connectionPoint was calculated with basePosition, adjust for current effectivePosition
        const positionDeltaX = effectivePosition.x - customComputeCache.current.basePosition.x;
        const positionDeltaY = effectivePosition.y - customComputeCache.current.basePosition.y;
        return {
          portId,
          renderPosition: cachedPos.renderPosition,
          connectionPoint: {
            x: cachedPos.connectionPoint.x + positionDeltaX,
            y: cachedPos.connectionPoint.y + positionDeltaY,
          },
        };
      }
    }

    return computeNodePortPositions(effectiveNode, { config, ports: nodePorts }).get(portId);
  }, [
    currentNode,
    nodeId,
    portId,
    nodePorts,
    portsKey,
    config,
    behavior,
    nodeDefinition?.computePortPositions,
    effectivePosition,
    effectiveSize,
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
