/**
 * @file Hook for calculating which nodes are visible in the current viewport
 */
import * as React from "react";
import type { Node } from "../types/core";
import { useNodeCanvas } from "../contexts/NodeCanvasContext";

type ViewportBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/**
 * Hook to calculate which nodes are visible in the current viewport
 * Adds a buffer zone to prevent nodes from popping in/out during pan
 */
export const useVisibleNodes = (nodes: Record<string, Node>, bufferFactor: number = 1.5): Node[] => {
  const { state: canvasState } = useNodeCanvas();

  return React.useMemo(() => {
    const { viewport } = canvasState;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Calculate viewport bounds in canvas coordinates
    const buffer = (Math.max(containerWidth, containerHeight) * (bufferFactor - 1)) / 2;
    const bounds: ViewportBounds = {
      left: (-viewport.offset.x - buffer) / viewport.scale,
      top: (-viewport.offset.y - buffer) / viewport.scale,
      right: (containerWidth - viewport.offset.x + buffer) / viewport.scale,
      bottom: (containerHeight - viewport.offset.y + buffer) / viewport.scale,
    };

    // Filter nodes by visibility and intersection with viewport
    return Object.values(nodes).filter((node) => {
      if (node.visible === false) {
        return false;
      }
      const nodeWidth = node.size?.width || 150;
      const nodeHeight = node.size?.height || 50;

      // Check if node bounds intersect with viewport bounds
      return (
        node.position.x + nodeWidth >= bounds.left &&
        node.position.x <= bounds.right &&
        node.position.y + nodeHeight >= bounds.top &&
        node.position.y <= bounds.bottom
      );
    });
  }, [nodes, canvasState.viewport, bufferFactor]);
};
