import * as React from "react";
import { Position, Viewport } from "../types/core";

export type CanvasTransformOptions = {
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
};

export type CanvasTransformResult = {
  viewport: Viewport;
  clientToCanvas: (clientPos: Position) => Position;
  canvasToClient: (canvasPos: Position) => Position;
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (bounds: { width: number; height: number }) => void;
  panBy: (delta: Position) => void;
};

/**
 * Hook for managing canvas viewport transformations
 * Handles coordinate conversions between client and canvas space
 */
export function useCanvasTransform(
  containerRef: React.RefObject<HTMLElement>,
  options: CanvasTransformOptions = {},
): CanvasTransformResult {
  const { minScale = 0.1, maxScale = 4, scaleStep = 0.1, enablePan = true, enableZoom = true } = options;

  const [viewport, setViewport] = React.useState<Viewport>({
    offset: { x: 0, y: 0 },
    scale: 1,
  });

  // Convert client coordinates to canvas coordinates
  const clientToCanvas = React.useCallback(
    (clientPos: Position): Position => {
      if (!containerRef.current) {
        return clientPos;
      }

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientPos.x - rect.left) / viewport.scale - viewport.offset.x,
        y: (clientPos.y - rect.top) / viewport.scale - viewport.offset.y,
      };
    },
    [viewport, containerRef],
  );

  // Convert canvas coordinates to client coordinates
  const canvasToClient = React.useCallback(
    (canvasPos: Position): Position => {
      if (!containerRef.current) {
        return canvasPos;
      }

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (canvasPos.x + viewport.offset.x) * viewport.scale + rect.left,
        y: (canvasPos.y + viewport.offset.y) * viewport.scale + rect.top,
      };
    },
    [viewport, containerRef],
  );

  // Reset viewport to default
  const resetViewport = React.useCallback(() => {
    setViewport({
      offset: { x: 0, y: 0 },
      scale: 1,
    });
  }, []);

  // Zoom in
  const zoomIn = React.useCallback(() => {
    if (!enableZoom) {
      return;
    }

    setViewport((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + scaleStep, maxScale),
    }));
  }, [enableZoom, scaleStep, maxScale]);

  // Zoom out
  const zoomOut = React.useCallback(() => {
    if (!enableZoom) {
      return;
    }

    setViewport((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - scaleStep, minScale),
    }));
  }, [enableZoom, scaleStep, minScale]);

  // Zoom to fit content
  const zoomToFit = React.useCallback(
    (contentBounds: { width: number; height: number }) => {
      if (!enableZoom || !containerRef.current) {
        return;
      }

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate scale to fit content with padding
      const padding = 50;
      const scaleX = (containerWidth - padding * 2) / contentBounds.width;
      const scaleY = (containerHeight - padding * 2) / contentBounds.height;
      const newScale = Math.min(scaleX, scaleY, maxScale);

      // Center the content
      const scaledWidth = contentBounds.width * newScale;
      const scaledHeight = contentBounds.height * newScale;
      const offsetX = (containerWidth - scaledWidth) / 2 / newScale;
      const offsetY = (containerHeight - scaledHeight) / 2 / newScale;

      setViewport({
        offset: { x: offsetX, y: offsetY },
        scale: Math.max(minScale, newScale),
      });
    },
    [enableZoom, containerRef, minScale, maxScale],
  );

  // Pan by delta
  const panBy = React.useCallback(
    (delta: Position) => {
      if (!enablePan) {
        return;
      }

      setViewport((prev) => ({
        ...prev,
        offset: {
          x: prev.offset.x + delta.x,
          y: prev.offset.y + delta.y,
        },
      }));
    },
    [enablePan],
  );

  return {
    viewport,
    clientToCanvas,
    canvasToClient,
    setViewport,
    resetViewport,
    zoomIn,
    zoomOut,
    zoomToFit,
    panBy,
  };
}
