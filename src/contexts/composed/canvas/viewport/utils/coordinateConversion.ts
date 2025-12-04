/**
 * @file Utility functions for coordinate conversion between screen and canvas space
 */
import * as React from "react";
import type { Position, Viewport } from "../../../../../types/core";

/**
 * Creates utility functions for converting coordinates between screen and canvas space
 */
export const createCanvasUtils = (
  canvasRef: React.RefObject<HTMLDivElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null> | undefined,
  viewport: Viewport,
) => ({
  // Convert screen coordinates to canvas coordinates
  screenToCanvas: (screenX: number, screenY: number): Position => {
    const element = containerRef?.current ?? canvasRef.current;
    if (!element) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: screenX, y: screenY };
    }

    const rect = element.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.offset.x) / viewport.scale,
      y: (screenY - rect.top - viewport.offset.y) / viewport.scale,
    };
  },

  // Convert canvas coordinates to screen coordinates
  canvasToScreen: (canvasX: number, canvasY: number): Position => {
    const element = containerRef?.current ?? canvasRef.current;
    if (!element) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: canvasX, y: canvasY };
    }

    const rect = element.getBoundingClientRect();
    return {
      x: canvasX * viewport.scale + viewport.offset.x + rect.left,
      y: canvasY * viewport.scale + viewport.offset.y + rect.top,
    };
  },
});
